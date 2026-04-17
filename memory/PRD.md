# Consultant CMS - Product Requirements Document

## Original Problem Statement
Multi-page consultant website with CMS admin panel, Stripe payments, Theme Engine, Visual Page Builder, Maps management, and Landing Page.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, react-leaflet, react-leaflet-cluster, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic, APIRouter
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## What's Been Implemented

### Core (Phase 1-2)
Full public website, admin CMS, Visual Page Builder (16 content blocks), Theme Engine, Dynamic Pages, SMTP config, External Blog API, Backup/Restore, Gallery, Portfolio, Maps (3 types + clustering), Reading List, Blog Categories CRUD

### Landing Page Module (Apr 9, 2026)
**5-Section Layout:**
1. **Header/Nav** — Fixed, logo left + 4 nav links right, mobile hamburger
2. **Hero** — 2-column: Left (title, countdown, subtitle, description, multi-buttons), Right (video/photo embed). Background overlay toggle.
3. **Get in Touch** — 2-column: Left (image), Right (form: Name/Email/Subject/Message). Saves to `landing_contacts`.
4. **Waiting List** — White bg, centered form (Name/Last Name/Email). Saves to `landing_subscribers`.
5. **Footer** — 2-column: Left (logo+desc), Right (social icons), Copyright center.

**Hero Carousel (Apr 9, 2026):**
- Multi-slide carousel with auto-advance (configurable delay per slide, default 9.4s)
- Prev/Next arrow navigation (glassmorphism buttons)
- Dot indicators with active state highlighting

### Map Improvements (Apr 8, 2026)
MapBlock crash fix, Maps "Open in new tab" fix, Global Maps Language (11 languages), Interactive Map Picker, Tile provider integration

### Membership Enrollment Module (Apr 10, 2026)
**4-Step Wizard at `/membership-enrollment`:**
1. **Step 1 — Invitation CODE**: Invite code validation + email/name/password
2. **Step 2 — Clarity Statement and Interview**: 37 fields (personal, financial, ratings, geo cascading selects)
3. **Step 3 — Application Enrollment**: 3 legal agreements + digital signature
4. **Step 4 — Confirm & Submit**: CMS-managed title + description + Submit button

**Features:**
- Dynamic form fields stored in `enrollment_fields` collection (49 seeded defaults)
- Admin CMS: Full CRUD for fields, grouped by step, with drag-and-drop sorting
- 20 field types: text, email, password, number, currency, date, datetime, select, radio, checkbox, textarea, richtext, rating, rating_table, legal_checkbox, signature_text, signature_date, country, state, city
- Step 4 Content CMS: Dedicated tab with Title + Rich Text Description
- CMS-configurable colors (`--me-*` CSS variables)
- On submit: creates member with Level 1, auto-login, redirect to /my-account

### UI & CMS Refinements (Apr 11, 2026)
- Enrollment form buttons (Save/Continue/Submit) right-aligned
- Step 4 Content management via CMS tab (Title + Description)
- Fixed Step 4 text duplication (removed legacy richtext field rendering)
- Send Invitation modal colors now use CMS `--ma-*` CSS variables

### QR Code System (Apr 11, 2026)
- CMS Members Manager: "Create QR Code" (Yes/No) permission in Membership tab
- My Account Invite Code: Business QR section (conditional on permission)
- QR encodes `/my-account/register?sponsor={membership_number}`
- Download, View Full, Regenerate actions

### Documentation (Apr 11, 2026)
- Admin Documentation page (`/admin/documentation`) with 4 downloadable documents:
  1. Use Case & Flow Diagram (SVG-based, all actors + registration paths)
  2. Technical Documentation (architecture, DB, APIs, auth, CSS vars)
  3. Operator Manual (CMS step-by-step guide)
  4. User Guide (My Account member manual)
- All docs have "Save as PDF" browser print functionality

### Geo Data (Apr 10, 2026)
- 249 countries, 5046 states/subdivisions, 32,423 cities
- CMS admin geo management at /admin/geo

## Key Files
- `/app/frontend/src/pages/MembershipEnrollment.js` — 4-step enrollment wizard
- `/app/frontend/src/pages/admin/EnrollmentFieldsManager.js` — CMS form fields + Step 4 content
- `/app/frontend/src/pages/admin/MembersManager.js` — Members with QR permission
- `/app/frontend/src/pages/myaccount/InviteCode.js` — Invite codes + Business QR
- `/app/frontend/src/pages/admin/DocumentationManager.js` — Docs page
- `/app/backend/routes/enrollment.py` — Enrollment + content APIs
- `/app/backend/routes/membership.py` — Members, QR, invite codes
- `/app/backend/routes/docs.py` — Documentation HTML endpoints

