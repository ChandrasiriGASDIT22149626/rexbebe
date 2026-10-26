const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'public/images/logo.png');
const outputPath = path.join(__dirname, 'public/images/logo_clean.png');

async function removePinkBackground() {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // Process RGBA pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if pixel is background (near white, pale pink, or pastel pink)
    // Pinkish background pixels have high R, slightly lower G, and moderate to high B
    // e.g. R > 220, G > 200, B > 200 or R > 230, G > 210, B > 215
    const isWhite = r > 240 && g > 240 && b > 240;
    const isPinkBackground = r > 220 && g > 200 && b > 200 && Math.abs(r - b) < 35 && g > 195;
    
    // Specifically target the pink pill container: R > 225, G > 200, B > 205
    if (isWhite || isPinkBackground || (r > 230 && g > 205 && b > 210)) {
      data[i + 3] = 0; // Make pixel 100% transparent
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png()
  .toFile(outputPath);

  console.log('Successfully created clean logo at logo_clean.png');

  // Replace original logo.png with logo_clean.png
  fs.copyFileSync(outputPath, inputPath);
  console.log('Successfully updated logo.png');
}

removePinkBackground().catch(err => {
  console.error('Error removing background:', err);
});
