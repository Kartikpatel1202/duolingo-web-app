"""Split a flat hero image (artwork on a white background) into independently animatable layers.

Nothing is redrawn: every output pixel is copied from the source. The image is cut along its white
gaps — each connected piece of artwork becomes one transparent PNG — and a manifest records where
each piece sits, so the page can reassemble the picture exactly and move the pieces separately.

  python scripts/split_hero_layers.py <source.png> <scene-name> [<source.png> <scene-name> ...]

Outputs: public/brand/landing-hero/<scene-name>/layer-N.png
         src/features/entry/landingHeroScenes.json
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "brand" / "landing-hero"
MANIFEST = ROOT / "src" / "features" / "entry" / "landingHeroScenes.json"

WHITE_LEVEL = 236  # a pixel is background-white when every channel is at least this bright
MIN_LAYER_SHARE = 0.006  # pieces smaller than this share of the image travel with a neighbour
MIN_NESTED_SHARE = 0.03  # artwork sitting inside another piece's white area becomes its own layer
EIGHT_CONNECTED = np.ones((3, 3), dtype=bool)


def split(source: Path, scene: str) -> dict[str, object]:
    image = np.array(Image.open(source).convert("RGBA"))
    height, width = image.shape[:2]
    area = width * height
    artwork = image[:, :, :3].min(axis=2) < WHITE_LEVEL

    labels, count = ndimage.label(artwork, structure=EIGHT_CONNECTED)
    filled = [ndimage.binary_fill_holes(labels == i) for i in range(1, count + 1)]
    sizes = [int(mask.sum()) for mask in filled]
    order = sorted(range(count), key=lambda i: -sizes[i])

    # A piece is "nested" when it lies inside the filled outline of a bigger piece.
    parent: dict[int, int] = {}
    for i in order:
        ys, xs = np.nonzero(labels == i + 1)
        for j in order:
            if j == i or sizes[j] <= sizes[i]:
                continue
            if filled[j][ys[0], xs[0]]:
                parent[i] = j
                break

    top_level = [i for i in order if i not in parent]
    anchors = [i for i in top_level if sizes[i] >= MIN_LAYER_SHARE * area]
    promoted = [i for i in order if i in parent and sizes[i] >= MIN_NESTED_SHARE * area]

    centres = {i: np.array(ndimage.center_of_mass(filled[i])) for i in top_level}
    masks = {i: filled[i].copy() for i in anchors}
    for i in top_level:
        if i in masks:
            continue
        nearest = min(anchors, key=lambda a: float(np.linalg.norm(centres[a] - centres[i])))
        masks[nearest] |= filled[i]

    layers = []
    scene_dir = OUT_DIR / scene
    scene_dir.mkdir(parents=True, exist_ok=True)
    for old in scene_dir.glob("layer-*.png"):
        old.unlink()

    # Parents first (drawn underneath), then the pieces that sit on top of them.
    for number, (index, mask) in enumerate([*masks.items(), *((i, filled[i]) for i in promoted)], start=1):
        pixels = image.copy()
        if index in masks:
            for child in promoted:
                # Where a promoted piece was lifted out, the parent keeps plain white underneath.
                pixels[filled[child] & mask] = (255, 255, 255, 255)
        # One extra pixel keeps the soft anti-aliased edge that the white threshold cut off.
        soft = ndimage.binary_dilation(mask, structure=EIGHT_CONNECTED)
        pixels[~soft] = (0, 0, 0, 0)
        ys, xs = np.nonzero(soft)
        top, bottom, left, right = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        name = f"layer-{number}.png"
        Image.fromarray(pixels[top:bottom, left:right]).save(scene_dir / name)
        layers.append(
            {
                "src": f"/brand/landing-hero/{scene}/{name}",
                "left": round(100 * left / width, 3),
                "top": round(100 * top / height, 3),
                "width": round(100 * (right - left) / width, 3),
                "height": round(100 * (bottom - top) / height, 3),
                "share": round(float(mask.sum()) / area, 4),
            }
        )
    return {"name": scene, "width": width, "height": height, "layers": layers}


def main() -> None:
    args = sys.argv[1:]
    if not args or len(args) % 2:
        raise SystemExit(__doc__)
    scenes = [split(Path(args[i]), args[i + 1]) for i in range(0, len(args), 2)]
    MANIFEST.write_text(json.dumps(scenes, indent=2) + "\n", encoding="utf8")
    for scene in scenes:
        print(scene["name"], f"{scene['width']}x{scene['height']}", len(scene["layers"]), "layers")  # type: ignore[arg-type]
        for layer in scene["layers"]:  # type: ignore[union-attr]
            print("  ", layer)


if __name__ == "__main__":
    main()
