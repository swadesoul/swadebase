"""Postgres full-text search for platform document refs. Parameters stay bound."""

from __future__ import annotations

from dataclasses import dataclass

from .brain import DocumentHit


FTS_SQL = """
SELECT id, tenant_id, title, body
FROM swade_ontology.document_refs
WHERE tenant_id = %s
  AND search @@ websearch_to_tsquery('english', %s)
ORDER BY ts_rank(search, websearch_to_tsquery('english', %s)) DESC
LIMIT %s
""".strip()


@dataclass(frozen=True)
class StoredDocument:
    id: str
    tenant_id: str
    title: str
    body: str


def fts_statement(tenant_id: str, query: str, limit: int) -> tuple[str, tuple[object, ...]]:
    """Return SQL text plus bound parameters. The query is never interpolated."""
    if limit < 1 or limit > 20:
        raise ValueError("limit must be from 1 to 20")
    return FTS_SQL, (tenant_id, query, query, limit)


class MemoryDocumentIndex:
    """Test and default double for the isolated full-text index. It does not query Postgres."""

    def __init__(self) -> None:
        self.rows: list[StoredDocument] = []

    def add(self, document: StoredDocument) -> None:
        self.rows.append(document)

    def search(self, tenant_id: str, query: str, limit: int) -> list[DocumentHit]:
        statement, params = fts_statement(tenant_id, query, limit)
        if query and query in statement:
            raise RuntimeError("full-text query was interpolated into SQL")
        if params[0] != tenant_id:
            raise RuntimeError("tenant id was not bound")
        needles = [part.lower() for part in query.split() if part]
        hits: list[DocumentHit] = []
        for row in self.rows:
            if row.tenant_id != tenant_id:
                continue
            haystack = f"{row.title} {row.body}".lower()
            if needles and not all(needle in haystack for needle in needles):
                continue
            hits.append(
                DocumentHit(
                    id=row.id,
                    tenant_id=row.tenant_id,
                    title=row.title,
                    excerpt=row.body[:240],
                    source="postgres-fts",
                )
            )
        return hits[:limit]
