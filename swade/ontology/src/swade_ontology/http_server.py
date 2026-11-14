"""HTTP server for the SWADE facade and its MCP endpoint."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

from .service import KnowledgeService


def serve(service: KnowledgeService, host: str, port: int) -> None:
    server = ThreadingHTTPServer((host, port), _handler(service))
    print(f"SWADE ontology facade listening on {host}:{port} enabled={service.config.enabled}")
    server.serve_forever()


def bind(service: KnowledgeService, host: str = "127.0.0.1", port: int = 0) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((host, port), _handler(service))
    return server


def _handler(service: KnowledgeService) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def do_GET(self) -> None:  # noqa: N802
            self._dispatch("GET")

        def do_POST(self) -> None:  # noqa: N802
            self._dispatch("POST")

        def log_message(self, fmt: str, *args: object) -> None:
            return None

        def _dispatch(self, method: str) -> None:
            parsed = urlparse(self.path)
            query = {key: values[-1] for key, values in parse_qs(parsed.query).items()}
            length = int(self.headers.get("Content-Length", "0") or "0")
            raw = self.rfile.read(length) if length else b""
            body: Any = None
            if raw:
                try:
                    body = json.loads(raw.decode("utf-8"))
                except json.JSONDecodeError:
                    self._write(400, {"error": {"code": "invalid_json", "service": "SWADE"}})
                    return
            headers = {key: value for key, value in self.headers.items()}
            status, payload = service.dispatch(method, parsed.path, headers, query, body)
            self._write(status, payload)

        def _write(self, status: int, payload: dict[str, Any]) -> None:
            encoded = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("content-type", "application/json; charset=utf-8")
            self.send_header("content-length", str(len(encoded)))
            self.send_header("cache-control", "no-store")
            self.end_headers()
            self.wfile.write(encoded)

    return Handler
