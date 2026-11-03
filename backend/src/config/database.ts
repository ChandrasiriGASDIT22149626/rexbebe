import { PrismaClient } from '@prisma/client';
import { Pool, PoolClient } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

// Instantiate PrismaClient with fallback error logging
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export const connectDatabase = async (): Promise<boolean> => {
  try {
    const dbUrl = (process.env.DATABASE_URL || '').trim();
    if (!dbUrl || dbUrl.includes('dummy') || dbUrl.startsWith('memory:')) {
      logger.info('Running in JSON / Local Mode (DATABASE_URL not configured)');
      return false;
    }
    await prisma.$connect();
    logger.info('Database connected successfully via Prisma');
    return true;
  } catch (error) {
    logger.warn('Database connection unavailable - fallback in-memory/JSON storage active for dev');
    return false;
  }
};

export interface DatabaseQueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseClient {
  query<T = any>(text: string, params?: any[]): Promise<DatabaseQueryResult<T>>;
}

export class DatabaseManager {
  private pool: Pool | null = null;
  private pglite: PGlite | null = null;
  private isPgliteMode: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.configureEngine();
  }

  private configureEngine(): void {
    const dbUrl = (process.env.DATABASE_URL || '').trim();
    if (dbUrl && !dbUrl.includes('dummy') && !dbUrl.startsWith('memory:')) {
      const isServerlessOrProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
      const useSsl =
        process.env.DB_SSL === 'true' ||
        dbUrl.includes('sslmode=require') ||
        dbUrl.includes('supabase.co') ||
        dbUrl.includes('neon.tech') ||
        dbUrl.includes('render.com') ||
        dbUrl.includes('aws.com') ||
        dbUrl.includes('aivencloud.com');

      const poolConfig: any = {
        connectionString: dbUrl,
        max: isServerlessOrProd ? (Number(process.env.DB_POOL_MAX) || 3) : 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      if (useSsl) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }

      this.pool = new Pool(poolConfig);
      this.isPgliteMode = false;
    } else {
      this.isPgliteMode = true;
    }
  }

  /**
   * Explicitly force PGlite (in-memory or file-backed) for test / staging execution
   */
  public usePglite(dataDir?: string): PGlite {
    if (this.pool) {
      this.pool.end().catch(() => {});
      this.pool = null;
    }
    this.pglite = new PGlite(dataDir);
    this.isPgliteMode = true;
    this.isInitialized = true;
    return this.pglite;
  }

  /**
   * Get or initialize active database instance
   */
  private async getEngine(): Promise<{ isPglite: boolean; engine: Pool | PGlite }> {
    if (this.isPgliteMode) {
      if (!this.pglite) {
        this.pglite = new PGlite();
      }
      return { isPglite: true, engine: this.pglite };
    }

    if (!this.pool) {
      this.configureEngine();
    }

    if (!this.pool) {
      this.pglite = new PGlite();
      this.isPgliteMode = true;
      return { isPglite: true, engine: this.pglite };
    }

    return { isPglite: false, engine: this.pool };
  }

  /**
   * Execute a parameterized SQL query
   */
  public async query<T = any>(text: string, params: any[] = []): Promise<DatabaseQueryResult<T>> {
    const { isPglite, engine } = await this.getEngine();

    if (isPglite) {
      const res = await (engine as PGlite).query(text, params);
      return {
        rows: (res.rows || []) as T[],
        rowCount: res.rows?.length || 0,
      };
    } else {
      const res = await (engine as Pool).query(text, params);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount || 0,
      };
    }
  }

  /**
   * Execute an atomic transaction
   */
  public async transaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T> {
    const { isPglite, engine } = await this.getEngine();

    if (isPglite) {
      const pgl = engine as PGlite;
      return await pgl.transaction(async (tx) => {
        const txClient: DatabaseClient = {
          query: async <R = any>(text: string, params: any[] = []) => {
            const res = await tx.query(text, params);
            return {
              rows: (res.rows || []) as R[],
              rowCount: res.rows?.length || 0,
            };
          },
        };
        return await fn(txClient);
      });
    } else {
      const pool = engine as Pool;
      const client: PoolClient = await pool.connect();
      try {
        await client.query('BEGIN');
        const txClient: DatabaseClient = {
          query: async <R = any>(text: string, params: any[] = []) => {
            const res = await client.query(text, params);
            return {
              rows: res.rows as R[],
              rowCount: res.rowCount || 0,
            };
          },
        };
        const result = await fn(txClient);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    }
  }

  /**
   * Test database connectivity and return version metadata
   */
  public async testConnection(): Promise<{ connected: boolean; version: string; engine: string }> {
    try {
      const res = await this.query('SELECT version();');
      const versionStr = res.rows[0]?.version || 'Unknown';
      return {
        connected: true,
        version: versionStr,
        engine: this.isPgliteMode ? 'PGlite (Embedded WASM PostgreSQL 16)' : 'PostgreSQL Server (node-postgres Pool)',
      };
    } catch (err: any) {
      return {
        connected: false,
        version: err.message,
        engine: this.isPgliteMode ? 'PGlite' : 'PostgreSQL Pool',
      };
    }
  }

  /**
   * Initialize or apply standard schema DDL
   */
  public async initializeSchema(sqlFilePath?: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const checkRes = await this.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Order' LIMIT 1`
      );
      if (checkRes.rows.length > 0) {
        this.isInitialized = true;
        return;
      }
    } catch {}

    const ddlPath =
      sqlFilePath ||
      path.resolve(__dirname, '../../prisma/migrations/0_init/migration.sql');

    if (!fs.existsSync(ddlPath)) {
      throw new Error(`DDL schema file not found at: ${ddlPath}`);
    }

    let ddl = fs.readFileSync(ddlPath, 'utf-8');
    if (ddl.charCodeAt(0) === 0xfeff) {
      ddl = ddl.slice(1);
    }

    const { isPglite, engine } = await this.getEngine();
    if (isPglite) {
      await (engine as PGlite).exec(ddl);
    } else {
      const pool = engine as Pool;
      const client = await pool.connect();
      try {
        await client.query(ddl);
      } finally {
        client.release();
      }
    }
    this.isInitialized = true;
  }

  /**
   * Close connections cleanly
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    if (this.pglite) {
      await this.pglite.close();
      this.pglite = null;
    }
    this.isInitialized = false;
  }
}

export const db = new DatabaseManager();
