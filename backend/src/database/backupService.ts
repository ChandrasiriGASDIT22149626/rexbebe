import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface BackupFileEntry {
  filename: string;
  bytes: number;
  sha256: string;
  itemCount: number;
  type: 'Array' | 'Object' | 'Primitive';
}

export interface BackupManifest {
  backupId: string;
  createdAt: string;
  sourceDirectory: string;
  targetDirectory: string;
  totalFiles: number;
  totalBytes: number;
  files: BackupFileEntry[];
}

export class BackupService {
  private dataDir: string;
  private backupRootDir: string;

  constructor(dataDir?: string, backupRootDir?: string) {
    this.dataDir = dataDir || path.resolve(__dirname, '../../data');
    this.backupRootDir = backupRootDir || path.join(this.dataDir, 'backups');
  }

  /**
   * Calculate SHA-256 hash of a buffer or string
   */
  public calculateSha256(content: Buffer | string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Create an automated, verified, immutable backup of all JSON data files
   */
  public async createVerifiedBackup(label: string = 'pre_migration'): Promise<{
    backupDir: string;
    manifest: BackupManifest;
    verified: boolean;
  }> {
    if (!fs.existsSync(this.dataDir)) {
      throw new Error(`Source data directory not found: ${this.dataDir}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${label}_${timestamp}`;
    const targetDir = path.join(this.backupRootDir, backupId);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const allFiles = fs.readdirSync(this.dataDir).filter((f) => f.endsWith('.json'));
    const manifestEntries: BackupFileEntry[] = [];
    let totalBytes = 0;

    for (const file of allFiles) {
      const srcPath = path.join(this.dataDir, file);
      const destPath = path.join(targetDir, file);

      const raw = fs.readFileSync(srcPath);
      const sha256 = this.calculateSha256(raw);
      totalBytes += raw.length;

      let itemCount = 0;
      let type: 'Array' | 'Object' | 'Primitive' = 'Primitive';
      try {
        const parsed = JSON.parse(raw.toString('utf-8'));
        if (Array.isArray(parsed)) {
          type = 'Array';
          itemCount = parsed.length;
        } else if (typeof parsed === 'object' && parsed !== null) {
          type = 'Object';
          itemCount = Object.keys(parsed).length;
        }
      } catch (e) {
        // Keep as primitive
      }

      // Copy file with synchronous write
      fs.writeFileSync(destPath, raw);

      manifestEntries.push({
        filename: file,
        bytes: raw.length,
        sha256,
        itemCount,
        type,
      });
    }

    const manifest: BackupManifest = {
      backupId,
      createdAt: new Date().toISOString(),
      sourceDirectory: this.dataDir,
      targetDirectory: targetDir,
      totalFiles: manifestEntries.length,
      totalBytes,
      files: manifestEntries,
    };

    // Write manifest inside the backup directory
    const manifestPath = path.join(targetDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    // Immediate post-backup cryptographic verification
    const verification = await this.verifyBackup(targetDir);
    if (!verification.valid) {
      throw new Error(`Backup verification failed for ${backupId}: ${verification.errors.join(', ')}`);
    }

    return {
      backupDir: targetDir,
      manifest,
      verified: true,
    };
  }

  /**
   * Verify an existing backup directory against its manifest.json
   */
  public async verifyBackup(backupDir: string): Promise<{ valid: boolean; errors: string[] }> {
    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return { valid: false, errors: ['manifest.json not found in backup directory'] };
    }

    const errors: string[] = [];
    try {
      const manifest: BackupManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      for (const entry of manifest.files) {
        const filePath = path.join(backupDir, entry.filename);
        if (!fs.existsSync(filePath)) {
          errors.push(`Missing backed-up file: ${entry.filename}`);
          continue;
        }

        const raw = fs.readFileSync(filePath);
        const actualSha = this.calculateSha256(raw);
        if (actualSha !== entry.sha256) {
          errors.push(`Checksum mismatch for ${entry.filename}: expected ${entry.sha256}, got ${actualSha}`);
        }
        if (raw.length !== entry.bytes) {
          errors.push(`Byte size mismatch for ${entry.filename}: expected ${entry.bytes}, got ${raw.length}`);
        }
      }
    } catch (err: any) {
      errors.push(`Manifest parse error: ${err.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Safely restore JSON data files from a verified backup directory into the active data folder.
   * Performs pre-restore backup and checksum verification.
   */
  public async restoreBackup(backupDir: string, targetDirectory?: string): Promise<{ restoredFiles: number; message: string }> {
    const verification = await this.verifyBackup(backupDir);
    if (!verification.valid) {
      throw new Error(`Cannot restore invalid backup: ${verification.errors.join('; ')}`);
    }

    const manifestPath = path.join(backupDir, 'manifest.json');
    const manifest: BackupManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const destDir = targetDirectory || this.dataDir;
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Create a safety snapshot of current state before restoring if restoring to dataDir
    if (destDir === this.dataDir) {
      await this.createVerifiedBackup('pre_restore_safety_snapshot');
    }

    let restoredCount = 0;
    for (const entry of manifest.files) {
      const srcPath = path.join(backupDir, entry.filename);
      const destPath = path.join(destDir, entry.filename);
      const content = fs.readFileSync(srcPath);
      fs.writeFileSync(destPath, content);
      restoredCount++;
    }

    return {
      restoredFiles: restoredCount,
      message: `Successfully restored ${restoredCount} JSON data files from backup ${manifest.backupId}`,
    };
  }
}

export const backupService = new BackupService();
