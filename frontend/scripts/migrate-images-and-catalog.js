/**
 * REXBEBE Safe Batch Image Migration & Catalog Reference Synchronizer
 * 
 * 1. Converts all JPG, JPEG, and PNG images across public assets & uploads to WebP (quality 80-85).
 * 2. Preserves transparency with lossless alpha encoding for graphics/logos.
 * 3. Preserves aspect ratios and dimensions (no cropping or stretching).
 * 4. Backs up original uploads safely to uploads/originals/ (never deletes originals).
 * 5. Generates high-efficiency thumbnails (-thumb.webp) for product grids.
 * 6. Updates database records (products.json, media.json, homepage.json, collections.json) safely.
 * 7. Reports total file size reduction and bandwidth savings.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const FRONTEND_UPLOADS_DIR = path.resolve(__dirname, '../public/uploads');
const BACKEND_UPLOADS_DIR = path.resolve(__dirname, '../../backend/uploads');
const FRONTEND_ORIGINALS_DIR = path.resolve(FRONTEND_UPLOADS_DIR, 'originals');
const BACKEND_ORIGINALS_DIR = path.resolve(BACKEND_UPLOADS_DIR, 'originals');

const IMAGE_DIRS = [
  path.resolve(__dirname, '../public/images/products'),
  path.resolve(__dirname, '../public/images/hero'),
  path.resolve(__dirname, '../public/images/sectors'),
  path.resolve(__dirname, '../public/images'),
  FRONTEND_UPLOADS_DIR,
  BACKEND_UPLOADS_DIR,
];

// Ensure backup directories exist
[FRONTEND_ORIGINALS_DIR, BACKEND_ORIGINALS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

let totalOriginalBytes = 0;
let totalOptimizedBytes = 0;
let filesConverted = 0;
let thumbnailsCreated = 0;

async function optimizeFile(filePath, isUploadDir = false) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;
  if (filePath.includes('-thumb.') || filePath.includes('.min.')) return;
  if (filePath.includes(path.sep + 'originals' + path.sep)) return;

  const dirName = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const baseName = path.basename(fileName, ext);

  const origStats = fs.statSync(filePath);
  totalOriginalBytes += origStats.size;

  // 1. If in uploads, backup original buffer to originals directory
  if (isUploadDir) {
    const frontOrigBackup = path.join(FRONTEND_ORIGINALS_DIR, fileName);
    const backOrigBackup = path.join(BACKEND_ORIGINALS_DIR, fileName);
    if (!fs.existsSync(frontOrigBackup)) fs.copyFileSync(filePath, frontOrigBackup);
    if (!fs.existsSync(backOrigBackup)) fs.copyFileSync(filePath, backOrigBackup);
  }

  const webpPath = path.join(dirName, `${baseName}.webp`);
  const thumbPath = path.join(dirName, `${baseName}-thumb.webp`);

  try {
    const metadata = await sharp(filePath).metadata();
    const isTransparent = Boolean(metadata.hasAlpha && metadata.channels && metadata.channels > 3);

    // 2. Generate full-resolution WebP
    if (!fs.existsSync(webpPath) || fs.statSync(webpPath).mtimeMs < origStats.mtimeMs) {
      if (isTransparent) {
        await sharp(filePath)
          .webp({ quality: 85, effort: 4, lossless: true, alphaQuality: 100 })
          .toFile(webpPath);
      } else {
        await sharp(filePath)
          .webp({ quality: 85, effort: 4 })
          .toFile(webpPath);
      }
      filesConverted++;
    }

    const webpStats = fs.statSync(webpPath);
    totalOptimizedBytes += webpStats.size;

    // 3. Generate responsive thumbnail (-thumb.webp) for products or uploads
    const isProductOrUpload = dirName.includes('products') || isUploadDir;
    if (isProductOrUpload && (!fs.existsSync(thumbPath) || fs.statSync(thumbPath).mtimeMs < origStats.mtimeMs)) {
      if (metadata.width && metadata.width > 420) {
        await sharp(filePath)
          .resize({ width: 420, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toFile(thumbPath);
      } else {
        fs.copyFileSync(webpPath, thumbPath);
      }
      thumbnailsCreated++;
    }

    // 4. If this is an upload, synchronize generated files between frontend and backend uploads
    if (isUploadDir) {
      const counterpartDir = dirName.includes('backend') ? FRONTEND_UPLOADS_DIR : BACKEND_UPLOADS_DIR;
      const counterpartWebp = path.join(counterpartDir, `${baseName}.webp`);
      const counterpartThumb = path.join(counterpartDir, `${baseName}-thumb.webp`);

      if (fs.existsSync(webpPath) && !fs.existsSync(counterpartWebp)) {
        fs.copyFileSync(webpPath, counterpartWebp);
      }
      if (fs.existsSync(thumbPath) && !fs.existsSync(counterpartThumb)) {
        fs.copyFileSync(thumbPath, counterpartThumb);
      }
    }
  } catch (err) {
    console.warn(`  ⚠️ Failed to convert ${fileName}:`, err.message);
    totalOptimizedBytes += origStats.size; // fallback to original size in accounting
  }
}

async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  const isUploadDir = dirPath === FRONTEND_UPLOADS_DIR || dirPath === BACKEND_UPLOADS_DIR;

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'originals') {
        await processDirectory(fullPath);
      }
    } else {
      await optimizeFile(fullPath, isUploadDir);
    }
  }
}

function updateDatabaseReferences() {
  console.log('\n🔄 Updating Database and Catalog image references to WebP...');

  const dataFiles = [
    {
      backend: path.resolve(__dirname, '../../backend/data/products.json'),
      frontend: path.resolve(__dirname, '../data/products.json'),
      type: 'products'
    },
    {
      backend: path.resolve(__dirname, '../../backend/data/media.json'),
      frontend: path.resolve(__dirname, '../data/media.json'),
      type: 'media'
    },
    {
      backend: path.resolve(__dirname, '../../backend/data/homepage.json'),
      frontend: path.resolve(__dirname, '../data/homepage.json'),
      type: 'homepage'
    },
    {
      backend: path.resolve(__dirname, '../../backend/data/collections.json'),
      frontend: path.resolve(__dirname, '../data/collections.json'),
      type: 'collections'
    },
  ];

  for (const { backend, frontend, type } of dataFiles) {
    if (!fs.existsSync(backend)) continue;

    let content = fs.readFileSync(backend, 'utf-8');
    let modified = false;

    if (type === 'products') {
      const products = JSON.parse(content);
      products.forEach((p) => {
        // Update images array
        (p.images || []).forEach((img) => {
          if (img.url) {
            const newUrl = convertUrlToWebp(img.url);
            if (newUrl !== img.url) {
              img.url = newUrl;
              modified = true;
            }
          }
        });

        // Update variants imageUrl
        (p.variants || []).forEach((v) => {
          if (v.imageUrl) {
            const newUrl = convertUrlToWebp(v.imageUrl);
            if (newUrl !== v.imageUrl) {
              v.imageUrl = newUrl;
              modified = true;
            }
          }
        });

        // Update parts images
        (p.parts || []).forEach((part) => {
          (part.images || []).forEach((pimg) => {
            if (pimg.url) {
              const newUrl = convertUrlToWebp(pimg.url);
              if (newUrl !== pimg.url) {
                pimg.url = newUrl;
                modified = true;
              }
            }
          });
        });
      });

      if (modified) {
        content = JSON.stringify(products, null, 2);
        fs.writeFileSync(backend, content, 'utf-8');
        if (fs.existsSync(path.dirname(frontend))) {
          fs.writeFileSync(frontend, content, 'utf-8');
        }
        console.log(`  ✅ Safely updated products.json image references to WebP`);
      }
    } else if (type === 'media') {
      const mediaList = JSON.parse(content);
      mediaList.forEach((m) => {
        if (m.url) {
          const newUrl = convertUrlToWebp(m.url);
          if (newUrl !== m.url) {
            const oldExt = path.extname(m.url);
            m.originalUrl = `/uploads/originals/${path.basename(m.url)}`;
            m.url = newUrl;
            m.name = path.basename(newUrl);
            m.thumbnailUrl = newUrl.replace('.webp', '-thumb.webp');
            m.format = 'webp';

            // Check actual file size of WebP
            const localWebp = path.join(FRONTEND_UPLOADS_DIR, path.basename(newUrl));
            if (fs.existsSync(localWebp)) {
              m.size = `${Math.round(fs.statSync(localWebp).size / 1024)} KB`;
            }
            modified = true;
          }
        }
      });

      if (modified) {
        content = JSON.stringify(mediaList, null, 2);
        fs.writeFileSync(backend, content, 'utf-8');
        if (fs.existsSync(path.dirname(frontend))) {
          fs.writeFileSync(frontend, content, 'utf-8');
        }
        console.log(`  ✅ Safely updated media.json references to WebP`);
      }
    } else if (type === 'homepage' || type === 'collections') {
      // String replacement for known converted images
      let updated = content;
      const regex = /\/uploads\/([^"'\s]+)\.(png|jpg|jpeg)/gi;
      updated = updated.replace(regex, (match, base, ext) => {
        const webpExists = fs.existsSync(path.join(FRONTEND_UPLOADS_DIR, `${base}.webp`)) ||
                           fs.existsSync(path.join(BACKEND_UPLOADS_DIR, `${base}.webp`));
        return webpExists ? `/uploads/${base}.webp` : match;
      });

      const imgRegex = /\/images\/([^"'\s]+)\.(png|jpg|jpeg)/gi;
      updated = updated.replace(imgRegex, (match, relPath, ext) => {
        const webpExists = fs.existsSync(path.join(__dirname, '../public/images', `${relPath}.webp`));
        return webpExists ? `/images/${relPath}.webp` : match;
      });

      if (updated !== content) {
        fs.writeFileSync(backend, updated, 'utf-8');
        if (fs.existsSync(path.dirname(frontend))) {
          fs.writeFileSync(frontend, updated, 'utf-8');
        }
        console.log(`  ✅ Safely updated ${type}.json image references to WebP`);
      }
    }
  }
}

function convertUrlToWebp(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.endsWith('.webp') || url.endsWith('.svg')) return url;

  const ext = path.extname(url).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return url;

  const base = url.substring(0, url.length - ext.length);
  const webpUrl = `${base}.webp`;

  // Verify that the webp file actually exists on disk before switching reference
  if (url.startsWith('/uploads/')) {
    const filename = path.basename(webpUrl);
    if (fs.existsSync(path.join(FRONTEND_UPLOADS_DIR, filename)) ||
        fs.existsSync(path.join(BACKEND_UPLOADS_DIR, filename))) {
      return webpUrl;
    }
  } else if (url.startsWith('/images/')) {
    const rel = webpUrl.replace('/images/', '');
    if (fs.existsSync(path.join(__dirname, '../public/images', rel))) {
      return webpUrl;
    }
  }

  return url;
}

async function run() {
  console.log('🚀 Starting REXBEBE Batch Image Optimization & Safe Migration...\n');

  const seen = new Set();
  for (const dir of IMAGE_DIRS) {
    if (!seen.has(dir) && fs.existsSync(dir)) {
      seen.add(dir);
      console.log(`📂 Processing: ${dir}`);
      await processDirectory(dir);
    }
  }

  updateDatabaseReferences();

  const originalMb = (totalOriginalBytes / (1024 * 1024)).toFixed(2);
  const optimizedMb = (totalOptimizedBytes / (1024 * 1024)).toFixed(2);
  const savedMb = ((totalOriginalBytes - totalOptimizedBytes) / (1024 * 1024)).toFixed(2);
  const percentSaved = totalOriginalBytes > 0
    ? Math.round(((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100)
    : 0;

  console.log('\n======================================================');
  console.log('✨ REXBEBE BATCH IMAGE MIGRATION COMPLETE SUMMARY:');
  console.log(`   - Images Converted: ${filesConverted}`);
  console.log(`   - Thumbnails Generated: ${thumbnailsCreated}`);
  console.log(`   - Original Raw Size: ${originalMb} MB (${totalOriginalBytes.toLocaleString()} bytes)`);
  console.log(`   - Optimized WebP Size: ${optimizedMb} MB (${totalOptimizedBytes.toLocaleString()} bytes)`);
  console.log(`   - Total Storage & Bandwidth Saved: ${savedMb} MB (${percentSaved}% reduction)`);
  console.log('   - Original Files Backed Up: 100% Intact in uploads/originals/');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
