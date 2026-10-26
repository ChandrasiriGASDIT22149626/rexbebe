#!/usr/bin/env python3
"""
REXBEBE — FABRIC RECOLORING OPENCV & NUMPY ENGINE
Uses Python, OpenCV (cv2), NumPy and Pillow only.
Performs HSV/LAB color segmentation, contour/edge detection, independent front/back view processing,
topological artwork protection closure, and luminance-aware texture-preserving recoloring.
"""

import sys
import os
import json
import argparse
import base64
import io

# Ensure local py_packages is in sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
workspace_root = os.path.abspath(os.path.join(script_dir, '../../..'))
py_packages_dir = os.path.join(workspace_root, 'py_packages')
if os.path.exists(py_packages_dir) and py_packages_dir not in sys.path:
    sys.path.insert(0, py_packages_dir)

import cv2
import numpy as np
from PIL import Image


def hex_to_bgr(hex_str: str):
    clean = hex_str.lstrip('#')
    if len(clean) == 3:
        clean = ''.join([c * 2 for c in clean])
    num = int(clean, 16)
    r = (num >> 16) & 255
    g = (num >> 8) & 255
    b = num & 255
    return np.array([b, g, r], dtype=np.uint8)


def hex_to_lab(hex_str: str):
    bgr = hex_to_bgr(hex_str).reshape(1, 1, 3)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    return lab[0, 0]


def is_skin_mask(img_bgr, img_hsv):
    """
    Detect human skin using combined HSV hue angles and melanin/hemoglobin RGB ordering.
    Pink, rose, and magenta fabrics have B >= G and hue > 165 or hue < 5, never classified as skin.
    """
    b = img_bgr[:, :, 0].astype(np.int16)
    g = img_bgr[:, :, 1].astype(np.int16)
    r = img_bgr[:, :, 2].astype(np.int16)

    # Melanin order: R > G > B with significant difference
    rgb_order = (r > g) & (g > b) & (r - g >= 8) & (g - b >= 8)

    # HSV warm skin range (OpenCV H is 0..179)
    h = img_hsv[:, :, 0]
    s = img_hsv[:, :, 1]
    v = img_hsv[:, :, 2]
    hsv_skin = (h >= 3) & (h <= 20) & (s >= 40) & (s <= 190) & (v >= 50) & (v <= 235)

    return (rgb_order & hsv_skin).astype(np.uint8)


def fill_artwork_interior(raw_seed_mask):
    """
    Topological 2D boundary closure:
    Any pixel trapped inside print seeds, text, or character outlines is marked as artwork interior.
    """
    rh, rw = raw_seed_mask.shape
    if rw <= 4 or rh <= 4:
        return raw_seed_mask.copy()

    # 1px dilation of raw seeds to close minor stroke gaps
    kernel_cross = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    dilated = cv2.dilate(raw_seed_mask, kernel_cross, iterations=1)

    # BFS flood-fill from the ROI outer border
    reachable = np.zeros((rh, rw), dtype=np.uint8)
    queue = []

    # Enqueue top & bottom borders
    for x in range(rw):
        if dilated[0, x] == 0:
            reachable[0, x] = 1
            queue.append((0, x))
        if dilated[rh - 1, x] == 0:
            reachable[rh - 1, x] = 1
            queue.append((rh - 1, x))

    # Enqueue left & right borders
    for y in range(rh):
        if dilated[y, 0] == 0:
            reachable[y, 0] = 1
            queue.append((y, 0))
        if dilated[y, rw - 1] == 0:
            reachable[y, rw - 1] = 1
            queue.append((y, rw - 1))

    head = 0
    while head < len(queue):
        cy, cx = queue[head]
        head += 1

        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < rh and 0 <= nx < rw:
                if reachable[ny, nx] == 0 and dilated[ny, nx] == 0:
                    reachable[ny, nx] = 1
                    queue.append((ny, nx))

    # All pixels unreachable from outside the ROI are enclosed artwork interior
    filled = np.where(reachable == 0, 1, 0).astype(np.uint8)
    return filled


