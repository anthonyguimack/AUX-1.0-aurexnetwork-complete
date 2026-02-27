from fastapi import APIRouter, HTTPException, Request, Response, Depends
from models.database import db, verify_password, create_jwt_token, hash_password, generate_reset_token, get_current_user, send_email_smtp, logger
from datetime import datetime, timezone, timedelta
import uuid
import httpx

router = APIRouter()

@router.post("/auth/login")
async def login(request: Request, response: Response):
    body = await request.json()
    email = body.get("email", "")
    password = body.get("password", "")
    login_type = body.get("login_type", "any")
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

@router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return {k: v for k, v in user.items() if k != "password_hash"}

@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

@router.post("/auth/session")
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

@router.post("/auth/forgot-password")
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

@router.post("/auth/reset-password")
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

@router.post("/auth/change-password")
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
