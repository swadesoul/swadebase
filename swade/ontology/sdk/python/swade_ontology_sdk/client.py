"""Small HTTP client for the SWADE facade."""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen


class SwadeError(RuntimeError):
    def __init__(self, status: int, payload: dict[str, Any]) -> None:
        super().__init__(payload.get("error", {}).get("code", "swade_error"))
        self.status = status
        self.payload = payload


class SwadeClient:
    def __init__(self, base_url: str, token: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token

    def health(self) -> dict[str, Any]:
        return self._request("GET", "/health", None, authenticated=False)

    def terms(self, query: str = "") -> dict[str, Any]:
        path = "/v1/terms" if not query else f"/v1/terms?q={_query(query)}"
        return self._request("GET", path, None)

    def term(self, term_id: str) -> dict[str, Any]:
        return self._request("GET", f"/v1/terms/{term_id}", None)

    def answerable(self, question: str) -> dict[str, Any]:
        return self._request("POST", "/v1/answerable", {"question": question})

    def ask(self, question: str) -> dict[str, Any]:
        return self._request("POST", "/v1/ask", {"question": question})

    def search_documents(self, query: str, limit: int = 10) -> dict[str, Any]:
        return self._request("POST", "/v1/documents/search", {"query": query, "limit": limit})

    def audit(self) -> dict[str, Any]:
        return self._request("GET", "/v1/audit", None)

    def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None,
        *,
        authenticated: bool = True,
    ) -> dict[str, Any]:
        if body is not None and ("tenant_id" in body or "tenantId" in body):
            raise SwadeError(400, {"error": {"code": "tenant_override", "service": "SWADE"}})
        data = None if body is None else json.dumps(body).encode("utf-8")
        headers = {"content-type": "application/json", "x-swadebots-client": "swadebots"}
        if authenticated:
            headers["authorization"] = f"Bearer {self.token}"
        request = Request(self.base_url + path, data=data, headers=headers, method=method)
        try:
            with urlopen(request, timeout=10) as response:  # noqa: S310 - caller-supplied SWADE URL
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            payload = json.loads(exc.read().decode("utf-8"))
            raise SwadeError(exc.code, payload) from exc


def _query(value: str) -> str:
    from urllib.parse import quote

    return quote(value)