def generate_independent_masks(img_bgr, target_garment='tshirt', sample_point=None):
    """
    Generates independent front and back view fabric masks and strictly protected artwork masks.
    """
    h, w, _ = img_bgr.shape
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

    # Global skin mask
    skin = is_skin_mask(img_bgr, img_hsv)

    # Dual view detection
    is_dual_view = (w / float(h) >= 0.95)
    divider_x = int(round(w * 0.51)) if is_dual_view else w

    fabric_mask = np.zeros((h, w), dtype=np.uint8)
    protected_artwork = np.zeros((h, w), dtype=np.uint8)

    # If interactive sample point (Magic Wand) is given:
    if sample_point is not None:
        sx, sy = sample_point
        if 0 <= sx < w and 0 <= sy < h:
            sample_lab = img_lab[sy, sx].astype(np.float32)
            dist_lab = np.linalg.norm(img_lab.astype(np.float32) - sample_lab, axis=2)
            
            # Candidate match
            wand_mask = (dist_lab <= 24).astype(np.uint8)
            wand_mask[skin > 0] = 0
            # Exclude white background
            white_bg = (img_bgr[:, :, 0] >= 248) & (img_bgr[:, :, 1] >= 248) & (img_bgr[:, :, 2] >= 248)
            wand_mask[white_bg] = 0
            return wand_mask * 255, protected_artwork, 0.755

    if target_garment == 'tshirt':
        # =====================================================================
        # 1. FRONT VIEW: x in [0, divider_x)
        # =====================================================================
        front_pts = [
            (int(divider_x * 0.28), int(h * 0.38)),
            (int(divider_x * 0.75), int(h * 0.38)),
            (int(divider_x * 0.22), int(h * 0.44)),
            (int(divider_x * 0.80), int(h * 0.44)),
        ]
        front_samples = []
        for fx, fy in front_pts:
            for dy in range(-6, 7, 2):
                for dx in range(-6, 7, 2):
                    px = max(0, min(divider_x - 1, fx + dx))
                    py = max(0, min(h - 1, fy + dy))
                    if skin[py, px] == 0:
                        b, g, r = img_bgr[py, px]
                        if not (r > 248 and g > 248 and b > 248) and not (r < 30 and g < 30 and b < 30):
                            front_samples.append(img_lab[py, px])

        if len(front_samples) > 0:
            front_base_lab = np.median(np.array(front_samples), axis=0).astype(np.float32)
        else:
            front_base_lab = np.array([192, 160, 138], dtype=np.float32)

        # Dynamic Front Artwork Seed Search
        f_y1, f_y2 = int(h * 0.40), int(h * 0.68)
        f_x1, f_x2 = int(w * 0.14), min(divider_x - 25, int(w * 0.45))

        f_roi_bgr = img_bgr[f_y1:f_y2, f_x1:f_x2]
        f_roi_lab = img_lab[f_y1:f_y2, f_x1:f_x2]

        rb = f_roi_bgr[:, :, 0].astype(np.int16)
        rg = f_roi_bgr[:, :, 1].astype(np.int16)
        rr = f_roi_bgr[:, :, 2].astype(np.int16)
        rl = f_roi_lab[:, :, 0]

        is_blue = (rb > rr + 18) & (rb > rg + 12)
        is_green = (rg > rr + 12) & (rg > rb + 15)
        is_red = (rr > 210) & (rr - rg > 105) & (rr - rb > 95)
        is_dark = ((rr < 85) & (rg < 80) & (rb < 85)) | (rl < 55)
        is_white = (rr > 235) & (rg > 230) & (rb > 230) & (np.abs(rr - rg) < 15) & (np.abs(rr - rb) < 15)

        front_seeds = is_blue | is_green | is_red | is_dark | is_white
        if np.any(front_seeds):
            y_indices, x_indices = np.where(front_seeds)
            min_y, max_y = np.min(y_indices), np.max(y_indices)
            min_x, max_x = np.min(x_indices), np.max(x_indices)

            roi_y1 = max(0, f_y1 + min_y - 6)
            roi_y2 = min(h - 1, f_y1 + max_y + 6)
            roi_x1 = max(0, f_x1 + min_x - 6)
            roi_x2 = min(divider_x - 10, f_x1 + max_x + 6)

            sub_bgr = img_bgr[roi_y1:roi_y2+1, roi_x1:roi_x2+1]
            sub_lab = img_lab[roi_y1:roi_y2+1, roi_x1:roi_x2+1]

            sb = sub_bgr[:, :, 0].astype(np.int16)
            sg = sub_bgr[:, :, 1].astype(np.int16)
            sr = sub_bgr[:, :, 2].astype(np.int16)
            sl = sub_lab[:, :, 0]

            sub_blue = (sb > sr + 15) & (sb > sg + 10)
            sub_green = (sg > sr + 10) & (sg > sb + 15)
            sub_red = (sr > 210) & (sr - sg > 100) & (sr - sb > 90)
            sub_dark = ((sr < 95) & (sg < 90) & (sb < 95)) | (sl < 55)
            sub_violet = (sr > 215) & (sb > 190) & (sg < 170) & (sb - sg >= 36)
            sub_white = (sr > 230) & (sg > 225) & (sb > 225) & (np.abs(sr - sg) < 18) & (np.abs(sr - sb) < 18)

            raw_front_print = (sub_blue | sub_green | sub_red | sub_dark | sub_violet | sub_white).astype(np.uint8)
            filled_front_print = fill_artwork_interior(raw_front_print)

            # Dilate filled artwork by 2px to protect anti-aliased print contours
            kernel_circ = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            dilated_front = cv2.dilate(filled_front_print, kernel_circ, iterations=1)
            protected_artwork[roi_y1:roi_y2+1, roi_x1:roi_x2+1] = np.maximum(
                protected_artwork[roi_y1:roi_y2+1, roi_x1:roi_x2+1], dilated_front
            )

        # Front Fabric Mask Scan
        y_coords, x_coords = np.ogrid[:h, :divider_x]
        norm_y = y_coords / float(h)
        norm_x = x_coords / float(w)

        front_spatial = (norm_y >= 0.31) & (norm_y <= 0.765) & (norm_x >= 0.04) & (x_coords < divider_x - 8)
        # Sleeve cutoff
        sleeve_arm_front = (norm_y > 0.52) & ((norm_x < 0.11) | (norm_x > 0.44))
        front_spatial &= ~sleeve_arm_front

        front_bgr = img_bgr[:, :divider_x]
        fb_b = front_bgr[:, :, 0].astype(np.int16)
        fb_g = front_bgr[:, :, 1].astype(np.int16)
        fb_r = front_bgr[:, :, 2].astype(np.int16)

        white_bg_front = (fb_r > 248) & (fb_g > 248) & (fb_b > 248)
        deep_shadow_front = (fb_r < 25) & (fb_g < 25) & (fb_b < 25)
        # Neutral background wall
        neutral_wall = (np.abs(fb_r - fb_g) < 12) & (np.abs(fb_r - fb_b) < 12) & (fb_b > 180)
        # Shorts hem protection
        shorts_hem_front = (norm_y >= 0.74) & (
            ((np.abs(fb_r - fb_g) < 32) & (np.abs(fb_r - fb_b) < 32)) |
            ((fb_g > 185) & (fb_b > 185) & (fb_r - fb_g < 45))
        )

        front_lab = img_lab[:, :divider_x].astype(np.float32)
        dist_front = np.linalg.norm(front_lab - front_base_lab, axis=2)
        is_front_fabric = (dist_front <= 36.0)

        raw_front_mask = (
            front_spatial &
            is_front_fabric &
            ~white_bg_front &
            ~deep_shadow_front &
            ~neutral_wall &
            ~shorts_hem_front &
            (skin[:, :divider_x] == 0) &
            (protected_artwork[:, :divider_x] == 0)
        ).astype(np.uint8)

        fabric_mask[:, :divider_x] = raw_front_mask * 255

        # =====================================================================
        # 2. BACK VIEW: x in [divider_x + 1, w)
        # =====================================================================
        if is_dual_view:
            back_width = w - divider_x
            back_pts = [
                (int(divider_x + back_width * 0.28), int(h * 0.38)),
                (int(divider_x + back_width * 0.75), int(h * 0.38)),
                (int(divider_x + back_width * 0.35), int(h * 0.48)),
                (int(divider_x + back_width * 0.65), int(h * 0.48)),
            ]
            back_samples = []
            for bx, by in back_pts:
                for dy in range(-6, 7, 2):
                    for dx in range(-6, 7, 2):
                        px = max(divider_x + 1, min(w - 1, bx + dx))
                        py = max(0, min(h - 1, by + dy))
                        if skin[py, px] == 0:
                            b, g, r = img_bgr[py, px]
                            if not (r > 248 and g > 248 and b > 248) and not (r < 30 and g < 30 and b < 30):
                                back_samples.append(img_lab[py, px])

            if len(back_samples) > 0:
                back_base_lab = np.median(np.array(back_samples), axis=0).astype(np.float32)
            else:
                back_base_lab = np.array([192, 160, 138], dtype=np.float32)

            # Dynamic Back Logo Seed Search
            b_y1, b_y2 = int(h * 0.33), int(h * 0.48)
            b_x1, b_x2 = int(divider_x + back_width * 0.20), int(divider_x + back_width * 0.80)

            b_roi_bgr = img_bgr[b_y1:b_y2, b_x1:b_x2]
            b_roi_lab = img_lab[b_y1:b_y2, b_x1:b_x2]

            bb = b_roi_bgr[:, :, 0].astype(np.int16)
            bg = b_roi_bgr[:, :, 1].astype(np.int16)
            br = b_roi_bgr[:, :, 2].astype(np.int16)
            bl = b_roi_lab[:, :, 0]

            b_blue = (bb > br + 18) & (bb > bg + 12)
            b_white = (br > 225) & (bg > 220) & (bb > 220) & (np.abs(br - bg) < 20) & (np.abs(br - bb) < 20)
            b_dark = ((br < 85) & (bg < 80) & (bb < 85)) | (bl < 55)

            back_seeds = b_blue | b_white | b_dark
            if np.any(back_seeds):
                by_indices, bx_indices = np.where(back_seeds)
                min_by, max_by = np.min(by_indices), np.max(by_indices)
                min_bx, max_bx = np.min(bx_indices), np.max(bx_indices)

                broi_y1 = max(0, b_y1 + min_by - 6)
                broi_y2 = min(h - 1, b_y1 + max_by + 6)
                broi_x1 = max(divider_x + 1, b_x1 + min_bx - 6)
                broi_x2 = min(w - 1, b_x1 + max_bx + 6)

                sub_bbgr = img_bgr[broi_y1:broi_y2+1, broi_x1:broi_x2+1]
                sub_blab = img_lab[broi_y1:broi_y2+1, broi_x1:broi_x2+1]

                sbb = sub_bbgr[:, :, 0].astype(np.int16)
                sbg = sub_bbgr[:, :, 1].astype(np.int16)
                sbr = sub_bbgr[:, :, 2].astype(np.int16)
                sbl = sub_blab[:, :, 0]

                sub_b_blue = (sbb > sbr + 15) & (sbb > sbg + 10)
                sub_b_white = (sbr > 225) & (sbg > 220) & (sbb > 220) & (np.abs(sbr - sbg) < 20) & (np.abs(sbr - sbb) < 20)
                sub_b_dark = ((sbr < 95) & (sbg < 90) & (sbb < 95)) | (sbl < 55)

                raw_back_logo = (sub_b_blue | sub_b_white | sub_b_dark).astype(np.uint8)
                filled_back_logo = fill_artwork_interior(raw_back_logo)

                dilated_back = cv2.dilate(filled_back_logo, kernel_circ, iterations=1)
                protected_artwork[broi_y1:broi_y2+1, broi_x1:broi_x2+1] = np.maximum(
                    protected_artwork[broi_y1:broi_y2+1, broi_x1:broi_x2+1], dilated_back
                )

            # Back Fabric Mask Scan
            by_coords, bx_coords = np.ogrid[:h, divider_x:w]
            bnorm_y = by_coords / float(h)
            actual_bx = bx_coords  # already from divider_x to w - 1

            back_spatial = (bnorm_y >= 0.315) & (bnorm_y <= 0.760) & (actual_bx > divider_x + 8) & (actual_bx <= w - 20)
            back_arms = (bnorm_y > 0.52) & ((actual_bx < divider_x + back_width * 0.16) | (actual_bx > divider_x + back_width * 0.88))
            back_spatial &= ~back_arms

            back_bgr = img_bgr[:, divider_x:]
            bb_b = back_bgr[:, :, 0].astype(np.int16)
            bb_g = back_bgr[:, :, 1].astype(np.int16)
            bb_r = back_bgr[:, :, 2].astype(np.int16)

            white_bg_back = (bb_r > 248) & (bb_g > 248) & (bb_b > 248)
            deep_shadow_back = (bb_r < 25) & (bb_g < 25) & (bb_b < 25)
            neutral_wall_back = (np.abs(bb_r - bb_g) < 12) & (np.abs(bb_r - bb_b) < 12) & (bb_b > 180)
            shorts_hem_back = (bnorm_y >= 0.74) & (
                ((np.abs(bb_r - bb_g) < 32) & (np.abs(bb_r - bb_b) < 32)) |
                ((bb_g > 185) & (bb_b > 185) & (bb_r - bb_g < 45))
            )

            back_lab = img_lab[:, divider_x:].astype(np.float32)
            dist_back = np.linalg.norm(back_lab - back_base_lab, axis=2)
            is_back_fabric = (dist_back <= 36.0)

            raw_back_mask = (
                back_spatial &
                is_back_fabric &
                ~white_bg_back &
                ~deep_shadow_back &
                ~neutral_wall_back &
                ~shorts_hem_back &
                (skin[:, divider_x:] == 0) &
                (protected_artwork[:, divider_x:] == 0)
            ).astype(np.uint8)

            fabric_mask[:, divider_x:] = raw_back_mask * 255

        # Morphological Closing: fills 1-2px textile weave holes without leaking into protected art
        kernel_3 = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        fabric_mask = cv2.morphologyEx(fabric_mask, cv2.MORPH_CLOSE, kernel_3)
        fabric_mask[protected_artwork > 0] = 0

        # Base luminance reference (normalized 0..1)
        base_lum = float(front_base_lab[0] / 255.0)
        return fabric_mask, protected_artwork, base_lum

    elif target_garment == 'shorts':
        # Shorts segmentation
        y_coords, x_coords = np.ogrid[:h, :w]
        norm_y = y_coords / float(h)
        norm_x = x_coords / float(w)

        shorts_spatial = (norm_y >= 0.72) & (norm_y <= 0.88) & (norm_x >= 0.08) & (norm_x <= 0.92)
        if is_dual_view:
            shorts_spatial &= ~((norm_x >= 0.495) & (norm_x <= 0.525))

        b = img_bgr[:, :, 0]
        g = img_bgr[:, :, 1]
        r = img_bgr[:, :, 2]
        white_bg = (r > 248) & (g > 248) & (b > 248)

        shorts_mask = (shorts_spatial & (skin == 0) & ~white_bg).astype(np.uint8) * 255
        return shorts_mask, protected_artwork, 0.755

    else:
        # Default / other garment
        y_coords, x_coords = np.ogrid[:h, :w]
        norm_y = y_coords / float(h)
        norm_x = x_coords / float(w)
        gen_spatial = (norm_y >= 0.28) & (norm_y <= 0.85) & (norm_x >= 0.10) & (norm_x <= 0.90)
        gen_mask = (gen_spatial & (skin == 0)).astype(np.uint8) * 255
        return gen_mask, protected_artwork, 0.755


