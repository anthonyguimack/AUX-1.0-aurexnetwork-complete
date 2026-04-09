from fastapi import APIRouter, HTTPException, Request, Depends
from models.database import db, require_admin
from datetime import datetime, timezone
import uuid

router = APIRouter()

# ─── Landing Page Content (single document) ───
@router.get("/admin/landing-content")
async def admin_get_landing_content(user: dict = Depends(require_admin)):
    doc = await db.landing_content.find_one({}, {"_id": 0})
    return doc or {}

@router.put("/admin/landing-content")
async def admin_update_landing_content(request: Request, user: dict = Depends(require_admin)):
    data = await request.json()
    data.pop("_id", None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.landing_content.update_one({}, {"$set": data}, upsert=True)
    return await db.landing_content.find_one({}, {"_id": 0})

@router.get("/public/landing-content")
async def public_get_landing_content():
    doc = await db.landing_content.find_one({}, {"_id": 0})
    return doc or {}

# ─── Landing Page Subscribers (Notify Me) ───
@router.get("/admin/landing-subscribers")
async def admin_list_subscribers(user: dict = Depends(require_admin)):
    items = await db.landing_subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@router.delete("/admin/landing-subscribers/{item_id}")
async def admin_delete_subscriber(item_id: str, user: dict = Depends(require_admin)):
    await db.landing_subscribers.delete_one({"id": item_id})
    return {"message": "Deleted"}

@router.post("/public/landing-subscribe")
async def public_subscribe(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    existing = await db.landing_subscribers.find_one({"email": email})
    if existing:
        return {"message": "Already subscribed", "id": existing["id"]}
    sub = {
        "id": str(uuid.uuid4()),
        "first_name": body.get("first_name", ""),
        "last_name": body.get("last_name", ""),
        "email": email,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.landing_subscribers.insert_one(sub)
    return {"message": "Subscribed successfully", "id": sub["id"]}

# ─── Landing Page Contacts ───
@router.get("/admin/landing-contacts")
async def admin_list_landing_contacts(user: dict = Depends(require_admin)):
    items = await db.landing_contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items

@router.delete("/admin/landing-contacts/{item_id}")
async def admin_delete_landing_contact(item_id: str, user: dict = Depends(require_admin)):
    await db.landing_contacts.delete_one({"id": item_id})
    return {"message": "Deleted"}

@router.post("/public/landing-contact")
async def public_landing_contact(request: Request):
    body = await request.json()
    email = body.get("email", "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    contact = {
        "id": str(uuid.uuid4()),
        "first_name": body.get("first_name", ""),
        "last_name": body.get("last_name", ""),
        "email": email,
        "message": body.get("message", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.landing_contacts.insert_one(contact)
    return {"message": "Message sent successfully", "id": contact["id"]}