### Dashboard & Analytics Improvements (Apr 13, 2026)
- Dashboard: Added "Members" card (first in grid) showing total member count with Users icon, linking to /admin/members
- Analytics: Fixed "Users" label to "Members", now counts from `db.members` (was incorrectly using `db.users`)
- Analytics: Added "Registered Members" monthly bar chart showing new registrations per month
- Analytics: Added "Logged-In Members" monthly bar chart tracking member logins
- Member login now records `last_login` timestamp for analytics tracking
- Step 4 enrollment: Fixed text overflow by removing `prose` class and adding `overflow-wrap: break-word`

### My Account Quick Links (Apr 13, 2026)
- Quick Links bar in My Account top header (right-aligned, same row as logo)
- Links separated by dividers, external links show ↗ icon, active link highlighted
- Breadcrumb remains visible below the quick links bar
- CMS admin page `/admin/quick-links` with full CRUD, drag-and-drop reorder, toggle active/inactive, new tab toggle
- Backend: `myaccount_links` collection with CRUD + reorder endpoints

### Members Manager & Analytics Fixes (Apr 13, 2026)
- Added "Register" column to Members Manager table showing member registration date
- Fixed Logged-In Members chart: now tracks each login event in `member_logins` collection (was only tracking `last_login` overwrite)
- Analytics counts unique member_ids per month via MongoDB aggregation

### Calendar System (Apr 14, 2026)
- Backend: Full Global Events CRUD, member registration with capacity/waitlist, auto-promotion on cancel
- Backend: Notifications system with unread count, Mentoring slots CRUD, booking with waitlist
- CMS: Global Events Manager at `/admin/calendar/global` with event table, registration viewer, CSV export
- CMS: Mentorship Schedule Manager at `/admin/calendar/mentorship` with slot table, mentor selector, bookings viewer
- My Account: Events Calendar (`/my-account/global-calendar`) — Month grid + List view with event cards
- My Account: Mentorship Calendar (`/my-account/mentorship-calendar`) — Mentor slot management with color-coded calendar
- My Account: Mentor Calendar View (`/my-account/mentor-calendar`) — Member booking with confirmation dialog
- My Account: My Reservations (`/my-account/my-bookings`) — Booking history with cancel
- Notification Bell in header with unread badge, dropdown, mark-all-read, 30s auto-refresh

### Event File Attachments (Apr 15, 2026)
- New `/api/upload-file` endpoint: accepts PDF, PPT, DOC, XLS, CSV, TXT, ZIP, images (max 25MB)
- Events store `attachments[]` array with url, name, size, content_type per file
- CMS: File upload section in event editor (add multiple files, remove individual files)
- CMS: Files column in events table showing attachment count
- My Account: Event cards show downloadable file links with paperclip icon

### Calendar Major Overhaul (Apr 16, 2026)
- Clone Event: Duplicate events with "(Copy)" suffix and inactive status for admin
- CSV Export: Fixed auth-token download using blob response
- Event fields: Split into Address, Map URL, Virtual Link (3 separate fields)
- Past events: Gray on calendar, no action buttons, Virtual Link removed
- Active events: Green on calendar
- Cancelled events: Hidden from member calendar, all registrants notified
- Waitlist: Changed from auto-promote to notify-all-and-remove (members self-register)
- Event Detail page: `/my-account/event/:eventId` with full description, attachments, links
- "Read more" link on event cards
- Renamed "Events Calendar" → "{AUX Prefix} Calendar"
- Mentorship slots: virtual_link, attachments, time dropdowns, One-on-One defaults max=1
- Mentor slot card: Shows participants list (booked + waitlisted)
- Past slots: Gray, view-only (no edit/delete)
- Cancelled slots: Hidden from member calendars, notifications sent
- Mentor Calendar (member view): Month + List views
- My Reservations: Status logic (Upcoming/Completed/Cancelled), Virtual Link column
- CMS Mentorship Schedule: Calendar view alongside list view, time dropdowns

### Calendar Refinements (Apr 16, 2026)
- Member file upload endpoint `/api/member/upload-file` (PDF, PPT, DOC, etc. up to 25MB)
- Title field for mentorship slots (CMS + My Calendar)
- Mentor Calendar moved into Mentorship Profile page (sidebar item removed)
- CMS Global Events + Mentorship Schedule: Calendar views alongside list
- CSV export includes event title and date
- Waitlist: members kept in DB (not deleted) when spots open — notified to self-register
- Cancellation notifications use "mentor" for slots, "administrator" for events
- Virtual link only visible to booked members
- Event detail page rich text rendering fixed (no horizontal scrollbar)
- AUX Calendar enabled in sidebar

