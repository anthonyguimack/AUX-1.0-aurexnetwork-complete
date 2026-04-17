from fastapi import APIRouter, HTTPException, Request, Depends
from models.database import db, require_admin, send_email_smtp, logger
from datetime import datetime, timezone
import uuid

router = APIRouter()


# ── Helper: notify all waitlisted members that a spot opened ──
async def notify_waitlist_spot_open(collection, item_id, item_id_field, title, link="/my-account/global-calendar"):
    """Notify ALL waitlisted members that a spot opened (they keep their waitlist status and can book)."""
    waitlisted = await collection.find({item_id_field: item_id, "status": "waitlist"}, {"_id": 0}).to_list(500)
    for w in waitlisted:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "member_id": w["member_id"],
            "type": "spot_available",
            "title": "Spot Available!",
            "message": f"A spot opened up for \"{title}\". Visit the calendar to register before it fills up!",
            "link": link,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


async def notify_cancellation(collection, item_id, item_id_field, title, cancel_type="event"):
    """Notify all registered + waitlisted members that event/slot was cancelled."""
    regs = await collection.find({item_id_field: item_id}, {"_id": 0}).to_list(1000)
    for r in regs:
        cancelled_by = "the mentor" if cancel_type == "slot" else "the administrator"
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "member_id": r["member_id"],
            "type": f"{cancel_type}_cancelled_by_admin",
            "title": f"{cancel_type.capitalize()} Cancelled",
            "message": f"\"{title}\" has been cancelled by {cancelled_by}.",
            "link": "/my-account/global-calendar" if cancel_type == "event" else "/my-account/my-bookings",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


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
    body.setdefault("map_url", "")
    body.setdefault("virtual_link", "")
    body.setdefault("description", "")
    body.setdefault("attachments", [])
    body.setdefault("member_uploads", [])
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
    old_event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    body.pop("id", None)
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    # If status changed to cancelled, notify all registrants
    if old_event and old_event.get("status") != "cancelled" and body.get("status") == "cancelled":
        await notify_cancellation(db.event_registrations, event_id, "event_id", old_event.get("title", ""), "event")
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


@router.post("/admin/calendar/events/{event_id}/clone")
async def admin_clone_event(event_id: str, user: dict = Depends(require_admin)):
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    clone = {k: v for k, v in event.items()}
    clone["id"] = str(uuid.uuid4())
    clone["title"] = f"{event.get('title', '')} (Copy)"
    clone["status"] = "inactive"
    clone["created_at"] = datetime.now(timezone.utc).isoformat()
    clone.pop("updated_at", None)
    clone.pop("member_uploads", None)
    await db.calendar_events.insert_one(clone)
    result = await db.calendar_events.find_one({"id": clone["id"]}, {"_id": 0})
    result["registered_count"] = 0
    result["waitlist_count"] = 0
    return result


