from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Body, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from slugify import slugify
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'legacy_jwt_secret')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@consultant.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin123!')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str = "user") -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    token = request.cookies.get("session_token")
    if token:
        # Check if it's a session token (from Google OAuth)
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at and expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
            user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
            if user:
                return user
    # Check Authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        # Try as session token first
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at and expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
            user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
            if user:
                return user
        # Try as JWT
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            pass
    raise HTTPException(status_code=401, detail="Not authenticated")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ AUTH ROUTES ============

@api_router.post("/auth/login")
async def login(request: Request, response: Response):
    body = await request.json()
    email = body.get("email", "")
    password = body.get("password", "")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt_token(user["user_id"], user["email"], user.get("role", "user"))
    response.set_cookie("session_token", token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password_hash"}}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return {k: v for k, v in user.items() if k != "password_hash"}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# Google OAuth - Emergent Auth
@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id", "")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        data = resp.json()
    email = data.get("email", "")
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data.get("session_token", "")
    # Find or create user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    # Store session
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {k: v for k, v in user.items() if k != "password_hash"}

# ============ PUBLIC ROUTES ============

@api_router.get("/public/settings")
async def get_public_settings():
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        return {}
    return settings

@api_router.get("/public/hero")
async def get_public_hero():
    hero = await db.hero.find_one({}, {"_id": 0})
    return hero or {}

@api_router.get("/public/about")
async def get_public_about():
    about = await db.about.find_one({}, {"_id": 0})
    return about or {}

@api_router.get("/public/services")
async def get_public_services():
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    return services

@api_router.get("/public/blog")
async def get_public_blog(page: int = 1, limit: int = 9, category: str = ""):
    query = {"published": True}
    if category:
        query["category"] = category
    total = await db.blog_posts.count_documents(query)
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    return {"posts": posts, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/public/blog/{slug}")
async def get_public_blog_detail(slug: str):
    post = await db.blog_posts.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@api_router.get("/public/books")
async def get_public_books():
    books = await db.books.find({}, {"_id": 0}).to_list(100)
    return books

@api_router.get("/public/maps")
async def get_public_maps():
    maps = await db.maps.find({"published": True}, {"_id": 0}).to_list(100)
    return maps

@api_router.get("/public/maps/{slug}")
async def get_public_map_detail(slug: str):
    m = await db.maps.find_one({"slug": slug}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Map not found")
    return m

@api_router.get("/public/map-locations")
async def get_public_map_locations():
    locs = await db.map_locations.find({}, {"_id": 0}).to_list(500)
    return locs

@api_router.get("/public/gallery")
async def get_public_gallery(category: str = ""):
    query = {}
    if category:
        query["category"] = category
    items = await db.gallery.find(query, {"_id": 0}).to_list(100)
    return items

@api_router.get("/public/portfolio")
async def get_public_portfolio():
    items = await db.portfolio.find({}, {"_id": 0}).to_list(100)
    return items

@api_router.get("/public/testimonials")
async def get_public_testimonials():
    items = await db.testimonials.find({}, {"_id": 0}).to_list(100)
    return items

@api_router.get("/public/sections")
async def get_public_sections():
    settings = await db.settings.find_one({}, {"_id": 0})
    if settings and "sections" in settings:
        return settings["sections"]
    return {}

@api_router.get("/public/page/{page_type}")
async def get_public_page(page_type: str):
    page = await db.pages.find_one({"page_type": page_type}, {"_id": 0})
    return page or {"page_type": page_type, "title": page_type.replace("_", " ").title(), "content": ""}

# ============ CONTACT FORM ============

@api_router.post("/contact")
async def submit_contact(request: Request):
    body = await request.json()
    contact = {
        "id": str(uuid.uuid4()),
        "name": body.get("name", ""),
        "email": body.get("email", ""),
        "phone": body.get("phone", ""),
        "subject": body.get("subject", ""),
        "message": body.get("message", ""),
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contacts.insert_one(contact)
    return {"message": "Contact form submitted successfully", "id": contact["id"]}

# ============ STRIPE ROUTES ============

@api_router.post("/checkout")
async def create_checkout(request: Request):
    body = await request.json()
    service_id = body.get("service_id", "")
    origin_url = body.get("origin_url", "")
    if not service_id or not origin_url:
        raise HTTPException(status_code=400, detail="service_id and origin_url required")
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    price = float(service.get("price", 0))
    if price <= 0:
        raise HTTPException(status_code=400, detail="Invalid price")
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    api_key = os.environ.get("STRIPE_API_KEY", "")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/services"
    metadata = {"service_id": service_id, "service_name": service.get("title", "")}
    # Get user if authenticated
    try:
        user = await get_current_user(request)
        metadata["user_id"] = user.get("user_id", "")
        metadata["user_email"] = user.get("email", "")
    except Exception:
        pass
    checkout_req = CheckoutSessionRequest(
        amount=price,
        currency=service.get("currency", "usd"),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)
    # Record transaction
    tx = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "service_id": service_id,
        "service_name": service.get("title", ""),
        "amount": price,
        "currency": service.get("currency", "usd"),
        "status": "initiated",
        "payment_status": "pending",
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(tx)
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    api_key = os.environ.get("STRIPE_API_KEY", "")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    # Update transaction
    update_data = {"status": status.status, "payment_status": status.payment_status}
    if status.payment_status == "paid":
        existing = await db.payment_transactions.find_one({"session_id": session_id, "payment_status": "paid"}, {"_id": 0})
        if not existing:
            update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update_data})
    return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": status.currency}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    api_key = os.environ.get("STRIPE_API_KEY", "")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    try:
        event = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))
        if event.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {"status": "complete", "payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============ ADMIN ROUTES ============

# Generic CRUD helper
async def admin_crud_list(collection_name: str):
    items = await db[collection_name].find({}, {"_id": 0}).to_list(1000)
    return items

async def admin_crud_create(collection_name: str, data: dict):
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    if "created_at" not in data:
        data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db[collection_name].insert_one(data)
    created = await db[collection_name].find_one({"id": data["id"]}, {"_id": 0})
    return created

async def admin_crud_update(collection_name: str, item_id: str, data: dict):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    data.pop("_id", None)
    await db[collection_name].update_one({"id": item_id}, {"$set": data})
    updated = await db[collection_name].find_one({"id": item_id}, {"_id": 0})
    return updated

async def admin_crud_delete(collection_name: str, item_id: str):
    await db[collection_name].delete_one({"id": item_id})
    return {"message": "Deleted"}

# Hero
@api_router.get("/admin/hero")
async def admin_get_hero(user: dict = Depends(require_admin)):
    hero = await db.hero.find_one({}, {"_id": 0})
    return hero or {}

@api_router.put("/admin/hero")
async def admin_update_hero(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.hero.update_one({}, {"$set": body}, upsert=True)
    return await db.hero.find_one({}, {"_id": 0})

# About
@api_router.get("/admin/about")
async def admin_get_about(user: dict = Depends(require_admin)):
    about = await db.about.find_one({}, {"_id": 0})
    return about or {}

@api_router.put("/admin/about")
async def admin_update_about(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.about.update_one({}, {"$set": body}, upsert=True)
    return await db.about.find_one({}, {"_id": 0})

# Services
@api_router.get("/admin/services")
async def admin_list_services(user: dict = Depends(require_admin)):
    return await admin_crud_list("services")

@api_router.post("/admin/services")
async def admin_create_service(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_create("services", body)

@api_router.put("/admin/services/{item_id}")
async def admin_update_service(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_update("services", item_id, body)

@api_router.delete("/admin/services/{item_id}")
async def admin_delete_service(item_id: str, user: dict = Depends(require_admin)):
    # Check if service has purchases
    tx = await db.payment_transactions.find_one({"service_id": item_id, "payment_status": "paid"}, {"_id": 0})
    if tx:
        raise HTTPException(status_code=400, detail="Cannot delete service with completed purchases")
    return await admin_crud_delete("services", item_id)

# Blog
@api_router.get("/admin/blog")
async def admin_list_blog(user: dict = Depends(require_admin)):
    return await admin_crud_list("blog_posts")

@api_router.post("/admin/blog")
async def admin_create_blog(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["slug"] = slugify(body.get("title", str(uuid.uuid4())))
    body["published"] = body.get("published", True)
    return await admin_crud_create("blog_posts", body)

@api_router.put("/admin/blog/{item_id}")
async def admin_update_blog(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    if "title" in body:
        body["slug"] = slugify(body["title"])
    return await admin_crud_update("blog_posts", item_id, body)

@api_router.delete("/admin/blog/{item_id}")
async def admin_delete_blog(item_id: str, user: dict = Depends(require_admin)):
    return await admin_crud_delete("blog_posts", item_id)

# Books (Reading List)
@api_router.get("/admin/books")
async def admin_list_books(user: dict = Depends(require_admin)):
    return await admin_crud_list("books")

@api_router.post("/admin/books")
async def admin_create_book(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_create("books", body)

@api_router.put("/admin/books/{item_id}")
async def admin_update_book(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_update("books", item_id, body)

@api_router.delete("/admin/books/{item_id}")
async def admin_delete_book(item_id: str, user: dict = Depends(require_admin)):
    return await admin_crud_delete("books", item_id)

# Maps
@api_router.get("/admin/maps")
async def admin_list_maps(user: dict = Depends(require_admin)):
    return await admin_crud_list("maps")

@api_router.post("/admin/maps")
async def admin_create_map(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["slug"] = slugify(body.get("title", str(uuid.uuid4())))
    body["published"] = body.get("published", True)
    return await admin_crud_create("maps", body)

@api_router.put("/admin/maps/{item_id}")
async def admin_update_map(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    if "title" in body:
        body["slug"] = slugify(body["title"])
    return await admin_crud_update("maps", item_id, body)

@api_router.delete("/admin/maps/{item_id}")
async def admin_delete_map(item_id: str, user: dict = Depends(require_admin)):
    return await admin_crud_delete("maps", item_id)

# Map Locations
@api_router.get("/admin/map-locations")
async def admin_list_map_locations(user: dict = Depends(require_admin)):
    return await admin_crud_list("map_locations")

@api_router.post("/admin/map-locations")
async def admin_create_map_location(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_create("map_locations", body)

@api_router.put("/admin/map-locations/{item_id}")
async def admin_update_map_location(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_update("map_locations", item_id, body)

@api_router.delete("/admin/map-locations/{item_id}")
async def admin_delete_map_location(item_id: str, user: dict = Depends(require_admin)):
    return await admin_crud_delete("map_locations", item_id)

# Gallery
@api_router.get("/admin/gallery")
async def admin_list_gallery(user: dict = Depends(require_admin)):
    return await admin_crud_list("gallery")

@api_router.post("/admin/gallery")
async def admin_create_gallery(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_create("gallery", body)

@api_router.put("/admin/gallery/{item_id}")
async def admin_update_gallery(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_update("gallery", item_id, body)

@api_router.delete("/admin/gallery/{item_id}")
async def admin_delete_gallery(item_id: str, user: dict = Depends(require_admin)):
    return await admin_crud_delete("gallery", item_id)

# Portfolio
@api_router.get("/admin/portfolio")
async def admin_list_portfolio(user: dict = Depends(require_admin)):
    return await admin_crud_list("portfolio")

@api_router.post("/admin/portfolio")
async def admin_create_portfolio(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_create("portfolio", body)

@api_router.put("/admin/portfolio/{item_id}")
async def admin_update_portfolio(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_update("portfolio", item_id, body)

@api_router.delete("/admin/portfolio/{item_id}")
async def admin_delete_portfolio(item_id: str, user: dict = Depends(require_admin)):
    return await admin_crud_delete("portfolio", item_id)

# Testimonials
@api_router.get("/admin/testimonials")
async def admin_list_testimonials(user: dict = Depends(require_admin)):
    return await admin_crud_list("testimonials")

@api_router.post("/admin/testimonials")
async def admin_create_testimonial(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_create("testimonials", body)

@api_router.put("/admin/testimonials/{item_id}")
async def admin_update_testimonial(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_update("testimonials", item_id, body)

@api_router.delete("/admin/testimonials/{item_id}")
async def admin_delete_testimonial(item_id: str, user: dict = Depends(require_admin)):
    return await admin_crud_delete("testimonials", item_id)

# Contacts
@api_router.get("/admin/contacts")
async def admin_list_contacts(user: dict = Depends(require_admin)):
    return await admin_crud_list("contacts")

@api_router.put("/admin/contacts/{item_id}")
async def admin_update_contact(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    return await admin_crud_update("contacts", item_id, body)

@api_router.delete("/admin/contacts/{item_id}")
async def admin_delete_contact(item_id: str, user: dict = Depends(require_admin)):
    return await admin_crud_delete("contacts", item_id)

# Purchases
@api_router.get("/admin/purchases")
async def admin_list_purchases(user: dict = Depends(require_admin)):
    return await admin_crud_list("payment_transactions")

# Settings
@api_router.get("/admin/settings")
async def admin_get_settings(user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({}, {"_id": 0})
    return settings or {}

@api_router.put("/admin/settings")
async def admin_update_settings(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one({}, {"$set": body}, upsert=True)
    return await db.settings.find_one({}, {"_id": 0})

# Pages (terms, privacy)
@api_router.get("/admin/pages/{page_type}")
async def admin_get_page(page_type: str, user: dict = Depends(require_admin)):
    page = await db.pages.find_one({"page_type": page_type}, {"_id": 0})
    return page or {"page_type": page_type, "title": page_type.replace("_", " ").title(), "content": ""}

@api_router.put("/admin/pages/{page_type}")
async def admin_update_page(page_type: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["page_type"] = page_type
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.pages.update_one({"page_type": page_type}, {"$set": body}, upsert=True)
    return await db.pages.find_one({"page_type": page_type}, {"_id": 0})

# Dashboard stats
@api_router.get("/admin/dashboard")
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
    # Revenue
    pipeline = [{"$match": {"payment_status": "paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    return {
        "blog_count": blog_count,
        "services_count": services_count,
        "contacts_count": contacts_count,
        "unread_contacts": unread_contacts,
        "purchases_count": purchases_count,
        "gallery_count": gallery_count,
        "portfolio_count": portfolio_count,
        "testimonials_count": testimonials_count,
        "books_count": books_count,
        "maps_count": maps_count,
        "total_revenue": total_revenue
    }

# ============ SEED DATA ============

async def seed_data():
    # Check if already seeded
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing:
        return
    logger.info("Seeding initial data...")
    # Admin user
    admin_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": admin_id,
        "email": ADMIN_EMAIL,
        "name": "Admin",
        "password_hash": hash_password(ADMIN_PASSWORD),
        "role": "admin",
        "picture": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Settings
    await db.settings.insert_one({
        "id": "main",
        "brand_name": "Legacy",
        "tagline": "Strategic Business Consulting",
        "logo_url": "",
        "favicon_url": "",
        "meta_title": "Legacy - Strategic Business Consulting",
        "meta_description": "Innovative solutions tailored for your success",
        "primary_color": "#1a2332",
        "accent_color": "#0D9488",
        "smtp_host": "",
        "smtp_port": 587,
        "smtp_user": "",
        "smtp_password": "",
        "admin_email": ADMIN_EMAIL,
        "social_media": {
            "facebook": "https://facebook.com",
            "twitter": "https://twitter.com",
            "instagram": "https://instagram.com",
            "linkedin": "https://linkedin.com"
        },
        "sections": {
            "hero": {"enabled": True, "title": "Hero"},
            "about": {"enabled": True, "title": "About Us"},
            "services": {"enabled": True, "title": "Services"},
            "blog": {"enabled": True, "title": "News & Blog"},
            "reading_list": {"enabled": True, "title": "Reading List"},
            "map": {"enabled": True, "title": "Travel Map"},
            "portfolio": {"enabled": True, "title": "Portfolio"},
            "gallery": {"enabled": True, "title": "Gallery"},
            "testimonials": {"enabled": True, "title": "Testimonials"},
            "contact": {"enabled": True, "title": "Contact"}
        },
        "page_access": {
            "news": "public",
            "reading_list": "public",
            "gallery": "public",
            "map": "public",
            "terms": "public",
            "privacy": "public"
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Hero
    await db.hero.insert_one({
        "id": "main",
        "subtitle": "WELCOME TO LEGACY CONSULTING",
        "title": "Innovative Solutions\nTailored for Your Success",
        "description": "We deliver strategic insights and personalized solutions to help businesses thrive in competitive markets. Our expert consultants guide you every step of the way.",
        "button_text": "Get Started",
        "button_link": "#contact",
        "background_image": "https://images.unsplash.com/photo-1650784854430-3ab0c30afdf3?crop=entropy&cs=srgb&fm=jpg&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # About
    await db.about.insert_one({
        "id": "main",
        "label": "ABOUT LEGACY",
        "title": "Smart and effective business agency.",
        "description": "We believe in the power of collaboration and personalized solutions. By understanding our clients' unique needs and goals, we tailor our approach to deliver strategic insights and creative solutions that drive lasting results.",
        "phone": "+1 (555) 123-4567",
        "signature_name": "Jonathan Pierce",
        "signature_title": "Founder & CEO",
        "image": "https://images.pexels.com/photos/7433919/pexels-photo-7433919.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "stats": [{"label": "Business Progress", "value": "90%"}],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Services
    services_data = [
        {"id": str(uuid.uuid4()), "title": "Business Strategy", "description": "We provide smart, scalable business solutions tailored to help companies streamline operations and boost productivity.", "icon": "briefcase", "price": 299.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Growth Consulting", "description": "We identify untapped markets and customer segments to drive business growth through competitive analysis.", "icon": "trending-up", "price": 499.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Financial Planning", "description": "We offer tailored financial planning solutions that help individuals and businesses manage budgets and reduce risk.", "icon": "bar-chart-3", "price": 399.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Digital Transformation", "description": "Comprehensive digital strategy to modernize your business operations and enhance customer experience.", "icon": "monitor", "price": 599.00, "currency": "usd", "type": "product", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.services.insert_many(services_data)
    # Blog posts
    blog_data = [
        {"id": str(uuid.uuid4()), "title": "The Future of Business Consulting", "slug": "future-of-business-consulting", "summary": "Discover how modern consulting firms are adapting to digital transformation and AI-driven strategies to deliver exceptional value.", "content": "<h2>The Evolution of Consulting</h2><p>The consulting industry is undergoing a fundamental shift. Traditional advisory models are being replaced by data-driven, technology-enabled approaches that deliver faster and more measurable results.</p><h3>Key Trends</h3><ul><li>AI-powered analytics and decision support</li><li>Remote and hybrid consulting models</li><li>Sustainability-focused strategies</li><li>Digital transformation acceleration</li></ul><p>Organizations that embrace these changes will find themselves better positioned for long-term success in an increasingly competitive marketplace.</p>", "category": "Business", "author": "Jonathan Pierce", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "5 Strategies for Market Expansion", "slug": "5-strategies-market-expansion", "summary": "Learn proven approaches to expand your market reach and capture new customer segments in competitive industries.", "content": "<h2>Expanding Your Market</h2><p>Market expansion is critical for sustainable growth. Here are five proven strategies that leading companies are using today.</p><h3>1. Geographic Expansion</h3><p>Entering new geographic markets can provide access to untapped customer bases.</p><h3>2. Product Diversification</h3><p>Expanding your product line to serve adjacent markets.</p><h3>3. Strategic Partnerships</h3><p>Collaborating with complementary businesses to expand reach.</p><h3>4. Digital Channels</h3><p>Leveraging online platforms for broader market access.</p><h3>5. Customer Segmentation</h3><p>Identifying and targeting new customer segments within existing markets.</p>", "category": "Marketing", "author": "Sarah Mitchell", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Building Resilient Organizations", "slug": "building-resilient-organizations", "summary": "Explore the key principles behind organizational resilience and how leaders can prepare their teams for uncertainty.", "content": "<h2>Organizational Resilience</h2><p>In today's volatile business environment, resilience has become a critical competitive advantage. Organizations that can adapt quickly to change are more likely to thrive.</p><h3>Core Principles</h3><p>Building resilience requires focus on people, processes, and technology. Leaders must create cultures that embrace change and foster continuous learning.</p>", "category": "Leadership", "author": "Michael Chen", "image": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.blog_posts.insert_many(blog_data)
    # Books
    books_data = [
        {"id": str(uuid.uuid4()), "title": "Good to Great", "author": "Jim Collins", "description": "Why some companies make the leap and others don't. A landmark study revealing what it takes to transform a good company into one that produces sustained great results.", "image": "https://images.unsplash.com/photo-1543320996-542b8a0e022c?crop=entropy&cs=srgb&fm=jpg&q=85", "amazon_link": "https://amazon.com", "other_links": [{"name": "Barnes & Noble", "url": "https://barnesandnoble.com"}], "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "The Lean Startup", "author": "Eric Ries", "description": "A revolutionary approach to business that's being adopted around the world, changing the way companies are built and new products launched.", "image": "https://images.unsplash.com/photo-1695634621295-8f83685a35bb?crop=entropy&cs=srgb&fm=jpg&q=85", "amazon_link": "https://amazon.com", "other_links": [], "featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "description": "A groundbreaking tour of the mind that explains the two systems that drive the way we think—and how they shape our judgments and decisions.", "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800", "amazon_link": "https://amazon.com", "other_links": [], "featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.books.insert_many(books_data)
    # Maps
    map_id = str(uuid.uuid4())
    await db.maps.insert_one({
        "id": map_id, "title": "Global Business Presence", "slug": "global-business-presence",
        "description": "<p>Our consulting practice spans across major business hubs worldwide. Each location represents years of dedicated service and deep market understanding.</p>",
        "cover_image": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800",
        "tags": ["global", "consulting", "business"],
        "published": True, "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Map Locations
    locations = [
        {"id": str(uuid.uuid4()), "name": "New York Office", "lat": 40.7128, "lng": -74.0060, "description": "Our flagship office in the heart of Manhattan", "category": "office", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "London Hub", "lat": 51.5074, "lng": -0.1278, "description": "European headquarters serving UK and EU markets", "category": "office", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Tokyo Center", "lat": 35.6762, "lng": 139.6503, "description": "Asia-Pacific operations center", "category": "office", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Dubai Office", "lat": 25.2048, "lng": 55.2708, "description": "Middle East and Africa regional office", "category": "office", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Sydney Branch", "lat": -33.8688, "lng": 151.2093, "description": "Oceania operations and consulting", "category": "office", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.map_locations.insert_many(locations)
    # Gallery
    gallery_data = [
        {"id": str(uuid.uuid4()), "title": "Strategic Planning Session", "summary": "Annual strategy meeting with key stakeholders", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Team Building Workshop", "summary": "Collaborative team building event", "image": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Client Presentation", "summary": "Delivering quarterly results to clients", "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Office Celebration", "summary": "Year-end celebration with the team", "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800", "category": "personal", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Weekend Retreat", "summary": "Team retreat at the mountains", "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", "category": "personal", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Networking Event", "summary": "Industry networking and connections", "image": "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.gallery.insert_many(gallery_data)
    # Portfolio
    portfolio_data = [
        {"id": str(uuid.uuid4()), "title": "Startup Solution", "description": "Complete business transformation for a tech startup", "image": "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800", "tags": ["marketing", "strategy"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Marketing Growth", "description": "Led a 200% growth campaign for an e-commerce brand", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", "tags": ["business", "solution"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Company Skills Development", "description": "Enterprise-wide training and skills assessment program", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "tags": ["solution", "business"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Business Growth Plan", "description": "Strategic growth roadmap for a Fortune 500 company", "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800", "tags": ["business", "solution"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Digital Business Transformation", "description": "End-to-end digital transformation initiative", "image": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800", "tags": ["solution", "marketing"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Elevate Your Brand", "description": "Complete brand refresh and market repositioning", "image": "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800", "tags": ["marketing", "solution"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.portfolio.insert_many(portfolio_data)
    # Testimonials
    testimonials_data = [
        {"id": str(uuid.uuid4()), "name": "David Richardson", "title": "CEO, TechVentures Inc.", "content": "Legacy Consulting transformed our business strategy. Their insights and expertise helped us achieve a 150% growth in revenue within just one year.", "image": "https://images.unsplash.com/photo-1755519024827-fd05075a7200?crop=entropy&cs=srgb&fm=jpg&q=85", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Amanda Foster", "title": "COO, GlobalReach Ltd.", "content": "Working with Legacy was a game-changer. Their team's deep understanding of market dynamics and strategic planning is unmatched.", "image": "https://images.pexels.com/photos/29852895/pexels-photo-29852895.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Robert Kim", "title": "Director, InnovateCo", "content": "The team at Legacy helped us navigate complex regulatory challenges and emerge stronger. Highly recommend their services.", "image": "https://images.pexels.com/photos/30004360/pexels-photo-30004360.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.testimonials.insert_many(testimonials_data)
    # Pages
    await db.pages.insert_many([
        {"page_type": "terms", "title": "Terms of Service", "content": "<h2>Terms of Service</h2><p>Welcome to Legacy Consulting. By using our website and services, you agree to these terms and conditions.</p><h3>1. Services</h3><p>Legacy Consulting provides business consulting, strategy development, and related professional services. All engagements are subject to individual service agreements.</p><h3>2. Intellectual Property</h3><p>All content, methodologies, and deliverables created by Legacy Consulting remain our intellectual property unless otherwise specified in writing.</p><h3>3. Confidentiality</h3><p>We maintain strict confidentiality of all client information and expect the same from our clients regarding our proprietary methods.</p><h3>4. Payment Terms</h3><p>Payment for services is due as specified in individual service agreements. Late payments may incur additional charges.</p><h3>5. Limitation of Liability</h3><p>Legacy Consulting's liability is limited to the fees paid for the specific service in question.</p>", "banner_image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800", "created_at": datetime.now(timezone.utc).isoformat()},
        {"page_type": "privacy", "title": "Privacy Policy", "content": "<h2>Privacy Policy</h2><p>At Legacy Consulting, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.</p><h3>Information We Collect</h3><p>We collect information you provide directly, such as contact details, business information, and communication preferences.</p><h3>How We Use Information</h3><p>Your information is used to provide consulting services, communicate with you, and improve our offerings.</p><h3>Data Protection</h3><p>We implement industry-standard security measures to protect your data from unauthorized access or disclosure.</p><h3>Contact Us</h3><p>For questions about this policy, please contact us at privacy@legacyconsulting.com</p>", "banner_image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    logger.info("Seed data created successfully!")

# ============ STARTUP ============

@app.on_event("startup")
async def startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
