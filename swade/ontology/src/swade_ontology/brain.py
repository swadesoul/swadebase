"""SSS Brain remains the tenant knowledge store. This client never widens a tenant."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


Transport = Callable[[str, dict[str, str], bytes], tuple[int, bytes]]


@dataclass(frozen=True)
class DocumentHit:
    id: str
    tenant_id: str
    title: str
    excerpt: str
    source: str


@dataclass(frozen=True)
class BrainResult:
    configured: bool
    hits: list[DocumentHit]
    dropped: int
    error: str | None


class BrainClient:
    def __init__(self, url: str | None, token: str | None, transport: Transport | None = None) -> None:
        self.url = url
        self.token = token
        self.transport = transport or _urllib_transport

    @property
    def configured(self) -> bool:
        return bool(self.url)

    def search(self, tenant_id: str, query: str, limit: int) -> BrainResult:
        if not self.url:
            return BrainResult(False, [], 0, None)
        payload = json.dumps({"tenant_id": tenant_id, "query": query, "limit": limit}).encode("utf-8")
        headers = {"content-type": "application/json"}
        if self.token:
            headers["authorization"] = f"Bearer {self.token}"
        try:
            status, raw = self.transport(self.url, headers, payload)
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            return BrainResult(True, [], 0, exc.__class__.__name__)
        if status != 200:
            return BrainResult(True, [], 0, f"brain_status_{status}")
        try:
            parsed = json.loads(raw.decode("utf-8"))
            raw_hits = parsed.get("hits", [])
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            return BrainResult(True, [], 0, "brain_response_unreadable")
        if not isinstance(raw_hits, list):
            return BrainResult(True, [], 0, "brain_response_unreadable")
        hits: list[DocumentHit] = []
        dropped = 0
        for item in raw_hits:
            if not isinstance(item, dict) or item.get("tenant_id") != tenant_id:
                dropped += 1
                continue
            hits.append(
                DocumentHit(
                    id=str(item.get("id", "")),
                    tenant_id=tenant_id,
                    title=str(item.get("title", "")),
                    excerpt=str(item.get("excerpt", "")),
                    source="sss-brain",
                )
            )
        return BrainResult(True, hits[:limit], dropped, None)


def _urllib_transport(url: str, headers: dict[str, str], payload: bytes) -> tuple[int, bytes]:
    request = Request(url, data=payload, headers=headers, method="POST")
    with urlopen(request, timeout=10) as response:  # noqa: S310 - operator-configured SSS Brain URL
        return response.status, response.read()
