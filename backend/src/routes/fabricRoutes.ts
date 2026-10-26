import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

const FRONTEND_UPLOADS_DIR = path.resolve(__dirname, '../../../frontend/public/uploads');
const BACKEND_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const PYTHON_SCRIPT_PATH = path.resolve(__dirname, '../python/fabric_recolor_engine.py');

// Resolve verified working Python executable
function getPythonExecutable(): string {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }
  const libreOfficePython = 'C:\\Program Files\\LibreOffice\\program\\python.exe';
  if (fs.existsSync(libreOfficePython)) {
    return libreOfficePython;
  }
  return 'python';
}

// Resolve image URL or path to actual local file
function resolveLocalImagePath(imageUrl: string): string | null {
  if (!imageUrl) return null;

  // If already absolute path and exists
  if (path.isAbsolute(imageUrl) && fs.existsSync(imageUrl)) {
    return imageUrl;
  }

  // Extract clean filename
  const filename = path.basename(imageUrl.split('?')[0]);

  // Check backend uploads
  const backendPath = path.join(BACKEND_UPLOADS_DIR, filename);
  if (fs.existsSync(backendPath)) {
    return backendPath;
  }

  // Check frontend uploads
  const frontendPath = path.join(FRONTEND_UPLOADS_DIR, filename);
  if (fs.existsSync(frontendPath)) {
    return frontendPath;
  }

  // If relative path from workspace root
  const rootRelative = path.resolve(__dirname, '../../..', imageUrl.replace(/^\//, ''));
  if (fs.existsSync(rootRelative)) {
    return rootRelative;
  }

  return null;
}

/**
 * POST /api/fabric/segment
 * Calls Python OpenCV engine to perform HSV/LAB segmentation and protected-artwork contour closure.
 * Returns fabric mask, protected artwork mask, and pixel metrics.
 */
router.post('/segment', async (req: Request, res: Response) => {
  try {
    const { imageUrl, targetGarment = 'tshirt', wandX, wandY } = req.body;

    if (!imageUrl) {
      return sendError(res, 'imageUrl is required for segmentation', 400);
    }

    const localImagePath = resolveLocalImagePath(imageUrl);
    if (!localImagePath) {
      return sendError(res, `Image not found on server: ${imageUrl}`, 404);
    }

    const pythonExe = getPythonExecutable();
    const args = [
      PYTHON_SCRIPT_PATH,
      '--image', localImagePath,
      '--garment', targetGarment,
      '--action', 'segment',
      '--json',
    ];

    if (wandX !== undefined && wandY !== undefined) {
      args.push('--wand-x', String(wandX), '--wand-y', String(wandY));
    }

    execFile(
      pythonExe,
      args,
      { maxBuffer: 30 * 1024 * 1024 }, // 30MB buffer for base64 masks
      (error, stdout, stderr) => {
        if (error) {
          console.error('[Fabric OpenCV] Segmentation error:', error, stderr);
          return sendError(res, `Segmentation failed: ${error.message}`, 500);
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          if (!parsed.success) {
            return sendError(res, parsed.error || 'Segmentation unsuccessful', 400);
          }
          return sendSuccess(res, parsed, 'Garment segmented with Python OpenCV');
        } catch (parseErr) {
          console.error('[Fabric OpenCV] JSON parse error:', parseErr, stdout);
          return sendError(res, 'Invalid response from Python OpenCV engine', 500);
        }
      }
    );
  } catch (err: any) {
    console.error('[Fabric OpenCV] Unexpected segment route error:', err);
    return sendError(res, err.message || 'Internal server error', 500);
  }
});

/**
 * POST /api/fabric/recolor
 * Calls Python OpenCV engine to perform texture and luminance-preserving recoloring.
 * Excludes protected artwork pixel-for-pixel and creates a new variation without overwriting source.
 */
router.post('/recolor', async (req: Request, res: Response) => {
  const tempConfigFile = path.resolve(__dirname, `../../uploads/tmp-cfg-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);

  try {
    const {
      imageUrl,
      targetColorHex,
      targetColorName = 'Custom',
      targetGarment = 'tshirt',
      partName = 'Garment',
      customMaskBase64,
    } = req.body;

    if (!imageUrl || !targetColorHex) {
      return sendError(res, 'imageUrl and targetColorHex are required', 400);
    }

    const localImagePath = resolveLocalImagePath(imageUrl);
    if (!localImagePath) {
      return sendError(res, `Image not found on server: ${imageUrl}`, 404);
    }

    const safeColorName = targetColorName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const safePartName = partName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const cleanFilename = `recolored-${safePartName}-${safeColorName}-${Date.now()}.jpg`;

    const backendTarget = path.join(BACKEND_UPLOADS_DIR, cleanFilename);
    const frontendTarget = path.join(FRONTEND_UPLOADS_DIR, cleanFilename);

    // Prepare JSON payload for Python engine
    const configPayload = {
      action: 'recolor',
      imagePath: localImagePath,
      targetColor: targetColorHex,
      targetGarment,
      outputPath: backendTarget,
      customMaskBase64: customMaskBase64 || null,
    };

    fs.writeFileSync(tempConfigFile, JSON.stringify(configPayload), 'utf-8');

    const pythonExe = getPythonExecutable();
    const args = [PYTHON_SCRIPT_PATH, '--config', tempConfigFile];

    execFile(
      pythonExe,
      args,
      { maxBuffer: 30 * 1024 * 1024 },
      (error, stdout, stderr) => {
        // Clean up temp config
        try {
          if (fs.existsSync(tempConfigFile)) fs.unlinkSync(tempConfigFile);
        } catch (_) {}

        if (error) {
          console.error('[Fabric OpenCV] Recoloring error:', error, stderr);
          return sendError(res, `Recoloring failed: ${error.message}`, 500);
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          if (!parsed.success) {
            return sendError(res, parsed.error || 'Recoloring unsuccessful', 400);
          }

          if (parsed.isUncertain || (parsed.fabricPixelsMasked !== undefined && parsed.fabricPixelsMasked === 0)) {
            return sendError(res, 'Cannot approve variation: Fabric mask is empty or uncertain.', 400);
          }

          // Duplicate output to frontend public uploads so Next.js serves it immediately
          if (fs.existsSync(backendTarget)) {
            fs.copyFileSync(backendTarget, frontendTarget);
          }

          const publicUrl = `/uploads/${cleanFilename}`;
          return sendSuccess(
            res,
            {
              url: publicUrl,
              filename: cleanFilename,
              width: parsed.width,
              height: parsed.height,
              fabricPixelsMasked: parsed.fabricPixelsMasked,
              protectedArtworkPixels: parsed.protectedArtworkPixels,
              protectedArtworkViolations: parsed.protectedArtworkViolations,
              isUncertain: parsed.isUncertain,
            },
            'Variation recolored successfully using Python OpenCV'
          );
        } catch (parseErr) {
          console.error('[Fabric OpenCV] JSON parse error:', parseErr, stdout);
          return sendError(res, 'Invalid response from Python OpenCV engine', 500);
        }
      }
    );
  } catch (err: any) {
    // Clean up temp config on throw
    try {
      if (fs.existsSync(tempConfigFile)) fs.unlinkSync(tempConfigFile);
    } catch (_) {}

    console.error('[Fabric OpenCV] Unexpected recolor route error:', err);
    return sendError(res, err.message || 'Internal server error', 500);
  }
});

export default router;