@router.get("/admin/calendar/events/{event_id}/registrations")
async def admin_event_registrations(event_id: str, user: dict = Depends(require_admin)):
    regs = await db.event_registrations.find({"event_id": event_id}, {"_id": 0}).sort("registered_at", 1).to_list(1000)
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
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    event_title = event.get("title", "Event") if event else "Event"
    event_date = event.get("date", "") if event else ""
    regs = await db.event_registrations.find({"event_id": event_id}, {"_id": 0}).sort("registered_at", 1).to_list(1000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([f"Event: {event_title}", f"Date: {event_date}"])
    writer.writerow(["#", "Membership ID", "Name", "Email", "Registered At", "Status"])
    for i, r in enumerate(regs, 1):
        member = await db.members.find_one({"member_id": r["member_id"]}, {"_id": 0, "password_hash": 0})
        name = f"{member.get('first_name', '')} {member.get('last_name', '')}".strip() if member else ""
        writer.writerow([i, member.get("membership_id", "") if member else "", name, member.get("email", "") if member else "", r.get("registered_at", ""), r.get("status", "")])
    output.seek(0)
    safe_title = event_title.replace(" ", "_").replace("/", "-")[:50]
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={safe_title}_{event_date}_registrations.csv"})


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
    body.setdefault("virtual_link", "")
    body.setdefault("attachments", [])
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

@router.get("/member/calendar/events")
async def member_list_events(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    # Only show active events (cancelled events hidden from members)
    events = await db.calendar_events.find({"status": {"$in": ["active"]}}, {"_id": 0}).sort("date", 1).to_list(500)
    member_id = member["member_id"]
    for e in events:
        e["registered_count"] = await db.event_registrations.count_documents({"event_id": e["id"], "status": "registered"})
        e["waitlist_count"] = await db.event_registrations.count_documents({"event_id": e["id"], "status": "waitlist"})
        my_reg = await db.event_registrations.find_one({"event_id": e["id"], "member_id": member_id}, {"_id": 0})
        e["my_status"] = my_reg["status"] if my_reg else None
    return events


@router.get("/member/calendar/events/{event_id}")
async def member_get_event(event_id: str, request: Request):
    """Get single event detail for the detail page."""
    from routes.membership import get_current_member
    member = await get_current_member(request)
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event["registered_count"] = await db.event_registrations.count_documents({"event_id": event_id, "status": "registered"})
    event["waitlist_count"] = await db.event_registrations.count_documents({"event_id": event_id, "status": "waitlist"})
    my_reg = await db.event_registrations.find_one({"event_id": event_id, "member_id": member["member_id"]}, {"_id": 0})
    event["my_status"] = my_reg["status"] if my_reg else None
    return event


@router.post("/member/calendar/events/{event_id}/register")
async def member_register_event(event_id: str, request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("status") != "active":
        raise HTTPException(status_code=400, detail="Event is not active")
    existing = await db.event_registrations.find_one({"event_id": event_id, "member_id": member["member_id"]})
    if existing and existing.get("status") == "registered":
        raise HTTPException(status_code=400, detail="Already registered for this event")
    registered_count = await db.event_registrations.count_documents({"event_id": event_id, "status": "registered"})
    max_cap = event.get("max_capacity", 50)
    # Waitlisted member upgrading to registered
    if existing and existing.get("status") == "waitlist" and registered_count < max_cap:
        await db.event_registrations.update_one({"event_id": event_id, "member_id": member["member_id"]}, {"$set": {"status": "registered", "registered_at": datetime.now(timezone.utc).isoformat()}})
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "member_id": member["member_id"], "type": "event_registration",
            "title": "Registration Confirmed", "message": f"You are now registered for \"{event.get('title', '')}\".",
            "link": "/my-account/global-calendar", "read": False, "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"success": True, "status": "registered"}
    if existing:
        raise HTTPException(status_code=400, detail="Already on the waiting list")
    status = "registered" if registered_count < max_cap else "waitlist"
    reg = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "member_id": member["member_id"],
        "status": status,
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.event_registrations.insert_one(reg)
    msg = f"You have been {'registered for' if status == 'registered' else 'added to the waiting list for'} \"{event.get('title', '')}\"."
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "member_id": member["member_id"],
        "type": "event_registration",
        "title": "Event Registration" if status == "registered" else "Waiting List",
        "message": msg,
        "link": "/my-account/global-calendar",
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
    # If was registered, notify all waitlisted members (they must self-register)
    if was_registered:
        event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
        await notify_waitlist_spot_open(db.event_registrations, event_id, "event_id", event.get("title", ""), "/my-account/global-calendar")
    # Notification for the member who cancelled
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


@router.post("/member/calendar/events/{event_id}/upload")
async def member_upload_event_file(event_id: str, request: Request):
    """Members can upload files to events they are registered for."""
    from routes.membership import get_current_member
    member = await get_current_member(request)
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    body = await request.json()
    upload = {
        "id": str(uuid.uuid4()),
        "member_id": member["member_id"],
        "member_name": f"{member.get('first_name', '')} {member.get('last_name', '')}".strip(),
        "membership_id": member.get("membership_id", ""),
        "url": body.get("url", ""),
        "name": body.get("name", ""),
        "size": body.get("size", 0),
        "content_type": body.get("content_type", ""),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.calendar_events.update_one({"id": event_id}, {"$push": {"member_uploads": upload}})
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
        # Include participant list for mentor view
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
    body["id"] = str(uuid.uuid4())
    body["mentor_id"] = member["member_id"]
    body.setdefault("status", "active")
    body.setdefault("max_students", 1)
    body.setdefault("session_type", "One-on-One")
    body.setdefault("description", "")
    body.setdefault("virtual_link", "")
    body.setdefault("attachments", [])
    body["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.mentorship_slots.insert_one(body)
    result = await db.mentorship_slots.find_one({"id": body["id"]}, {"_id": 0})
    result["booked_count"] = 0
    result["waitlist_count"] = 0
    result["participants"] = []
    return result


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
    # If status changed to cancelled, notify booked members
    if old_slot and old_slot.get("status") != "cancelled" and body.get("status") == "cancelled":
        await notify_cancellation(db.mentorship_bookings, slot_id, "slot_id", f"Mentorship on {old_slot.get('date', '')}", "slot")
    result = await db.mentorship_slots.update_one({"id": slot_id, "mentor_id": member["member_id"]}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    updated = await db.mentorship_slots.find_one({"id": slot_id}, {"_id": 0})
    updated["booked_count"] = await db.mentorship_bookings.count_documents({"slot_id": slot_id, "status": {"$in": ["booked", "completed"]}})
    updated["waitlist_count"] = await db.mentorship_bookings.count_documents({"slot_id": slot_id, "status": "waitlist"})
    # Re-fetch participants
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


@router.get("/member/mentor-calendar")
async def member_view_mentor_calendar(request: Request):
    from routes.membership import get_current_member
    member = await get_current_member(request)
    mentor_id = member.get("mentor_id")
    if not mentor_id:
        return {"slots": [], "mentor": None}
    # Only show active slots (cancelled/inactive hidden)
    slots = await db.mentorship_slots.find({"mentor_id": mentor_id, "status": "active"}, {"_id": 0}).sort("date", 1).to_list(500)
    for s in slots:
        s["booked_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": {"$in": ["booked", "completed"]}})
        s["waitlist_count"] = await db.mentorship_bookings.count_documents({"slot_id": s["id"], "status": "waitlist"})
        my_booking = await db.mentorship_bookings.find_one({"slot_id": s["id"], "member_id": member["member_id"]}, {"_id": 0})
        s["my_status"] = my_booking["status"] if my_booking else None
        # Virtual link only visible to booked members
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
        # No spots, add to waitlist
        if existing:
            raise HTTPException(status_code=400, detail="Already on the waiting list")
        status = "waitlist"
    elif existing and existing.get("status") == "waitlist" and booked_count < max_students:
        # Upgrade from waitlist to booked
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
    # If was booked, notify all waitlisted (they must self-register)
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
            # Compute display status
            if slot.get("status") == "cancelled":
                b["display_status"] = "cancelled"
            elif b["date"] < today and b["status"] == "booked":
                b["display_status"] = "completed"
            elif b["status"] == "booked":
                b["display_status"] = "upcoming"
            else:
                b["display_status"] = b["status"]
    return bookings
