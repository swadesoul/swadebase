"""SWADE ontology facade.

User-facing name: SWADE. Package name ``swade_ontology`` keeps this service
distinct from the SWADE AI gateway (``SWADE_AI_GATEWAY_URL``).
"""

from pathlib import Path

__version__ = "0.1.0"

PRIMER_PATH = Path(__file__).resolve().parents[2] / "docs" / "PRIMER.md"


def primer_text() -> str:
    return PRIMER_PATH.read_text(encoding="utf-8").strip()
