"""Owner sign-in goes through SWADEBASE auth. This service does not talk to Google."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


Transport = Callable[[str, dict[str, str]], tuple[int, bytes]]


@dataclass(frozen=True)
class Owner:
    email: str
    subject: str


@dataclass(frozen=True)
class OwnerDecision:
    ok: bool
    status: int
    code: str
    owner: Owner | None


class OwnerAuth:
    def __init__(self, auth_url: str | None, owner_email: str | None, transport: Transport | None = None) -> None:
        self.auth_url = auth_url.rstrip("/") if auth_url else None
        self.owner_email = owner_email.lower() if owner_email else None
        self.transport = transport or _urllib_transport

    @property
    def configured(self) -> bool:
        return bool(self.auth_url and self.owner_email)

    def verify(self, access_token: str) -> OwnerDecision:
        if not self.configured:
            return OwnerDecision(False, 503, "owner_not_configured", None)
        if not access_token:
            return OwnerDecision(False, 401, "unauthenticated", None)
        if "service_role" in access_token.lower():
            return OwnerDecision(False, 403, "service_role_rejected", None)
        try:
            status, raw = self.transport(
                f"{self.auth_url}/user",
                {"authorization": f"Bearer {access_token}", "accept": "application/json"},
            )
        except (HTTPError, URLError, TimeoutError, OSError):
            return OwnerDecision(False, 401, "unauthenticated", None)
        if status != 200:
            return OwnerDecision(False, 401, "unauthenticated", None)
        return _owner_from_user(raw, self.owner_email or "")


def _owner_from_user(raw: bytes, owner_email: str) -> OwnerDecision:
    import json

    try:
        user = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return OwnerDecision(False, 401, "unauthenticated", None)
    if not isinstance(user, dict):
        return OwnerDecision(False, 401, "unauthenticated", None)
    identities = user.get("identities")
    if not isinstance(identities, list):
        identities = []
    google = [item for item in identities if isinstance(item, dict) and item.get("provider") == "google"]
    if not google:
        return OwnerDecision(False, 403, "google_required", None)
    identity = google[0]
    data = identity.get("identity_data") if isinstance(identity.get("identity_data"), dict) else {}
    verified = data.get("email_verified") is True or bool(user.get("email_confirmed_at"))
    if not verified:
        return OwnerDecision(False, 403, "google_unverified", None)
    email = str(data.get("email") or user.get("email") or "").lower()
    if email != owner_email:
        return OwnerDecision(False, 403, "owner_mismatch", None)
    subject = str(data.get("sub") or identity.get("id") or "")
    if not subject:
        return OwnerDecision(False, 403, "google_unverified", None)
    return OwnerDecision(True, 200, "allow", Owner(email=email, subject=subject))


def _urllib_transport(url: str, headers: dict[str, str]) -> tuple[int, bytes]:
    request = Request(url, headers=headers, method="GET")
    with urlopen(request, timeout=10) as response:  # noqa: S310 - SWADEBASE auth URL is operator-configured
        return response.status, response.read()
