"""Process configuration. The facade is off unless explicitly enabled."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


class ConfigError(ValueError):
    """Raised when the process environment is unsafe to start."""


PERSONAL_TENANT_ID = "swade-personal"
LOCAL_MODEL = "auto/offline"
PIN_PATH = Path(__file__).resolve().parents[2] / "engine" / "PIN"

_FORBIDDEN_HOST_SUFFIXES = ("nvidia.com", "api.nvidia.com")
_SERVICE_ROLE_MARKER = "service_role"


@dataclass(frozen=True)
class EnginePin:
    repository: str
    commit: str
    license_id: str


@dataclass(frozen=True)
class Config:
    enabled: bool
    host: str
    port: int
    personal_tenant_id: str
    database_url: str | None
    gateway_url: str | None
    gateway_key: str | None
    local_model: str
    paid_model: str | None
    brain_search_url: str | None
    brain_token: str | None
    engine_url: str | None
    auth_url: str | None
    owner_email: str | None
    pin: EnginePin


def load_pin(path: Path = PIN_PATH) -> EnginePin:
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    commit = values.get("commit", "")
    if len(commit) != 40:
        raise ConfigError("engine pin commit must be a 40 character git sha")
    return EnginePin(
        repository=values.get("repository", ""),
        commit=commit,
        license_id=values.get("license", ""),
    )


def load_config(env: os._Environ[str] | dict[str, str] | None = None) -> Config:
    source = os.environ if env is None else env
    _reject_unsafe_environment(source)
    gateway_url = _clean(source.get("SWADE_AI_GATEWAY_URL"))
    if gateway_url:
        _reject_nvidia_url(gateway_url, "SWADE_AI_GATEWAY_URL")
    gateway_key = _clean(source.get("SWADE_AI_GATEWAY_KEY"))
    if gateway_key:
        _reject_secret_material(gateway_key, "SWADE_AI_GATEWAY_KEY")
    brain_url = _clean(source.get("SSS_BRAIN_SEARCH_URL"))
    if brain_url:
        _reject_nvidia_url(brain_url, "SSS_BRAIN_SEARCH_URL")
    brain_token = _clean(source.get("SSS_BRAIN_READ_TOKEN"))
    if brain_token:
        _reject_secret_material(brain_token, "SSS_BRAIN_READ_TOKEN")
    engine_url = _clean(source.get("SWADE_ONTOLOGY_ENGINE_URL"))
    if engine_url:
        _reject_nvidia_url(engine_url, "SWADE_ONTOLOGY_ENGINE_URL")
    auth_url = _clean(source.get("SWADEBASE_AUTH_URL"))
    if auth_url:
        _reject_direct_google(auth_url)
    owner_email = _clean(source.get("SWADE_ONTOLOGY_OWNER_EMAIL"))
    if owner_email:
        owner_email = owner_email.lower()
    database_url = _clean(source.get("SWADE_ONTOLOGY_DATABASE_URL"))
    if database_url:
        _require_isolated_database(database_url)
    paid_model = _clean(source.get("SWADE_ONTOLOGY_PAID_MODEL"))
    local_model = _clean(source.get("SWADE_ONTOLOGY_LOCAL_MODEL")) or LOCAL_MODEL
    if local_model != LOCAL_MODEL and not local_model.startswith("auto/offline"):
        raise ConfigError("SWADE_ONTOLOGY_LOCAL_MODEL must stay on a local gateway route")
    try:
        port = int(source.get("SWADE_ONTOLOGY_PORT", "8090"))
    except ValueError as exc:
        raise ConfigError("SWADE_ONTOLOGY_PORT must be an integer") from exc
    return Config(
        enabled=_clean(source.get("SWADE_ONTOLOGY_ENABLED")) == "true",
        host=source.get("SWADE_ONTOLOGY_HOST", "0.0.0.0"),
        port=port,
        personal_tenant_id=PERSONAL_TENANT_ID,
        database_url=database_url,
        gateway_url=gateway_url,
        gateway_key=gateway_key,
        local_model=local_model,
        paid_model=paid_model,
        brain_search_url=brain_url,
        brain_token=brain_token,
        engine_url=engine_url,
        auth_url=auth_url,
        owner_email=owner_email,
        pin=load_pin(),
    )


def _reject_unsafe_environment(source: dict[str, str] | os._Environ[str]) -> None:
    kumo = source.get("KUMO_RFM_API_KEY")
    if kumo is not None and kumo.strip():
        raise ConfigError("KUMO_RFM_API_KEY uploads tables and must stay unset")
    for key, value in source.items():
        if value and "nvapi-" in value.lower():
            raise ConfigError(f"{key} contains a hosted NVIDIA API key, which is not allowed")
    if source.get("SWADE_ONTOLOGY_ALLOW_SERVICE_ROLE", "").strip():
        raise ConfigError("service-role fallback is not allowed")
    # The platform service-role key is never a credential for this facade.
    leaked = _clean(source.get("SWADEBASE_SERVICE_ROLE_KEY"))
    if leaked and leaked == _clean(source.get("SSS_BRAIN_READ_TOKEN")):
        raise ConfigError("SSS Brain reads cannot use the platform service-role key")
    if leaked and leaked == _clean(source.get("SWADE_AI_GATEWAY_KEY")):
        raise ConfigError("the AI gateway key cannot be the platform service-role key")


def _reject_secret_material(value: str, label: str) -> None:
    lowered = value.lower()
    if _SERVICE_ROLE_MARKER in lowered or lowered.startswith("nvapi"):
        raise ConfigError(f"{label} must be a scoped credential, not a service-role or hosted key")


def _reject_direct_google(url: str) -> None:
    host = (urlparse(url).hostname or "").lower()
    if host == "accounts.google.com" or host.endswith(".google.com") or host.endswith(".googleapis.com"):
        raise ConfigError("SWADEBASE_AUTH_URL must be SWADEBASE auth, not a Google host")


def _reject_nvidia_url(url: str, label: str) -> None:
    host = (urlparse(url).hostname or "").lower()
    if any(host == suffix or host.endswith("." + suffix) for suffix in _FORBIDDEN_HOST_SUFFIXES):
        raise ConfigError(f"{label} must use the SWADE AI gateway, not a NVIDIA hosted endpoint")


def _require_isolated_database(url: str) -> None:
    name = database_name(url)
    if name != "swade_ontology":
        raise ConfigError("SWADE_ONTOLOGY_DATABASE_URL must use the isolated swade_ontology database")


def database_name(url: str) -> str:
    path = urlparse(url).path.lstrip("/")
    return path.split("?", 1)[0].split("/", 1)[0]


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
