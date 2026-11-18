"""Model calls go only to the SWADE AI gateway. There is no second provider."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .config import LOCAL_MODEL


Transport = Callable[[str, dict[str, str], bytes], tuple[int, bytes]]


@dataclass(frozen=True)
class GatewayResult:
    configured: bool
    used: bool
    model: str | None
    text: str | None
    error: str | None


class Gateway:
    def __init__(
        self,
        url: str | None,
        api_key: str | None,
        *,
        local_model: str = LOCAL_MODEL,
        paid_model: str | None = None,
        transport: Transport | None = None,
    ) -> None:
        self.url = url.rstrip("/") if url else None
        self.api_key = api_key
        self.local_model = local_model
        self.paid_model = paid_model
        self.transport = transport or _urllib_transport
        self.calls: list[dict[str, str]] = []

    @property
    def configured(self) -> bool:
        return bool(self.url)

    def narrate(self, plan: str, prompt: str) -> GatewayResult:
        if not self.url:
            return GatewayResult(False, False, None, None, None)
        model = self._model_for(plan)
        body = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        }
        self.calls.append({"model": model, "plan": plan})
        payload = json.dumps(body).encode("utf-8")
        headers = {"content-type": "application/json"}
        if self.api_key:
            headers["authorization"] = f"Bearer {self.api_key}"
        try:
            status, raw = self.transport(f"{self.url}/chat/completions", headers, payload)
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            return GatewayResult(True, True, model, None, exc.__class__.__name__)
        if status != 200:
            return GatewayResult(True, True, model, None, f"gateway_status_{status}")
        try:
            parsed = json.loads(raw.decode("utf-8"))
            text = parsed["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, json.JSONDecodeError, UnicodeDecodeError):
            return GatewayResult(True, True, model, None, "gateway_response_unreadable")
        if not isinstance(text, str):
            return GatewayResult(True, True, model, None, "gateway_response_unreadable")
        return GatewayResult(True, True, model, text, None)

    def _model_for(self, plan: str) -> str:
        if plan == "paid" and self.paid_model:
            return self.paid_model
        return self.local_model


def _urllib_transport(url: str, headers: dict[str, str], payload: bytes) -> tuple[int, bytes]:
    request = Request(url, data=payload, headers=headers, method="POST")
    with urlopen(request, timeout=10) as response:  # noqa: S310 - gateway URL is operator-configured
        return response.status, response.read()