def recolor_image(img_bgr, fabric_mask, protected_artwork, target_hex, base_lum=0.755):
    """
    Recolors eligible fabric pixels using luminance-aware LAB transformation.
    Preserves original fabric wrinkles, folds, texture, highlights and shadows.
    Pixels outside the fabric mask or inside protected artwork are bit-exact identical.
    """
    h, w, _ = img_bgr.shape
    out_bgr = img_bgr.copy()

    # Target LAB
    target_lab = hex_to_lab(target_hex)
    target_l = float(target_lab[0])
    target_a = float(target_lab[1])
    target_b = float(target_lab[2])

    target_rgb = hex_to_bgr(target_hex)[::-1]
    is_white = target_rgb[0] >= 235 and target_rgb[1] >= 235 and target_rgb[2] >= 235
    is_black = target_rgb[0] <= 35 and target_rgb[1] <= 35 and target_rgb[2] <= 35

    # Convert to LAB for luminance extraction
    img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    orig_l = img_lab[:, :, 0].astype(np.float32)

    # Relative luminance offset
    base_l_val = base_lum * 255.0
    rel_diff = orig_l - base_l_val

    if is_white:
        adjusted_l = np.clip(224.0 + rel_diff * 0.35, 178.0, 250.0)
        target_a = 128.0
        target_b = 128.0
    elif is_black:
        adjusted_l = np.clip(38.0 + rel_diff * 0.25, 12.0, 90.0)
        target_a = 128.0
        target_b = 128.0
    else:
        # Texture-preserving fold transfer
        adjusted_l = np.clip(target_l + rel_diff * 0.70, 35.0, 242.0)

    recolored_lab = np.zeros_like(img_lab)
    recolored_lab[:, :, 0] = adjusted_l.astype(np.uint8)
    recolored_lab[:, :, 1] = np.uint8(target_a)
    recolored_lab[:, :, 2] = np.uint8(target_b)

    rec_bgr = cv2.cvtColor(recolored_lab, cv2.COLOR_LAB2BGR)

    # Alpha blending on mask
    mask_alpha = (fabric_mask.astype(np.float32) / 255.0)
    # Strictly zero out protected artwork
    if protected_artwork is not None:
        mask_alpha[protected_artwork > 0] = 0.0

    mask_alpha_3d = np.repeat(mask_alpha[:, :, np.newaxis], 3, axis=2)

    out_bgr = np.round(
        img_bgr.astype(np.float32) * (1.0 - mask_alpha_3d) +
        rec_bgr.astype(np.float32) * mask_alpha_3d
    ).astype(np.uint8)

    # Strictly enforce 100% bit-exact preservation on unselected pixels
    unselected = (mask_alpha == 0.0)
    out_bgr[unselected] = img_bgr[unselected]

    return out_bgr



