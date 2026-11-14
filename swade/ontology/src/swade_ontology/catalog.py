"""Starter platform ontology. Certification is human work; this file is a draft."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


ONTOLOGY_PATH = Path(__file__).resolve().parents[2] / "catalog" / "platform.json"

_SOURCE_TABLES: dict[str, tuple[str, ...]] = {
    "artist": ("artist",),
    "track": ("track",),
    "station": ("station",),
    "spin": ("spin",),
    "attribution": ("attribution",),
    "order": ("commerce_order",),
    "royalty": ("royalty",),
    "consent": ("consent",),
    "course": ("course",),
    "lesson": ("lesson",),
    "exam": ("exam_progress",),
    "source": ("course_source",),
    "tenant": ("tenant",),
    "book": ("book",),
}


@dataclass(frozen=True)
class SqlAttribute:
    id: str
    description: str
    expression: str
    executable: bool
    certification: str


@dataclass(frozen=True)
class ColumnMapping:
    name: str
    description: str
    physical: bool


@dataclass(frozen=True)
class Term:
    id: str
    name: str
    description: str
    synonyms: tuple[str, ...]
    sql_attributes: tuple[SqlAttribute, ...]
    columns: tuple[ColumnMapping, ...]
    source_tables: tuple[str, ...]


@dataclass(frozen=True)
class Relationship:
    id: str
    source: str
    target: str
    description: str
    multiplicity: str


@dataclass(frozen=True)
class AppGrant:
    id: str
    product: str
    requires_tenant_class: str
    terms: frozenset[str]


@dataclass(frozen=True)
class Catalog:
    version: str
    name: str
    certification: str
    apps: dict[str, AppGrant]
    terms: dict[str, Term]
    relationships: tuple[Relationship, ...]

    def app(self, app_id: str) -> AppGrant | None:
        return self.apps.get(app_id)

    def visible_relationships(self, term_id: str, granted: frozenset[str]) -> list[Relationship]:
        visible: list[Relationship] = []
        for relationship in self.relationships:
            if term_id not in (relationship.source, relationship.target):
                continue
            if relationship.source in granted and relationship.target in granted:
                visible.append(relationship)
        return visible


def load_catalog(path: Path = ONTOLOGY_PATH) -> Catalog:
    payload = json.loads(path.read_text(encoding="utf-8"))
    apps = {
        item["id"]: AppGrant(
            id=item["id"],
            product=item["product"],
            requires_tenant_class=item["requires_tenant_class"],
            terms=frozenset(item["terms"]),
        )
        for item in payload["apps"]
    }
    terms = {}
    for item in payload["terms"]:
        terms[item["id"]] = Term(
            id=item["id"],
            name=item["name"],
            description=item["description"],
            synonyms=tuple(item.get("synonyms", [])),
            sql_attributes=tuple(
                SqlAttribute(
                    id=attribute["id"],
                    description=attribute["description"],
                    expression=attribute["expression"],
                    executable=bool(attribute.get("executable", False)),
                    certification=attribute.get("certification", payload["certification"]),
                )
                for attribute in item.get("sql_attributes", [])
            ),
            columns=tuple(
                ColumnMapping(
                    name=column["name"],
                    description=column["description"],
                    physical=bool(column.get("physical", False)),
                )
                for column in item.get("columns", [])
            ),
            source_tables=tuple(item.get("source_tables") or _SOURCE_TABLES[item["id"]]),
        )
    relationships = tuple(
        Relationship(
            id=item["id"],
            source=item["source"],
            target=item["target"],
            description=item["description"],
            multiplicity=item["multiplicity"],
        )
        for item in payload["relationships"]
    )
    return Catalog(
        version=payload["version"],
        name=payload["name"],
        certification=payload["certification"],
        apps=apps,
        terms=terms,
        relationships=relationships,
    )
