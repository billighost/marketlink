#!/usr/bin/env python3
"""
MarketLink Icon & Asset Generator
Generates all required favicons, Apple touch icon, Android/PWA icons (including maskable),
and social preview image from the source SVG branding file.
"""

import sys
import os
import math
import argparse
from PIL import Image, ImageDraw, ImageFont
import cairosvg

# Brand colors from src/styles/tokens.css
BG_COLOR_HEX = "#FFFFFF"      # Pure white surface token (--color-white)
BRAND_BEET_HEX = "#7A2E3B"    # Beet root token (--color-beet)
BRAND_INK_HEX = "#2E2B26"     # Chalkboard ink token (--color-ink)
BRAND_INK_SOFT_HEX = "#6B6259"# Secondary text token (--color-ink-soft)

def parse_hex(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

BG_RGB = parse_hex(BG_COLOR_HEX)
BEET_RGB = parse_hex(BRAND_BEET_HEX)
INK_RGB = parse_hex(BRAND_INK_HEX)
INK_SOFT_RGB = parse_hex(BRAND_INK_SOFT_HEX)

def rasterize_svg_to_master(svg_path, master_size=1024):
    """Rasterize source SVG to a master RGBA Pillow Image."""
    png_data = cairosvg.svg2png(
        url=svg_path,
        output_width=master_size,
        output_height=master_size
    )
    import io
    master = Image.open(io.BytesIO(png_data)).convert("RGBA")
    return master

def create_flattened_icon(master_img, size):
    """Composite transparent master icon onto solid brand background."""
    scaled = master_img.resize(size, Image.Resampling.LANCZOS)
    bg = Image.new("RGB", size, BG_RGB)
    bg.paste(scaled, mask=scaled.split()[3])
    return bg

def create_maskable_icon(master_img, size):
    """
    Build a maskable icon respecting the safe zone (inner 80% diameter circle).
    The icon content is scaled so its diagonal bounding box fits comfortably inside
    the inner 80% diameter circle (radius = 40% of canvas size).
    """
    canvas = Image.new("RGB", (size, size), BG_RGB)
    
    # Non-transparent bounding box of master
    bbox = master_img.getbbox()
    if bbox:
        crop_w = bbox[2] - bbox[0]
        crop_h = bbox[3] - bbox[1]
        cropped = master_img.crop(bbox)
    else:
        cropped = master_img
        crop_w, crop_h = master_img.size

    # The safe zone radius is 0.40 * size (80% diameter circle).
    # To guarantee all 4 corners fit inside radius R = 0.40 * size,
    # the content diagonal sqrt(W^2 + H^2) must be <= 2 * R = 0.80 * size.
    # We use 0.75 * size to provide a safe margin.
    diag = math.hypot(crop_w, crop_h)
    target_diag = size * 0.74
    scale = target_diag / diag

    new_w = max(1, int(crop_w * scale))
    new_h = max(1, int(crop_h * scale))
        
    scaled = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Paste centered
    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    canvas.paste(scaled, (offset_x, offset_y), mask=scaled.split()[3])

    # Self-check: compute distance of bounding corners of content from canvas center
    center_x = size / 2.0
    center_y = size / 2.0
    corners = [
        (offset_x, offset_y),
        (offset_x + new_w, offset_y),
        (offset_x, offset_y + new_h),
        (offset_x + new_w, offset_y + new_h)
    ]
    max_radius_allowed = size * 0.40  # 40% radius = 80% diameter safe zone
    for (cx, cy) in corners:
        dist = math.hypot(cx - center_x, cy - center_y)
        if dist > max_radius_allowed + 1.0:
            raise ValueError(f"Maskable icon check failed: corner ({cx},{cy}) dist {dist:.1f} exceeds safe radius {max_radius_allowed:.1f}")

    return canvas

def create_social_og_image(master_img, width=1200, height=630):
    """
    Generate Open Graph / Twitter preview image (1200x630).
    Features brand background, centered icon, title 'MarketLink', and tagline.
    """
    canvas = Image.new("RGB", (width, height), BG_RGB)
    draw = ImageDraw.Draw(canvas)
    
    # Draw icon on left-center
    icon_size = 220
    bbox = master_img.getbbox()
    cropped = master_img.crop(bbox) if bbox else master_img
    scaled_icon = cropped.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    
    icon_x = 180
    icon_y = (height - icon_size) // 2
    canvas.paste(scaled_icon, (icon_x, icon_y), mask=scaled_icon.split()[3])
    
    # Text positions
    text_x = icon_x + icon_size + 60
    title_y = height // 2 - 60
    subtitle_y = height // 2 + 20
    
    # Use default font (or scalable bitmap default font)
    try:
        title_font = ImageFont.truetype("arial.ttf", 64)
        sub_font = ImageFont.truetype("arial.ttf", 28)
    except IOError:
        try:
            title_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 64)
            sub_font = ImageFont.truetype("DejaVuSans.ttf", 28)
        except IOError:
            title_font = ImageFont.load_default()
            sub_font = ImageFont.load_default()
            
    draw.text((text_x, title_y), "MarketLink", fill=BEET_RGB, font=title_font)
    draw.text((text_x, subtitle_y), "Farm fresh, just a click away", fill=INK_SOFT_RGB, font=sub_font)
    
    # Decorative subtle hairline border at bottom edge
    draw.line([(0, height - 8), (width, height - 8)], fill=BEET_RGB, width=8)

    return canvas

