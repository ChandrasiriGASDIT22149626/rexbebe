/**
 * REXBEBE Automated Image Optimization & WebP Generation Suite
 * Converts uncompressed/heavy PNGs and JPEGs into high-efficiency WebP files
 * Generates lightweight thumbnails while preserving 100% of original source images.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIRS_TO_OPTIMIZE = [
  path.resolve(__dirname, '../public/images/products'),
  path.resolve(__dirname, '../public/images/hero'),
  path.resolve(__dirname, '../public/images'),
  path.resolve(__dirname, '../../backend/uploads'),
];

let totalSavedBytes = 0;
let filesOptimized = 0;

async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Avoid processing .next or node_modules
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        await processDirectory(fullPath);
      }
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    // Skip if it's already a generated thumbnail or variant
    if (entry.name.includes('-thumb.') || entry.name.includes('.min.')) continue;

    const baseName = path.basename(entry.name, ext);
    const webpPath = path.join(dirPath, `${baseName}.webp`);
    const thumbWebpPath = path.join(dirPath, `${baseName}-thumb.webp`);

    const origStats = fs.statSync(fullPath);

    // 1. Generate full-resolution optimized WebP if missing or outdated
    const needsWebp = !fs.existsSync(webpPath) || fs.statSync(webpPath).mtimeMs < origStats.mtimeMs;
    if (needsWebp) {
      try {
        await sharp(fullPath)
          .webp({ quality: 85, effort: 4 })
          .toFile(webpPath);

        const newStats = fs.statSync(webpPath);
        const saved = origStats.size - newStats.size;
        if (saved > 0) totalSavedBytes += saved;
        filesOptimized++;
        console.log(`  ✨ Optimized: ${entry.name} (${Math.round(origStats.size / 1024)}KB) -> ${baseName}.webp (${Math.round(newStats.size / 1024)}KB) [${Math.round((saved / origStats.size) * 100)}% saved]`);
      } catch (err) {
        console.warn(`  ⚠️ Could not convert ${entry.name}:`, err.message);
      }
    }

    // 2. For product images > 400px wide, generate high-speed thumbnail WebP
    const needsThumb = !fs.existsSync(thumbWebpPath) || fs.statSync(thumbWebpPath).mtimeMs < origStats.mtimeMs;
    if (needsThumb && dirPath.includes('products')) {
      try {
        const metadata = await sharp(fullPath).metadata();
        if (metadata.width && metadata.width > 420) {
          await sharp(fullPath)
            .resize({ width: 420, withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toFile(thumbWebpPath);
          console.log(`  📦 Generated Thumbnail: ${baseName}-thumb.webp`);
        }
      } catch (err) {
        // Ignore thumb resize error
      }
    }
  }
}

async function run() {
  console.log('🚀 Starting REXBEBE Image Optimization & WebP Generation...\n');
  const seen = new Set();
  for (const dir of DIRS_TO_OPTIMIZE) {
    if (!seen.has(dir) && fs.existsSync(dir)) {
      seen.add(dir);
      console.log(`📂 Scanning: ${dir}`);
      await processDirectory(dir);
    }
  }

  console.log(`\n🎉 Image Optimization Complete!`);
  console.log(`  - Files Optimized: ${filesOptimized}`);
  console.log(`  - Total Network Bandwidth Saved: ${Math.round(totalSavedBytes / 1024)} KB\n`);
}

run().catch(console.error);
