"""Python client for SWADE. SWADEBOTS and app servers use a credential, not a tenant override."""

from .client import SwadeClient, SwadeError

__all__ = ["SwadeClient", "SwadeError"]