def main():
    parser = argparse.ArgumentParser(description="Generate MarketLink Web App Icons & Social Image")
    parser.add_argument("--source", default="public/favicon.svg", help="Path to source SVG icon")
    args = parser.parse_args()

    if not os.path.exists(args.source):
        print(f"Error: Source file '{args.source}' not found.")
        sys.exit(1)

    print(f"1. Rasterizing source SVG '{args.source}' to 1024x1024 RGBA master...")
    master = rasterize_svg_to_master(args.source, master_size=1024)

    os.makedirs("public/icons", exist_ok=True)
    os.makedirs("public/social", exist_ok=True)

    # Generated files metadata table
    # format: (path, size_tuple, mode, generator_func)
    files_to_generate = [
        ("public/icons/favicon-16x16.png", (16, 16), "RGBA", lambda: master.resize((16, 16), Image.Resampling.LANCZOS)),
        ("public/icons/favicon-32x32.png", (32, 32), "RGBA", lambda: master.resize((32, 32), Image.Resampling.LANCZOS)),
        ("public/icons/apple-touch-icon.png", (180, 180), "RGB", lambda: create_flattened_icon(master, (180, 180))),
        ("public/icons/android-chrome-192x192.png", (192, 192), "RGBA", lambda: master.resize((192, 192), Image.Resampling.LANCZOS)),
        ("public/icons/android-chrome-512x512.png", (512, 512), "RGBA", lambda: master.resize((512, 512), Image.Resampling.LANCZOS)),
        ("public/icons/maskable-icon-192x192.png", (192, 192), "RGB", lambda: create_maskable_icon(master, 192)),
        ("public/icons/maskable-icon-512x512.png", (512, 512), "RGB", lambda: create_maskable_icon(master, 512)),
        ("public/social/og-image.png", (1200, 630), "RGB", lambda: create_social_og_image(master, 1200, 630)),
    ]

    print("\n2. Generating icon & image files...")
    results = []

    # Generate multi-size ICO file
    ico_path = "public/favicon.ico"
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    master.save(ico_path, format="ICO", sizes=ico_sizes)

    # Verify ICO
    ico_exists = os.path.exists(ico_path) and os.path.getsize(ico_path) > 0
    results.append((ico_path, "16x16, 32x32, 48x48", "ICO", "PASS" if ico_exists else "FAIL"))

    # Generate each file and save/verify
    for path, (w, h), expected_mode, gen_fn in files_to_generate:
        img = gen_fn()
        img.save(path, optimize=True)
        
        # Verify
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            results.append((path, f"{w}x{h}", expected_mode, "FAIL (Empty/Missing)"))
            continue
            
        verify_img = Image.open(path)
        actual_w, actual_h = verify_img.size
        actual_mode = verify_img.mode
        
        status = "PASS"
        if (actual_w, actual_h) != (w, h):
            status = f"FAIL (Size: {actual_w}x{actual_h})"
        elif actual_mode != expected_mode:
            status = f"FAIL (Mode: {actual_mode})"
            
        results.append((path, f"{w}x{h}", actual_mode, status))

    print("\n==========================================================================")
    print("                      GENERATION & VERIFICATION TABLE                     ")
    print("==========================================================================")
    print(f"{'File':<42} | {'Size':<16} | {'Mode':<6} | {'Status'}")
    print("--------------------------------------------------------------------------")
    for path, size_str, mode_str, status in results:
        print(f"{path:<42} | {size_str:<16} | {mode_str:<6} | {status}")
    print("==========================================================================\n")

    all_pass = all(r[3] == "PASS" for r in results)
    if all_pass:
        print("RESULT: ALL ICONS GENERATED & VERIFIED SUCCESSFULLY (PASS)")
    else:
        print("RESULT: ICON GENERATION HAD FAILURES (FAIL)")
        sys.exit(1)

if __name__ == "__main__":
    main()
