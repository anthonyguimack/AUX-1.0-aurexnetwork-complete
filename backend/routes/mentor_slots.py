"""Mentor Slots — admin + mentor CRUD, member booking, waitlist, and slot templates."""
from fastapi import APIRouter, HTTPException, Request, Depends
from models.database import db, require_admin
from routes.calendar_helpers import notify_waitlist_spot_open, notify_cancellation
from datetime import datetime, timezone, date, timedelta
import uuid

router = APIRouter()


def _expand_recurrence(base_date: str, days_of_week: list, weeks: int) -> list:
    """Given a start date and a list of JS-style day-of-week indices (0=Sun..6=Sat),
    produce the sorted, deduplicated list of ISO dates across `weeks` consecutive weeks.
    The first week starts at the Sunday on or before `base_date`."""
    if not base_date or not days_of_week or weeks <= 0:
        return []
    try:
        y, m, d = [int(x) for x in base_date.split("-")]
        start = date(y, m, d)
    except (ValueError, AttributeError):
        return []
    # Python weekday(): Mon=0..Sun=6. JS: Sun=0..Sat=6. Convert JS dow → python dow.
    def js_to_py(dow: int) -> int:
        return 6 if dow == 0 else dow - 1
    # Anchor each week at the Sunday on-or-before the start date, so selecting
    # Monday against a Wednesday start yields next Monday, not 5 days in the past.
    sunday_anchor = start - timedelta(days=(start.weekday() + 1) % 7)
    out = set()
    for w in range(weeks):
        for dow in days_of_week:
            py_dow = js_to_py(int(dow))
            offset = (py_dow + 1) % 7  # days after Sunday
            dt = sunday_anchor + timedelta(weeks=w, days=offset)
            if dt >= start:
                out.add(dt.isoformat())
    return sorted(out)


async def _materialize_slot(base_body: dict, override_date: str) -> dict:
    """Insert a single slot document; return the enriched record."""
    doc = {**base_body, "id": str(uuid.uuid4()), "date": override_date, "created_at": datetime.now(timezone.utc).isoformat()}
    doc.pop("recurrence", None)
    await db.mentorship_slots.insert_one(doc)
    result = await db.mentorship_slots.find_one({"id": doc["id"]}, {"_id": 0})
    result["booked_count"] = 0
    result["waitlist_count"] = 0
    return result


# ── Admin: Mentorship Schedule ──

@router.get("/admin/mentorship/slots")
async def admin_list_mentorship_slots(user: dict = Depends(require_admin)):
    slots = await db.mentorship_slots.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    for s in slots:
        s["booked_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": {"$in": ["booked", "completed"]}})
        s["waitlist_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": "waitlist"})
        mentor = await db.members.find_one({"member_id": s.get("mentor_id")}, {"_id": 0, "password_hash": 0})
        s["mentor_name"] = f"{mentor.get('first_name', '')} {mentor.get('last_name', '')}".strip() if mentor else ""
        s["mentor_membership_id"] = mentor.get("membership_id", "") if mentor else ""
    return slots


