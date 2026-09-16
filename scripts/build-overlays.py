#!/usr/bin/env python3
"""Prepare transparent frame overlays and visual samples for the local editor.

The first three supplied frames are opaque PNGs with a white photo area.  The
editor needs that area to be transparent, but the white logo plaque and the
white band around the opening must remain opaque.  The previous threshold-based
cutout also removed isolated white pixels from the frame, which caused the
white/pixelated notches visible around the photo.  We keep only the largest
connected transparent area from the existing mask and restore every other
pixel from the original frame.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


SIZE = 1080
PHOTO_RADII = {1: 398, 2: 394, 3: 380}
ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "modelos"
PHOTO_PATH = ROOT / "img" / "image22.png"


def largest_transparent_component(image: Image.Image) -> Image.Image:
    """Return a binary mask for the largest transparent connected component."""

    image = image.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    transparent = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            transparent[y * width + x] = 1 if pixels[x, y][3] < 128 else 0

    visited = bytearray(width * height)
    largest: list[int] = []
    neighbors = (
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1),
        (-1, -1),
        (1, -1),
        (-1, 1),
        (1, 1),
    )

    for y in range(height):
        for x in range(width):
            start = y * width + x
            if not transparent[start] or visited[start]:
                continue

            queue: deque[int] = deque([start])
            visited[start] = 1
            component: list[int] = []

            while queue:
                index = queue.pop()
                component.append(index)
                current_x = index % width
                current_y = index // width

                for offset_x, offset_y in neighbors:
                    next_x = current_x + offset_x
                    next_y = current_y + offset_y
                    if not (0 <= next_x < width and 0 <= next_y < height):
                        continue
                    next_index = next_y * width + next_x
                    if transparent[next_index] and not visited[next_index]:
                        visited[next_index] = 1
                        queue.append(next_index)

            if len(component) > len(largest):
                largest = component

    mask = Image.new("L", (width, height), 0)
    mask_pixels = mask.load()
    for index in largest:
        mask_pixels[index % width, index // width] = 255
    return mask


def build_overlay(model_number: int) -> Image.Image:
    original = Image.open(MODELS / f"modelo{model_number}.png").convert("RGBA")
    original = original.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    old_overlay = Image.open(MODELS / f"modelo{model_number}-overlay.png").convert("RGBA")

    # Expand one pixel and feather the opening so the photo meets the frame
    # cleanly without a white binary fringe.
    hole = largest_transparent_component(old_overlay)
    hole = hole.filter(ImageFilter.MaxFilter(3))
    hole = hole.filter(ImageFilter.GaussianBlur(0.7))
    original.putalpha(ImageChops.invert(hole))
    original.save(MODELS / f"modelo{model_number}-overlay.png", optimize=True)
    return original


def compose_sample(overlay: Image.Image, radius: int) -> Image.Image:
    photo = Image.open(PHOTO_PATH).convert("RGBA")
    scale = max((radius * 2) / photo.width, (radius * 2) / photo.height)
    photo = photo.resize((round(photo.width * scale), round(photo.height * scale)), Image.Resampling.LANCZOS)

    photo_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    photo_layer.alpha_composite(photo, (round((SIZE - photo.width) / 2), round((SIZE - photo.height) / 2)))
    clip = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(clip).ellipse(
        (SIZE / 2 - radius, SIZE / 2 - radius,
         SIZE / 2 + radius, SIZE / 2 + radius),
        fill=255,
    )
    photo_layer.putalpha(ImageChops.multiply(photo_layer.getchannel("A"), clip))

    result = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 255))
    result.alpha_composite(photo_layer)
    result.alpha_composite(overlay)
    return result.convert("RGB")


def main() -> None:
    overlays = [build_overlay(number) for number in (1, 2, 3)]
    for number, overlay in enumerate(overlays, start=1):
        compose_sample(overlay, PHOTO_RADII[number]).save(MODELS / f"modelo{number}-com-foto.png", optimize=True)


if __name__ == "__main__":
    main()
