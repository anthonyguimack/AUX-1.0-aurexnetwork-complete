from fastapi import APIRouter, HTTPException, Request, Depends
from models.database import db, require_admin, send_email_smtp, logger
from datetime import datetime, timezone
import uuid

router = APIRouter()


# ── Admin: Global Events CRUD ──

@router.get("/admin/calendar/events")
async def admin_list_events(user: dict = Depends(require_admin)):
    events = await db.calendar_events.find({}, {"_id": 0}).sort("date", -1).to_list(500)
    for e in events:
        e["registered_count"] = await db.event_registrations.count_documents({"event_id": e["id"], "status": "registered"})
        e["waitlist_count"] = await db.event_registrations.count_documents({"event_id": e["id"], "status": "waitlist"})
    return events


@router.post("/admin/calendar/events")
async def admin_create_event(request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body["id"] = str(uuid.uuid4())
    body.setdefault("status", "active")
    body.setdefault("max_capacity", 50)
    body.setdefault("image", "")
    body.setdefault("location", "")
    body.setdefault("description", "")
    body["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.calendar_events.insert_one(body)
    result = await db.calendar_events.find_one({"id": body["id"]}, {"_id": 0})
    result["registered_count"] = 0
    result["waitlist_count"] = 0
    return result


@router.get("/admin/calendar/events/{event_id}")
async def admin_get_event(event_id: str, user: dict = Depends(require_admin)):
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event["registered_count"] = await db.event_registrations.count_documents({"event_id": event_id, "status": "registered"})
    return event


@router.put("/admin/calendar/events/{event_id}")
async def admin_update_event(event_id: str, request: Request, user: dict = Depends(require_admin)):
    body = await request.json()
    body.pop("id", None)
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.calendar_events.update_one({"id": event_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    event["registered_count"] = await db.event_registrations.count_documents({"event_id": event_id, "status": "registered"})
    return event


@router.delete("/admin/calendar/events/{event_id}")
async def admin_delete_event(event_id: str, user: dict = Depends(require_admin)):
    await db.calendar_events.delete_one({"id": event_id})
    await db.event_registrations.delete_many({"event_id": event_id})
    return {"success": True}


@router.get("/admin/calendar/events/{event_id}/registrations")
async def admin_event_registrations(event_id: str, user: dict = Depends(require_admin)):
    regs = await db.event_registrations.find({"event_id": event_id}, {"_id": 0}).sort("registered_at", 1).to_list(1000)
    # Enrich with member data
    for r in regs:
        member = await db.members.find_one({"member_id": r["member_id"]}, {"_id": 0, "password_hash": 0})
        if member:
            r["membership_id"] = member.get("membership_id", "")
            r["name"] = f"{member.get('first_name', '')} {member.get('last_name', '')}".strip()
            r["email"] = member.get("email", "")
    return regs


@router.get("/admin/calendar/events/{event_id}/registrations/csv")
async def admin_event_registrations_csv(event_id: str, user: dict = Depends(require_admin)):
    from fastapi.responses import StreamingResponse
    import io
    import csv
    regs = await db.event_registrations.find({"event_id": event_id}, {"_id": 0}).sort("registered_at", 1).to_list(1000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Membership ID", "Name", "Email", "Registered At", "Status"])
    for i, r in enumerate(regs, 1):
        member = await db.members.find_one({"member_id": r["member_id"]}, {"_id": 0, "password_hash": 0})
        name = f"{member.get('first_name', '')} {member.get('last_name', '')}".strip() if member else ""
        writer.writerow([i, member.get("membership_id", "") if member else "", name, member.get("email", "") if member else "", r.get("registered_at", ""), r.get("status", "")])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=event_{event_id}_registrations.csv"})


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
    body["id"] = str(uuid.uuid4())
    body.setdefault("status", "active")
    body.setdefault("max_students", 1)
    body.setdefault("session_type", "One-on-One")
    body.setdefault("description", "")
    if not body.get("mentor_id"):
        raise HTTPException(status_code=400, detail="mentor_id is required")
    body["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.mentorship_slots.insert_one(body)
    result = await db.mentorship_slots.find_one({"id": body["id"]}, {"_id": 0})
    result["booked_count"] = 0
    result["waitlist_count"] = 0
    mentor = await db.members.find_one({"member_id": body["mentor_id"]}, {"_id": 0, "password_hash": 0})
    result["mentor_name"] = f"{mentor.get('first_name', '')} {mentor.get('last_name', '')}".strip() if mentor else ""
    result["mentor_membership_id"] = mentor.get("membership_id", "") if mentor else ""
    return result


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



# ── Public: Member Event Access ──

def get_current_member_dep():
    from routes.membership import get_current_member
    return Depends(get_current_member)


@router.get("/member/calendar/events")
async def member_list_events(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    events = await db.calendar_events.find({"status": {"$in": ["active", "cancelled"]}}, {"_id": 0}).sort("date", 1).to_list(500)
    member_id = member["member_id"]
    for e in events:
        e["registered_count"] = await db.event_registrations.count_documents({"event_id": e["id"], "status": "registered"})
        e["waitlist_count"] = await db.event_registrations.count_documents({"event_id": e["id"], "status": "waitlist"})
        my_reg = await db.event_registrations.find_one({"event_id": e["id"], "member_id": member_id}, {"_id": 0})
        e["my_status"] = my_reg["status"] if my_reg else None
    return events


@router.post("/member/calendar/events/{event_id}/register")
async def member_register_event(event_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Event has been cancelled")
    existing = await db.event_registrations.find_one({"event_id": event_id, "member_id": member["member_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    registered_count = await db.event_registrations.count_documents({"event_id": event_id, "status": "registered"})
    max_cap = event.get("max_capacity", 50)
    status = "registered" if registered_count < max_cap else "waitlist"
    reg = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "member_id": member["member_id"],
        "status": status,
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.event_registrations.insert_one(reg)
    # Create notification
    msg = f"You have been {'registered for' if status == 'registered' else 'added to the waiting list for'} \"{event.get('title', '')}\"."
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "member_id": member["member_id"],
        "type": "event_registration",
        "title": "Event Registration" if status == "registered" else "Waiting List",
        "message": msg,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"success": True, "status": status}


@router.post("/member/calendar/events/{event_id}/cancel")
async def member_cancel_event(event_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    reg = await db.event_registrations.find_one({"event_id": event_id, "member_id": member["member_id"]})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    was_registered = reg.get("status") == "registered"
    await db.event_registrations.delete_one({"event_id": event_id, "member_id": member["member_id"]})
    # If was registered, check waitlist and promote first waitlisted member
    if was_registered:
        event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
        waitlisted = await db.event_registrations.find_one({"event_id": event_id, "status": "waitlist"}, sort=[("registered_at", 1)])
        if waitlisted:
            await db.event_registrations.update_one({"id": waitlisted["id"]}, {"$set": {"status": "registered"}})
            # Notify the promoted member
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "member_id": waitlisted["member_id"],
                "type": "event_spot_available",
                "title": "Spot Available!",
                "message": f"A spot opened up for \"{event.get('title', '')}\"! You have been moved from the waiting list to registered.",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    # Notification for cancellation
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "member_id": member["member_id"],
        "type": "event_cancellation",
        "title": "Registration Cancelled",
        "message": f"Your registration for \"{event.get('title', '')}\" has been cancelled.",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"success": True}


# ── Notifications ──

@router.get("/member/notifications")
async def member_notifications(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    notifs = await db.notifications.find({"member_id": member["member_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifs


@router.get("/member/notifications/unread-count")
async def member_unread_count(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    count = await db.notifications.count_documents({"member_id": member["member_id"], "read": False})
    return {"count": count}


@router.put("/member/notifications/{notif_id}/read")
async def member_mark_read(notif_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    await db.notifications.update_one({"id": notif_id, "member_id": member["member_id"]}, {"$set": {"read": True}})
    return {"success": True}


@router.put("/member/notifications/read-all")
async def member_mark_all_read(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    await db.notifications.update_many({"member_id": member["member_id"], "read": False}, {"$set": {"read": True}})
    return {"success": True}


# ── Mentoring Calendar ──

@router.get("/member/mentorship/slots")
async def mentor_list_slots(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    slots = await db.mentorship_slots.find({"mentor_id": member["member_id"]}, {"_id": 0}).sort("date", 1).to_list(500)
    for s in slots:
        s["booked_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": {"$in": ["booked", "completed"]}})
        s["waitlist_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": "waitlist"})
    return slots


@router.post("/member/mentorship/slots")
async def mentor_create_slot(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    body = await request.json()
    body["id"] = str(uuid.uuid4())
    body["mentor_id"] = member["member_id"]
    body.setdefault("status", "active")
    body.setdefault("max_students", 1)
    body.setdefault("session_type", "one-on-one")
    body.setdefault("description", "")
    body["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.mentorship_slots.insert_one(body)
    result = await db.mentorship_slots.find_one({"id": body["id"]}, {"_id": 0})
    result["booked_count"] = 0
    result["waitlist_count"] = 0
    return result


@router.put("/member/mentorship/slots/{slot_id}")
async def mentor_update_slot(slot_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    body = await request.json()
    body.pop("id", None)
    body.pop("_id", None)
    body.pop("mentor_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.mentorship_slots.update_one({"id": slot_id, "mentor_id": member["member_id"]}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    return await db.mentorship_slots.find_one({"id": slot_id}, {"_id": 0})


@router.delete("/member/mentorship/slots/{slot_id}")
async def mentor_delete_slot(slot_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    await db.mentorship_slots.delete_one({"id": slot_id, "mentor_id": member["member_id"]})
    await db.mentorship_bookings.delete_many({"slot_id": slot_id})
    return {"success": True}


@router.get("/member/mentor-calendar")
async def member_view_mentor_calendar(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    mentor_id = member.get("mentor_id")
    if not mentor_id:
        return []
    slots = await db.mentorship_slots.find({"mentor_id": mentor_id, "status": {"$in": ["active", "inactive"]}}, {"_id": 0}).sort("date", 1).to_list(500)
    for s in slots:
        s["booked_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": {"$in": ["booked", "completed"]}})
        s["waitlist_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": "waitlist"})
        my_booking = await db.mentorship_bookings.find_one({"slot_id": s["id"], "member_id": member["member_id"]}, {"_id": 0})
        s["my_status"] = my_booking["status"] if my_booking else None
    # Include mentor info
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
    if existing:
        raise HTTPException(status_code=400, detail="Already booked this slot")
    booked_count = await db.mentorship_bookings.count_documents({"slot_id": slot_id, "status": {"$in": ["booked", "completed"]}})
    max_students = slot.get("max_students", 1)
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
    # Notify mentor
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "member_id": slot["mentor_id"],
        "type": "mentorship_booking",
        "title": "New Booking",
        "message": f"{member.get('first_name', '')} {member.get('last_name', '')} booked your {slot.get('session_type', 'session')} on {slot.get('date', '')}.",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Notify member
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "member_id": member["member_id"],
        "type": "mentorship_confirmed" if status == "booked" else "mentorship_waitlist",
        "title": "Booking Confirmed" if status == "booked" else "Waiting List",
        "message": f"Your mentorship session on {slot.get('date', '')} has been {'confirmed' if status == 'booked' else 'added to the waiting list'}.",
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
    # Promote waitlisted member if applicable
    if was_booked:
        slot = await db.mentorship_slots.find_one({"id": slot_id}, {"_id": 0})
        waitlisted = await db.mentorship_bookings.find_one({"slot_id": slot_id, "status": "waitlist"}, sort=[("booked_at", 1)])
        if waitlisted:
            await db.mentorship_bookings.update_one({"id": waitlisted["id"]}, {"$set": {"status": "booked"}})
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "member_id": waitlisted["member_id"],
                "type": "mentorship_spot_available",
                "title": "Spot Available!",
                "message": f"A mentorship slot on {slot.get('date', '')} is now available. You've been moved from the waiting list.",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    return {"success": True}


@router.get("/member/my-bookings")
async def member_my_bookings(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    bookings = await db.mentorship_bookings.find({"member_id": member["member_id"]}, {"_id": 0}).sort("booked_at", -1).to_list(200)
    for b in bookings:
        slot = await db.mentorship_slots.find_one({"id": b["slot_id"]}, {"_id": 0})
        if slot:
            b["date"] = slot.get("date", "")
            b["start_time"] = slot.get("start_time", "")
            b["end_time"] = slot.get("end_time", "")
            b["session_type"] = slot.get("session_type", "")
            mentor = await db.members.find_one({"member_id": slot["mentor_id"]}, {"_id": 0, "password_hash": 0})
            b["mentor_name"] = f"{mentor.get('first_name', '')} {mentor.get('last_name', '')}".strip() if mentor else ""
    return bookings
