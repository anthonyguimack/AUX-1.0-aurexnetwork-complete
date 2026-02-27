from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from slugify import slugify
import jwt
import bcrypt
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'legacy_jwt_secret')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@consultant.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin123!')

app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str = "user") -> str:
    payload = {"user_id": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(days=7),
               "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def generate_reset_token():
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(48))

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if token:
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
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
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

# ==================== EMAIL HELPERS ====================

async def send_email_smtp(settings: dict, to_email: str, to_name: str, subject: str, html_body: str, from_email: str = "", from_name: str = "", cc_list: list = None):
    smtp_host = settings.get("smtp_host", "")
    smtp_port = settings.get("smtp_port", 587)
    smtp_user = settings.get("smtp_user", "")
    smtp_pass = settings.get("smtp_password", "")
    if not smtp_host or not smtp_user:
        raise HTTPException(status_code=400, detail="SMTP not configured")
    actual_from = from_email or settings.get("email_from", smtp_user)
    actual_from_name = from_name or settings.get("name_from", "Legacy")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{actual_from_name} <{actual_from}>"
    msg["To"] = f"{to_name} <{to_email}>"
    if cc_list:
        msg["Cc"] = ", ".join(cc_list)
    msg.attach(MIMEText(html_body, "html"))
    all_recipients = [to_email]
    if cc_list:
        all_recipients.extend(cc_list)
    await aiosmtplib.send(msg, hostname=smtp_host, port=smtp_port, username=smtp_user, password=smtp_pass, start_tls=True, recipients=all_recipients)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login")
async def login(request: Request, response: Response):
    body = await request.json()
    email = body.get("email", "")
    password = body.get("password", "")
    login_type = body.get("login_type", "any")  # "admin", "user", or "any"
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if login_type == "admin" and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if login_type == "user" and user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Please use admin login")
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

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id", "")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id})
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        data = resp.json()
    email = data.get("email", "")
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data.get("session_token", "")
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "role": "user", "first_name": name.split()[0] if name else "",
            "last_name": " ".join(name.split()[1:]) if name and len(name.split()) > 1 else "",
            "phone": "", "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {k: v for k, v in user.items() if k != "password_hash"}

