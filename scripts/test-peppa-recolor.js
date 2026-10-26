const sharp = require('sharp');
const fs = require('fs');

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
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

function hexToRgb(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function isSkinPixel(r, g, b) {
  const [hue, sat, lum] = rgbToHsl(r, g, b);
  const isRGBOrder = (r > g) && (g > b) && (r - g >= 8) && (g - b >= 8);
  const isSkinHue = (hue >= 0.02 && hue <= 0.13) && (sat >= 0.18 && sat <= 0.75) && (lum >= 0.20 && lum <= 0.88);
  return isRGBOrder && isSkinHue;
}

function fillArtworkInterior(rawPrint, rw, rh) {
  const dilated = new Uint8Array(rw * rh);
  for (let ry = 0; ry < rh; ry++) {
    for (let rx = 0; rx < rw; rx++) {
      const idx = ry * rw + rx;
      if (rawPrint[idx]) {
        dilated[idx] = 1;
        if (rx > 0) dilated[idx - 1] = 1;
        if (rx < rw - 1) dilated[idx + 1] = 1;
        if (ry > 0) dilated[idx - rw] = 1;
        if (ry < rh - 1) dilated[idx + rw] = 1;
      }
    }
  }

  const reachableFromBorder = new Uint8Array(rw * rh);
  const queue = [];

  for (let rx = 0; rx < rw; rx++) {
    if (!dilated[0 * rw + rx]) { reachableFromBorder[0 * rw + rx] = 1; queue.push(rx, 0); }
    if (!dilated[(rh - 1) * rw + rx]) { reachableFromBorder[(rh - 1) * rw + rx] = 1; queue.push(rx, rh - 1); }
  }
  for (let ry = 0; ry < rh; ry++) {
    if (!dilated[ry * rw + 0]) { reachableFromBorder[ry * rw + 0] = 1; queue.push(0, ry); }
    if (!dilated[ry * rw + (rw - 1)]) { reachableFromBorder[ry * rw + (rw - 1)] = 1; queue.push(rw - 1, ry); }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];

    if (cx > 0) {
      const nidx = cy * rw + (cx - 1);
      if (!reachableFromBorder[nidx] && !dilated[nidx]) { reachableFromBorder[nidx] = 1; queue.push(cx - 1, cy); }
    }
    if (cx < rw - 1) {
      const nidx = cy * rw + (cx + 1);
      if (!reachableFromBorder[nidx] && !dilated[nidx]) { reachableFromBorder[nidx] = 1; queue.push(cx + 1, cy); }
    }
    if (cy > 0) {
      const nidx = (cy - 1) * rw + cx;
      if (!reachableFromBorder[nidx] && !dilated[nidx]) { reachableFromBorder[nidx] = 1; queue.push(cx, cy - 1); }
    }
    if (cy < rh - 1) {
      const nidx = (cy + 1) * rw + cx;
      if (!reachableFromBorder[nidx] && !dilated[nidx]) { reachableFromBorder[nidx] = 1; queue.push(cx, cy + 1); }
    }
  }

  const filled = new Uint8Array(rw * rh);
  for (let i = 0; i < rw * rh; i++) {
    if (!reachableFromBorder[i]) {
      filled[i] = 1;
    }
  }
  return filled;
}

