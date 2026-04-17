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

### Blocked Dates (holiday skip-list) — Iteration 60 (Apr 17, 2026)
- New `blocked_dates` collection: `{ id, date, reason, created_at }`
- Admin endpoints in `mentor_slots.py`: GET/POST/PUT/DELETE `/api/admin/blocked-dates`. Public read at `/api/public/blocked-dates` so the recurrence picker can preview skipped dates without auth.
- `_expand_recurrence` extended with optional `excluded_dates: set` — filters out blocked dates during expansion.
- Both slot-creation endpoints now:
  - auto-load the blocked set and skip those dates during recurrence (e.g. 4 weeks × [Mon, Wed] with 2026-04-27 blocked → 7 slots instead of 8)
  - reject single-slot creation on a blocked date with HTTP 400 ("2026-04-27 is a blocked date…")
- New CMS page `/app/frontend/src/pages/admin/BlockedDatesManager.js` at route `/admin/calendar/blocked-dates` with date + reason fields.
- New sidebar item **Calendar → Blocked Dates** in `AdminLayout.js`.
- `<SlotRecurrencePicker>` now fetches blocked dates, filters the preview, and adds a second preview line: `"Skipping 1 blocked date: 2026-05-25 (Memorial Day)"`.
- Existing slots on a newly-blocked date are **not** auto-cancelled (per design) — mentors still explicitly cancel those via the existing status-change flow that already triggers member notifications.

### iCal Subscription Feeds — Iteration 61 (Apr 17, 2026)
- New `/app/backend/routes/ical.py` module — RFC 5545 VCALENDAR generator using floating local time (no TZID) so each member's calendar app renders in local TZ.
- Per-member opaque token stored as `ical_token` on the `members` document (auto-generated via `secrets.token_urlsafe(24)` on first visit).
- Endpoints:
  - `GET /api/ical/{token}.ics` — public, serves `text/calendar`; looks up member by token. 404s on invalid tokens.
  - `GET /api/member/ical/info` — authenticated, returns `{ token, path }` (idempotent, generates token if missing).
  - `POST /api/member/ical/regenerate` — authenticated, rotates the token and invalidates the old URL immediately.
