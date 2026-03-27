from fastapi import APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from models.database import db, verify_password, create_jwt_token, hash_password, send_email_smtp, get_current_user, require_admin, logger, UPLOAD_DIR
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import aiofiles

router = APIRouter()

# ---- Helpers ----

async def get_next_membership_number():
    """Get the next sequential membership number."""
    last = await db.members.find_one({}, {"membership_number": 1}, sort=[("membership_number", -1)])
    return (last["membership_number"] + 1) if last else 1

async def get_aux_prefix():
    """Get the AUX prefix from settings."""
    settings = await db.settings.find_one({}, {"_id": 0, "aux_prefix": 1})
    return (settings or {}).get("aux_prefix", "AUX")

async def format_membership_id(number):
    prefix = await get_aux_prefix()
    return f"{prefix}-{number}"

async def get_current_member(request: Request) -> dict:
    """Authenticate member from JWT token. Accepts any role (member or admin)."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    import jwt as pyjwt
    from models.database import JWT_SECRET
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        member = await db.members.find_one({"member_id": payload["user_id"]}, {"_id": 0})
        if not member:
            raise HTTPException(status_code=401, detail="Member not found")
        return member
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---- Member Auth ----

@router.post("/member/login")
async def member_login(request: Request, response: Response):
    body = await request.json()
    username = body.get("username", "").strip()
    password = body.get("password", "")
    member = await db.members.find_one({"$or": [{"username": username}, {"email": username}]}, {"_id": 0})
    if not member or not verify_password(password, member.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt_token(member["member_id"], member["email"], "member")
    return {"token": token, "member": {k: v for k, v in member.items() if k != "password_hash"}}

@router.get("/member/me")
async def member_me(member: dict = Depends(get_current_member)):
    return {k: v for k, v in member.items() if k != "password_hash"}

# ---- Invite Codes ----

@router.post("/member/invite-codes/generate")
async def generate_invite_codes(request: Request, member: dict = Depends(get_current_member)):
    body = await request.json()
    count = min(int(body.get("count", 1)), 50)
    prefix = await get_aux_prefix()
    mn = member["membership_number"]
    codes = []
    for _ in range(count):
        short = secrets.token_hex(3)
        code = f"{prefix}-{mn}-{short}"
        doc = {
            "id": str(uuid.uuid4()), "code": code,
            "owner_member_id": member["member_id"],
            "owner_membership_number": mn,
            "owner_membership_id": f"{prefix}-{mn}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "used_at": None, "used_by_membership_id": None,
            "used_by_membership_number": None,
            "invitee_first_name": "", "invitee_last_name": "",
            "invitee_email": "", "invitee_phone": "",
            "invitee_gender": "",
            "status": "available"
        }
        await db.invite_codes.insert_one(doc)
        codes.append({k: v for k, v in doc.items() if k != "_id"})
    return codes

@router.get("/member/invite-codes")
async def list_invite_codes(member: dict = Depends(get_current_member)):
    codes = await db.invite_codes.find({"owner_member_id": member["member_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return codes

@router.post("/member/invite-codes/{code_id}/send")
async def send_invite_code(code_id: str, request: Request, member: dict = Depends(get_current_member)):
    body = await request.json()
    code_doc = await db.invite_codes.find_one({"id": code_id, "owner_member_id": member["member_id"]}, {"_id": 0})
    if not code_doc:
        raise HTTPException(status_code=404, detail="Code not found")
    if code_doc["status"] != "available":
        raise HTTPException(status_code=400, detail="Code already used")
    update = {
        "invitee_first_name": body.get("first_name", ""),
        "invitee_last_name": body.get("last_name", ""),
        "invitee_email": body.get("email", ""),
        "invitee_phone": body.get("phone", ""),
        "invitee_gender": body.get("gender", ""),
    }
    await db.invite_codes.update_one({"id": code_id}, {"$set": update})
    # Try to send email
    settings = await db.settings.find_one({}, {"_id": 0})
    if settings and settings.get("smtp_host") and body.get("email"):
        try:
            prefix = settings.get("aux_prefix", "AUX")
            platform_name = settings.get("brand_name", "Legacy")
            origin = request.headers.get("origin", "")
            reg_url = f"{origin}/my-account/register?code={code_doc['code']}"
            html = f"""<h2>You're Invited to {platform_name}!</h2>
