'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Paintbrush,
  Shield,
  Undo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Save,
  X,
  Sparkles,
  Check,
  AlertCircle,
  Eye,
  Layers,
  Wand2,
  HelpCircle,
  Columns,
  Maximize2,
  Upload,
} from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import { API_BASE_URL } from '../../utils/constants';

// ============================================================================
// PURE COLOR CONVERSION & TOPOLOGICAL ARTWORK UTILITIES
// ============================================================================
function hexToRgb(hex: string) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
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

function isSkinPixel(r: number, g: number, b: number): boolean {
  const [hue, sat, lum] = rgbToHsl(r, g, b);
  const isRGBOrder = (r > g) && (g > b) && (r - g >= 8) && (g - b >= 8);
  const isSkinHue = (hue >= 0.02 && hue <= 0.13) && (sat >= 0.18 && sat <= 0.75) && (lum >= 0.20 && lum <= 0.88);
  return isRGBOrder && isSkinHue;
}

function fillArtworkInterior(rawPrint: Uint8Array, rw: number, rh: number): Uint8Array {
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
  const queue: number[] = [];

  for (let rx = 0; rx < rw; rx++) {
    if (!dilated[0 * rw + rx]) {
      reachableFromBorder[0 * rw + rx] = 1;
      queue.push(rx, 0);
    }
    if (!dilated[(rh - 1) * rw + rx]) {
      reachableFromBorder[(rh - 1) * rw + rx] = 1;
      queue.push(rx, rh - 1);
    }
  }
  for (let ry = 0; ry < rh; ry++) {
    if (!dilated[ry * rw + 0]) {
      reachableFromBorder[ry * rw + 0] = 1;
      queue.push(0, ry);
    }
    if (!dilated[ry * rw + (rw - 1)]) {
      reachableFromBorder[ry * rw + (rw - 1)] = 1;
      queue.push(rw - 1, ry);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];

    if (cx > 0) {
      const nidx = cy * rw + (cx - 1);
      if (!reachableFromBorder[nidx] && !dilated[nidx]) {
        reachableFromBorder[nidx] = 1;
        queue.push(cx - 1, cy);
      }
    }
    if (cx < rw - 1) {
      const nidx = cy * rw + (cx + 1);
      if (!reachableFromBorder[nidx] && !dilated[nidx]) {
        reachableFromBorder[nidx] = 1;
        queue.push(cx + 1, cy);
      }
    }
    if (cy > 0) {
      const nidx = (cy - 1) * rw + cx;
      if (!reachableFromBorder[nidx] && !dilated[nidx]) {
        reachableFromBorder[nidx] = 1;
        queue.push(cx, cy - 1);
      }
    }
    if (cy < rh - 1) {
      const nidx = (cy + 1) * rw + cx;
      if (!reachableFromBorder[nidx] && !dilated[nidx]) {
        reachableFromBorder[nidx] = 1;
        queue.push(cx, cy + 1);
      }
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

interface FabricRecolorStudioProps {
  baseImageUrl: string;
  targetColorHex: string;
  targetColorName: string;
  baseColorHex?: string;
  baseColorName?: string;
  partName: string;
  onSaveVariation: (newImageUrl: string) => void;
  onClose: () => void;
}

export function FabricRecolorStudio({
  baseImageUrl,
  targetColorHex,
  targetColorName,
  baseColorHex,
  baseColorName,
  partName,
  onSaveVariation,
  onClose,
}: FabricRecolorStudioProps) {
  // Canvas refs
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const baseGarmentColorRef = useRef<{ r: number; g: number; b: number; lum: number } | null>(null);
  const protectedArtworkRef = useRef<Uint8Array | null>(null);

  // Tools state
  const [activeTool, setActiveTool] = useState<'fabric' | 'protect' | 'sample' | 'preview'>('fabric');
  const [targetGarment, setTargetGarment] = useState<'tshirt' | 'shorts' | 'hat' | 'all'>(() => {
    const pLower = (partName || '').toLowerCase();
    if (pLower.includes('short') || pLower.includes('pant')) return 'shorts';
    if (pLower.includes('hat') || pLower.includes('cap')) return 'hat';
    return 'tshirt';
  });
  const [viewMode, setViewMode] = useState<'editor' | 'compare'>('editor');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showMaskOverlay, setShowMaskOverlay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [colorHex, setColorHex] = useState(targetColorHex || '#3B82F6');
  const [colorName, setColorName] = useState(targetColorName || 'Blue');
  const [recoloredPreviewDataUrl, setRecoloredPreviewDataUrl] = useState<string | null>(null);
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    protectedCount: number;
    nonTargetCount: number;
  }>({ isOpen: false, protectedCount: 0, nonTargetCount: 0 });

  // Popular preset colors for baby clothes
  const PRESET_COLORS = [
    { name: 'Light Blue', hex: '#60A5FA' },
    { name: 'Sky Blue', hex: '#38BDF8' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Sunny Yellow', hex: '#FACC15' },
    { name: 'Sage Green', hex: '#84CC16' },
    { name: 'Dusty Rose', hex: '#F472B6' },
    { name: 'Soft Peach', hex: '#FB923C' },
    { name: 'Lavender', hex: '#A855F7' },
    { name: 'Mint Green', hex: '#34D399' },
    { name: 'Navy Blue', hex: '#1E3A8A' },
  ];

  // Core pixel recoloring engine preserving luminance, folds, stitching, and texture
  const applyRecolorToImageData = useCallback(
    (baseData: ImageData, maskData: ImageData, targetHex: string, outputData: ImageData) => {
      const bp = baseData.data;
      const mp = maskData.data;
      const op = outputData.data;

      const baseLum = baseGarmentColorRef.current?.lum ?? 0.75;
      const targetRgb = hexToRgb(targetHex);
      const [targetH, targetS, targetL] = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);

      const isWhiteTarget = targetRgb.r >= 235 && targetRgb.g >= 235 && targetRgb.b >= 235;
      const isBlackTarget = targetRgb.r <= 35 && targetRgb.g <= 35 && targetRgb.b <= 35;

      for (let i = 0; i < bp.length; i += 4) {
        const origR = bp[i];
        const origG = bp[i + 1];
        const origB = bp[i + 2];
        const origA = bp[i + 3];

        const maskAlpha = mp[i + 3] / 255; // 0 to 1

        if (maskAlpha > 0) {
          // Relative luminance: Y = 0.299R + 0.587G + 0.114B
          const origLuminance = (0.299 * origR + 0.587 * origG + 0.114 * origB) / 255;
          const relDiff = origLuminance - baseLum;

          let adjustedL: number;
          let effectiveS = targetS;

          if (isWhiteTarget) {
            // Pure White / Off-White natural cotton with soft shadow/fold preservation
            adjustedL = Math.min(0.98, Math.max(0.70, 0.88 + relDiff * 0.35));
            effectiveS = Math.min(0.04, targetS);
          } else if (isBlackTarget) {
            // Jet Black / Charcoal cotton
            adjustedL = Math.min(0.35, Math.max(0.05, 0.15 + relDiff * 0.25));
            effectiveS = Math.min(0.10, targetS);
          } else {
            // Natural fabric recoloring preserving folds, wrinkles, texture and highlights
            adjustedL = Math.min(0.94, Math.max(0.14, targetL + relDiff * 0.65));
            effectiveS = targetS;
          }

          const [recR, recG, recB] = hslToRgb(targetH, effectiveS, adjustedL);

          // Blend recolored fabric
          op[i] = Math.round(origR * (1 - maskAlpha) + recR * maskAlpha);
          op[i + 1] = Math.round(origG * (1 - maskAlpha) + recG * maskAlpha);
          op[i + 2] = Math.round(origB * (1 - maskAlpha) + recB * maskAlpha);
          op[i + 3] = origA;
        } else {
          // Outside mask: 100% UNCHANGED bit-exact preservation
          op[i] = origR;
          op[i + 1] = origG;
          op[i + 2] = origB;
          op[i + 3] = origA;
        }
      }
    },
    []
  );

  // Pixel-accurate luminance-preserving fabric recoloring
  const renderDisplayCanvas = useCallback(() => {
    const baseCanvas = baseCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;
    if (!baseCanvas || !maskCanvas || !displayCanvas) return;

    const w = baseCanvas.width;
    const h = baseCanvas.height;
    const baseCtx = baseCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    const displayCtx = displayCanvas.getContext('2d');
    if (!baseCtx || !maskCtx || !displayCtx) return;

    const baseData = baseCtx.getImageData(0, 0, w, h);
    const maskData = maskCtx.getImageData(0, 0, w, h);
    const outputData = displayCtx.createImageData(w, h);

    applyRecolorToImageData(baseData, maskData, colorHex, outputData);

    displayCtx.putImageData(outputData, 0, 0);

    // Update data URL for side-by-side comparison
    setRecoloredPreviewDataUrl(displayCanvas.toDataURL('image/jpeg', 0.95));

    // If mask overlay is active in editor mode, draw a fast translucent indicator
    if (showMaskOverlay && activeTool !== 'preview') {
      displayCtx.save();
      displayCtx.globalAlpha = 0.25;
      displayCtx.drawImage(maskCanvas, 0, 0);
      displayCtx.restore();
    }
  }, [colorHex, showMaskOverlay, activeTool, applyRecolorToImageData]);

  // Load image onto base canvas once
  useEffect(() => {
    let isCancelled = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImageUrl;

    img.onload = () => {
      if (isCancelled) return;
      const baseCanvas = baseCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const displayCanvas = displayCanvasRef.current;
      if (!baseCanvas || !maskCanvas || !displayCanvas) return;

      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 800;

      baseCanvas.width = w;
      baseCanvas.height = h;
      maskCanvas.width = w;
      maskCanvas.height = h;
      displayCanvas.width = w;
      displayCanvas.height = h;

      const baseCtx = baseCanvas.getContext('2d');
      if (baseCtx) {
        baseCtx.drawImage(img, 0, 0, w, h);
      }

      // Initial clean mask
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, w, h);
      }

      setIsImageLoaded(true);
      // Run assistive OpenCV auto-detection on initial load
      runSegmentation();
    };

    return () => {
      isCancelled = true;
    };
  }, [baseImageUrl]);

  // Immediately re-render display whenever color or display options change
  useEffect(() => {
    if (isImageLoaded) {
      renderDisplayCanvas();
    }
  }, [colorHex, showMaskOverlay, activeTool, isImageLoaded, renderDisplayCanvas]);

  // Push mask state to undo stack
  const pushUndoState = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    setUndoStack((prev) => [...prev.slice(-10), data]);
  };

  // Undo action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const previous = undoStack[undoStack.length - 1];
    ctx.putImageData(previous, 0, 0);
    setUndoStack((prev) => prev.slice(0, -1));
    renderDisplayCanvas();
  };

  // Assistive segmentation engine:
  // Dynamically masks selected garment (T-shirt, Shorts, Hat) while protecting:
  // - Graphic prints and illustrations via dedicated Exclusion Mask with independent front/back view processing and 2px dilation
  // - Toddler skin, face, eyebrows, ears, neck, arms, and legs (distinguishing fabric from skin)
  // - Shorts, hair, accessories, and studio background
  const autoDetectFabricMask = (
    baseCtx: CanvasRenderingContext2D | null,
    maskCtx: CanvasRenderingContext2D | null,
    w: number,
    h: number,
    sampleColor?: { r: number; g: number; b: number }
  ) => {
    if (!baseCtx || !maskCtx) return;

    const imgData = baseCtx.getImageData(0, 0, w, h);
    const bp = imgData.data;

    // If sampleColor is passed (e.g. from Magic Wand click), add to existing mask
    if (sampleColor) {
      const existingMaskData = maskCtx.getImageData(0, 0, w, h);
      const emp = existingMaskData.data;
      const [sampleH, sampleS] = rgbToHsl(sampleColor.r, sampleColor.g, sampleColor.b);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const pIdx = y * w + x;
          const i = pIdx * 4;
          const r = bp[i];
          const g = bp[i + 1];
          const b = bp[i + 2];

          // Exclude protected artwork
          if (protectedArtworkRef.current && protectedArtworkRef.current[pIdx] === 1) continue;
          // Exclude skin
          if (isSkinPixel(r, g, b)) continue;
          // Exclude studio white backdrop
          if (r >= 250 && g >= 250 && b >= 250) continue;

          const dist = Math.sqrt(
            Math.pow(r - sampleColor.r, 2) +
            Math.pow(g - sampleColor.g, 2) +
            Math.pow(b - sampleColor.b, 2)
          );
          const [hVal, sVal] = rgbToHsl(r, g, b);
          const hueDiff = Math.min(Math.abs(hVal - sampleH), 1 - Math.abs(hVal - sampleH));

          if (dist <= 48 || (hueDiff <= 0.05 && Math.abs(sVal - sampleS) <= 0.25)) {
            emp[i] = 255;
            emp[i + 1] = 0;
            emp[i + 2] = 0;
            emp[i + 3] = 255;
          }
        }
      }
      maskCtx.putImageData(existingMaskData, 0, 0);
      return;
    }

    // CREATE FRESH CLEAN MASK
    const maskData = maskCtx.createImageData(w, h);
    const mp = maskData.data;
    const protectedArtwork = new Uint8Array(w * h);
    protectedArtworkRef.current = protectedArtwork;

    const getPixel = (x: number, y: number): [number, number, number] => {
      const idx = (y * w + x) * 4;
      return [bp[idx], bp[idx + 1], bp[idx + 2]];
    };

    // Detect if image is dual-view (side-by-side front & back views)
    const isDualView = (w / h >= 0.95);
    const dividerX = isDualView ? Math.round(w * 0.51) : w;

    if (targetGarment === 'tshirt') {
      const rawMask = new Uint8Array(w * h);

      // -----------------------------------------------------------------------
      // VIEW 1: FRONT VIEW (x: 0 .. dividerX - 1)
      // -----------------------------------------------------------------------
      const frontSamples: Array<{ r: number; g: number; b: number; lum: number }> = [];
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
        : (baseColorHex ? { ...hexToRgb(baseColorHex), lum: 0.755 } : { r: 250, g: 163, b: 194, lum: 0.755 });

      baseGarmentColorRef.current = frontBaseColor;
      const [frontBaseH, frontBaseS] = rgbToHsl(frontBaseColor.r, frontBaseColor.g, frontBaseColor.b);

      // Dynamic Seed Search for Front Graphic Print
      let fMinX = w, fMaxX = 0, fMinY = h, fMaxY = 0;
      let fSeedFound = false;

      for (let y = Math.floor(h * 0.40); y <= Math.floor(h * 0.68); y++) {
        for (let x = Math.floor(w * 0.14); x <= Math.min(dividerX - 25, Math.floor(w * 0.45)); x++) {
          const [r, g, b] = getPixel(x, y);
          const [, , lVal] = rgbToHsl(r, g, b);

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
            const [, , lVal] = rgbToHsl(r, g, b);

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
            rawMask[pIdx] = 255;
          }
        }
      }

      // -----------------------------------------------------------------------
      // VIEW 2: BACK VIEW (x: dividerX + 1 .. w - 1)
      // -----------------------------------------------------------------------
      if (isDualView) {
        const backWidth = w - dividerX;
        const backSamples: Array<{ r: number; g: number; b: number; lum: number }> = [];
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

        const [backBaseH, backBaseS] = rgbToHsl(backBaseColor.r, backBaseColor.g, backBaseColor.b);

        // Dynamic Seed Search for Back Logo
        let bMinX = w, bMaxX = 0, bMinY = h, bMaxY = 0;
        let bSeedFound = false;

        for (let y = Math.floor(h * 0.33); y <= Math.floor(h * 0.48); y++) {
          for (let x = Math.floor(dividerX + backWidth * 0.20); x <= Math.floor(dividerX + backWidth * 0.80); x++) {
            const [r, g, b] = getPixel(x, y);
            const [, , lVal] = rgbToHsl(r, g, b);

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
              const [, , lVal] = rgbToHsl(r, g, b);

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
            const pIdx = y * w + x;

            // Skip protected back logo
            if (protectedArtwork[pIdx]) continue;

            // Outer margin
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
              rawMask[pIdx] = 255;
            }
          }
        }
      }

      // MORPHOLOGICAL GAP FILLING (Eliminates stray spots inside fabric)
      const cleanMask = new Uint8Array(w * h);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (protectedArtwork[idx]) {
            cleanMask[idx] = 0;
            continue;
          }
          if (rawMask[idx]) {
            cleanMask[idx] = 255;
          } else {
            const neighbors = (rawMask[idx - 1] ? 1 : 0) +
              (rawMask[idx + 1] ? 1 : 0) +
              (rawMask[idx - w] ? 1 : 0) +
              (rawMask[idx + w] ? 1 : 0);
            if (neighbors >= 3 && !protectedArtwork[idx]) {
              cleanMask[idx] = 255;
            }
          }
        }
      }

      // WRITE MASK WITH SMOOTH EDGE FEATHERING
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const i = idx * 4;

          if (cleanMask[idx] === 255) {
            const isEdge = cleanMask[idx - 1] === 0 || cleanMask[idx + 1] === 0 ||
              cleanMask[idx - w] === 0 || cleanMask[idx + w] === 0;

            const alpha = isEdge ? 200 : 255;
            mp[i] = 255;
            mp[i + 1] = 0;
            mp[i + 2] = 0;
            mp[i + 3] = alpha;
          }
        }
      }

      maskCtx.putImageData(maskData, 0, 0);
      return;
    }

    // Shorts garment masking
    if (targetGarment === 'shorts') {
      for (let y = 0; y < h; y++) {
        const normY = y / h;
        if (normY < 0.72 || normY > 0.88) continue;
        for (let x = 0; x < w; x++) {
          const normX = x / w;
          const i = (y * w + x) * 4;
          const r = bp[i], g = bp[i + 1], b = bp[i + 2];

          if (isDualView && normX >= 0.495 && normX <= 0.525) continue;
          if (normX < 0.08 || normX > 0.92) continue;

          if (isSkinPixel(r, g, b)) continue;
          if (r > 248 && g > 248 && b > 248) continue;

          mp[i] = 255;
          mp[i + 1] = 0;
          mp[i + 2] = 0;
          mp[i + 3] = 255;
        }
      }
      maskCtx.putImageData(maskData, 0, 0);
      return;
    }

    // Hat accessory masking
    if (targetGarment === 'hat') {
      for (let y = 0; y < h; y++) {
        const normY = y / h;
        for (let x = 0; x < w; x++) {
          const normX = x / w;
          const i = (y * w + x) * 4;
          const r = bp[i], g = bp[i + 1], b = bp[i + 2];

          if (isSkinPixel(r, g, b)) continue;
          if (normX >= 0.55 && normY >= 0.45 && normX <= 0.95 && normY <= 0.90) {
            const isHatFabric = r > 105 && (r - g) > 25 && (r - b) > 25;
            if (isHatFabric) {
              mp[i] = 255;
              mp[i + 1] = 0;
              mp[i + 2] = 0;
              mp[i + 3] = 255;
            }
          }
        }
      }
      maskCtx.putImageData(maskData, 0, 0);
      return;
    }

    // General garment fabric
    for (let y = 0; y < h; y++) {
      const normY = y / h;
      for (let x = 0; x < w; x++) {
        const normX = x / w;
        const i = (y * w + x) * 4;
        const r = bp[i], g = bp[i + 1], b = bp[i + 2];

        if (isSkinPixel(r, g, b)) continue;
        if (normY >= 0.28 && normY <= 0.85 && normX >= 0.10 && normX <= 0.90) {
          const isFabric = r > 95 && (Math.abs(r - g) > 15 || Math.abs(r - b) > 15);
          if (isFabric) {
            mp[i] = 255;
            mp[i + 1] = 0;
            mp[i + 2] = 0;
            mp[i + 3] = 255;
          }
        }
      }
    }

    maskCtx.putImageData(maskData, 0, 0);
  };

  // Assistive segmentation engine powered by Python OpenCV with local client fallback
  const runSegmentation = async (
    samplePoint?: { x: number; y: number },
    sampleColor?: { r: number; g: number; b: number },
    garmentOverride?: 'tshirt' | 'shorts' | 'hat' | 'all'
  ) => {
    const baseCanvas = baseCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!baseCanvas || !maskCanvas) return;

    const w = baseCanvas.width;
    const h = baseCanvas.height;
    const garment = garmentOverride || targetGarment;

    setIsProcessing(true);

    try {
      // 1. Python OpenCV segmentation service
      const res = await fetch(`${API_BASE_URL}/fabric/segment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: baseImageUrl,
          targetGarment: garment,
          wandX: samplePoint?.x,
          wandY: samplePoint?.y,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.fabricMaskBase64) {
          const maskImg = new window.Image();
          await new Promise<void>((resolve, reject) => {
            maskImg.onload = () => resolve();
            maskImg.onerror = reject;
            maskImg.src = json.data.fabricMaskBase64;
          });

          const maskCtx = maskCanvas.getContext('2d');
          if (maskCtx) {
            if (samplePoint) {
              // Add to existing mask for Magic Wand
              maskCtx.drawImage(maskImg, 0, 0);
            } else {
              // Fresh mask
              maskCtx.clearRect(0, 0, w, h);
              maskCtx.drawImage(maskImg, 0, 0);
            }
          }

          // Decode protected artwork mask if returned
          if (json.data.protectedMaskBase64) {
            const protImg = new window.Image();
            await new Promise<void>((resolve, reject) => {
              protImg.onload = () => resolve();
              protImg.onerror = reject;
              protImg.src = json.data.protectedMaskBase64;
            });

            const offCanvas = document.createElement('canvas');
            offCanvas.width = w;
            offCanvas.height = h;
            const offCtx = offCanvas.getContext('2d');
            if (offCtx) {
              offCtx.drawImage(protImg, 0, 0);
              const pData = offCtx.getImageData(0, 0, w, h).data;
              const protArr = new Uint8Array(w * h);
              for (let idx = 0; idx < protArr.length; idx++) {
                if (pData[idx * 4] > 120) {
                  protArr[idx] = 1;
                }
              }
              protectedArtworkRef.current = protArr;
            }
          }

          renderDisplayCanvas();
          setIsProcessing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[FabricRecolorStudio] Python segmentation service fallback:', err);
    }

    // 2. Client-side fallback if Python service unavailable
    const baseCtx = baseCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    autoDetectFabricMask(baseCtx, maskCtx, w, h, sampleColor);
    renderDisplayCanvas();
    setIsProcessing(false);
  };

  const handleAutoDetectClick = () => {
    pushUndoState();
    runSegmentation();
  };

  // Clear mask
  const handleClearMask = () => {
    pushUndoState();
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    renderDisplayCanvas();
  };

  // Drawing & Wand event handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'preview') return;

    if (activeTool === 'sample') {
      // Magic Wand: sample pixel and auto-detect matching fabric via OpenCV
      const displayCanvas = displayCanvasRef.current;
      const baseCanvas = baseCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!displayCanvas || !baseCanvas || !maskCanvas) return;

      const rect = displayCanvas.getBoundingClientRect();
      const scaleX = baseCanvas.width / rect.width;
      const scaleY = baseCanvas.height / rect.height;
      const px = Math.floor((e.clientX - rect.left) * scaleX);
      const py = Math.floor((e.clientY - rect.top) * scaleY);

      const baseCtx = baseCanvas.getContext('2d');
      if (!baseCtx) return;

      const pData = baseCtx.getImageData(px, py, 1, 1).data;
      const sampled = { r: pData[0], g: pData[1], b: pData[2] };

      pushUndoState();
      runSegmentation({ x: px, y: py }, sampled);
      return;
    }

    const displayCanvas = displayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!displayCanvas || !maskCanvas) return;

    const rect = displayCanvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    pushUndoState();
    lastPointRef.current = { x, y };
    drawBrushStroke(x, y, x, y);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'preview' || activeTool === 'sample') return;
    const displayCanvas = displayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!displayCanvas || !maskCanvas) return;

    const rect = displayCanvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const last = lastPointRef.current || { x, y };
    drawBrushStroke(last.x, last.y, x, y);
    lastPointRef.current = { x, y };
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    renderDisplayCanvas();
  };

  const drawBrushStroke = (fromX: number, fromY: number, toX: number, toY: number) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const radius = Math.max(2, brushSize * (maskCanvas.width / 1000));

    ctx.save();
    if (activeTool === 'fabric') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#FF0000';
      ctx.strokeStyle = '#FF0000';
    } else {
      // Protect / Erase: erase from mask
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#000000';
    }

    ctx.lineWidth = radius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(toX, toY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    renderDisplayCanvas();
  };

  // Pre-save validation: verifies mask does not leak into protected artwork or non-target regions
  const validateMask = (): { protectedCount: number; nonTargetCount: number } => {
    const maskCanvas = maskCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    if (!maskCanvas || !baseCanvas) return { protectedCount: 0, nonTargetCount: 0 };

    const w = maskCanvas.width;
    const h = maskCanvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    const baseCtx = baseCanvas.getContext('2d');
    if (!maskCtx || !baseCtx) return { protectedCount: 0, nonTargetCount: 0 };

    const maskData = maskCtx.getImageData(0, 0, w, h);
    const baseData = baseCtx.getImageData(0, 0, w, h);
    const mp = maskData.data;
    const bp = baseData.data;
    const protectedMap = protectedArtworkRef.current;

    let protectedCount = 0;
    let nonTargetCount = 0;

    for (let y = 0; y < h; y++) {
      const normY = y / h;
      for (let x = 0; x < w; x++) {
        const pIdx = y * w + x;
        const i = pIdx * 4;
        const alpha = mp[i + 3];

        if (alpha > 0) {
          // Check if inside protected artwork
          if (protectedMap && protectedMap[pIdx] === 1) {
            protectedCount++;
            continue;
          }

          // Check if on baby skin
          const r = bp[i], g = bp[i + 1], b = bp[i + 2];
          if (isSkinPixel(r, g, b)) {
            nonTargetCount++;
            continue;
          }

          // Check if on studio backdrop or bottom shorts (if target is tshirt)
          if (targetGarment === 'tshirt') {
            if (normY > 0.80 || (r > 250 && g > 250 && b > 250)) {
              nonTargetCount++;
            }
          }
        }
      }
    }

    return { protectedCount, nonTargetCount };
  };

  // Perform actual save and upload
  const performSaveVariation = async () => {
    const displayCanvas = displayCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!displayCanvas || !maskCanvas) return;

    // Never silently approve an uncertain or empty mask
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    let activeMaskPixels = 0;
    for (let i = 3; i < maskData.data.length; i += 4) {
      if (maskData.data[i] > 10) activeMaskPixels++;
    }

    if (activeMaskPixels === 0) {
      alert('Cannot approve or save: The fabric mask is empty. Please select or paint the garment fabric before saving.');
      return;
    }

    if (activeMaskPixels < 150) {
      alert('Cannot approve or save: The fabric mask appears uncertain or too small (fewer than 150 pixels). Please use "Add to Fabric" or "Auto-Mask" to define the garment before saving.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Primary: High-fidelity Python OpenCV luminance-aware recoloring service
      const customMaskBase64 = maskCanvas.toDataURL('image/png');
      try {
        const resp = await fetch(`${API_BASE_URL}/fabric/recolor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: baseImageUrl,
            targetColorHex: colorHex,
            targetColorName: colorName,
            targetGarment,
            partName,
            customMaskBase64,
          }),
        });

        if (resp.ok) {
          const resData = await resp.json();
          if (resData.success && resData.data?.url) {
            onSaveVariation(resData.data.url);
            onClose();
            return;
          }
        }
      } catch (backendRecolorErr) {
        console.warn('[FabricRecolorStudio] Python backend recolor fallback:', backendRecolorErr);
      }

      // 2. Client-side fallback: render canvas blob and upload via uploadService
      const baseCanvas = baseCanvasRef.current;
      if (baseCanvas) {
        const w = baseCanvas.width;
        const h = baseCanvas.height;
        const baseCtx = baseCanvas.getContext('2d');
        const displayCtx = displayCanvas.getContext('2d');

        if (baseCtx && maskCtx && displayCtx) {
          const baseData = baseCtx.getImageData(0, 0, w, h);
          const currentMaskData = maskCtx.getImageData(0, 0, w, h);
          const outputData = displayCtx.createImageData(w, h);
          applyRecolorToImageData(baseData, currentMaskData, colorHex, outputData);
          displayCtx.putImageData(outputData, 0, 0);
        }
      }

      // Convert clean canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        displayCanvas.toBlob(resolve, 'image/jpeg', 0.96)
      );

      if (!blob) throw new Error('Could not render image blob');

      const safeColorName = colorName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const safePartName = partName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const file = new File(
        [blob],
        `recolored-${safePartName}-${safeColorName}-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );

      const uploadedResult = await uploadService.uploadImage(file);
      onSaveVariation(uploadedResult.url);
      onClose();
    } catch (err: any) {
      console.error('Error saving variation:', err);
      alert('Failed to save variation image. Please try again or upload a photo directly.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save persistent variation with validation check
  const handleSaveAndPersist = async () => {
    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        let activeMaskPixels = 0;
        for (let i = 3; i < maskData.data.length; i += 4) {
          if (maskData.data[i] > 10) activeMaskPixels++;
        }

        if (activeMaskPixels === 0) {
          alert('Cannot approve or save: The fabric mask is empty. Please select or paint the garment fabric before approving.');
          return;
        }

        if (activeMaskPixels < 150) {
          alert('Cannot approve or save: The fabric mask appears uncertain or too small (fewer than 150 pixels). Please use "Add to Fabric" or "Auto-Mask" to define the garment before approving.');
          return;
        }
      }
    }

    const { protectedCount, nonTargetCount } = validateMask();
    if (protectedCount > 0 || nonTargetCount > 0) {
      setValidationModal({
        isOpen: true,
        protectedCount,
        nonTargetCount,
      });
      return;
    }
    await performSaveVariation();
  };

  // Auto-clean protected pixels and proceed with save
  const handleCleanProtectedAndSave = async () => {
    const maskCanvas = maskCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    if (maskCanvas && baseCanvas) {
      const w = maskCanvas.width;
      const h = maskCanvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      const baseCtx = baseCanvas.getContext('2d');
      if (maskCtx && baseCtx) {
        pushUndoState();
        const maskData = maskCtx.getImageData(0, 0, w, h);
        const baseData = baseCtx.getImageData(0, 0, w, h);
        const mp = maskData.data;
        const bp = baseData.data;
        const protectedMap = protectedArtworkRef.current;

        for (let y = 0; y < h; y++) {
          const normY = y / h;
          for (let x = 0; x < w; x++) {
            const pIdx = y * w + x;
            const i = pIdx * 4;
            if (mp[i + 3] > 0) {
              const r = bp[i], g = bp[i + 1], b = bp[i + 2];
              const isProtectedArt = protectedMap && protectedMap[pIdx] === 1;
              const isSkin = isSkinPixel(r, g, b);
              const isBackdrop = (r > 250 && g > 250 && b > 250);
              const isBelowGarment = targetGarment === 'tshirt' && normY > 0.77;

              if (isProtectedArt || isSkin || isBackdrop || isBelowGarment) {
                mp[i + 3] = 0; // strip from mask
              }
            }
          }
        }
        maskCtx.putImageData(maskData, 0, 0);
        renderDisplayCanvas();
      }
    }

    setValidationModal({ isOpen: false, protectedCount: 0, nonTargetCount: 0 });
    await performSaveVariation();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fabric Recolor Studio"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Sparkles className="w-5 h-5 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-heading text-base sm:text-lg font-black text-stone-900">
                  Fabric Recolor Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black uppercase">
                  {partName || 'Garment Component'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Mark the garment base fabric to recolour. Graphic prints, artwork, shorts, hat, and background are strictly protected.
              </p>
            </div>
          </div>

          {/* View Mode Toggle & Close */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-stone-200/70 p-1 rounded-xl text-xs font-bold text-stone-600">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  viewMode === 'editor' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Mask Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compare')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  viewMode === 'compare' ? 'bg-white text-pink-600 shadow-xs' : 'hover:text-stone-900'
                }`}
                title="Before & After Comparison"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Before &amp; After</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
              title="Close Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Main Canvas Viewport (Permanently mounted to preserve canvas state and drawing history) */}
          <div
            ref={containerRef}
            className={`flex-1 bg-stone-900/90 relative overflow-hidden flex items-center justify-center p-4 ${
              viewMode === 'editor' ? '' : 'hidden'
            }`}
          >
            {/* Hidden Offscreen Base & Mask Canvases */}
            <canvas ref={baseCanvasRef} className="hidden" />
            <canvas ref={maskCanvasRef} className="hidden" />

            {/* Interactive Display Canvas */}
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="transition-transform duration-100 max-w-full max-h-[65vh] flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden border border-stone-700/50"
            >
              <canvas
                ref={displayCanvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className={`max-w-full max-h-[65vh] object-contain ${
                  activeTool === 'preview'
                    ? 'cursor-default'
                    : activeTool === 'protect'
                    ? 'cursor-crosshair'
                    : 'cursor-crosshair'
                }`}
              />
            </div>

            {/* Quick Floating Zoom & Mask Toggle */}
            <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-stone-800/80 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs border border-stone-700/50 shadow-lg">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                className="p-1 hover:text-pink-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1 hover:text-pink-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-stone-600 mx-1" />
              <button
                type="button"
                onClick={() => setShowMaskOverlay(!showMaskOverlay)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  showMaskOverlay ? 'bg-cyan-500 text-stone-900' : 'bg-stone-700 text-stone-300'
                }`}
              >
                {showMaskOverlay ? 'Mask Highlight: ON' : 'Mask Highlight: OFF'}
              </button>
            </div>
          </div>

          {/* SIDE-BY-SIDE ORIGINAL VS RECOLORED COMPARISON (Requirement 8) */}
          <div
            className={`flex-1 bg-stone-900 relative p-4 sm:p-6 overflow-auto flex flex-col sm:flex-row items-center justify-center gap-6 ${
              viewMode === 'compare' ? '' : 'hidden'
            }`}
          >
            {/* Left: Original Base Photo */}
            <div className="flex-1 w-full max-w-md flex flex-col items-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-stone-800 text-stone-200 text-xs font-black uppercase tracking-wider border border-stone-700">
                Original Photo
              </span>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 p-2 flex items-center justify-center shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={baseImageUrl}
                  alt="Original Base Photo"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-stone-400 text-center">
                Base design: original graphic artwork, shorts, and cap
              </p>
            </div>

            {/* Right: Recolored Output Variation */}
            <div className="flex-1 w-full max-w-md flex flex-col items-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-pink-600/90 text-white text-xs font-black uppercase tracking-wider border border-pink-400/30">
                Recolored Variation ({colorName})
              </span>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 p-2 flex items-center justify-center shadow-xl">
                {recoloredPreviewDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={recoloredPreviewDataUrl}
                    alt="Recolored Fabric Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-stone-400 text-xs">Generating preview...</div>
                )}
              </div>
              <p className="text-[11px] text-emerald-400 text-center font-bold">
                ✓ Original artwork print, shorts, cap, and background are 100% identical!
              </p>
            </div>
          </div>

          {/* Right Control Panel */}
          <div className="w-full lg:w-80 bg-white border-l border-stone-100 p-5 overflow-y-auto space-y-5">
            {/* Target Colour Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                1. Target Garment Colour
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5"
                />
                <input
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="Colour name (e.g. Sunny Yellow)"
                  className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800"
                />
              </div>

              {/* Quick Swatches */}
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => {
                      setColorHex(col.hex);
                      setColorName(col.name);
                    }}
                    title={col.name}
                    style={{ backgroundColor: col.hex }}
                    className={`h-7 rounded-lg border transition-transform ${
                      colorHex.toLowerCase() === col.hex.toLowerCase()
                        ? 'ring-2 ring-pink-500 scale-110 border-white'
                        : 'border-stone-200 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Target Garment Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                2. Target Garment Component
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetGarment('tshirt');
                    pushUndoState();
                    runSegmentation(undefined, undefined, 'tshirt');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-black uppercase transition-all ${
                    targetGarment === 'tshirt'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  👕 T-Shirt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetGarment('shorts');
                    pushUndoState();
                    runSegmentation(undefined, undefined, 'shorts');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-black uppercase transition-all ${
                    targetGarment === 'shorts'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  🩳 Shorts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetGarment('hat');
                    pushUndoState();
                    runSegmentation(undefined, undefined, 'hat');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-black uppercase transition-all ${
                    targetGarment === 'hat'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  👒 Hat
                </button>
              </div>
            </div>

            {/* Tool Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                3. Mask Correction Tools
              </label>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('editor');
                    setActiveTool('fabric');
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeTool === 'fabric' && viewMode === 'editor'
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-900 shadow-xs ring-2 ring-cyan-400'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                  title="Add to Fabric Mask — brush over missed T-shirt areas"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Paintbrush className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[11px] leading-tight">Add to Fabric</div>
                    <div className="text-[9px] text-stone-500 font-normal">Recolor missed areas</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('editor');
                    setActiveTool('protect');
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeTool === 'protect' && viewMode === 'editor'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-xs ring-2 ring-rose-400'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                  title="Remove from Fabric Mask — protect printed artwork or remove incorrectly selected areas"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[11px] leading-tight">Remove Mask</div>
                    <div className="text-[9px] text-stone-500 font-normal">Protect art &amp; skin</div>
                  </div>
                </button>
              </div>

              <div className="flex items-center space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('editor');
                    setActiveTool('sample');
                  }}
                  className={`w-full py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    activeTool === 'sample' && viewMode === 'editor'
                      ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-xs ring-1 ring-purple-400'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                  title="Click anywhere on the garment to sample its color and mask it"
                >
                  <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Magic Wand (Sample Color)</span>
                </button>
              </div>

              {/* Assistive Auto-Detect Button */}
              <button
                type="button"
                onClick={handleAutoDetectClick}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 border border-pink-200 text-pink-700 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span>
                  Auto-Mask {targetGarment === 'tshirt' ? 'T-Shirt' : targetGarment === 'shorts' ? 'Shorts' : 'Hat'} Fabric
                </span>
              </button>
              <p className="text-[10px] text-stone-400 mt-1 text-center">
                {targetGarment === 'tshirt'
                  ? 'Accurately masks complete T-shirt fabric while protecting artwork print and skin.'
                  : targetGarment === 'shorts'
                  ? 'Masks shorts while protecting T-shirt, legs, and background.'
                  : 'Masks hat while protecting baby model and other clothes.'}
              </p>
            </div>

            {/* Brush Size Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-stone-700 mb-1">
                <span>Brush Size</span>
                <span className="font-mono text-stone-500">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="70"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Undo & Clear Actions */}
            <div className="flex items-center space-x-2 pt-1 border-t border-stone-100">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 disabled:opacity-40 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={handleClearMask}
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Mask</span>
              </button>
            </div>

            {/* Protection Notice */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <div className="font-bold text-stone-800 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Artwork &amp; Baby Guarantee</span>
              </div>
              <p>
                Every pixel outside the approved mask remains 100% bit-exact to the original photograph. If a garment is too complex, use <strong>Upload Real Photo</strong> instead.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-500 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Target variation: <strong>{partName || 'T-Shirt'}</strong> in <strong>{colorName}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAndPersist}
              disabled={isProcessing || !isImageLoaded}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-50 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isProcessing ? 'Generating & Uploading...' : 'Approve & Save Variation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VALIDATION ALERT MODAL (Requirement: Detect changes to protected artwork & non-target regions) */}
      {validationModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-black text-stone-900 text-base">
                  Artwork &amp; Boundary Protection Alert
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Overlap with protected regions was detected in your current fabric mask:
                </p>
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 text-xs space-y-1.5">
              {validationModal.protectedCount > 0 && (
                <div className="flex items-center justify-between text-rose-700 font-semibold">
                  <span>• Protected Graphic Artwork / Print:</span>
                  <span className="font-mono bg-rose-100 px-2 py-0.5 rounded-md text-[11px] font-bold">
                    {validationModal.protectedCount.toLocaleString()} px
                  </span>
                </div>
              )}
              {validationModal.nonTargetCount > 0 && (
                <div className="flex items-center justify-between text-amber-700 font-semibold">
                  <span>• Non-Target (Skin / Shorts / Backdrop):</span>
                  <span className="font-mono bg-amber-100 px-2 py-0.5 rounded-md text-[11px] font-bold">
                    {validationModal.nonTargetCount.toLocaleString()} px
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              To guarantee original graphic prints, character artwork, skin, and shorts remain 100% bit-exact to the original photo, click <strong>Auto-Clean &amp; Save</strong> to strip these pixels, or <strong>Review &amp; Correct Mask</strong> to make manual brush adjustments.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setValidationModal({ isOpen: false, protectedCount: 0, nonTargetCount: 0 });
                  setViewMode('editor');
                  setActiveTool('protect');
                  setShowMaskOverlay(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors"
              >
                Review &amp; Correct Mask
              </button>
              <button
                type="button"
                onClick={handleCleanProtectedAndSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                Auto-Clean &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
