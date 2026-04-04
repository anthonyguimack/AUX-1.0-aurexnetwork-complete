from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from models.database import db, require_admin, send_email_smtp, UPLOAD_DIR, logger
from datetime import datetime, timezone, timedelta
import uuid
import io
import csv
import aiosmtplib
import aiofiles
import os

router = APIRouter()

# Image Upload
@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, GIF, WebP, SVG) allowed")
    max_size = 10 * 1024 * 1024
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = UPLOAD_DIR / filename
    total = 0
    async with aiofiles.open(filepath, "wb") as f:
        while chunk := await file.read(1024 * 64):
            total += len(chunk)
            if total > max_size:
                await f.close()
                filepath.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="File too large (max 10MB)")
            await f.write(chunk)
    return {"url": f"/api/uploads/{filename}", "filename": filename}

# CSV Export
@router.get("/admin/contacts/export")
async def export_contacts_csv(user: dict = Depends(require_admin)):
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Phone", "Subject", "Message", "Read", "Date"])
    for c in contacts:
        writer.writerow([c.get("name",""), c.get("email",""), c.get("phone",""), c.get("subject",""), c.get("message",""), "Yes" if c.get("read") else "No", c.get("created_at","")])
    output.seek(0)
    return StreamingResponse(io.BytesIO(output.getvalue().encode("utf-8")), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=contacts.csv"})

# Bulk Operations
@router.post("/admin/bulk-delete")
async def bulk_delete(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    collection = body.get("collection", "")
    ids = body.get("ids", [])
    allowed = {"blog_posts", "gallery", "portfolio", "testimonials", "contacts", "books", "nav_pages", "map_locations"}
    if collection not in allowed:
        raise HTTPException(status_code=400, detail="Invalid collection")
    if not ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    result = await db[collection].delete_many({"id": {"$in": ids}})
    return {"deleted": result.deleted_count}

@router.post("/admin/bulk-update")
async def bulk_update(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    collection = body.get("collection", "")
    ids = body.get("ids", [])
    update = body.get("update", {})
    allowed = {"blog_posts", "contacts", "gallery"}
    if collection not in allowed:
        raise HTTPException(status_code=400, detail="Invalid collection")
    if not ids or not update:
        raise HTTPException(status_code=400, detail="IDs and update data required")
    update.pop("_id", None)
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db[collection].update_many({"id": {"$in": ids}}, {"$set": update})
    return {"modified": result.modified_count}

# Section Ordering
@router.get("/admin/section-order")
async def get_section_order(user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({}, {"_id": 0})
    default = ["hero", "about", "services", "news", "blog", "reading_list", "map", "portfolio", "gallery", "testimonials", "contact"]
    return settings.get("section_order", default) if settings else default

@router.put("/admin/section-order")
async def update_section_order(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    order = body.get("order", [])
    await db.settings.update_one({}, {"$set": {"section_order": order, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"order": order}

# SEO Meta
@router.get("/admin/seo")
async def admin_get_seo(user: dict = Depends(require_admin)):
    return await db.seo_meta.find({}, {"_id": 0}).to_list(100)

@router.put("/admin/seo/{page_path}")
async def admin_update_seo(page_path: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["page_path"] = page_path
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.seo_meta.update_one({"page_path": page_path}, {"$set": body}, upsert=True)
    return await db.seo_meta.find_one({"page_path": page_path}, {"_id": 0})

# Analytics
@router.get("/admin/analytics")
async def admin_analytics(user: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    monthly_contacts = []
    for i in range(5, -1, -1):
        month_start = now.replace(day=1) - timedelta(days=i * 30)
        month_end = month_start + timedelta(days=30)
        count = await db.contacts.count_documents({"created_at": {"$gte": month_start.isoformat(), "$lt": month_end.isoformat()}})
        monthly_contacts.append({"month": month_start.strftime("%b"), "contacts": count})
    monthly_revenue = []
    for i in range(5, -1, -1):
        month_start = now.replace(day=1) - timedelta(days=i * 30)
        month_end = month_start + timedelta(days=30)
        pipeline = [{"$match": {"payment_status": "paid", "created_at": {"$gte": month_start.isoformat(), "$lt": month_end.isoformat()}}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
        result = await db.payment_transactions.aggregate(pipeline).to_list(1)
        monthly_revenue.append({"month": month_start.strftime("%b"), "revenue": result[0]["total"] if result else 0})
    top_services = await db.payment_transactions.aggregate([
        {"$match": {"payment_status": "paid"}}, {"$group": {"_id": "$service_name", "count": {"$sum": 1}, "revenue": {"$sum": "$amount"}}},
        {"$sort": {"count": -1}}, {"$limit": 5}
    ]).to_list(5)
    content_stats = {
        "blog_posts": await db.blog_posts.count_documents({}),
        "published_posts": await db.blog_posts.count_documents({"published": True}),
        "gallery_items": await db.gallery.count_documents({}),
        "portfolio_items": await db.portfolio.count_documents({}),
        "books": await db.books.count_documents({}),
        "map_locations": await db.map_locations.count_documents({}),
        "testimonials": await db.testimonials.count_documents({}),
        "total_contacts": await db.contacts.count_documents({}),
        "unread_contacts": await db.contacts.count_documents({"read": False}),
        "total_users": await db.users.count_documents({"role": {"$ne": "admin"}}),
        "total_pages": await db.nav_pages.count_documents({}),
    }
    return {
        "monthly_contacts": monthly_contacts, "monthly_revenue": monthly_revenue,
        "top_services": [{"name": s["_id"] or "Unknown", "count": s["count"], "revenue": s["revenue"]} for s in top_services],
        "content_stats": content_stats,
    }

# SMTP Test
@router.post("/admin/smtp/test-connection")
async def test_smtp_connection(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    host = body.get("smtp_host", "")
    port = body.get("smtp_port", 587)
    username = body.get("smtp_user", "")
    password = body.get("smtp_password", "")
    if not host or not username:
        raise HTTPException(status_code=400, detail="SMTP host and username required")
    try:
        smtp = aiosmtplib.SMTP(hostname=host, port=port, start_tls=True)
        await smtp.connect()
        await smtp.login(username, password)
        await smtp.quit()
        return {"success": True, "message": "SMTP connection successful!"}
    except Exception as e:
        return {"success": False, "message": f"Connection failed: {str(e)}"}

@router.post("/admin/smtp/test-email")
async def test_smtp_email(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    to_email = body.get("test_email", body.get("email_to", ""))
    if not to_email:
        raise HTTPException(status_code=400, detail="Test email address required")
    try:
        html = "<h2>Test Email from Legacy CMS</h2><p>If you received this email, your SMTP configuration is working correctly!</p>"
        await send_email_smtp(body, to_email, "Test Recipient", "Legacy CMS - Test Email", html,
                            body.get("email_from", body.get("smtp_user", "")), body.get("name_from", "Legacy CMS"))
        return {"success": True, "message": f"Test email sent to {to_email}!"}
    except Exception as e:
        return {"success": False, "message": f"Failed to send: {str(e)}"}


# ──────────── Backup & Restore ────────────

EXPORTABLE_COLLECTIONS = {
    "hero_slides": "Hero Slides",
    "about": "About",
    "services": "Services",
    "blog_posts": "Blog Posts",
    "books": "Reading List",
    "maps": "Maps",
    "map_locations": "Map Locations",
    "gallery": "Gallery",
    "gallery_albums": "Gallery Albums",
    "album_photos": "Album Photos",
    "portfolio": "Portfolio",
    "testimonials": "Testimonials",
    "nav_pages": "Pages",
    "pages": "System Pages",
    "settings": "Settings",
    "member_types": "Member Types",
}

@router.get("/admin/export-content")
async def export_content(request: Request, user: dict = Depends(require_admin)):
    collections = request.query_params.get("collections", "")
    selected = [c.strip() for c in collections.split(",") if c.strip()] if collections else list(EXPORTABLE_COLLECTIONS.keys())
    export_data = {"_meta": {"exported_at": datetime.now(timezone.utc).isoformat(), "version": "1.0", "collections": selected}}
    for col in selected:
        if col not in EXPORTABLE_COLLECTIONS:
            continue
        if col in ("about", "settings"):
            doc = await db[col].find_one({}, {"_id": 0})
            export_data[col] = doc
        else:
            docs = await db[col].find({}, {"_id": 0}).to_list(10000)
            export_data[col] = docs
    return export_data

@router.post("/admin/import-content")
async def import_content(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    mode = body.pop("_mode", "merge")
    imported = body.pop("_meta", None)
    results = {}
    for col, data in body.items():
        if col not in EXPORTABLE_COLLECTIONS or data is None:
            continue
        try:
            if col in ("about", "settings"):
                if isinstance(data, dict):
                    data.pop("_id", None)
                    data["updated_at"] = datetime.now(timezone.utc).isoformat()
                    if mode == "replace":
                        await db[col].delete_many({})
                        await db[col].insert_one(data)
                    else:
                        await db[col].update_one({}, {"$set": data}, upsert=True)
                    results[col] = {"status": "ok", "count": 1}
            elif isinstance(data, list):
                if mode == "replace":
                    await db[col].delete_many({})
                    if data:
                        clean = [{k: v for k, v in doc.items() if k != "_id"} for doc in data]
                        await db[col].insert_many(clean)
                    results[col] = {"status": "ok", "count": len(data)}
                else:
                    upserted = 0
                    for doc in data:
                        doc.pop("_id", None)
                        doc_id = doc.get("id")
                        if doc_id:
                            await db[col].update_one({"id": doc_id}, {"$set": doc}, upsert=True)
                        else:
                            doc["id"] = str(uuid.uuid4())
                            await db[col].insert_one(doc)
                        upserted += 1
                    results[col] = {"status": "ok", "count": upserted}
        except Exception as e:
            results[col] = {"status": "error", "message": str(e)}
    return {"success": True, "results": results}


# ──────────── Backup Snapshots ────────────

@router.get("/admin/backup-settings")
async def get_backup_settings(user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({}, {"_id": 0})
    return (settings or {}).get("backup_settings", {"enabled": False, "frequency": "daily", "max_snapshots": 5})

@router.get("/admin/contact-settings")
async def get_contact_settings(user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({}, {"_id": 0})
    return (settings or {}).get("contact_settings", {"title": "Contact", "subtitle": "Let's Work Together", "description": "Have a project in mind? Let's discuss how we can help"})

@router.put("/admin/contact-settings")
async def update_contact_settings(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    cs = {"title": body.get("title", "Contact"), "subtitle": body.get("subtitle", ""), "description": body.get("description", "")}
    await db.settings.update_one({}, {"$set": {"contact_settings": cs, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return cs

@router.put("/admin/backup-settings")
async def update_backup_settings(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    bs = {"enabled": body.get("enabled", False), "frequency": body.get("frequency", "daily"), "max_snapshots": body.get("max_snapshots", 5)}
    await db.settings.update_one({}, {"$set": {"backup_settings": bs, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return bs

@router.get("/admin/backups")
async def list_backups(user: dict = Depends(require_admin)):
    backups = await db.backups.find({}, {"_id": 0, "data": 0}).sort("created_at", -1).to_list(100)
    return backups

@router.get("/admin/backups/{backup_id}")
async def get_backup(backup_id: str, user: dict = Depends(require_admin)):
    backup = await db.backups.find_one({"id": backup_id}, {"_id": 0})
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    return backup.get("data", {})

@router.post("/admin/backups/create-now")
async def create_backup_now(request: Request, user: dict = Depends(require_admin)):
    body = await request.json() if (await request.body()) else {}
    label = body.get("label", "manual")
    from scheduler import create_backup_snapshot, cleanup_old_backups
    backup_id = await create_backup_snapshot(label=label)
    settings = await db.settings.find_one({}, {"_id": 0})
    max_s = (settings or {}).get("backup_settings", {}).get("max_snapshots", 5)
    await cleanup_old_backups(max_s)
    return {"success": True, "backup_id": backup_id}

@router.delete("/admin/backups/{backup_id}")
async def delete_backup(backup_id: str, user: dict = Depends(require_admin)):
    result = await db.backups.delete_one({"id": backup_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Backup not found")
    return {"message": "Backup deleted"}