<p>Hello {body.get('first_name', '')},</p>
<p>{member.get('first_name', '')} {member.get('last_name', '')} has invited you to join {platform_name}.</p>
<p>Your invite code: <strong>{code_doc['code']}</strong></p>
<p><a href="{reg_url}" style="background:#1a2e4a;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Register Now</a></p>
<p>Or visit: {reg_url}</p>"""
            await send_email_smtp(settings, body["email"], body.get("first_name", ""), f"Invitation to {platform_name}", html)
        except Exception as e:
            logger.warning(f"Failed to send invite email: {e}")
    return {"message": "Invitation sent", "code": {**code_doc, **update}}

# ---- Public: Validate & Register ----

@router.get("/member/validate-code/{code}")
async def validate_invite_code(code: str):
    doc = await db.invite_codes.find_one({"code": code, "status": "available"}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invalid or used invite code")
    prefix = await get_aux_prefix()
    return {"valid": True, "code": code, "sponsor_membership_id": doc["owner_membership_id"]}

@router.post("/member/register")
async def register_member(request: Request):
    body = await request.json()
    code_str = body.get("invite_code", "").strip()
    code_doc = await db.invite_codes.find_one({"code": code_str, "status": "available"}, {"_id": 0})
    if not code_doc:
        raise HTTPException(status_code=400, detail="Invalid or used invite code")
    email = body.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    existing = await db.members.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    password = body.get("password", "")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    confirm = body.get("confirm_password", "")
    if password != confirm:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    membership_number = await get_next_membership_number()
    prefix = await get_aux_prefix()
    membership_id = f"{prefix}-{membership_number}"
    member_id = f"member_{uuid.uuid4().hex[:12]}"
    first_name = body.get("first_name", "").strip()
    last_name = body.get("last_name", "").strip()
    username = email
    # Assign default Level 1 (lowest order level)
    default_level = await db.member_levels.find_one({}, {"_id": 0, "id": 1}, sort=[("order", 1)])
    default_level_id = default_level["id"] if default_level else None
    new_member = {
        "member_id": member_id,
        "membership_number": membership_number,
        "membership_id": membership_id,
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "first_name": first_name, "last_name": last_name,
        "gender": body.get("gender", ""),
        "phone": body.get("phone", ""),
        "date_of_birth": body.get("date_of_birth", ""),
        "address": body.get("address", ""), "country": body.get("country", ""),
        "state": body.get("state", ""), "city": body.get("city", ""),
        "zip_code": body.get("zip_code", ""),
        "google_account": "",
        "avatar": body.get("avatar", ""),
        "summary": "", "biography": "",
        "social_links": [],
        "sponsor_id": code_doc["owner_member_id"],
        "sponsor_membership_number": code_doc["owner_membership_number"],
        "mentor_id": None, "mentor_membership_number": None,
        "role": "member",
        "is_mentor": False,
        "portfolio_development": False,
        "level_id": default_level_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.members.insert_one(new_member)
    # Mark invite code as used
    await db.invite_codes.update_one({"id": code_doc["id"]}, {"$set": {
        "status": "used",
        "used_at": datetime.now(timezone.utc).isoformat(),
        "used_by_membership_id": membership_id,
        "used_by_membership_number": membership_number,
        "invitee_first_name": first_name or code_doc.get("invitee_first_name", ""),
        "invitee_last_name": last_name or code_doc.get("invitee_last_name", ""),
        "invitee_email": email,
        "invitee_gender": body.get("gender", code_doc.get("invitee_gender", "")),
    }})
    # Send welcome email
    settings = await db.settings.find_one({}, {"_id": 0})
    if settings and settings.get("smtp_host"):
        try:
            platform_name = settings.get("brand_name", "Legacy")
            welcome_template = settings.get("welcome_email_template", "")
            if welcome_template:
                html = welcome_template.replace("{{first_name}}", first_name).replace("{{last_name}}", last_name).replace("{{membership_id}}", membership_id).replace("{{username}}", username).replace("{{platform_name}}", platform_name)
            else:
                html = f"""<h2>Welcome to {platform_name}!</h2>