# Password recovery
@api_router.post("/auth/forgot-password")
async def forgot_password(request: Request):
    body = await request.json()
    email = body.get("email", "")
    user = await db.users.find_one({"email": email, "role": {"$ne": "admin"}}, {"_id": 0})
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}
    token = generate_reset_token()
    await db.password_resets.insert_one({
        "email": email, "token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "used": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Try to send email
    settings = await db.settings.find_one({}, {"_id": 0})
    if settings and settings.get("smtp_host"):
        try:
            origin = request.headers.get("origin", "")
            reset_url = f"{origin}/#reset_token={token}"
            html = f"<h2>Password Reset</h2><p>Click <a href='{reset_url}'>here</a> to reset your password.</p><p>This link expires in 1 hour.</p>"
            await send_email_smtp(settings, email, user.get("name", ""), "Password Reset - Legacy", html)
        except Exception as e:
            logger.warning(f"Failed to send reset email: {e}")
    return {"message": "If the email exists, a reset link has been sent."}

@api_router.post("/auth/reset-password")
async def reset_password(request: Request):
    body = await request.json()
    token = body.get("token", "")
    new_password = body.get("password", "")
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and password required")
    reset = await db.password_resets.find_one({"token": token, "used": False}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    expires_at = datetime.fromisoformat(reset["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    await db.users.update_one({"email": reset["email"]}, {"$set": {"password_hash": hash_password(new_password)}})
    await db.password_resets.update_one({"token": token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully"}

# Change password (logged in user)
@api_router.post("/auth/change-password")
async def change_password(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    current = body.get("current_password", "")
    new = body.get("new_password", "")
    full_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not verify_password(current, full_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"password_hash": hash_password(new)}})
    return {"message": "Password changed successfully"}

# ==================== PUBLIC ROUTES ====================

@api_router.get("/public/settings")
async def get_public_settings():
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        return {}
    safe = {k: v for k, v in settings.items() if k not in ("smtp_password", "smtp_user")}
    return safe

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
    return await db.services.find({}, {"_id": 0}).to_list(100)

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
    return await db.books.find({}, {"_id": 0}).to_list(100)

@api_router.get("/public/maps")
async def get_public_maps():
    return await db.maps.find({"published": True}, {"_id": 0}).to_list(100)

@api_router.get("/public/maps/{slug}")
async def get_public_map_detail(slug: str):
    m = await db.maps.find_one({"slug": slug}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Map not found")
    return m

@api_router.get("/public/map-locations")
async def get_public_map_locations():
    return await db.map_locations.find({}, {"_id": 0}).to_list(500)

@api_router.get("/public/gallery")
async def get_public_gallery(category: str = ""):
    query = {}
    if category:
        query["category"] = category
    return await db.gallery.find(query, {"_id": 0}).to_list(100)

@api_router.get("/public/portfolio")
async def get_public_portfolio():
    return await db.portfolio.find({}, {"_id": 0}).to_list(100)

@api_router.get("/public/testimonials")
async def get_public_testimonials():
    return await db.testimonials.find({}, {"_id": 0}).to_list(100)

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

@api_router.get("/public/nav-pages")
async def get_public_nav_pages():
    pages = await db.nav_pages.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return pages

# ==================== EXTERNAL BLOG API ====================

@api_router.get("/blog/latest")
async def get_blog_latest():
    settings = await db.settings.find_one({}, {"_id": 0})
    blog_api_url = settings.get("blog_api_url", "") if settings else ""
    if not blog_api_url:
        return {"posts": [], "error": "Blog API URL not configured"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.get(blog_api_url)
            if resp.status_code != 200:
                return {"posts": [], "error": "Blog API unavailable"}
            data = resp.json()
            posts = data.get("posts", [])[:3]
            normalized = []
            for p in posts:
                normalized.append({
                    "title": p.get("title", ""),
                    "image": p.get("image", ""),
                    "url": p.get("url", p.get("link", "")),
                    "summary": (p.get("summary", "") or "")[:150]
                })
            return {"posts": normalized}
    except Exception as e:
        logger.warning(f"Blog API error: {e}")
        return {"posts": [], "error": "Blog API unavailable"}

# ==================== CONTACT FORM ====================

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
    # Try to send email notification
    settings = await db.settings.find_one({}, {"_id": 0})
    if settings and settings.get("smtp_host") and settings.get("email_to"):
        try:
            name_from = contact["name"]
            from_email = settings.get("email_from", settings.get("smtp_user", ""))
            to_email = settings.get("email_to", "")
            to_name = settings.get("name_to", "Admin")
            cc_list = [c.strip() for c in settings.get("email_cc", "").split(",") if c.strip()]
            html = f"""<h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {contact['name']}</p>
            <p><strong>Email:</strong> {contact['email']}</p>
            <p><strong>Phone:</strong> {contact['phone']}</p>
            <p><strong>Subject:</strong> {contact['subject']}</p>
            <p><strong>Message:</strong></p><p>{contact['message']}</p>
            <hr><p style="color:#999;font-size:12px;">Sent from Legacy Contact Form</p>"""
            await send_email_smtp(settings, to_email, to_name, f"Contact: {contact['subject']}", html, from_email, name_from, cc_list)
            logger.info(f"Contact email sent to {to_email}")
        except Exception as e:
            logger.warning(f"Failed to send contact email: {e}")
    return {"message": "Contact form submitted successfully", "id": contact["id"]}

# ==================== SMTP TEST ====================

@api_router.post("/admin/smtp/test-connection")
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

@api_router.post("/admin/smtp/test-email")
async def test_smtp_email(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    settings = body
    to_email = body.get("test_email", body.get("email_to", ""))
    if not to_email:
        raise HTTPException(status_code=400, detail="Test email address required")
    try:
        html = "<h2>Test Email from Legacy CMS</h2><p>If you received this email, your SMTP configuration is working correctly!</p>"
        await send_email_smtp(settings, to_email, "Test Recipient", "Legacy CMS - Test Email", html,
                            settings.get("email_from", settings.get("smtp_user", "")),
                            settings.get("name_from", "Legacy CMS"))
        return {"success": True, "message": f"Test email sent to {to_email}!"}
    except Exception as e:
        return {"success": False, "message": f"Failed to send: {str(e)}"}

# ==================== STRIPE ROUTES ====================

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
    cancel_url = f"{origin_url}/"
    metadata = {"service_id": service_id, "service_name": service.get("title", "")}
    try:
        user = await get_current_user(request)
        metadata["user_id"] = user.get("user_id", "")
        metadata["user_email"] = user.get("email", "")
    except Exception:
        pass
    checkout_req = CheckoutSessionRequest(amount=price, currency=service.get("currency", "usd"),
        success_url=success_url, cancel_url=cancel_url, metadata=metadata)
    session = await stripe_checkout.create_checkout_session(checkout_req)
    tx = {"id": str(uuid.uuid4()), "session_id": session.session_id, "service_id": service_id,
          "service_name": service.get("title", ""), "amount": price, "currency": service.get("currency", "usd"),
          "status": "initiated", "payment_status": "pending", "metadata": metadata,
          "created_at": datetime.now(timezone.utc).isoformat()}
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
    update_data = {"status": status.status, "payment_status": status.payment_status}
    if status.payment_status == "paid":
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
            await db.payment_transactions.update_one({"session_id": event.session_id},
                {"$set": {"status": "complete", "payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ==================== ADMIN CRUD HELPERS ====================

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

# ==================== ADMIN: Hero ====================
@api_router.get("/admin/hero")
async def admin_get_hero(user: dict = Depends(require_admin)):
    return await db.hero.find_one({}, {"_id": 0}) or {}

@api_router.put("/admin/hero")
async def admin_update_hero(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.hero.update_one({}, {"$set": body}, upsert=True)
    return await db.hero.find_one({}, {"_id": 0})

# ==================== ADMIN: About ====================
@api_router.get("/admin/about")
async def admin_get_about(user: dict = Depends(require_admin)):
    return await db.about.find_one({}, {"_id": 0}) or {}

@api_router.put("/admin/about")
async def admin_update_about(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.about.update_one({}, {"$set": body}, upsert=True)
    return await db.about.find_one({}, {"_id": 0})

# ==================== ADMIN: Services ====================
@api_router.get("/admin/services")
async def admin_list_services(user: dict = Depends(require_admin)):
    return await crud_list("services")

@api_router.post("/admin/services")
async def admin_create_service(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("services", await request.json())

@api_router.put("/admin/services/{item_id}")
async def admin_update_service(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("services", item_id, await request.json())

@api_router.delete("/admin/services/{item_id}")
async def admin_delete_service(item_id: str, user: dict = Depends(require_admin)):
    tx = await db.payment_transactions.find_one({"service_id": item_id, "payment_status": "paid"}, {"_id": 0})
    if tx:
        raise HTTPException(status_code=400, detail="Cannot delete service with completed purchases")
    return await crud_delete("services", item_id)

# ==================== ADMIN: Blog ====================
@api_router.get("/admin/blog")
async def admin_list_blog(user: dict = Depends(require_admin)):
    return await crud_list("blog_posts")

@api_router.post("/admin/blog")
async def admin_create_blog(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["slug"] = slugify(body.get("title", str(uuid.uuid4())))
    body.setdefault("published", True)
    return await crud_create("blog_posts", body)

@api_router.put("/admin/blog/{item_id}")
async def admin_update_blog(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    if "title" in body:
        body["slug"] = slugify(body["title"])
    return await crud_update("blog_posts", item_id, body)

@api_router.delete("/admin/blog/{item_id}")
async def admin_delete_blog(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("blog_posts", item_id)

# ==================== ADMIN: Books ====================
@api_router.get("/admin/books")
async def admin_list_books(user: dict = Depends(require_admin)):
    return await crud_list("books")

@api_router.post("/admin/books")
async def admin_create_book(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("books", await request.json())

@api_router.put("/admin/books/{item_id}")
async def admin_update_book(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("books", item_id, await request.json())

@api_router.delete("/admin/books/{item_id}")
async def admin_delete_book(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("books", item_id)

# ==================== ADMIN: Maps ====================
@api_router.get("/admin/maps")
async def admin_list_maps(user: dict = Depends(require_admin)):
    return await crud_list("maps")

@api_router.post("/admin/maps")
async def admin_create_map(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["slug"] = slugify(body.get("title", str(uuid.uuid4())))
    body.setdefault("published", True)
    return await crud_create("maps", body)

@api_router.put("/admin/maps/{item_id}")
async def admin_update_map(item_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    if "title" in body:
        body["slug"] = slugify(body["title"])
    return await crud_update("maps", item_id, body)

@api_router.delete("/admin/maps/{item_id}")
async def admin_delete_map(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("maps", item_id)

# ==================== ADMIN: Map Locations ====================
@api_router.get("/admin/map-locations")
async def admin_list_map_locations(user: dict = Depends(require_admin)):
    return await crud_list("map_locations")

@api_router.post("/admin/map-locations")
async def admin_create_map_location(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("map_locations", await request.json())

@api_router.put("/admin/map-locations/{item_id}")
async def admin_update_map_location(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("map_locations", item_id, await request.json())

@api_router.delete("/admin/map-locations/{item_id}")
async def admin_delete_map_location(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("map_locations", item_id)

# ==================== ADMIN: Gallery ====================
@api_router.get("/admin/gallery")
async def admin_list_gallery(user: dict = Depends(require_admin)):
    return await crud_list("gallery")

@api_router.post("/admin/gallery")
async def admin_create_gallery(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("gallery", await request.json())

@api_router.put("/admin/gallery/{item_id}")
async def admin_update_gallery(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("gallery", item_id, await request.json())

@api_router.delete("/admin/gallery/{item_id}")
async def admin_delete_gallery(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("gallery", item_id)

# ==================== ADMIN: Portfolio ====================
@api_router.get("/admin/portfolio")
async def admin_list_portfolio(user: dict = Depends(require_admin)):
    return await crud_list("portfolio")

@api_router.post("/admin/portfolio")
async def admin_create_portfolio(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("portfolio", await request.json())

@api_router.put("/admin/portfolio/{item_id}")
async def admin_update_portfolio(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("portfolio", item_id, await request.json())

@api_router.delete("/admin/portfolio/{item_id}")
async def admin_delete_portfolio(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("portfolio", item_id)

# ==================== ADMIN: Testimonials ====================
@api_router.get("/admin/testimonials")
async def admin_list_testimonials(user: dict = Depends(require_admin)):
    return await crud_list("testimonials")

@api_router.post("/admin/testimonials")
async def admin_create_testimonial(request: Request, user: dict = Depends(require_admin)):
    return await crud_create("testimonials", await request.json())

@api_router.put("/admin/testimonials/{item_id}")
async def admin_update_testimonial(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("testimonials", item_id, await request.json())

@api_router.delete("/admin/testimonials/{item_id}")
async def admin_delete_testimonial(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("testimonials", item_id)

# ==================== ADMIN: Contacts ====================
@api_router.get("/admin/contacts")
async def admin_list_contacts(user: dict = Depends(require_admin)):
    return await crud_list("contacts")

@api_router.put("/admin/contacts/{item_id}")
async def admin_update_contact(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("contacts", item_id, await request.json())

@api_router.delete("/admin/contacts/{item_id}")
async def admin_delete_contact(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("contacts", item_id)

# ==================== ADMIN: Purchases ====================
@api_router.get("/admin/purchases")
async def admin_list_purchases(user: dict = Depends(require_admin)):
    return await crud_list("payment_transactions")

# ==================== ADMIN: Settings ====================
@api_router.get("/admin/settings")
async def admin_get_settings(user: dict = Depends(require_admin)):
    return await db.settings.find_one({}, {"_id": 0}) or {}

@api_router.put("/admin/settings")
async def admin_update_settings(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one({}, {"$set": body}, upsert=True)
    return await db.settings.find_one({}, {"_id": 0})

# ==================== ADMIN: Pages (terms/privacy) ====================
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

# ==================== ADMIN: Nav Pages ====================
@api_router.get("/admin/nav-pages")
async def admin_list_nav_pages(user: dict = Depends(require_admin)):
    return await db.nav_pages.find({}, {"_id": 0}).sort("order", 1).to_list(100)

@api_router.post("/admin/nav-pages")
async def admin_create_nav_page(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body.setdefault("id", str(uuid.uuid4()))
    body.setdefault("order", 0)
    body.setdefault("show_in_header", False)
    body.setdefault("show_in_footer", False)
    body.setdefault("open_in_new_tab", False)
    body.setdefault("login_required", False)
    body.setdefault("banner_image", "")
    body.setdefault("summary", "")
    body.setdefault("content", "")
    return await crud_create("nav_pages", body)

@api_router.put("/admin/nav-pages/{item_id}")
async def admin_update_nav_page(item_id: str, request: Request, user: dict = Depends(require_admin)):
    return await crud_update("nav_pages", item_id, await request.json())

@api_router.delete("/admin/nav-pages/{item_id}")
async def admin_delete_nav_page(item_id: str, user: dict = Depends(require_admin)):
    return await crud_delete("nav_pages", item_id)

# ==================== ADMIN: Users ====================
@api_router.get("/admin/users")
async def admin_list_users(user: dict = Depends(require_admin)):
    users = await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.post("/admin/users")
async def admin_create_user(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    existing = await db.users.find_one({"email": body.get("email", "")})
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    new_user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": body.get("email", ""),
        "first_name": body.get("first_name", ""),
        "last_name": body.get("last_name", ""),
        "name": f"{body.get('first_name', '')} {body.get('last_name', '')}".strip(),
        "phone": body.get("phone", ""),
        "password_hash": hash_password(body.get("password", "changeme123")),
        "role": "user",
        "picture": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    result = {k: v for k, v in new_user.items() if k not in ("password_hash", "_id")}
    return result

@api_router.put("/admin/users/{user_id}")
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
    result = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return result

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(require_admin)):
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    return {"message": "User deleted"}

# ==================== ADMIN: Dashboard ====================
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
    users_count = await db.users.count_documents({"role": {"$ne": "admin"}})
    pages_count = await db.nav_pages.count_documents({})
    pipeline = [{"$match": {"payment_status": "paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    return {
        "blog_count": blog_count, "services_count": services_count,
        "contacts_count": contacts_count, "unread_contacts": unread_contacts,
        "purchases_count": purchases_count, "gallery_count": gallery_count,
        "portfolio_count": portfolio_count, "testimonials_count": testimonials_count,
        "books_count": books_count, "maps_count": maps_count,
        "users_count": users_count, "pages_count": pages_count,
        "total_revenue": total_revenue
    }

# ==================== SEED DATA ====================

async def seed_data():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing:
        # Migration: add new fields if missing
        settings = await db.settings.find_one({}, {"_id": 0})
        if settings and "social_links" not in settings:
            await db.settings.update_one({}, {"$set": {
                "social_links": [
                    {"id": str(uuid.uuid4()), "platform": "Facebook", "url": "https://facebook.com", "icon": "facebook"},
                    {"id": str(uuid.uuid4()), "platform": "Twitter", "url": "https://twitter.com", "icon": "twitter"},
                    {"id": str(uuid.uuid4()), "platform": "Instagram", "url": "https://instagram.com", "icon": "instagram"},
                    {"id": str(uuid.uuid4()), "platform": "LinkedIn", "url": "https://linkedin.com", "icon": "linkedin"},
                ],
                "blog_api_url": "https://carlosartiles.com/api.php",
                "colors": {
                    "primary": "#1a2332", "accent": "#0D9488",
                    "button_bg": "#1a2332", "button_text": "#FFFFFF",
                    "link_color": "#0D9488", "tab_active_bg": "#1a2332",
                    "tab_active_text": "#FFFFFF", "tab_inactive_bg": "#FFFFFF",
                    "tab_inactive_text": "#64748B", "icon_color": "#0D9488",
                    "heading_color": "#1a2332", "body_text": "#475569",
                    "footer_bg": "#1a2332", "footer_text": "#FFFFFF"
                },
                "email_from": "", "name_from": "", "email_to": "",
                "name_to": "", "email_cc": "",
            }})
        # Add nav_pages for terms/privacy if missing
        nav_pages_count = await db.nav_pages.count_documents({})
        if nav_pages_count == 0:
            await db.nav_pages.insert_many([
                {"id": str(uuid.uuid4()), "title": "Terms of Service", "url": "/terms", "show_in_header": False, "show_in_footer": True, "open_in_new_tab": False, "login_required": False, "order": 1, "banner_image": "", "summary": "Our terms and conditions", "content": "", "page_type": "terms", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "title": "Privacy Policy", "url": "/privacy", "show_in_header": False, "show_in_footer": True, "open_in_new_tab": False, "login_required": False, "order": 2, "banner_image": "", "summary": "Our privacy policy", "content": "", "page_type": "privacy", "created_at": datetime.now(timezone.utc).isoformat()},
            ])
        # Ensure sample user exists
        sample_user = await db.users.find_one({"email": "user@example.com"})
        if not sample_user:
            await db.users.insert_one({
                "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": "user@example.com",
                "name": "John Doe", "first_name": "John", "last_name": "Doe",
                "password_hash": hash_password("User123!"), "role": "user",
                "picture": "", "phone": "+1 555-0100",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        return
    logger.info("Seeding initial data...")
    admin_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": admin_id, "email": ADMIN_EMAIL, "name": "Admin",
        "first_name": "Admin", "last_name": "",
        "password_hash": hash_password(ADMIN_PASSWORD),
        "role": "admin", "picture": "", "phone": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.settings.insert_one({
        "id": "main", "brand_name": "Legacy", "tagline": "Strategic Business Consulting",
        "logo_url": "", "favicon_url": "",
        "meta_title": "Legacy - Strategic Business Consulting",
        "meta_description": "Innovative solutions tailored for your success",
        "primary_color": "#1a2332", "accent_color": "#0D9488",
        "smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_password": "",
        "email_from": "", "name_from": "", "email_to": "", "name_to": "", "email_cc": "",
        "admin_email": ADMIN_EMAIL,
        "blog_api_url": "https://carlosartiles.com/api.php",
        "social_links": [
            {"id": str(uuid.uuid4()), "platform": "Facebook", "url": "https://facebook.com", "icon": "facebook"},
            {"id": str(uuid.uuid4()), "platform": "Twitter", "url": "https://twitter.com", "icon": "twitter"},
            {"id": str(uuid.uuid4()), "platform": "Instagram", "url": "https://instagram.com", "icon": "instagram"},
            {"id": str(uuid.uuid4()), "platform": "LinkedIn", "url": "https://linkedin.com", "icon": "linkedin"},
        ],
        "colors": {
            "primary": "#1a2332", "accent": "#0D9488",
            "button_bg": "#1a2332", "button_text": "#FFFFFF",
            "link_color": "#0D9488", "tab_active_bg": "#1a2332",
            "tab_active_text": "#FFFFFF", "tab_inactive_bg": "#FFFFFF",
            "tab_inactive_text": "#64748B", "icon_color": "#0D9488",
            "heading_color": "#1a2332", "body_text": "#475569",
            "footer_bg": "#1a2332", "footer_text": "#FFFFFF"
        },
        "sections": {
            "hero": {"enabled": True, "title": "Hero"},
            "about": {"enabled": True, "title": "About Us"},
            "services": {"enabled": True, "title": "Services"},
            "news": {"enabled": True, "title": "News"},
            "blog": {"enabled": True, "title": "Blog"},
            "reading_list": {"enabled": True, "title": "Reading List"},
            "map": {"enabled": True, "title": "Travel Map"},
            "portfolio": {"enabled": True, "title": "Portfolio"},
            "gallery": {"enabled": True, "title": "Gallery"},
            "testimonials": {"enabled": True, "title": "Testimonials"},
            "contact": {"enabled": True, "title": "Contact"}
        },
        "page_access": {
            "news": "public", "reading_list": "public", "gallery": "public",
            "map": "public", "terms": "public", "privacy": "public"
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.hero.insert_one({
        "id": "main", "subtitle": "WELCOME TO LEGACY CONSULTING",
        "title": "Innovative Solutions\nTailored for Your Success",
        "description": "We deliver strategic insights and personalized solutions to help businesses thrive in competitive markets. Our expert consultants guide you every step of the way.",
        "button_text": "Get Started", "button_link": "#contact",
        "background_image": "https://images.unsplash.com/photo-1650784854430-3ab0c30afdf3?crop=entropy&cs=srgb&fm=jpg&q=85",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.about.insert_one({
        "id": "main", "label": "ABOUT LEGACY",
        "title": "Smart and effective business agency.",
        "description": "We believe in the power of collaboration and personalized solutions. By understanding our clients' unique needs and goals, we tailor our approach to deliver strategic insights and creative solutions that drive lasting results.",
        "phone": "+1 (555) 123-4567", "signature_name": "Jonathan Pierce",
        "signature_title": "Founder & CEO",
        "image": "https://images.pexels.com/photos/7433919/pexels-photo-7433919.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "stats": [{"label": "Business Progress", "value": "90%"}],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.services.insert_many([
        {"id": str(uuid.uuid4()), "title": "Business Strategy", "description": "Smart, scalable business solutions tailored to help companies streamline operations.", "icon": "briefcase", "price": 299.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Growth Consulting", "description": "We identify untapped markets and customer segments to drive business growth.", "icon": "trending-up", "price": 499.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Financial Planning", "description": "Tailored financial planning to help businesses manage budgets and reduce risk.", "icon": "bar-chart-3", "price": 399.00, "currency": "usd", "type": "service", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Digital Transformation", "description": "Comprehensive digital strategy to modernize your business operations.", "icon": "monitor", "price": 599.00, "currency": "usd", "type": "product", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.blog_posts.insert_many([
        {"id": str(uuid.uuid4()), "title": "The Future of Business Consulting", "slug": "future-of-business-consulting", "summary": "Discover how modern consulting firms are adapting to digital transformation and AI-driven strategies.", "content": "<h2>The Evolution of Consulting</h2><p>The consulting industry is undergoing a fundamental shift driven by AI and data analytics.</p><h3>Key Trends</h3><ul><li>AI-powered analytics</li><li>Remote consulting models</li><li>Sustainability strategies</li></ul>", "category": "Business", "author": "Jonathan Pierce", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "5 Strategies for Market Expansion", "slug": "5-strategies-market-expansion", "summary": "Learn proven approaches to expand your market reach and capture new customer segments.", "content": "<h2>Expanding Your Market</h2><p>Market expansion is critical for sustainable growth.</p>", "category": "Marketing", "author": "Sarah Mitchell", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Building Resilient Organizations", "slug": "building-resilient-organizations", "summary": "Explore the key principles behind organizational resilience.", "content": "<h2>Organizational Resilience</h2><p>Resilience is a critical competitive advantage.</p>", "category": "Leadership", "author": "Michael Chen", "image": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800", "published": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.books.insert_many([
        {"id": str(uuid.uuid4()), "title": "Good to Great", "author": "Jim Collins", "description": "Why some companies make the leap and others don't.", "synopsis": "A landmark study revealing what it takes to transform a good company into one that produces sustained great results.", "who_is_it_for": "Business leaders, managers, and entrepreneurs seeking to understand what separates great companies from good ones.", "about_author": "Jim Collins is a student and teacher of what makes great companies tick, and a Socratic advisor to leaders in the business and social sectors.", "image": "https://images.unsplash.com/photo-1543320996-542b8a0e022c?crop=entropy&cs=srgb&fm=jpg&q=85", "amazon_link": "https://amazon.com", "other_links": [{"name": "Barnes & Noble", "url": "https://barnesandnoble.com"}], "featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "The Lean Startup", "author": "Eric Ries", "description": "A revolutionary approach to business that's changing the way companies are built.", "synopsis": "Eric Ries presents a scientific approach to creating and managing successful startups in an age when companies need to innovate more than ever.", "who_is_it_for": "Startup founders, product managers, and anyone building something new under conditions of extreme uncertainty.", "about_author": "Eric Ries is an entrepreneur and author. He is the creator of the Lean Startup methodology.", "image": "https://images.unsplash.com/photo-1695634621295-8f83685a35bb?crop=entropy&cs=srgb&fm=jpg&q=85", "amazon_link": "https://amazon.com", "other_links": [], "featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "description": "A groundbreaking tour of the mind explaining two systems that drive our thinking.", "synopsis": "Nobel laureate Daniel Kahneman takes us on a tour of the mind explaining the two systems that drive the way we think and how they shape our decisions.", "who_is_it_for": "Decision-makers, psychologists, economists, and anyone curious about how the mind works.", "about_author": "Daniel Kahneman is a psychologist and economist notable for his work on the psychology of judgment and decision-making.", "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800", "amazon_link": "https://amazon.com", "other_links": [], "featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    map_id = str(uuid.uuid4())
    await db.maps.insert_one({
        "id": map_id, "title": "Global Business Presence", "slug": "global-business-presence",
        "description": "<p>Our consulting practice spans across major business hubs worldwide.</p>",
        "cover_image": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800",
        "tags": ["global", "consulting"], "published": True, "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.map_locations.insert_many([
        {"id": str(uuid.uuid4()), "name": "New York Office", "lat": 40.7128, "lng": -74.0060, "description": "Flagship office in Manhattan", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "London Hub", "lat": 51.5074, "lng": -0.1278, "description": "European headquarters", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Tokyo Center", "lat": 35.6762, "lng": 139.6503, "description": "Asia-Pacific operations", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Dubai Office", "lat": 25.2048, "lng": 55.2708, "description": "Middle East regional office", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Sydney Branch", "lat": -33.8688, "lng": 151.2093, "description": "Oceania operations", "category": "office", "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.gallery.insert_many([
        {"id": str(uuid.uuid4()), "title": "Strategic Planning Session", "summary": "Annual strategy meeting", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Team Building Workshop", "summary": "Collaborative team event", "image": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Client Presentation", "summary": "Quarterly results delivery", "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Office Celebration", "summary": "Year-end celebration", "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800", "category": "personal", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Weekend Retreat", "summary": "Mountain retreat", "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", "category": "personal", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Networking Event", "summary": "Industry networking", "image": "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800", "category": "professional", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.portfolio.insert_many([
        {"id": str(uuid.uuid4()), "title": "Startup Solution", "description": "Complete business transformation", "image": "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800", "tags": ["marketing", "strategy"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Marketing Growth", "description": "200% growth campaign", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", "tags": ["business", "solution"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Company Skills", "description": "Enterprise training program", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "tags": ["solution"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Business Growth Plan", "description": "Strategic growth roadmap", "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800", "tags": ["business"], "link": "", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.testimonials.insert_many([
        {"id": str(uuid.uuid4()), "name": "David Richardson", "title": "CEO, TechVentures Inc.", "content": "Legacy Consulting transformed our business strategy with 150% revenue growth.", "image": "https://images.unsplash.com/photo-1755519024827-fd05075a7200?crop=entropy&cs=srgb&fm=jpg&q=85", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Amanda Foster", "title": "COO, GlobalReach Ltd.", "content": "Working with Legacy was a game-changer for our strategic planning.", "image": "https://images.pexels.com/photos/29852895/pexels-photo-29852895.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Robert Kim", "title": "Director, InnovateCo", "content": "They helped us navigate complex regulatory challenges. Highly recommended.", "image": "https://images.pexels.com/photos/30004360/pexels-photo-30004360.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "rating": 5, "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.pages.insert_many([
        {"page_type": "terms", "title": "Terms of Service", "content": "<h2>Terms of Service</h2><p>Welcome to Legacy Consulting. By using our services, you agree to these terms.</p><h3>1. Services</h3><p>Legacy provides consulting and related professional services.</p><h3>2. Intellectual Property</h3><p>All content and deliverables remain our intellectual property unless specified in writing.</p><h3>3. Confidentiality</h3><p>We maintain strict confidentiality of all client information.</p><h3>4. Payment</h3><p>Payment is due as specified in service agreements.</p>", "banner_image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800", "created_at": datetime.now(timezone.utc).isoformat()},
        {"page_type": "privacy", "title": "Privacy Policy", "content": "<h2>Privacy Policy</h2><p>We take your privacy seriously.</p><h3>Information We Collect</h3><p>Contact details, business information, and preferences.</p><h3>How We Use It</h3><p>To provide services, communicate, and improve our offerings.</p><h3>Data Protection</h3><p>Industry-standard security measures protect your data.</p>", "banner_image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    await db.nav_pages.insert_many([
        {"id": str(uuid.uuid4()), "title": "Terms of Service", "url": "/terms", "show_in_header": False, "show_in_footer": True, "open_in_new_tab": False, "login_required": False, "order": 1, "banner_image": "", "summary": "Our terms and conditions", "content": "", "page_type": "terms", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Privacy Policy", "url": "/privacy", "show_in_header": False, "show_in_footer": True, "open_in_new_tab": False, "login_required": False, "order": 2, "banner_image": "", "summary": "Our privacy policy", "content": "", "page_type": "privacy", "created_at": datetime.now(timezone.utc).isoformat()},
    ])
    # Sample user
    await db.users.insert_one({
        "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": "user@example.com",
        "name": "John Doe", "first_name": "John", "last_name": "Doe",
        "password_hash": hash_password("User123!"), "role": "user",
        "picture": "", "phone": "+1 555-0100",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    logger.info("Seed data created successfully!")

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"])
