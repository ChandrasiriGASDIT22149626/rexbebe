const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.resolve(__dirname, '..', 'frontend', 'public');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalOriginal = 0;
  let totalOptimized = 0;
  let count = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const sub = await processDirectory(fullPath);
      totalOriginal += sub.totalOriginal;
      totalOptimized += sub.totalOptimized;
      count += sub.count;
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    const origSize = stat.size;

    // Only optimize files larger than 100 KB
    if (origSize < 100 * 1024) {
      totalOriginal += origSize;
      totalOptimized += origSize;
      continue;
    }

    try {
      // Read file into memory buffer so sharp doesn't lock the file on Windows
      const inputBuffer = fs.readFileSync(fullPath);
      const meta = await sharp(inputBuffer).metadata();
      let pipeline = sharp(inputBuffer);

      // Downscale if unreasonably large (e.g., > 1600px)
      if (meta.width && meta.width > 1600) {
        pipeline = pipeline.resize({ width: 1600, withoutEnlargement: true });
      }

      let buffer;
      if (ext === '.png') {
        buffer = await pipeline
          .png({
            quality: 90,
            compressionLevel: 9,
            effort: 7,
          })
          .toBuffer();
      } else {
        buffer = await pipeline
          .jpeg({
            quality: 85,
            mozjpeg: true,
            progressive: true,
          })
          .toBuffer();
      }

      if (buffer.length < origSize) {
        fs.writeFileSync(fullPath, buffer);
        const savedPercent = Math.round(((origSize - buffer.length) / origSize) * 100);
        console.log(`Optimized ${entry.name}: ${Math.round(origSize / 1024)}KB -> ${Math.round(buffer.length / 1024)}KB (${savedPercent}% saved)`);
        totalOriginal += origSize;
        totalOptimized += buffer.length;
        count++;
      } else {
        totalOriginal += origSize;
        totalOptimized += origSize;
      }
    } catch (err) {
      console.warn(`Could not optimize ${entry.name}:`, err.message);
      totalOriginal += origSize;
      totalOptimized += origSize;
    }
  }

  return { totalOriginal, totalOptimized, count };
}

async function run() {
  console.log('Starting image asset optimization in:', PUBLIC_DIR);
  const result = await processDirectory(PUBLIC_DIR);
  const totalSaved = result.totalOriginal - result.totalOptimized;
  const pct = Math.round((totalSaved / (result.totalOriginal || 1)) * 100);

  console.log('==================================================');
  console.log(`Optimization Complete!`);
  console.log(`Files optimized: ${result.count}`);
  console.log(`Original total:  ${(result.totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized total: ${(result.totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total saved:     ${(totalSaved / 1024 / 1024).toFixed(2)} MB (${pct}% reduction)`);
  console.log('==================================================');
}

run();