<p>Hello {first_name},</p>
<p>Your account has been created successfully.</p>
<p><strong>Membership ID:</strong> {membership_id}</p>
<p><strong>Username:</strong> {username}</p>
<p>Please login at our platform to access your membership area.</p>"""
            await send_email_smtp(settings, email, first_name, f"Welcome to {platform_name}!", html)
        except Exception as e:
            logger.warning(f"Failed to send welcome email: {e}")
    return {
        "message": "Registration successful",
        "membership_id": membership_id,
        "username": username,
        "token": create_jwt_token(member_id, email, "member"),
        "member": {k: v for k, v in new_member.items() if k not in ("password_hash", "_id")}
    }

# ---- My Sponsor ----

@router.get("/member/my-sponsor")
async def get_my_sponsor(member: dict = Depends(get_current_member)):
    if not member.get("sponsor_id"):
        return None
    sponsor = await db.members.find_one({"member_id": member["sponsor_id"]}, {"_id": 0, "password_hash": 0})
    return sponsor

# ---- Mentorship Profile ----

@router.get("/member/my-mentor")
async def get_my_mentor(member: dict = Depends(get_current_member)):
    if not member.get("mentor_id"):
        return None
    mentor = await db.members.find_one({"member_id": member["mentor_id"]}, {"_id": 0, "password_hash": 0})
    return mentor

# ---- My Community (Hierarchical Tree) ----

@router.get("/member/my-community")
async def get_my_community(member: dict = Depends(get_current_member)):
    async def build_tree(member_id, depth=0):
        if depth > 10:
            return []
        children = await db.members.find({"sponsor_id": member_id}, {"_id": 0, "password_hash": 0}).to_list(500)
        result = []
        for child in children:
            subtree = await build_tree(child["member_id"], depth + 1)
            result.append({
                "member_id": child["member_id"],
                "membership_id": child["membership_id"],
                "membership_number": child["membership_number"],
                "first_name": child["first_name"],
                "last_name": child["last_name"],
                "avatar": child.get("avatar", ""),
                "email": child.get("email", ""),
                "children": subtree
            })
        return result
    tree = await build_tree(member["member_id"])
    total_invites = await db.invite_codes.count_documents({"owner_member_id": member["member_id"]})
    used_invites = await db.invite_codes.count_documents({"owner_member_id": member["member_id"], "status": "used"})
    return {"tree": tree, "total_invites": total_invites, "used_invites": used_invites}

# ---- Update Biography ----

@router.put("/member/biography")
async def update_biography(request: Request, member: dict = Depends(get_current_member)):
    body = await request.json()
    await db.members.update_one({"member_id": member["member_id"]}, {"$set": {
        "summary": body.get("summary", ""),
        "biography": body.get("biography", ""),
        "cover_image": body.get("cover_image", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    return {"message": "Biography updated"}

# ---- Update Profile ----

@router.put("/member/profile")
async def update_profile(request: Request, member: dict = Depends(get_current_member)):
    body = await request.json()
    allowed = ("first_name", "last_name", "phone", "date_of_birth", "address", "country", "state", "city", "zip_code", "google_account", "gender", "social_links", "avatar", "email")
    update = {k: body[k] for k in allowed if k in body}
    # Sync username with email if email changed
    if "email" in update:
        new_email = update["email"].strip().lower()
        # Check if new email is already used by another member
        existing = await db.members.find_one({"email": new_email, "member_id": {"$ne": member["member_id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use by another member")
        update["email"] = new_email
        update["username"] = new_email
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.members.update_one({"member_id": member["member_id"]}, {"$set": update})
    updated = await db.members.find_one({"member_id": member["member_id"]}, {"_id": 0, "password_hash": 0})
    return updated

# ---- Member File Upload ----

@router.post("/member/upload")
async def member_upload_file(file: UploadFile = File(...), member: dict = Depends(get_current_member)):
    """Upload endpoint accessible to any authenticated member."""
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

# ---- Portfolios ----

@router.get("/member/portfolios")
async def list_portfolios(member: dict = Depends(get_current_member)):
    own = await db.portfolios.find({"owner_member_id": member["member_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    # Shared portfolios: active only, either shared_mode=all or member is in shared_with
    shared = await db.portfolios.find({
        "owner_member_id": {"$ne": member["member_id"]},
        "status": "active",
        "$or": [
            {"shared_mode": "all"},
            {"shared_with": member["member_id"]},
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"own": own, "shared": shared}

@router.post("/member/portfolios")
async def create_portfolio(request: Request, member: dict = Depends(get_current_member)):
    body = await request.json()
    portfolio = {
        "id": str(uuid.uuid4()),
        "owner_member_id": member["member_id"],
        "owner_membership_id": member["membership_id"],
        "owner_name": f"{member['first_name']} {member['last_name']}",
        "title": body.get("title", ""),
        "description": body.get("description", ""),
        "cover_image": body.get("cover_image", ""),
        "as_of_date": body.get("as_of_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "cash_balance": float(body.get("cash_balance", 0)),
        "holdings": body.get("holdings", []),
        "activities": body.get("activities", []),
        "status": body.get("status", "active"),
        "shared_mode": body.get("shared_mode", "all"),
        "shared_with": body.get("shared_with", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.portfolios.insert_one(portfolio)
    return {k: v for k, v in portfolio.items() if k != "_id"}

@router.get("/member/portfolios/{portfolio_id}")
async def get_portfolio(portfolio_id: str, member: dict = Depends(get_current_member)):
    p = await db.portfolios.find_one({"id": portfolio_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    # Owner can always view
    if p["owner_member_id"] == member["member_id"]:
        return p
    # Shared: must be active and either shared_mode=all or member in shared_with
    if p.get("status") == "active" and (p.get("shared_mode") == "all" or member["member_id"] in p.get("shared_with", [])):
        return p
    raise HTTPException(status_code=403, detail="Access denied")

@router.put("/member/portfolios/{portfolio_id}")
async def update_portfolio(portfolio_id: str, request: Request, member: dict = Depends(get_current_member)):
    body = await request.json()
    p = await db.portfolios.find_one({"id": portfolio_id, "owner_member_id": member["member_id"]}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Portfolio not found or not owner")
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.portfolios.update_one({"id": portfolio_id}, {"$set": body})
    return await db.portfolios.find_one({"id": portfolio_id}, {"_id": 0})

@router.delete("/member/portfolios/{portfolio_id}")
async def delete_portfolio(portfolio_id: str, member: dict = Depends(get_current_member)):
    p = await db.portfolios.find_one({"id": portfolio_id, "owner_member_id": member["member_id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Portfolio not found or not owner")
    await db.portfolios.delete_one({"id": portfolio_id})
    return {"message": "Deleted"}

# ---- Admin: Manage Members ----

@router.get("/admin/members")
async def admin_list_members(user: dict = Depends(require_admin)):
    return await db.members.find({}, {"_id": 0, "password_hash": 0}).sort("membership_number", 1).to_list(10000)

@router.post("/admin/members")
async def admin_create_member(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    existing = await db.members.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    membership_number = await get_next_membership_number()
    prefix = await get_aux_prefix()
    membership_id = f"{prefix}-{membership_number}"
    member_id = f"member_{uuid.uuid4().hex[:12]}"
    first_name = body.get("first_name", "").strip()
    last_name = body.get("last_name", "").strip()
    username = email  # username and email are the same
    password = body.get("password", "changeme123")
    new_member = {
        "member_id": member_id,
        "membership_number": membership_number,
        "membership_id": membership_id,
        "username": username, "email": email,
        "password_hash": hash_password(password),
        "first_name": first_name, "last_name": last_name,
        "gender": body.get("gender", ""),
        "phone": body.get("phone", ""),
        "date_of_birth": body.get("date_of_birth", ""),
        "address": body.get("address", ""), "country": body.get("country", ""),
        "state": body.get("state", ""), "city": body.get("city", ""), "zip_code": body.get("zip_code", ""),
        "google_account": body.get("google_account", ""),
        "avatar": body.get("avatar", ""),
        "summary": "", "biography": "",
        "social_links": body.get("social_links", []),
        "sponsor_id": body.get("sponsor_id", None),
        "sponsor_membership_number": body.get("sponsor_membership_number", None),
        "mentor_id": body.get("mentor_id", None),
        "mentor_membership_number": body.get("mentor_membership_number", None),
        "is_mentor": body.get("is_mentor", False),
        "portfolio_development": body.get("portfolio_development", False),
        "level_id": body.get("level_id", None),
        "role": "member",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.members.insert_one(new_member)
    return {k: v for k, v in new_member.items() if k not in ("password_hash", "_id")}

@router.put("/admin/members/{member_id}")
async def admin_update_member(member_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body.pop("_id", None)
    body.pop("password_hash", None)
    if "password" in body and body["password"]:
        body["password_hash"] = hash_password(body.pop("password"))
    else:
        body.pop("password", None)
    if "email" in body:
        body["username"] = body["email"]
    # Resolve mentor_id from mentor_membership_number
    if "mentor_membership_number" in body:
        mn = body["mentor_membership_number"]
        if mn:
            mentor = await db.members.find_one({"membership_number": int(mn)}, {"member_id": 1, "_id": 0})
            body["mentor_id"] = mentor["member_id"] if mentor else None
        else:
            body["mentor_id"] = None
    # Resolve sponsor_id from sponsor_membership_number
    if "sponsor_membership_number" in body:
        sn = body["sponsor_membership_number"]
        if sn:
            sponsor = await db.members.find_one({"membership_number": int(sn)}, {"member_id": 1, "_id": 0})
            body["sponsor_id"] = sponsor["member_id"] if sponsor else None
        else:
            body["sponsor_id"] = None
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.members.update_one({"member_id": member_id}, {"$set": body})
    return await db.members.find_one({"member_id": member_id}, {"_id": 0, "password_hash": 0})

@router.delete("/admin/members/{member_id}")
async def admin_delete_member(member_id: str, user: dict = Depends(require_admin)):
    await db.members.delete_one({"member_id": member_id})
    await db.invite_codes.delete_many({"owner_member_id": member_id})
    return {"message": "Member deleted"}

@router.get("/admin/members/{member_id}")
async def admin_get_member(member_id: str, user: dict = Depends(require_admin)):
    member = await db.members.find_one({"member_id": member_id}, {"_id": 0, "password_hash": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member

# Admin: Mentor management
@router.put("/admin/members/{member_id}/mentor")
async def admin_assign_mentor(member_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    mentor_member_id = body.get("mentor_id")
    mentor_membership_number = body.get("mentor_membership_number")
    await db.members.update_one({"member_id": member_id}, {"$set": {
        "mentor_id": mentor_member_id,
        "mentor_membership_number": mentor_membership_number,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    return {"message": "Mentor assigned"}


# ---- Sectors / Industries / Companies ----

@router.get("/member/sectors")
async def list_sectors():
    return await db.sectors.find({}, {"_id": 0}).sort("name", 1).to_list(500)

@router.get("/member/industries")
async def list_industries(sector_id: str = None):
    query = {"sector_id": sector_id} if sector_id else {}
    return await db.industries.find(query, {"_id": 0}).sort("name", 1).to_list(500)

@router.get("/member/companies")
async def list_companies(industry_id: str = None):
    query = {"industry_id": industry_id} if industry_id else {}
    return await db.companies.find(query, {"_id": 0}).sort("symbol", 1).to_list(500)

@router.get("/member/members-list")
async def members_list_for_sharing(member: dict = Depends(get_current_member)):
    """List members for portfolio sharing select."""
    members = await db.members.find(
        {"member_id": {"$ne": member["member_id"]}, "role": {"$ne": "admin"}},
        {"_id": 0, "member_id": 1, "membership_id": 1, "first_name": 1, "last_name": 1}
    ).sort("membership_number", 1).to_list(10000)
    return members


# ---- Countries / States / Cities ----

@router.get("/geo/countries")
async def list_countries():
    return await db.countries.find({}, {"_id": 0}).sort("name", 1).to_list(500)

@router.get("/geo/states")
async def list_states(country_id: str = None):
    query = {"country_id": country_id} if country_id else {}
    return await db.states.find(query, {"_id": 0}).sort("name", 1).to_list(5000)

@router.get("/geo/cities")
async def list_cities(state_id: str = None):
    query = {"state_id": state_id} if state_id else {}
    return await db.cities.find(query, {"_id": 0}).sort("name", 1).to_list(10000)

# ---- Member Levels ----

@router.get("/admin/member-levels")
async def admin_list_levels(user: dict = Depends(require_admin)):
    return await db.member_levels.find({}, {"_id": 0}).sort("order", 1).to_list(100)

@router.post("/admin/member-levels")
async def admin_create_level(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    level = {
        "id": str(uuid.uuid4()),
        "name": body.get("name", ""),
        "permissions": body.get("permissions", []),
        "order": body.get("order", 0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.member_levels.insert_one(level)
    return {k: v for k, v in level.items() if k != "_id"}

@router.put("/admin/member-levels/{level_id}")
async def admin_update_level(level_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.member_levels.update_one({"id": level_id}, {"$set": body})
    return await db.member_levels.find_one({"id": level_id}, {"_id": 0})

@router.delete("/admin/member-levels/{level_id}")
async def admin_delete_level(level_id: str, user: dict = Depends(require_admin)):
    await db.member_levels.delete_one({"id": level_id})
    return {"message": "Level deleted"}

@router.get("/member/my-level")
async def get_my_level(member: dict = Depends(get_current_member)):
    level_id = member.get("level_id")
    if not level_id:
        return None
    level = await db.member_levels.find_one({"id": level_id}, {"_id": 0})
    return level
