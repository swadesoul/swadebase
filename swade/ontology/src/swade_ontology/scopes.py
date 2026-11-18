"""Explicit read scopes. A credential names domain:entity pairs and cannot use a wildcard."""

from __future__ import annotations

DOMAINS: dict[str, frozenset[str]] = {
    "radio": frozenset({"artist", "track", "station", "spin", "attribution"}),
    "courses": frozenset({"course", "lesson", "exam", "source"}),
    "commerce": frozenset({"order", "royalty", "consent", "tenant"}),
    "books": frozenset({"book"}),
}

_WILDCARDS = {"*", "all", "any"}


def parse_scopes(raw: object, app_terms: frozenset[str]) -> tuple[str, ...]:
    if not isinstance(raw, list) or not raw:
        raise ValueError("scopes are required")
    chosen: set[str] = set()
    for item in raw:
        if not isinstance(item, str):
            raise ValueError("each scope must be domain:entity")
        text = item.strip().lower()
        if not text or text in _WILDCARDS or "*" in text or ":" not in text:
            raise ValueError("wildcard scopes are not allowed")
        domain, entity = text.split(":", 1)
        if not domain or entity in _WILDCARDS or not entity:
            raise ValueError("wildcard scopes are not allowed")
        known = DOMAINS.get(domain)
        if known is None or entity not in known or entity not in app_terms:
            raise ValueError("scope is outside this app")
        chosen.add(entity)
    if not chosen:
        raise ValueError("scopes are required")
    return tuple(sorted(chosen))


def scopes_from_storage(stored: str, app_terms: frozenset[str]) -> tuple[str, ...] | None:
    if not stored or "*" in stored:
        return None
    entities = tuple(part.strip() for part in stored.split(",") if part.strip())
    if not entities:
        return None
    known = {entity for group in DOMAINS.values() for entity in group}
    if any(entity not in known or entity not in app_terms for entity in entities):
        return None
    return tuple(sorted(set(entities)))


def encode_scopes(entities: tuple[str, ...]) -> str:
    return ",".join(entities)


def explicit_scopes_for(app_terms: frozenset[str]) -> list[str]:
    scopes: list[str] = []
    for domain, entities in DOMAINS.items():
        for entity in sorted(entities & app_terms):
            scopes.append(f"{domain}:{entity}")
    return scopes
