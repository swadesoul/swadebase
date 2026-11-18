"""Rehearse the isolated migration. The transaction always rolls back."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from swade_ontology.rehearse import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