function generateFabricMask(data, w, h, targetGarment = 'tshirt') {
  const isDualView = (w / h >= 0.95);
  const dividerX = isDualView ? Math.round(w * 0.51) : w;

  const mask = new Uint8Array(w * h);
  const protectedArtwork = new Uint8Array(w * h);

  const getPixel = (x, y) => {
    const idx = (y * w + x) * 3;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };

  if (targetGarment === 'tshirt') {
    // -------------------------------------------------------------------------
    // VIEW 1: FRONT VIEW (x: 0 .. dividerX - 1)
    // -------------------------------------------------------------------------
    const frontSamples = [];
    const frontPoints = [
      { x: Math.round(dividerX * 0.28), y: Math.round(h * 0.38) },
      { x: Math.round(dividerX * 0.75), y: Math.round(h * 0.38) },
      { x: Math.round(dividerX * 0.22), y: Math.round(h * 0.44) },
      { x: Math.round(dividerX * 0.80), y: Math.round(h * 0.44) },
    ];

    for (const pt of frontPoints) {
      for (let dy = -6; dy <= 6; dy += 2) {
        for (let dx = -6; dx <= 6; dx += 2) {
          const sx = Math.max(0, Math.min(dividerX - 1, pt.x + dx));
          const sy = Math.max(0, Math.min(h - 1, pt.y + dy));
          const [r, g, b] = getPixel(sx, sy);
          if (isSkinPixel(r, g, b)) continue;
          if (r > 248 && g > 248 && b > 248) continue;
          if (r < 30 && g < 30 && b < 30) continue;
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          frontSamples.push({ r, g, b, lum });
        }
      }
    }

    frontSamples.sort((a, b) => a.lum - b.lum);
    const frontBaseColor = frontSamples.length > 0
      ? frontSamples[Math.floor(frontSamples.length / 2)]
      : { r: 250, g: 163, b: 194, lum: 0.755 };

    const [frontBaseH, frontBaseS, frontBaseL] = rgbToHsl(frontBaseColor.r, frontBaseColor.g, frontBaseColor.b);

    // Dynamic Seed Search for Front Graphic Print
    let fMinX = w, fMaxX = 0, fMinY = h, fMaxY = 0;
    let fSeedFound = false;

    for (let y = Math.floor(h * 0.40); y <= Math.floor(h * 0.68); y++) {
      for (let x = Math.floor(w * 0.14); x <= Math.min(dividerX - 25, Math.floor(w * 0.45)); x++) {
        const [r, g, b] = getPixel(x, y);
        const [hVal, sVal, lVal] = rgbToHsl(r, g, b);

        const isBlue = (b > r + 18 && b > g + 12);
        const isGreen = (g > r + 12 && g > b + 15);
        const isRed = (r > 210 && (r - g) > 105 && (r - b) > 95);
        const isDark = (r < 85 && g < 80 && b < 85) || lVal < 0.22;
        const isWhite = (r > 235 && g > 230 && b > 230 && Math.abs(r - g) < 15 && Math.abs(r - b) < 15 && (frontBaseS > 0.15 || frontBaseColor.r < 235));

        if (isBlue || isGreen || isRed || isDark || isWhite) {
          fMinX = Math.min(fMinX, x);
          fMaxX = Math.max(fMaxX, x);
          fMinY = Math.min(fMinY, y);
          fMaxY = Math.max(fMaxY, y);
          fSeedFound = true;
        }
      }
    }

    if (fSeedFound) {
      // Add tight 6px padding around detected print cluster
      const roiX1 = Math.max(0, fMinX - 6);
      const roiX2 = Math.min(dividerX - 10, fMaxX + 6);
      const roiY1 = Math.max(0, fMinY - 6);
      const roiY2 = Math.min(h - 1, fMaxY + 6);
      const rw = roiX2 - roiX1 + 1;
      const rh = roiY2 - roiY1 + 1;

      const rawPrint = new Uint8Array(rw * rh);

      for (let y = roiY1; y <= roiY2; y++) {
        for (let x = roiX1; x <= roiX2; x++) {
          const [r, g, b] = getPixel(x, y);
          const [hVal, sVal, lVal] = rgbToHsl(r, g, b);

          const isBlue = (b > r + 15 && b > g + 10);
          const isGreen = (g > r + 10 && g > b + 15);
          const isRed = (r > 210 && (r - g) > 100 && (r - b) > 90);
          const isDark = (r < 95 && g < 90 && b < 95) || lVal < 0.22;
          const isVioletInk = (r > 215 && b > 190 && g < 170 && (b - g) >= 36);
          const isWhiteInk = (r > 230 && g > 225 && b > 225 && Math.abs(r - g) < 18 && Math.abs(r - b) < 18);

          if (isBlue || isGreen || isRed || isDark || isVioletInk || isWhiteInk) {
            rawPrint[(y - roiY1) * rw + (x - roiX1)] = 1;
          }
        }
      }

      const filledPrint = fillArtworkInterior(rawPrint, rw, rh);

      // Dilate filled artwork mask by 2px into protectedArtwork
      for (let ry = 0; ry < rh; ry++) {
        for (let rx = 0; rx < rw; rx++) {
          const pidx = ry * rw + rx;
          if (filledPrint[pidx]) {
            const gx = roiX1 + rx;
            const gy = roiY1 + ry;
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                const nx = gx + dx;
                const ny = gy + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  protectedArtwork[ny * w + nx] = 1;
                }
              }
            }
          }
        }
      }
    }

    // FRONT FABRIC MASK PASS:
    for (let y = 0; y < h; y++) {
      const normY = y / h;
      if (normY < 0.31 || normY > 0.765) continue;

      for (let x = 0; x < dividerX; x++) {
        const normX = x / w;
        const pIdx = y * w + x;

        // Skip protected artwork
        if (protectedArtwork[pIdx]) continue;

        // Outer margins
        if (normX < 0.04 || x >= dividerX - 8) continue;

        // Bare arms & toy cutoff below sleeve cuffs (sleeves end around normY = 0.52)
        if (normY > 0.52) {
          if (normX < 0.11) continue; // Left bare arm & toy
          if (normX > 0.44) continue; // Right bare arm
        }

        const [r, g, b] = getPixel(x, y);

        // Exclude white background & deep shadows & grey walls
        if (r > 248 && g > 248 && b > 248) continue;
        if (r < 25 && g < 25 && b < 25) continue;

        const [hVal, sVal, lVal] = rgbToHsl(r, g, b);
        if (sVal < 0.15 && Math.abs(r - g) < 12 && Math.abs(r - b) < 12) continue;

        // Baby Skin Protection (Face, chin, neck, bare arms)
        if (isSkinPixel(r, g, b)) continue;

        // Shorts protection at hem
        if (normY >= 0.74) {
          if ((Math.abs(r - g) < 32 && Math.abs(r - b) < 32) || (g > 185 && b > 185 && (r - g) < 45)) continue;
        }

        // Fabric matching
        const dist = Math.sqrt((r - frontBaseColor.r) ** 2 + (g - frontBaseColor.g) ** 2 + (b - frontBaseColor.b) ** 2);
        const hueDiff = Math.min(Math.abs(hVal - frontBaseH), 1 - Math.abs(hVal - frontBaseH));

        const isFabric = (dist <= 82) ||
          (hueDiff <= 0.08 && Math.abs(sVal - frontBaseS) <= 0.45 && lVal >= 0.18 && lVal <= 0.95);

        if (isFabric) {
          mask[pIdx] = 255;
        }
      }
    }

    // -------------------------------------------------------------------------
    // VIEW 2: BACK VIEW (x: dividerX + 1 .. w - 1)
    // -------------------------------------------------------------------------
    if (isDualView) {
      const backWidth = w - dividerX;
      const backSamples = [];
      const backPoints = [
        { x: Math.round(dividerX + backWidth * 0.28), y: Math.round(h * 0.38) },
        { x: Math.round(dividerX + backWidth * 0.75), y: Math.round(h * 0.38) },
        { x: Math.round(dividerX + backWidth * 0.35), y: Math.round(h * 0.48) },
        { x: Math.round(dividerX + backWidth * 0.65), y: Math.round(h * 0.48) },
      ];

      for (const pt of backPoints) {
        for (let dy = -6; dy <= 6; dy += 2) {
          for (let dx = -6; dx <= 6; dx += 2) {
            const sx = Math.max(dividerX + 1, Math.min(w - 1, pt.x + dx));
            const sy = Math.max(0, Math.min(h - 1, pt.y + dy));
            const [r, g, b] = getPixel(sx, sy);
            if (isSkinPixel(r, g, b)) continue;
            if (r > 248 && g > 248 && b > 248) continue;
            if (r < 30 && g < 30 && b < 30) continue;
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            backSamples.push({ r, g, b, lum });
          }
        }
      }

      backSamples.sort((a, b) => a.lum - b.lum);
      const backBaseColor = backSamples.length > 0
        ? backSamples[Math.floor(backSamples.length / 2)]
        : { r: 247, g: 163, b: 196, lum: 0.755 };

      const [backBaseH, backBaseS, backBaseL] = rgbToHsl(backBaseColor.r, backBaseColor.g, backBaseColor.b);

      // Dynamic Seed Search for Back Logo
      let bMinX = w, bMaxX = 0, bMinY = h, bMaxY = 0;
      let bSeedFound = false;

      for (let y = Math.floor(h * 0.33); y <= Math.floor(h * 0.48); y++) {
        for (let x = Math.floor(dividerX + backWidth * 0.20); x <= Math.floor(dividerX + backWidth * 0.80); x++) {
          const [r, g, b] = getPixel(x, y);
          const [hVal, sVal, lVal] = rgbToHsl(r, g, b);

          const isBlue = (b > r + 18 && b > g + 12);
          const isWhite = (r > 225 && g > 220 && b > 220 && Math.abs(r - g) < 20 && Math.abs(r - b) < 20);
          const isDark = (r < 85 && g < 80 && b < 85) || lVal < 0.22;

          if (isBlue || isWhite || isDark) {
            bMinX = Math.min(bMinX, x);
            bMaxX = Math.max(bMaxX, x);
            bMinY = Math.min(bMinY, y);
            bMaxY = Math.max(bMaxY, y);
            bSeedFound = true;
          }
        }
      }

      if (bSeedFound) {
        const bRoiX1 = Math.max(dividerX + 1, bMinX - 6);
        const bRoiX2 = Math.min(w - 1, bMaxX + 6);
        const bRoiY1 = Math.max(0, bMinY - 6);
        const bRoiY2 = Math.min(h - 1, bMaxY + 6);
        const brw = bRoiX2 - bRoiX1 + 1;
        const brh = bRoiY2 - bRoiY1 + 1;

        const rawBackLogo = new Uint8Array(brw * brh);
        for (let y = bRoiY1; y <= bRoiY2; y++) {
          for (let x = bRoiX1; x <= bRoiX2; x++) {
            const [r, g, b] = getPixel(x, y);
            const [hVal, sVal, lVal] = rgbToHsl(r, g, b);

            const isBlue = (b > r + 15 && b > g + 10);
            const isWhite = (r > 225 && g > 220 && b > 220 && Math.abs(r - g) < 20 && Math.abs(r - b) < 20);
            const isDark = (r < 95 && g < 90 && b < 95) || lVal < 0.22;

            if (isBlue || isWhite || isDark) {
              rawBackLogo[(y - bRoiY1) * brw + (x - bRoiX1)] = 1;
            }
          }
        }

        const filledBackLogo = fillArtworkInterior(rawBackLogo, brw, brh);

        for (let ry = 0; ry < brh; ry++) {
          for (let rx = 0; rx < brw; rx++) {
            const pidx = ry * brw + rx;
            if (filledBackLogo[pidx]) {
              const gx = bRoiX1 + rx;
              const gy = bRoiY1 + ry;
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  const nx = gx + dx;
                  const ny = gy + dy;
                  if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    protectedArtwork[ny * w + nx] = 1;
                  }
                }
              }
            }
          }
        }
      }

      // BACK FABRIC MASK PASS:
      for (let y = 0; y < h; y++) {
        const normY = y / h;
        if (normY < 0.315 || normY > 0.760) continue;

        for (let x = dividerX + 8; x < w; x++) {
          const normX = x / w;
          const pIdx = y * w + x;

          // Skip protected back logo
          if (protectedArtwork[pIdx]) continue;

          // Outer margin & divider seam
          if (x > w - 20) continue;

          // Arms below back sleeves (sleeves end around normY = 0.52)
          if (normY > 0.52) {
            if (x < dividerX + backWidth * 0.16) continue;
            if (x > dividerX + backWidth * 0.88) continue;
          }

          const [r, g, b] = getPixel(x, y);

          // Exclude white background & deep shadows & grey walls
          if (r > 248 && g > 248 && b > 248) continue;
          if (r < 25 && g < 25 && b < 25) continue;

          const [hVal, sVal, lVal] = rgbToHsl(r, g, b);
          if (sVal < 0.15 && Math.abs(r - g) < 12 && Math.abs(r - b) < 12) continue;

          // Skin Protection (neck nape, hair, bare arms)
          if (isSkinPixel(r, g, b)) continue;

          // Shorts protection at hem
          if (normY >= 0.74) {
            if ((Math.abs(r - g) < 32 && Math.abs(r - b) < 32) || (g > 185 && b > 185 && (r - g) < 45)) continue;
          }

          // Fabric matching
          const dist = Math.sqrt((r - backBaseColor.r) ** 2 + (g - backBaseColor.g) ** 2 + (b - backBaseColor.b) ** 2);
          const hueDiff = Math.min(Math.abs(hVal - backBaseH), 1 - Math.abs(hVal - backBaseH));

          const isFabric = (dist <= 82) ||
            (hueDiff <= 0.08 && Math.abs(sVal - backBaseS) <= 0.45 && lVal >= 0.18 && lVal <= 0.95);

          if (isFabric) {
            mask[pIdx] = 255;
          }
        }
      }
    }
  }

  return { mask, protectedArtwork, baseLum: 0.755 };
}

