"""
Helper script to center-crop and resize images to canonical dimensions without distortion.
Uses Pillow's ImageOps.fit with LANCZOS resampling.
"""

import sys
import os
from PIL import Image, ImageOps

def crop_image(input_path, output_path, target_w, target_h):
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    with Image.open(input_path) as img:
        # Convert RGBA to RGB with clean white background if saving as JPEG
        if output_path.lower().endswith(('.jpg', '.jpeg')):
            if img.mode in ('RGBA', 'LA'):
                bg = Image.new('RGB', img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[-1])
                img = bg
            elif img.mode != 'RGB':
                img = img.convert('RGB')
        elif img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')

        # Fit image to target aspect ratio and dimensions using center crop
        fitted = ImageOps.fit(
            img,
            (target_w, target_h),
            Image.Resampling.LANCZOS,
            centering=(0.5, 0.5)
        )

        fmt = 'PNG' if output_path.lower().endswith('.png') else 'JPEG'
        if fmt == 'JPEG':
            fitted.save(output_path, format=fmt, quality=92, optimize=True)
        else:
            fitted.save(output_path, format=fmt, optimize=True)

if __name__ == '__main__':
    if len(sys.argv) < 5:
        print("Usage: python crop_image.py <input> <output> <width> <height>", file=sys.stderr)
        sys.exit(1)
    crop_image(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
    print(f"Cropped to {sys.argv[3]}x{sys.argv[4]} -> {sys.argv[2]}")
