"""Extract learning-path artwork from a reference screenshot as transparent PNGs.

Each asset is a rectangle cut out of the screenshot. Only background pixels are removed — white
connected to the rectangle's border — so the artwork keeps its exact shape, shading and colours
(anti-aliased edges are left as they are). Nothing is redrawn or resized.

  python scripts/extract_path_art.py <screenshot.png>

A standalone image (such as the front-facing Duo, `duo-front.png`) is cut the same way by calling
`cut_out(image, (0, 0, width, height))` on the whole picture.

Outputs to public/brand/path/ and prints each asset's size. The rectangles below are for the
Unit 1 reference screenshot; add rows for new artwork (Units 2–10) and re-run.
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "brand" / "path"

# name -> (left, top, right, bottom) in screenshot pixels; generous, trimmed automatically.
ASSETS: dict[str, tuple[int, int, int, int]] = {
    "duo": (380, 318, 500, 438),
    "chest-locked": (232, 436, 322, 510),
    "trophy-locked": (280, 598, 358, 672),
    "star-locked": (280, 515, 358, 588),
}

BACKGROUND_MIN = 250  # a pixel is background when every channel is at least this bright


def cut_out(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    piece = image.crop(box).convert("RGBA")
    width, height = piece.size
    pixels = piece.load()
    assert pixels is not None

    def is_background(x: int, y: int) -> bool:
        r, g, b, _ = pixels[x, y]
        return min(r, g, b) >= BACKGROUND_MIN

    seen = [[False] * width for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        queue.extend([(x, 0), (x, height - 1)])
    for y in range(height):
        queue.extend([(0, y), (width - 1, y)])
    while queue:
        x, y = queue.popleft()
        if not (0 <= x < width and 0 <= y < height) or seen[y][x] or not is_background(x, y):
            continue
        seen[y][x] = True
        pixels[x, y] = (255, 255, 255, 0)
        queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    bounds = piece.getbbox()  # the non-transparent area
    return piece.crop(bounds) if bounds else piece


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source = Image.open(sys.argv[1])
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, box in ASSETS.items():
        asset = cut_out(source, box)
        asset.save(OUT_DIR / f"{name}.png")
        print(f"{name}.png  {asset.size[0]}x{asset.size[1]}")


if __name__ == "__main__":
    main()