async function testRecolor() {
  const inputPath = 'backend/uploads/1792689904160-peppa-pig-toddler-outfit-diptych-1-.png';
  const img = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = img;
  const w = info.width, h = info.height;

  console.log(`Processing image ${w}x${h}...`);
  const { mask, protectedArtwork, baseLum } = generateFabricMask(data, w, h, 'tshirt');

  let fabricPixelCount = 0;
  let protectedPixelCount = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i] > 0) fabricPixelCount++;
    if (protectedArtwork[i] > 0) protectedPixelCount++;
  }

  console.log(`Fabric pixels masked: ${fabricPixelCount}`);
  console.log(`Artwork pixels strictly protected: ${protectedPixelCount}`);

  const testColors = [
    { name: 'yellow', hex: '#FACC15' },
    { name: 'purple', hex: '#A855F7' }
  ];

  for (const tc of testColors) {
    const targetRgb = hexToRgb(tc.hex);
    const [targetH, targetS, targetL] = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);
    const outBuf = Buffer.from(data);

    let changedCount = 0;
    let protectedChanged = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const pIdx = y * w + x;
        const i = pIdx * 3;
        const origR = data[i], origG = data[i+1], origB = data[i+2];

        if (mask[pIdx] > 0) {
          if (protectedArtwork[pIdx]) {
            protectedChanged++;
          }
          const origLum = (0.299 * origR + 0.587 * origG + 0.114 * origB) / 255;
          const relDiff = origLum - baseLum;
          const adjustedL = Math.min(0.94, Math.max(0.14, targetL + relDiff * 0.65));
          const [recR, recG, recB] = hslToRgb(targetH, targetS, adjustedL);

          outBuf[i] = recR;
          outBuf[i+1] = recG;
          outBuf[i+2] = recB;
          changedCount++;
        } else {
          outBuf[i] = origR;
          outBuf[i+1] = origG;
          outBuf[i+2] = origB;
        }
      }
    }

    console.log(`Recolored ${tc.name}: ${changedCount} pixels changed. Protected artwork changed: ${protectedChanged}`);

    const testPoints = [
      { name: 'Peppa face lilac-pink', x: 290, y: 580, expectRecolor: false },
      { name: 'Peppa eye white ink', x: 285, y: 545, expectRecolor: false },
      { name: 'Peppa outline dark', x: 260, y: 555, expectRecolor: false },
      { name: 'Peppa red dress', x: 290, y: 680, expectRecolor: false },
      { name: 'Front Peppa logo blue text', x: 450, y: 580, expectRecolor: false },
      { name: 'George / Dinosaur green', x: 485, y: 690, expectRecolor: false },
      { name: 'Back Peppa logo blue', x: 1010, y: 480, expectRecolor: false },
      { name: 'Back Peppa logo light ink', x: 1020, y: 475, expectRecolor: false },
      { name: 'Shorts pink floral front', x: 300, y: 950, expectRecolor: false },
      { name: 'Shorts back view', x: 900, y: 950, expectRecolor: false },
      { name: 'Skin toddler neck', x: 360, y: 400, expectRecolor: false },
      { name: 'Skin toddler arm', x: 110, y: 800, expectRecolor: false },
      { name: 'Background floor', x: 100, y: 600, expectRecolor: false },
      { name: 'Neutral background wall', x: 670, y: 200, expectRecolor: false },
      { name: 'Front T-shirt fabric (target)', x: 300, y: 480, expectRecolor: true },
      { name: 'Back T-shirt fabric (target)', x: 950, y: 600, expectRecolor: true },
    ];

    console.log(`--- Verification for ${tc.name} ---`);
    let passCount = 0;
    for (const tp of testPoints) {
      const idx = (tp.y * w + tp.x) * 3;
      const orig = [data[idx], data[idx+1], data[idx+2]];
      const rec = [outBuf[idx], outBuf[idx+1], outBuf[idx+2]];
      const isIdentical = orig[0] === rec[0] && orig[1] === rec[1] && orig[2] === rec[2];
      const status = tp.expectRecolor
        ? (!isIdentical ? 'RECOLORED ACCURATELY ✓' : 'FAILED TO RECOLOR ✗')
        : (isIdentical ? 'BIT-EXACT IDENTICAL ✓' : 'UNWANTED CHANGE ✗');
      if ((tp.expectRecolor && !isIdentical) || (!tp.expectRecolor && isIdentical)) {
        passCount++;
      }
      console.log(`  ${tp.name} (${tp.x},${tp.y}): Orig [${orig.join(',')}] -> Rec [${rec.join(',')}] | ${status}`);
    }
    console.log(`Passed ${passCount}/${testPoints.length} test points for ${tc.name}`);

    const outPath = `backend/uploads/test-recolored-${tc.name}.jpg`;
    await sharp(outBuf, { raw: { width: w, height: h, channels: 3 } })
      .jpeg({ quality: 96 })
      .toFile(outPath);
    console.log(`Saved test image to ${outPath}`);
  }
}

testRecolor().catch(console.error);
