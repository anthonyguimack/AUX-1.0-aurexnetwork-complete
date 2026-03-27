from fastapi import APIRouter, HTTPException, Request, Depends
from models.database import db, require_admin, hash_password
from datetime import datetime, timezone
from slugify import slugify
import uuid

router = APIRouter()

# CRUD Helpers
async def crud_list(col: str):
    return await db[col].find({}, {"_id": 0}).to_list(1000)

async def crud_create(col: str, data: dict):
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    data.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db[col].insert_one(data)
    return await db[col].find_one({"id": data["id"]}, {"_id": 0})

async def crud_update(col: str, item_id: str, data: dict):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    data.pop("_id", None)
    await db[col].update_one({"id": item_id}, {"$set": data})
    return await db[col].find_one({"id": item_id}, {"_id": 0})

async def crud_delete(col: str, item_id: str):
    await db[col].delete_one({"id": item_id})
    return {"message": "Deleted"}

# Hero
@router.get("/admin/hero")
async def admin_get_hero(user: dict = Depends(require_admin)):
    return await db.hero.find_one({}, {"_id": 0}) or {}

@router.put("/admin/hero")
async def admin_update_hero(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.hero.update_one({}, {"$set": body}, upsert=True)
    return await db.hero.find_one({}, {"_id": 0})

# About
@router.get("/admin/about")
async def admin_get_about(user: dict = Depends(require_admin)):
    return await db.about.find_one({}, {"_id": 0}) or {}

@router.put("/admin/about")
async def admin_update_about(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.about.update_one({}, {"$set": body}, upsert=True)
    return await db.about.find_one({}, {"_id": 0})

# Services
@router.get("/admin/services")
async def admin_list_services(user: dict = Depends(require_admin)):
    return await crud_list("services")

@router.post("/admin/services")
async def admin_create_service(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("services", await request.json())

@router.put("/admin/services/{item_id}")
async def admin_update_service(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("services", item_id, await request.json())

@router.delete("/admin/services/{item_id}")
async def admin_delete_service(item_id: str, user: dict = Depends(require_admin)):
    tx = await db.payment_transactions.find_one({"service_id": item_id, "payment_status": "paid"}, {"_id": 0})
    if tx:
        raise HTTPException(status_code=400, detail="Cannot delete service with completed purchases")
    return await crud_delete("services", item_id)

# Blog
@router.get("/admin/blog")
async def admin_list_blog(user: dict = Depends(require_admin)):
    return await crud_list("blog_posts")

@router.post("/admin/blog")
async def admin_create_blog(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["slug"] = slugify(body.get("title", str(uuid.uuid4())))
    body.setdefault("published", True)
    return await crud_create("blog_posts", body)

@router.put("/admin/blog/{item_id}")
async def admin_update_blog(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    if "title" in body:
        body["slug"] = slugify(body["title"])
    return await crud_update("blog_posts", item_id, body)

@router.delete("/admin/blog/{item_id}")
async def admin_delete_blog(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("blog_posts", item_id)

# Books
@router.get("/admin/books")
async def admin_list_books(user: dict = Depends(require_admin)):
    return await crud_list("books")

@router.post("/admin/books")
async def admin_create_book(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("books", await request.json())

@router.put("/admin/books/{item_id}")
async def admin_update_book(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("books", item_id, await request.json())

@router.delete("/admin/books/{item_id}")
async def admin_delete_book(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("books", item_id)

# Maps
@router.get("/admin/maps")
async def admin_list_maps(user: dict = Depends(require_admin)):
    return await crud_list("maps")

@router.post("/admin/maps")
async def admin_create_map(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["slug"] = slugify(body.get("title", str(uuid.uuid4())))
    body.setdefault("published", True)
    return await crud_create("maps", body)

@router.put("/admin/maps/{item_id}")
async def admin_update_map(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    if "title" in body:
        body["slug"] = slugify(body["title"])
    return await crud_update("maps", item_id, body)

@router.delete("/admin/maps/{item_id}")
async def admin_delete_map(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("maps", item_id)

# Map Locations
@router.get("/admin/map-locations")
async def admin_list_map_locations(user: dict = Depends(require_admin)):
    return await crud_list("map_locations")

@router.post("/admin/map-locations")
async def admin_create_map_location(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("map_locations", await request.json())

@router.put("/admin/map-locations/{item_id}")
async def admin_update_map_location(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("map_locations", item_id, await request.json())

@router.delete("/admin/map-locations/{item_id}")
async def admin_delete_map_location(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("map_locations", item_id)

# Gallery
@router.get("/admin/gallery")
async def admin_list_gallery(user: dict = Depends(require_admin)):
    return await crud_list("gallery")

@router.post("/admin/gallery")
async def admin_create_gallery(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("gallery", await request.json())

@router.put("/admin/gallery/{item_id}")
async def admin_update_gallery(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("gallery", item_id, await request.json())

@router.delete("/admin/gallery/{item_id}")
async def admin_delete_gallery(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("gallery", item_id)

# Portfolio
@router.get("/admin/portfolio")
async def admin_list_portfolio(user: dict = Depends(require_admin)):
    return await crud_list("portfolio")

@router.post("/admin/portfolio")
async def admin_create_portfolio(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("portfolio", await request.json())

@router.put("/admin/portfolio/{item_id}")
async def admin_update_portfolio(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("portfolio", item_id, await request.json())

@router.delete("/admin/portfolio/{item_id}")
async def admin_delete_portfolio(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("portfolio", item_id)

# Testimonials
@router.get("/admin/testimonials")
async def admin_list_testimonials(user: dict = Depends(require_admin)):
    return await crud_list("testimonials")

@router.post("/admin/testimonials")
async def admin_create_testimonial(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("testimonials", await request.json())

@router.put("/admin/testimonials/{item_id}")
async def admin_update_testimonial(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("testimonials", item_id, await request.json())

@router.delete("/admin/testimonials/{item_id}")
async def admin_delete_testimonial(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("testimonials", item_id)

# Contacts
@router.get("/admin/contacts")
async def admin_list_contacts(user: dict = Depends(require_admin)):
    return await crud_list("contacts")

@router.put("/admin/contacts/{item_id}")
async def admin_update_contact(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("contacts", item_id, await request.json())

@router.delete("/admin/contacts/{item_id}")
async def admin_delete_contact(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("contacts", item_id)

# Purchases
@router.get("/admin/purchases")
async def admin_list_purchases(user: dict = Depends(require_admin)):
    return await crud_list("payment_transactions")

# Settings
@router.get("/admin/settings")
async def admin_get_settings(user: dict = Depends(require_admin)):
    return await db.settings.find_one({}, {"_id": 0}) or {}

@router.put("/admin/settings")
async def admin_update_settings(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one({}, {"$set": body}, upsert=True)
    return await db.settings.find_one({}, {"_id": 0})

# Pages
@router.get("/admin/pages/{page_type}")
async def admin_get_page(page_type: str, user: dict = Depends(require_admin)):
    page = await db.pages.find_one({"page_type": page_type}, {"_id": 0})
    return page or {"page_type": page_type, "title": page_type.replace("_", " ").title(), "content": ""}

@router.put("/admin/pages/{page_type}")
async def admin_update_page(page_type: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["page_type"] = page_type
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.pages.update_one({"page_type": page_type}, {"$set": body}, upsert=True)
    return await db.pages.find_one({"page_type": page_type}, {"_id": 0})

# Nav Pages
@router.get("/admin/nav-pages")
async def admin_list_nav_pages(user: dict = Depends(require_admin)):
    return await db.nav_pages.find({}, {"_id": 0}).sort("order", 1).to_list(100)

@router.post("/admin/nav-pages")
async def admin_create_nav_page(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body.setdefault("id", str(uuid.uuid4()))
    body.setdefault("order", 0)
    for k in ("show_in_header", "show_in_footer", "open_in_new_tab", "login_required"):
        body.setdefault(k, False)
    for k in ("banner_image", "summary", "content"):
        body.setdefault(k, "")
    return await crud_create("nav_pages", body)

@router.put("/admin/nav-pages/{item_id}")
async def admin_update_nav_page(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("nav_pages", item_id, await request.json())

@router.delete("/admin/nav-pages/{item_id}")
async def admin_delete_nav_page(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("nav_pages", item_id)

# Users
@router.get("/admin/users")
async def admin_list_users(user: dict = Depends(require_admin)):
    return await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0, "password_hash": 0}).to_list(1000)

@router.post("/admin/users")
async def admin_create_user(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    existing = await db.users.find_one({"email": body.get("email", "")})
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    new_user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": body.get("email", ""),
        "first_name": body.get("first_name", ""), "last_name": body.get("last_name", ""),
        "name": f"{body.get('first_name', '')} {body.get('last_name', '')}".strip(),
        "phone": body.get("phone", ""), "password_hash": hash_password(body.get("password", "changeme123")),
        "role": "user", "picture": "", "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    return {k: v for k, v in new_user.items() if k not in ("password_hash", "_id")}

@router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, request: Request, admin: dict = Depends(require_admin)):
    body = await request.json()
    update = {}
    for k in ("first_name", "last_name", "email", "phone"):
        if k in body:
            update[k] = body[k]
    if "first_name" in body or "last_name" in body:
        curr = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        fn = body.get("first_name", curr.get("first_name", ""))
        ln = body.get("last_name", curr.get("last_name", ""))
        update["name"] = f"{fn} {ln}".strip()
    if "password" in body and body["password"]:
        update["password_hash"] = hash_password(body["password"])
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"user_id": user_id}, {"$set": update})
    return await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})

@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(require_admin)):
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    return {"message": "User deleted"}

# Dashboard
@router.get("/admin/dashboard")
async def admin_dashboard(user: dict = Depends(require_admin)):
    blog_count = await db.blog_posts.count_documents({})
    services_count = await db.services.count_documents({})
    contacts_count = await db.contacts.count_documents({})
    unread_contacts = await db.contacts.count_documents({"read": False})
    purchases_count = await db.payment_transactions.count_documents({"payment_status": "paid"})
    gallery_count = await db.gallery.count_documents({})
    portfolio_count = await db.portfolio.count_documents({})
    testimonials_count = await db.testimonials.count_documents({})
    books_count = await db.books.count_documents({})
    maps_count = await db.maps.count_documents({})
    users_count = await db.members.count_documents({"role": {"$ne": "admin"}})
    pages_count = await db.nav_pages.count_documents({})
    pipeline = [{"$match": {"payment_status": "paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    return {
        "blog_count": blog_count, "services_count": services_count,
        "contacts_count": contacts_count, "unread_contacts": unread_contacts,
        "purchases_count": purchases_count, "gallery_count": gallery_count,
        "portfolio_count": portfolio_count, "testimonials_count": testimonials_count,
        "books_count": books_count, "maps_count": maps_count,
        "users_count": users_count, "pages_count": pages_count,
        "total_revenue": revenue_result[0]["total"] if revenue_result else 0
    }
