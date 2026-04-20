"""Discount coupons — admin CRUD + member validation.

Coupons can apply to:
  - mentorship slots (when `paid_mentor_slots_enabled`)
  - session bundles (when `paid_bundles_enabled`)

Admin fields per coupon:
  code           (uppercase, unique)
  discount_type  'percent' | 'flat'
  discount_value (percent 0-100 OR flat amount in cents)
  applies_to     'slots' | 'bundles' | 'both'
  expires_at     ISO date or null
  usage_mode     'total'  → pooled usage_limit across all members
                 'per_member' → each member can redeem up to `usage_limit` times
  usage_limit    int (0 = unlimited)
  usage_count    int   — running total (populated by /validate redemption event)
  active         bool
"""
from datetime import datetime, timezone
import os
import uuid
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient

from routes.membership import require_admin, get_current_member

router = APIRouter()
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]


def _clean_body(body: dict) -> dict:
    code = (body.get("code") or "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
    dtype = body.get("discount_type") or "percent"
    if dtype not in ("percent", "flat"):
        raise HTTPException(status_code=400, detail="discount_type must be 'percent' or 'flat'")
    try:
        dvalue = float(body.get("discount_value") or 0)
    except (TypeError, ValueError):
        dvalue = 0
    if dtype == "percent":
        dvalue = max(0, min(100, dvalue))
    else:
        dvalue = max(0, int(dvalue))
    applies_to = body.get("applies_to") or "both"
    if applies_to not in ("slots", "bundles", "both"):
        applies_to = "both"
    usage_mode = body.get("usage_mode") or "total"
    if usage_mode not in ("total", "per_member"):
        usage_mode = "total"
    return {
        "code": code,
        "discount_type": dtype,
        "discount_value": dvalue,
        "applies_to": applies_to,
        "usage_mode": usage_mode,
        "usage_limit": max(0, int(body.get("usage_limit") or 0)),
        "expires_at": body.get("expires_at") or None,
        "active": body.get("active", True),
    }


def _compute_discount(coupon: dict, amount_cents: int) -> int:
    if coupon["discount_type"] == "percent":
        return int(round(amount_cents * (coupon["discount_value"] / 100.0)))
    return min(int(coupon["discount_value"]), amount_cents)


def _is_expired(coupon: dict) -> bool:
    if not coupon.get("expires_at"):
        return False
    try:
        exp = datetime.fromisoformat(str(coupon["expires_at"]).replace("Z", "+00:00"))
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > exp
    except Exception:
        return False


# ── Admin CRUD ──

@router.get("/admin/coupons")
async def admin_list(request: Request):
    await require_admin(request)
    items = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@router.post("/admin/coupons")
async def admin_create(body: dict, request: Request):
    await require_admin(request)
    data = _clean_body(body)
    existing = await db.coupons.find_one({"code": data["code"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail=f"Coupon code '{data['code']}' already exists")
    data["id"] = str(uuid.uuid4())
    data["usage_count"] = 0
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.coupons.insert_one(dict(data))
    return data


@router.put("/admin/coupons/{cid}")
async def admin_update(cid: str, body: dict, request: Request):
    await require_admin(request)
    data = _clean_body(body)
    # Prevent changing code to collide with another coupon
    dup = await db.coupons.find_one({"code": data["code"], "id": {"$ne": cid}}, {"_id": 0})
    if dup:
        raise HTTPException(status_code=400, detail=f"Coupon code '{data['code']}' already exists")
    r = await db.coupons.update_one({"id": cid}, {"$set": data})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    updated = await db.coupons.find_one({"id": cid}, {"_id": 0})
    return updated


@router.delete("/admin/coupons/{cid}")
async def admin_delete(cid: str, request: Request):
    await require_admin(request)
    r = await db.coupons.delete_one({"id": cid})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"deleted": True}


# ── Member validation ──

@router.post("/member/coupons/validate")
async def member_validate(body: dict, request: Request):
    """Validate a coupon for the current member.

    Body: { code: str, amount_cents: int, context: 'slots'|'bundles' }
    Returns: { valid, coupon: {...}, discount_cents, final_cents, reason? }
    """
    member = await get_current_member(request)
    code = (body.get("code") or "").strip().upper()
    ctx = (body.get("context") or "slots").lower()
    try:
        amount_cents = int(body.get("amount_cents") or 0)
    except (TypeError, ValueError):
        amount_cents = 0
    if not code:
        raise HTTPException(status_code=400, detail="Coupon code is required")
    if amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    if not coupon.get("active"):
        raise HTTPException(status_code=400, detail="Coupon is inactive")
    if _is_expired(coupon):
        raise HTTPException(status_code=400, detail="Coupon has expired")
    if coupon["applies_to"] != "both" and coupon["applies_to"] != ctx:
        raise HTTPException(status_code=400, detail=f"Coupon not valid for {ctx}")

    # Usage-limit check
    limit = int(coupon.get("usage_limit") or 0)
    if limit > 0:
        if coupon.get("usage_mode") == "per_member":
            used = await db.coupon_redemptions.count_documents({"coupon_id": coupon["id"], "member_id": member["member_id"]})
            if used >= limit:
                raise HTTPException(status_code=400, detail="You have already used this coupon the maximum number of times")
        else:
            if int(coupon.get("usage_count") or 0) >= limit:
                raise HTTPException(status_code=400, detail="Coupon usage limit reached")

    discount = _compute_discount(coupon, amount_cents)
    return {
        "valid": True,
        "code": coupon["code"],
        "id": coupon["id"],
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount_cents": discount,
        "original_cents": amount_cents,
        "final_cents": max(0, amount_cents - discount),
    }


async def record_redemption(coupon_id: str, member_id: str, context: str, original_cents: int, discount_cents: int, reference_id: str | None = None):
    """Internal helper invoked by slot/bundle checkout flows after successful payment."""
    if not coupon_id:
        return
    await db.coupon_redemptions.insert_one({
        "id": str(uuid.uuid4()),
        "coupon_id": coupon_id,
        "member_id": member_id,
        "context": context,
        "reference_id": reference_id,
        "original_cents": original_cents,
        "discount_cents": discount_cents,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.coupons.update_one({"id": coupon_id}, {"$inc": {"usage_count": 1}})
