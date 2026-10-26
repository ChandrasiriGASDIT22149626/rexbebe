const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

async function generateVariation(baseImagePath, targetHue, targetSat, lightCurve, outputPaths) {
  const img = await sharp(baseImagePath).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = img;
  const w = info.width;
  const h = info.height;
  const outBuf = Buffer.from(data);

  let recoloredPixelCount = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const normX = x / w;
      const normY = y / h;

      // Restrict strictly to T-shirt bounding box
      // (y: 12% to 52%, x: 20% to 83%)
      if (normY >= 0.12 && normY <= 0.52 && normX >= 0.20 && normX <= 0.83) {
        // 1. Strictly protect Hat (lower right quadrant normX > 0.62 && normY > 0.49)
        if (normX > 0.62 && normY > 0.49) continue;

        // 2. Strictly protect Background (soft sage grey [180-210, 190-215, 180-205])
        if (g > 140 && b > 140) continue;

        // 3. Strictly protect Dinosaur Illustration:
        //    a. Green body
        if (g > 75 && g > b * 0.9 && (g > r * 0.65 || g > 110)) continue;
        //    b. Cyan / teal fins & waves
        if (b > 85 && g > 85) continue;
        //    c. Yellow/orange spikes & spots
        if (r > 160 && g > 120) continue;
        //    d. White/cream teeth, eyes, labels
        if (r > 170 && g > 150 && b > 130) continue;
        //    e. Dark graphic outlines in chest region
        if (r < 90 && g < 60 && b < 60 && normX > 0.38 && normX < 0.65 && normY > 0.23 && normY < 0.49) continue;

        // 4. Must be Red Fabric:
        // Saturated red:
        const isRed = (r > 110 && (r - g) > 42 && (r - b) > 42);
        if (isRed) {
          const origLum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const adjustedL = lightCurve(origLum);
          const [recR, recG, recB] = hslToRgb(targetHue, targetSat, adjustedL);

          outBuf[idx] = recR;
          outBuf[idx + 1] = recG;
          outBuf[idx + 2] = recB;
          recoloredPixelCount++;
        }
      }
    }
  }

  console.log(`Recolored ${recoloredPixelCount} pixels for target hue ${targetHue}. Total pixels: ${w * h}`);

  // Save at maximum quality JPEG (quality: 98) to eliminate compression artifacts
  for (const outPath of outputPaths) {
    await sharp(outBuf, { raw: { width: w, height: h, channels: 3 } })
      .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
      .toFile(outPath);
    console.log(`Successfully written: ${outPath}`);
  }
}

async function main() {
  const baseImg = path.resolve(__dirname, '../frontend/public/images/products/dino-baby-set.jpg');

  // 1. Sunny Yellow Variation:
  // Hue: ~0.13 (approx 47 degrees), Saturation: 0.95
  console.log('Generating Pixel-Perfect Yellow Variation...');
  await generateVariation(
    baseImg,
    0.13,
    0.95,
    (lum) => Math.min(0.86, Math.max(0.18, 0.48 + (lum - 0.28) * 0.90)),
    [
      path.resolve(__dirname, '../frontend/public/images/products/dino-baby-set-yellow.jpg'),
      path.resolve(__dirname, '../backend/uploads/dino-baby-set-yellow.jpg'),
    ]
  );

  // 2. Royal / Baby Blue Variation:
  // Hue: ~0.58 (approx 210 degrees), Saturation: 0.86
  console.log('Generating Pixel-Perfect Blue Variation...');
  await generateVariation(
    baseImg,
    0.58,
    0.86,
    (lum) => Math.min(0.82, Math.max(0.14, 0.42 + (lum - 0.28) * 0.90)),
    [
      path.resolve(__dirname, '../frontend/public/images/products/dino-baby-set-blue.jpg'),
      path.resolve(__dirname, '../backend/uploads/dino-baby-set-blue.jpg'),
    ]
  );

  console.log('Done! All variations successfully generated and synchronized.');
}

main().catch(console.error);