### Calendar Fixes — Iteration 56 (Apr 17, 2026)
- Time picker: CMS Mentorship Schedule + My Calendar changed from `<select>` to `<input type="time">` matching Global Events format
- CMS calendar colors: Gray for past/cancelled, Green for upcoming (both Global Events + Mentorship Schedule)
- CMS Mentorship Schedule calendar: Shows slot title (not just mentor name)
- Waitlist-to-booked upgrade: Members on waitlist can now "Book this slot" when spots open (status upgraded from waitlist to booked/registered)
- Event detail: Breadcrumb shows "AUX Calendar", sidebar highlights AUX Calendar item
- Same fix applied to event registration (waitlist → registered upgrade)

### UI Polish — Iteration 57 (Apr 17, 2026)
- Native `<input type="date">` / `<input type="time">` icons now visible on dark My Account & member login/register pages (filter-inverted, hover brightens, cursor pointer)
- Color-scheme set to dark for member inputs so Firefox picker arrow follows text color
- Global rule enforces `--ma-input-border` on every `input`/`select`/`textarea` inside `[data-testid="myaccount-layout"]` — no more drift from hard-coded `border-white/10` on pages like Membership Profile → General Info → Edit
- Mentor Slot `description` field upgraded from `<textarea>` to `RichTextEditor` (ReactQuill) in both CMS (`MentorshipScheduleManager`) and My Account (`MentorshipCalendar`) — new `.ma-quill-dark` class themes the editor for dark backgrounds
- Slot detail display renders rich HTML via `dangerouslySetInnerHTML` + `rich-text-content`; calendar card previews use `stripHtml` helper to avoid tag bleed-through

### Refactor + Mentor Slot Templates — Iteration 58 (Apr 17, 2026)
- Split `/app/backend/routes/calendar.py` (620 lines) into three focused modules:
  - `calendar_helpers.py` — shared notification helpers (`notify_waitlist_spot_open`, `notify_cancellation`)
  - `calendar_events.py` — global events admin CRUD, member registration, notifications
  - `mentor_slots.py` — admin/mentor slot CRUD, bookings, waitlist, mentor-calendar, slot templates
  - `server.py` updated to mount both new routers; old `calendar.py` deleted
- Extracted shared `<CalendarGrid>` component at `/app/frontend/src/components/CalendarGrid.js` — renders month navigation + 7-column day grid. `GlobalCalendar.js` and `MentorCalendarView.js` both now use it (60+ lines of duplicated grid logic removed from each)
- **Feature: Mentor Slot Templates**
  - New collection `mentor_slot_templates` with fields: `name`, `title`, `session_type`, `max_students`, `default_duration_minutes`, `description` (rich HTML), `virtual_link`
  - Admin endpoints: GET/POST/PUT/DELETE `/api/admin/mentor-slot-templates`
  - Member endpoint: GET `/api/member/mentor-slot-templates` (returns `[]` when `mentor_slot_templates_enabled` setting is off — server-side gated)
  - New CMS page `/app/frontend/src/pages/admin/MentorSlotTemplatesManager.js` at route `/admin/calendar/mentor-slot-templates` with full CRUD + RichTextEditor
  - New sidebar item **Calendar → Mentor Slot Templates** in `AdminLayout.js`
  - New **Settings → General → Mentor Slot Templates** toggle (`mentor_slot_templates_enabled` on/off switch)
  - **Apply Template dropdown** added to slot editor in both `MentorshipScheduleManager.js` (admin, gated by `templatesEnabled`) and `MentorshipCalendar.js` (member, server gates via empty list). Selecting a template pre-fills title, session_type, max_students, description (rich HTML), virtual_link, and auto-computes end_time from start_time + default_duration_minutes

### Weekly Recurrence Engine — Iteration 59 (Apr 17, 2026)
- Backend: `POST /api/admin/mentorship/slots` and `POST /api/member/mentorship/slots` now accept an optional `recurrence: { enabled, days_of_week, weeks }` payload. A new `_expand_recurrence(base_date, days_of_week, weeks)` helper in `mentor_slots.py` anchors on the Sunday-on-or-before the start date, iterates week-by-week, deduplicates, and caps at 104 slots (2 years). JS `Date.getDay()` convention (0=Sun..6=Sat). Returns `{created: [...], count: N}` when multiple slots are produced; single-slot response unchanged.
- Frontend: new shared `<SlotRecurrencePicker>` at `/app/frontend/src/components/SlotRecurrencePicker.js` with checkbox + 7 day chips + weeks input + live date-range preview. Adapts to dark (member) vs light (admin) themes. Integrated into both `MentorshipCalendar.js` and `MentorshipScheduleManager.js` beneath the Virtual Link field; shows only when creating (not editing) a slot.
- Toast upgraded: multi-slot creation shows `"Created N slots"`.
- Verified via curl: 4 weeks × [Mon, Wed] starting 2026-04-20 produced 8 correct dates (2026-04-20, 04-22, 04-27, 04-29, 05-04, 05-06, 05-11, 05-13).

## Credentials
Admin: admin@consultant.com / Admin123!

## Pending/Backlog
- (P2) S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