def to_base64_png(mask_arr):
    _, buf = cv2.imencode('.png', mask_arr)
    return 'data:image/png;base64,' + base64.b64encode(buf).decode('ascii')


def to_base64_jpeg(img_bgr, quality=96):
    params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    if hasattr(cv2, 'IMWRITE_JPEG_SAMPLING_FACTOR'):
        params.extend([cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
    _, buf = cv2.imencode('.jpg', img_bgr, params)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf).decode('ascii')


def main():
    parser = argparse.ArgumentParser(description="Rexbebe Fabric Recoloring OpenCV Engine")
    parser.add_argument("--config", help="Path to JSON configuration file (for rich payload)")
    parser.add_argument("--image", help="Path to input source image")
    parser.add_argument("--color", default="#FACC15", help="Target hex color code (e.g. #FACC15, #A855F7)")
    parser.add_argument("--garment", default="tshirt", choices=["tshirt", "shorts", "hat", "all"], help="Target garment component")
    parser.add_argument("--action", default="all", choices=["segment", "recolor", "all"], help="Action to perform")
    parser.add_argument("--output", help="Path to save recolored image output (optional)")
    parser.add_argument("--save-mask", help="Path to save generated fabric mask (optional)")
    parser.add_argument("--save-protected", help="Path to save protected artwork mask (optional)")
    parser.add_argument("--json", action="store_true", help="Output execution results as JSON to stdout")
    parser.add_argument("--wand-x", type=int, help="Optional Magic Wand click X coordinate")
    parser.add_argument("--wand-y", type=int, help="Optional Magic Wand click Y coordinate")

    args = parser.parse_args()

    # Load configuration from file if provided
    config = {}
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)

    image_path = config.get("imagePath") or args.image
    target_color = config.get("targetColor") or args.color
    target_garment = config.get("targetGarment") or args.garment
    action = config.get("action") or args.action
    output_path = config.get("outputPath") or args.output
    custom_mask_b64 = config.get("customMaskBase64")
    wand_x = config.get("wandX", args.wand_x)
    wand_y = config.get("wandY", args.wand_y)

    if not image_path or not os.path.exists(image_path):
        res = {"success": False, "error": f"Image file not found: {image_path}"}
        print(json.dumps(res))
        sys.exit(1)

    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        res = {"success": False, "error": f"Could not read image: {image_path}"}
        print(json.dumps(res))
        sys.exit(1)

    h, w, _ = img_bgr.shape
    sample_pt = (wand_x, wand_y) if (wand_x is not None and wand_y is not None) else None

    # Step 1: Automatic segmentation or Custom Mask
    auto_fabric_mask, protected_artwork, base_lum = generate_independent_masks(
        img_bgr, target_garment=target_garment, sample_point=sample_pt
    )

    if custom_mask_b64:
        # User provided manual brush edits
        try:
            b64_data = custom_mask_b64.split('base64,')[-1]
            raw_bytes = base64.b64decode(b64_data)
            nparr = np.frombuffer(raw_bytes, np.uint8)
            decoded_mask = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
            if len(decoded_mask.shape) == 3 and decoded_mask.shape[2] == 4:
                fabric_mask = decoded_mask[:, :, 3]
            elif len(decoded_mask.shape) == 3:
                fabric_mask = cv2.cvtColor(decoded_mask, cv2.COLOR_BGR2GRAY)
            else:
                fabric_mask = decoded_mask
            # Resize if needed
            if fabric_mask.shape[:2] != (h, w):
                fabric_mask = cv2.resize(fabric_mask, (w, h), interpolation=cv2.INTER_NEAREST)
            # Strictly protect artwork
            fabric_mask[protected_artwork > 0] = 0
        except Exception as e:
            fabric_mask = auto_fabric_mask
    else:
        fabric_mask = auto_fabric_mask

    fabric_pixels = int(np.count_nonzero(fabric_mask))
    protected_pixels = int(np.count_nonzero(protected_artwork))

    if action == "segment":
        stats = {
            "success": True,
            "width": w,
            "height": h,
            "targetGarment": target_garment,
            "fabricPixels": fabric_pixels,
            "protectedPixels": protected_pixels,
            "isUncertain": fabric_pixels == 0,
            "fabricMaskBase64": to_base64_png(fabric_mask),
            "protectedMaskBase64": to_base64_png(protected_artwork * 255)
        }
        print(json.dumps(stats))
        return

    # Step 2: Luminance-Preserving Recoloring
    recolored_bgr = recolor_image(
        img_bgr, fabric_mask, protected_artwork, target_color, base_lum=base_lum
    )

    # Verification of zero protected artwork changes
    orig_protected = img_bgr[protected_artwork > 0]
    rec_protected = recolored_bgr[protected_artwork > 0]
    protected_diff = int(np.sum(np.abs(orig_protected.astype(np.int32) - rec_protected.astype(np.int32))))

    # Step 3: Saving output
    write_params = [cv2.IMWRITE_JPEG_QUALITY, 98]
    if hasattr(cv2, 'IMWRITE_JPEG_SAMPLING_FACTOR'):
        write_params.extend([cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])

    if output_path:
        out_dir = os.path.dirname(output_path)
        if out_dir and not os.path.exists(out_dir):
            os.makedirs(out_dir, exist_ok=True)
        cv2.imwrite(output_path, recolored_bgr, write_params)

    if args.save_mask:
        cv2.imwrite(args.save_mask, fabric_mask)

    if args.save_protected:
        cv2.imwrite(args.save_protected, protected_artwork * 255)

    stats = {
        "success": True,
        "width": w,
        "height": h,
        "targetGarment": target_garment,
        "targetColor": target_color,
        "fabricPixelsMasked": fabric_pixels,
        "protectedArtworkPixels": protected_pixels,
        "protectedArtworkViolations": protected_diff,
        "isUncertain": fabric_pixels == 0,
        "outputFile": output_path if output_path else None
    }

    if args.json or config:
        print(json.dumps(stats, indent=2))
    else:
        print(f"Processed {w}x{h} image:")
        print(f"  Fabric pixels masked: {fabric_pixels}")
        print(f"  Artwork pixels protected: {protected_pixels}")
        print(f"  Protected artwork violations: {protected_diff}")
        if output_path:
            print(f"  Saved recolored image to: {output_path}")


if __name__ == '__main__':
    main()
