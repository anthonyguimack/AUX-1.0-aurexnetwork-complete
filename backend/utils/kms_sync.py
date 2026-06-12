import httpx
import secrets
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


async def push_password_to_kms(settings: dict, email: str, new_password: str):
    """Push a password change from AUX to the paired KMS.

    Runs as a FastAPI BackgroundTask — never blocks the response.
    404 from KMS (user not yet synced) is treated as success; they will
    receive the correct password when the member-sync creates them.
    """
    kms_url = (settings.get("kms_url") or "").strip().rstrip("/")
    kms_sync_key = (settings.get("kms_sync_key") or "").strip()
    if not kms_url or not kms_sync_key or not email or not new_password:
        return

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            resp = await client.post(
                f"{kms_url}/api/password-update",
                json={"email": email, "new_password": new_password},
                headers={"X-Sync-Key": kms_sync_key},
            )
        if resp.status_code not in (200, 404):
            raise Exception(f"HTTP {resp.status_code}: {resp.text[:200]}")
    except Exception as exc:
        logger.warning("KMS password sync failed for %s: %s", email, exc)


async def sync_member_to_kms(settings: dict, member: dict, password: str = ""):
    """Push a newly created AUX member to the paired KMS users table.

    Runs as a FastAPI BackgroundTask — never blocks the registration response.
    If kms_url or kms_sync_key are not configured in CMS Settings, silently skips.
    Failures are logged and written to kms_sync_failures for manual retry.

    password: plaintext password from the registration form.  When provided the
    KMS account will use the same credential as the AUX account, so users can
    log into the KMS directly without going through SSO.  If omitted a random
    unusable token is stored (SSO-only access).
    """
    kms_url = (settings.get("kms_url") or "").strip().rstrip("/")
    kms_sync_key = (settings.get("kms_sync_key") or "").strip()
    if not kms_url or not kms_sync_key:
        return

    payload = {
        "email": member.get("email", ""),
        "first_name": member.get("first_name", ""),
        "last_name": member.get("last_name", ""),
        "raw_password": password if password else secrets.token_urlsafe(32),
        "member_id": member.get("member_id", ""),
        "membership_number": member.get("membership_number", 0),
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            resp = await client.post(
                f"{kms_url}/api/member-sync",
                json=payload,
                headers={"X-Sync-Key": kms_sync_key},
            )
        if resp.status_code not in (200, 409):
            raise Exception(f"HTTP {resp.status_code}: {resp.text[:200]}")
    except Exception as exc:
        logger.warning("KMS member sync failed for %s: %s", payload["email"], exc)
        try:
            from models.database import db
            await db.kms_sync_failures.insert_one({
                "email": payload["email"],
                "member_id": payload["member_id"],
                "error": str(exc),
                "created_at": datetime.now(timezone.utc),
                "retried": False,
            })
        except Exception:
            pass
