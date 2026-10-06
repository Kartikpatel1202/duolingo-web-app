"""Export the OpenAPI document — the source of truth for the frontend's generated types.

python -m scripts.export_openapi                       # → ../frontend/openapi.json
python -m scripts.export_openapi --out openapi.json
"""

import argparse
import json
from pathlib import Path

from app.core.config import Settings
from app.main import create_app

DEFAULT_OUT = Path(__file__).resolve().parents[2] / "frontend" / "openapi.json"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    # An in-memory database: exporting the contract must not touch real data.
    app = create_app(Settings(database_url="sqlite://"))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n", "utf-8")
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