@router.post("/admin/mentorship/slots")
async def admin_create_mentorship_slot(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body.setdefault("status", "active")
    body.setdefault("max_students", 1)
    body.setdefault("session_type", "One-on-One")
    body.setdefault("description", "")
    body.setdefault("virtual_link", "")
    body.setdefault("attachments", [])
    if not body.get("mentor_id"):
        raise HTTPException(status_code=400, detail="mentor_id is required")
    if not body.get("date"):
        raise HTTPException(status_code=400, detail="date is required")
    # Recurrence support: produce N cloned slots across selected weekdays/weeks.
    recurrence = body.pop("recurrence", None)
    dates = [body["date"]]
    if recurrence and recurrence.get("enabled"):
        expanded = _expand_recurrence(body["date"], recurrence.get("days_of_week") or [], int(recurrence.get("weeks") or 1))
        if expanded:
            dates = expanded[:104]  # hard cap (2 years)
    created = []
    for d in dates:
        rec = await _materialize_slot(body, d)
        created.append(rec)
    mentor = await db.members.find_one({"member_id": body["mentor_id"]}, {"_id": 0, "password_hash": 0})
    mentor_name = f"{mentor.get('first_name', '')} {mentor.get('last_name', '')}".strip() if mentor else ""
    mentor_mid = mentor.get("membership_id", "") if mentor else ""
    for rec in created:
        rec["mentor_name"] = mentor_name
        rec["mentor_membership_id"] = mentor_mid
    if len(created) == 1:
        return created[0]
    return {"created": created, "count": len(created)}


@router.put("/admin/mentorship/slots/{slot_id}")
async def admin_update_mentorship_slot(slot_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body.pop("id", None)
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.mentorship_slots.update_one({"id": slot_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    slot = await db.mentorship_slots.find_one({"id": slot_id}, {"_id": 0})
    mentor = await db.members.find_one({"member_id": slot.get("mentor_id")}, {"_id": 0, "password_hash": 0})
    slot["mentor_name"] = f"{mentor.get('first_name', '')} {mentor.get('last_name', '')}".strip() if mentor else ""
    return slot


@router.delete("/admin/mentorship/slots/{slot_id}")
async def admin_delete_mentorship_slot(slot_id: str, user: dict = Depends(require_admin)):
    await db.mentorship_slots.delete_one({"id": slot_id})
    await db.mentorship_bookings.delete_many({"slot_id": slot_id})
    return {"success": True}


@router.get("/admin/mentorship/slots/{slot_id}/bookings")
async def admin_slot_bookings(slot_id: str, user: dict = Depends(require_admin)):
    bookings = await db.mentorship_bookings.find({"slot_id": slot_id}, {"_id": 0}).sort("booked_at", 1).to_list(200)
    for b in bookings:
        member = await db.members.find_one({"member_id": b["member_id"]}, {"_id": 0, "password_hash": 0})
        if member:
            b["membership_id"] = member.get("membership_id", "")
            b["name"] = f"{member.get('first_name', '')} {member.get('last_name', '')}".strip()
            b["email"] = member.get("email", "")
    return bookings


# ── Admin: Mentor Slot Templates (Feature: quick-fill library) ──

@router.get("/admin/mentor-slot-templates")
async def admin_list_templates(user: dict = Depends(require_admin)):
    items = await db.mentor_slot_templates.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@router.post("/admin/mentor-slot-templates")
async def admin_create_template(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    if not body.get("name"):
        raise HTTPException(status_code=400, detail="Template name is required")
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.get("name", ""),
        "title": body.get("title", ""),
        "session_type": body.get("session_type", "One-on-One"),
        "max_students": int(body.get("max_students", 1)),
        "default_duration_minutes": int(body.get("default_duration_minutes", 60)),
        "description": body.get("description", ""),
        "virtual_link": body.get("virtual_link", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.mentor_slot_templates.insert_one(doc)
    return await db.mentor_slot_templates.find_one({"id": doc["id"]}, {"_id": 0})


@router.put("/admin/mentor-slot-templates/{tpl_id}")
async def admin_update_template(tpl_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body.pop("id", None)
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "max_students" in body:
        body["max_students"] = int(body["max_students"])
    if "default_duration_minutes" in body:
        body["default_duration_minutes"] = int(body["default_duration_minutes"])
    result = await db.mentor_slot_templates.update_one({"id": tpl_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return await db.mentor_slot_templates.find_one({"id": tpl_id}, {"_id": 0})


@router.delete("/admin/mentor-slot-templates/{tpl_id}")
async def admin_delete_template(tpl_id: str, user: dict = Depends(require_admin)):
    await db.mentor_slot_templates.delete_one({"id": tpl_id})
    return {"success": True}


# ── Member-side: Mentor slot templates (read-only, gated by setting) ──

@router.get("/member/mentor-slot-templates")
async def member_list_templates(request: Request):
    """Return templates only if the feature is enabled in settings."""
    from routes.membership import get_current_member
    await get_current_member(request)  # enforce auth
    settings = await db.settings.find_one({}, {"_id": 0}) or {}
    if not settings.get("mentor_slot_templates_enabled"):
        return []
    items = await db.mentor_slot_templates.find({}, {"_id": 0}).sort("name", 1).to_list(200)
    return items


# ── Mentor (member role): Manage own slots ──

@router.get("/member/mentorship/slots")
async def mentor_list_slots(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    slots = await db.mentorship_slots.find({"mentor_id": member["member_id"]}, {"_id": 0}).sort("date", 1).to_list(500)
    for s in slots:
        s["booked_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": {"$in": ["booked", "completed"]}})
        s["waitlist_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": "waitlist"})
        bookings = await db.mentorship_bookings.find({"slot_id": s["id"]}, {"_id": 0}).sort("booked_at", 1).to_list(50)
        participants = []
        for b in bookings:
            m = await db.members.find_one({"member_id": b["member_id"]}, {"_id": 0, "password_hash": 0})
            if m:
                participants.append({"member_id": b["member_id"], "name": f"{m.get('first_name', '')} {m.get('last_name', '')}".strip(), "membership_id": m.get("membership_id", ""), "status": b["status"]})
        s["participants"] = participants
    return slots


@router.post("/member/mentorship/slots")
async def mentor_create_slot(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    body = await request.json()
    body["mentor_id"] = member["member_id"]
    body.setdefault("status", "active")
    body.setdefault("max_students", 1)
    body.setdefault("session_type", "One-on-One")
    body.setdefault("description", "")
    body.setdefault("virtual_link", "")
    body.setdefault("attachments", [])
    if not body.get("date"):
        raise HTTPException(status_code=400, detail="date is required")
    recurrence = body.pop("recurrence", None)
    dates = [body["date"]]
    if recurrence and recurrence.get("enabled"):
        expanded = _expand_recurrence(body["date"], recurrence.get("days_of_week") or [], int(recurrence.get("weeks") or 1))
        if expanded:
            dates = expanded[:104]
    created = []
    for d in dates:
        rec = await _materialize_slot(body, d)
        rec["participants"] = []
        created.append(rec)
    if len(created) == 1:
        return created[0]
    return {"created": created, "count": len(created)}


@router.put("/member/mentorship/slots/{slot_id}")
async def mentor_update_slot(slot_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    body = await request.json()
    old_slot = await db.mentorship_slots.find_one({"id": slot_id, "mentor_id": member["member_id"]}, {"_id": 0})
    body.pop("id", None)
    body.pop("_id", None)
    body.pop("mentor_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    if old_slot and old_slot.get("status") != "cancelled" and body.get("status") == "cancelled":
        await notify_cancellation(db.mentorship_bookings, slot_id, "slot_id", f"Mentorship on {old_slot.get('date', '')}", "slot")
    result = await db.mentorship_slots.update_one({"id": slot_id, "mentor_id": member["member_id"]}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    updated = await db.mentorship_slots.find_one({"id": slot_id}, {"_id": 0})
    updated["booked_count"] = await db.mentorship_bookings.count_documents({"slot_id": slot_id, "status": {"$in": ["booked", "completed"]}})
    updated["waitlist_count"] = await db.mentorship_bookings.count_documents({"slot_id": slot_id, "status": "waitlist"})
    bookings = await db.mentorship_bookings.find({"slot_id": slot_id}, {"_id": 0}).sort("booked_at", 1).to_list(50)
    participants = []
    for b in bookings:
        m = await db.members.find_one({"member_id": b["member_id"]}, {"_id": 0, "password_hash": 0})
        if m:
            participants.append({"member_id": b["member_id"], "name": f"{m.get('first_name', '')} {m.get('last_name', '')}".strip(), "membership_id": m.get("membership_id", ""), "status": b["status"]})
    updated["participants"] = participants
    return updated


@router.delete("/member/mentorship/slots/{slot_id}")
async def mentor_delete_slot(slot_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    await db.mentorship_slots.delete_one({"id": slot_id, "mentor_id": member["member_id"]})
    await db.mentorship_bookings.delete_many({"slot_id": slot_id})
    return {"success": True}


# ── Member: Mentor calendar view (book / cancel / my bookings) ──

@router.get("/member/mentor-calendar")
async def member_view_mentor_calendar(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    mentor_id = member.get("mentor_id")
    if not mentor_id:
        return {"slots": [], "mentor": None}
    slots = await db.mentorship_slots.find({"mentor_id": mentor_id, "status": "active"}, {"_id": 0}).sort("date", 1).to_list(500)
    for s in slots:
        s["booked_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": {"$in": ["booked", "completed"]}})
        s["waitlist_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": "waitlist"})
        my_booking = await db.mentorship_bookings.find_one({"slot_id": s["id"], "member_id": member["member_id"]}, {"_id": 0})
        s["my_status"] = my_booking["status"] if my_booking else None
        if s["my_status"] != "booked":
            s.pop("virtual_link", None)
    mentor = await db.members.find_one({"member_id": mentor_id}, {"_id": 0, "password_hash": 0})
    return {"slots": slots, "mentor": {"name": f"{mentor.get('first_name', '')} {mentor.get('last_name', '')}".strip(), "membership_id": mentor.get("membership_id", "")} if mentor else None}


@router.post("/member/mentorship/book/{slot_id}")
async def member_book_slot(slot_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    slot = await db.mentorship_slots.find_one({"id": slot_id}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.get("status") != "active":
        raise HTTPException(status_code=400, detail="Slot is not available")
    existing = await db.mentorship_bookings.find_one({"slot_id": slot_id, "member_id": member["member_id"]})
    if existing and existing.get("status") == "booked":
        raise HTTPException(status_code=400, detail="Already booked this slot")
    booked_count = await db.mentorship_bookings.count_documents({"slot_id": slot_id, "status": {"$in": ["booked", "completed"]}})
    max_students = slot.get("max_students", 1)
    if booked_count >= max_students and (not existing or existing.get("status") != "waitlist"):
        if existing:
            raise HTTPException(status_code=400, detail="Already on the waiting list")
        status = "waitlist"
    elif existing and existing.get("status") == "waitlist" and booked_count < max_students:
        await db.mentorship_bookings.update_one({"slot_id": slot_id, "member_id": member["member_id"]}, {"$set": {"status": "booked", "booked_at": datetime.now(timezone.utc).isoformat()}})
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "member_id": slot["mentor_id"],
            "type": "mentorship_booking",
            "title": "Booking Confirmed",
            "message": f"{member.get('first_name', '')} {member.get('last_name', '')} confirmed their booking for {slot.get('session_type', 'session')} on {slot.get('date', '')}.",
            "link": "/my-account/mentorship-calendar",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "member_id": member["member_id"],
            "type": "mentorship_confirmed",
            "title": "Booking Confirmed",
            "message": f"Your mentorship session on {slot.get('date', '')} has been confirmed.",
            "link": "/my-account/my-bookings",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"success": True, "status": "booked"}
    else:
        status = "booked" if booked_count < max_students else "waitlist"
    booking = {
        "id": str(uuid.uuid4()),
        "slot_id": slot_id,
        "member_id": member["member_id"],
        "mentor_id": slot["mentor_id"],
        "status": status,
        "booked_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.mentorship_bookings.insert_one(booking)
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "member_id": slot["mentor_id"],
        "type": "mentorship_booking",
        "title": "New Booking",
        "message": f"{member.get('first_name', '')} {member.get('last_name', '')} booked your {slot.get('session_type', 'session')} on {slot.get('date', '')}.",
        "link": "/my-account/mentorship-calendar",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "member_id": member["member_id"],
        "type": "mentorship_confirmed" if status == "booked" else "mentorship_waitlist",
        "title": "Booking Confirmed" if status == "booked" else "Waiting List",
        "message": f"Your mentorship session on {slot.get('date', '')} has been {'confirmed' if status == 'booked' else 'added to the waiting list'}.",
        "link": "/my-account/my-bookings",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"success": True, "status": status}


@router.post("/member/mentorship/cancel/{slot_id}")
async def member_cancel_booking(slot_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    booking = await db.mentorship_bookings.find_one({"slot_id": slot_id, "member_id": member["member_id"]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    was_booked = booking.get("status") == "booked"
    await db.mentorship_bookings.delete_one({"slot_id": slot_id, "member_id": member["member_id"]})
    if was_booked:
        slot = await db.mentorship_slots.find_one({"id": slot_id}, {"_id": 0})
        await notify_waitlist_spot_open(db.mentorship_bookings, slot_id, "slot_id", f"Mentorship on {slot.get('date', '')}", "/my-account/mentor-calendar")
    return {"success": True}


@router.get("/member/my-bookings")
async def member_my_bookings(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    bookings = await db.mentorship_bookings.find({"member_id": member["member_id"]}, {"_id": 0}).sort("booked_at", -1).to_list(200)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for b in bookings:
        slot = await db.mentorship_slots.find_one({"id": b["slot_id"]}, {"_id": 0})
        if slot:
            b["date"] = slot.get("date", "")
            b["start_time"] = slot.get("start_time", "")
            b["end_time"] = slot.get("end_time", "")
            b["session_type"] = slot.get("session_type", "")
            b["virtual_link"] = slot.get("virtual_link", "")
            mentor = await db.members.find_one({"member_id": slot["mentor_id"]}, {"_id": 0, "password_hash": 0})
            b["mentor_name"] = f"{mentor.get('first_name', '')} {mentor.get('last_name', '')}".strip() if mentor else ""
            if slot.get("status") == "cancelled":
                b["display_status"] = "cancelled"
            elif b["date"] < today and b["status"] == "booked":
                b["display_status"] = "completed"
            elif b["status"] == "booked":
                b["display_status"] = "upcoming"
            else:
                b["display_status"] = b["status"]
    return bookings
