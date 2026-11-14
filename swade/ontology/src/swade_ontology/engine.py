"""Optional client for the pinned Auto Ontology engine. Policy runs before any call."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .config import EnginePin


Transport = Callable[[str, dict[str, str]], tuple[int, bytes]]


@dataclass(frozen=True)
class EngineResult:
    consulted: bool
    error: str | None


class EngineClient:
    def __init__(self, url: str | None, pin: EnginePin, transport: Transport | None = None) -> None:
        self.url = url.rstrip("/") if url else None
        self.pin = pin
        self.transport = transport or _urllib_transport

    @property
    def commit(self) -> str:
        return self.pin.commit

    def ping(self) -> EngineResult:
        if not self.url:
            return EngineResult(False, None)
        try:
            status, _raw = self.transport(f"{self.url}/health", {})
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            return EngineResult(True, exc.__class__.__name__)
        if status != 200:
            return EngineResult(True, f"engine_status_{status}")
        return EngineResult(True, None)


def _urllib_transport(url: str, headers: dict[str, str]) -> tuple[int, bytes]:
    request = Request(url, headers=headers, method="GET")
    with urlopen(request, timeout=5) as response:  # noqa: S310 - internal engine URL
        return response.status, response.read()


def read_json(raw: bytes) -> object:
    return json.loads(raw.decode("utf-8"))
