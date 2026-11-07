import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { db } from '../config/database';
import { MigrationService } from '../database/migrationService';

export async function runCatalogSync() {
  console.log('--- REXBEBE Neon PostgreSQL Catalog Synchronization ---');
  console.log('Testing connection to database...');

  const status = await db.testConnection();
  console.log('Database Engine:', status.engine);
  console.log('Database Connected:', status.connected);
  console.log('Database Version:', status.version);

  if (!status.connected) {
    console.error('Cannot run sync: database is not connected. Check DATABASE_URL in backend/.env');
    return false;
  }

  const migrationService = new MigrationService();
  console.log('Validating source JSON files...');
  const validation = await migrationService.validateSourceData();
  console.log('Source validation summary:', validation.summary);

  console.log('Running transactional migration to PostgreSQL...');
  const report = await migrationService.runMigration({ dryRun: false });

  console.log('Migration Completed!');
  console.log(`Success: ${report.success}`);
  console.log(`Total Records Migrated: ${report.totalRecordsMigrated}`);
  console.log(`Entities Migrated: ${report.totalEntitiesMigrated}`);
  console.log('Entity counts:');
  for (const c of report.counts) {
    console.log(`  - ${c.entity}: source=${c.sourceJsonCount}, db=${c.migratedDbCount} [${c.status}]`);
  }

  // Verify rows in PostgreSQL
  console.log('\n--- Verifying Row Counts in PostgreSQL ---');
  const tables = ['Product', 'ProductVariant', 'Category', 'NavigationItem', 'HomepageConfig', 'Order', 'Customer'];
  for (const t of tables) {
    try {
      const res = await db.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`  ${t}: ${res.rows[0].count} rows`);
    } catch (e: any) {
      console.log(`  ${t}: Error querying count (${e.message})`);
    }
  }

  return true;
}

if (require.main === module) {
  runCatalogSync()
    .then(async () => {
      await db.close();
      console.log('\nSync finished cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

