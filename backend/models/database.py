from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
import jwt as pyjwt
import bcrypt
import secrets
import string
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from fastapi import HTTPException, Request
import logging

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'legacy_jwt_secret')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@consultant.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin123!')
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str = "user") -> str:
    payload = {"user_id": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(days=7),
               "iat": datetime.now(timezone.utc)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")

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
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                return user
        except pyjwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except pyjwt.InvalidTokenError:
            pass
    raise HTTPException(status_code=401, detail="Not authenticated")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

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