- Feed contents: booked mentorship slots (status in booked/completed) + registered global events. Excludes waitlist, cancelled slots, and cancelled events. Rich-HTML descriptions are stripped before escaping. UIDs are stable (`slot-{id}@consultant` / `event-{id}@consultant`) for proper update behavior in client calendar apps.
- Frontend:
  - New reusable `/app/frontend/src/components/CalendarSyncCard.js` — renders URL + copy button + three CTAs (Google Calendar "add by URL" deeplink, Apple Calendar `webcal://`, copy webcal://), expandable manual setup instructions for Google / Apple / Outlook, and a two-step "Regenerate URL" confirmation. Supports inline render or modal via `asModal` prop.
  - New page `/app/frontend/src/pages/myaccount/CalendarSync.js` at route `/my-account/calendar-sync` — dedicated landing with intro copy + card.
  - New sidebar item **Calendar Sync** (Rss icon) in `MyAccountLayout.js` — always visible (not gated by level perms, matching the other calendar items).
  - Inline collapsible card at the top of **My Reservations** page (`MyBookings.js`) — one-click reveal with compact copy.
  - Small **Subscribe** button on **Global / AUX Calendar** page (`GlobalCalendar.js`) that opens the modal variant.
- Curl verified: `.ics` output is valid RFC 5545 (VCALENDAR/VEVENT wrapper, PRODID, VERSION, METHOD, DTSTART/DTEND floating, proper CRLF line-endings). Invalid token returns 404. Regenerate rotates and old URL stops working.

### Paid Mentor Slots (Stripe) — Iteration 62 (Apr 17, 2026)
- New `mentorship_slots.price_cents` (int, default 0) + `currency` (default "usd"); free slots keep working.
- New global **Settings → General → Paid Mentor Slots** toggle `mentor_slots_paid_enabled`. Takes effect immediately — no redeployment.
- Backend (`routes/mentor_slots.py`):
  - `POST /member/mentorship/book/{slot_id}` returns HTTP 402 when toggle=ON and slot has price > 0 (directs to checkout).
  - New `POST /member/mentorship/checkout/{slot_id}` — creates Stripe Checkout via `emergentintegrations`, soft-holds the seat with `pending_payment` booking, inserts `payment_transactions` record. Success URL → `/my-account/mentorship/checkout-success?session_id={CHECKOUT_SESSION_ID}`.
  - New `GET /member/mentorship/checkout/status/{session_id}` — polled by success page; on `paid` flips booking to `booked` (idempotent), notifies mentor + member.
  - Rejects with 400 when: toggle=OFF, slot has no price, already booked/pending, or slot is full.
- Frontend:
  - Admin Settings toggle (clear copy: "Enabled — Stripe active on booking flow" / "Disabled — bookings remain free").
  - Price (USD) input in both slot editors, only rendered when toggle is ON. Dollars input → cents storage.
  - `MentorCalendarView.js`: price badge on SlotCard, "Pay $X & Book" button, dialog shows price line + adaptive CTA. Paid flow redirects to Stripe; free and waitlist flows unchanged.
  - New `MentorshipCheckoutSuccess.js` polls status with 10×2s with loading/paid/failed/timeout/error states.
- Testing (iteration_57): 17/17 backend PASS, CMS + slot editor UI verified, 0 regressions. Toggle left OFF after tests.

### Mentor Earnings Dashboard — Iteration 63 (Apr 17, 2026)
- New `GET /api/member/mentor/earnings` — returns aggregated stats for the authenticated mentor:
  - `total_revenue_cents`, `this_month_revenue_cents`, `pending_revenue_cents` (paid sessions with future dates)
  - `sessions_delivered`, `sessions_pending`, `sessions_total`
  - `monthly_breakdown` — last 12 months filled with zeros where no revenue
  - `transactions` — up to 50 most recent paid bookings with slot/member/amount/status (delivered | upcoming)
- Endpoint is mentor-scoped (`mentor_id` = current member), counts only bookings with `payment_status == 'paid'`. Returns zeros safely when no paid sessions exist.
- Frontend page `/app/frontend/src/pages/myaccount/MentorEarnings.js` at route `/my-account/earnings`:
  - 4 stat cards (Lifetime / This Month / Pending Payout / Delivered) with clean gold/amber accent
  - Monthly bar chart using existing `recharts` dep — respects `--ma-accent` CSS var
  - Transaction table with Delivered/Upcoming status pills
  - Gentle notice when paid toggle is currently OFF: "Paid slots are currently disabled by the administrator — no new charges will occur, but past paid sessions are shown below."
- New sidebar item **Earnings** (BarChart3 icon) in `MyAccountLayout.js`, gated by `mentorOnly: true` (matches existing My Calendar mentor-only pattern).
- Verified via curl + screenshot: seeded 3 paid bookings (2 past delivered, 1 future upcoming) → dashboard correctly showed $225 lifetime, $175 this month, $100 pending, 2/3 delivered, plus monthly chart with Mar $75 / Apr $175 bars and 3-row transaction table.

### Session Bundles — Iteration 64 (Apr 17, 2026)
- New `routes/bundles.py`; new collections `session_bundles` + `credit_packs`.
- **Two scopes**: admin-global bundles (`mentor_id: null`, redeemable against any paid slot) and per-mentor bundles (redeemable only on that mentor's slots). Eligibility priority at redemption: mentor-specific pack → global pack.
- Endpoints:
  - Admin CRUD: `GET/POST/PUT/DELETE /api/admin/bundles`
  - Mentor CRUD: `GET/POST/PUT/DELETE /api/member/mentor/bundles`
  - Member browse: `GET /api/member/bundles` (active only, enriched with mentor name)
  - Purchase: `POST /api/member/bundles/checkout/{id}` → Stripe Checkout; poll `GET /api/member/bundles/checkout/status/{session_id}` materializes a `credit_pack` with `remaining = session_count` on `paid`.
  - `GET /api/member/credits` — all packs owned by the member
- **Booking integration** (in `routes/mentor_slots.py`):
  - `POST /member/mentorship/book/{slot_id}` accepts `{use_credit: true}` — redeems one credit atomically, decrements pack `remaining`, marks booking `payment_status: credit`.
  - Cancellation restores the credit (atomic `$inc: {remaining: 1}` when `credit_pack_id` is set).
- Frontend:
  - Reusable `BundleEditorDialog` (admin-light + mentor-dark themes) used by both CMS and Earnings pages.
  - New CMS page `/admin/calendar/bundles` (AdminBundlesManager). Sidebar item **Calendar → Session Bundles**.
  - New member page `/my-account/bundles` (BundlesBrowse) — cards show bundle name, price, sessions, discount callout (`$600 value — save $200`), rich description, mentor badge for mentor-owned bundles, owned credits panel at top.
  - New `BundleCheckoutSuccess.js` at `/my-account/bundles/checkout-success` — polling + credit-count celebration card.
  - Mentor Earnings page adds a **My Bundles** table with add/edit/delete (uses the shared dialog with dark theme).
  - Booking dialog (`MentorCalendarView.js`) shows a new **Use 1 credit from "<Bundle>"** checkbox when the member has an eligible pack, updates CTA to **Book with Credit**.
- Verified via curl: admin + mentor bundle CRUD, member browse, book-with-credit decrements 5→4, cancel restores 4→5, 402 still fires when trying to book without credit. Seeded 2 demo bundles → browse page renders correctly with savings copy. All seed data cleaned.

### Payout Ledger MVP — Iteration 65 (Apr 17, 2026)
- New `routes/payouts.py` with manual payout ledger tied to a configurable `platform_fee_percent` CMS setting (default 15%).
- Ledger math: `gross = sum(paid transactions per mentor)`, `fee = gross * fee%`, `net = gross - fee`, `balance_owed = net - paid_out`.
- Endpoints:
  - Admin: `GET /api/admin/payouts` (aggregated per-mentor ledger + payout history), `POST /api/admin/payouts` (record manual payout: mentor_id, amount_cents, method, reference, notes), `DELETE /api/admin/payouts/{id}` (void).
  - Mentor: `GET /api/member/mentor/payouts` (own ledger + records).
- Frontend:
  - New admin page `/admin/payouts` (`AdminPayoutsManager.js`) — 5 KPI cards (Gross / Fee / Net Owed / Paid Out / Outstanding), mentor earnings ledger table with "Record payout" action per mentor, and payout history table with void action.
  - `MentorEarnings.js` gets a new **Payouts** card at the bottom showing Gross / Fee / Paid Out / Balance Owed stats + payout history table, with platform fee badge.
- **Bug discovered & fixed** during visual QA: MentorEarnings was missing imports for `Package`, `Plus`, `Edit2`, `Trash2`, `Send` (lucide-react), `toast` (sonner), and `BundleEditorDialog` → caused `Package is not defined` runtime ReferenceError on page mount. Also `loadPayouts()` was defined but never called in useEffect. All fixed.
- Verified via curl (17/17 backend tests) + screenshots of both `/admin/payouts` and `/my-account/earnings` (Carlos mentor account) rendering correctly with empty and populated ledger states.

## Credentials
Admin: admin@consultant.com / Admin123!

## Pending/Backlog
- (P2) S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
- (P2) Stripe Connect full marketplace (automatic payouts replacing manual logging)
