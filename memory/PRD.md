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

**CMS Admin — Landing Page Section:**
- **Hero** — Full slide form CLONED from Website Hero: timer, title/subtitle/description (rich text), **multiple buttons per slide** (text/url/window/style), slide type (photo/video), media dimensions, background image + **Background Overlay (Yes/No)**, layer animation effects, layer positioning (canvas editor), revolution slider params, page assignment, live preview.
- **Content** — Nav links (4), contact section (title/subtitle/description/image/placeholders), waiting list (title/subtitle/btn), footer (description/social title/copyright), cookie banner.
- **Subscribers** — Waiting list signups table with delete.
- **Contacts** — Contact form submissions table with Subject column + detail dialog.

**CMS Settings:**
- Settings > General: LP toggle, Launch Date, Logo, Background Image
- Settings > Colors: 25 CSS variables (`--lp-*`)
- Routing: Auto-switch LP ↔ Website on countdown expiry (client-side, no reload)
- Admin Login: Standalone at `/admin/login`

**Hero Carousel (Apr 9, 2026):**
- Multi-slide carousel with auto-advance (configurable delay per slide, default 9.4s)
- Prev/Next arrow navigation (glassmorphism buttons)
- Dot indicators with active state highlighting
- Background image crossfade transition on slide change
- Content re-animation via React key on slide transitions
- Buttons only display if admin creates them (no fallback defaults)
- Border only on video embeds (photos and empty states have no border)
- Per-slide countdown timer toggle (`show_countdown` Yes/No in CMS)
- Settings loading gate: dark screen shown until settings load, preventing main website flash

**Text Rendering Fixes (Apr 9, 2026):**
- Non-breaking hyphen replacement (`nbHyphens`) prevents text wrapping at hyphens (membership-based, expert-led, high-quality)
- Rich text paragraph spacing: `<p>` tags get proper margin-bottom for line spacing
- CSS `word-break: keep-all` + `hyphens: none` globally on `.rich-text-content`

### Map Improvements (Apr 8, 2026)
MapBlock crash fix, Maps "Open in new tab" fix, Global Maps Language (11 languages), Interactive Map Picker, Tile provider integration

## Key Files
- `/app/frontend/src/pages/LandingPage.js` — Main landing page component
- `/app/frontend/src/pages/admin/LandingHeroSlideForm.js` — Full hero slide form (cloned from HeroSlideForm)
- `/app/frontend/src/pages/admin/LandingHeroManager.js` — Hero slides list manager
- `/app/frontend/src/pages/admin/LandingContentManager.js` — All text/image content
- `/app/frontend/src/pages/admin/LandingSubscribersManager.js` — Waiting list table
- `/app/frontend/src/pages/admin/LandingContactsManager.js` — Contact submissions
- `/app/backend/routes/landing.py` — All landing page API endpoints
- `/app/frontend/src/pages/MembershipEnrollment.js` — 4-step enrollment wizard
- `/app/frontend/src/pages/admin/EnrollmentFieldsManager.js` — CMS admin for enrollment form fields
- `/app/backend/routes/enrollment.py` — All enrollment API endpoints

### Membership Enrollment Module (Apr 10, 2026)
**4-Step Wizard at `/membership-enrollment`:**
1. **Step 1 — Invitation CODE**: Invite code validation + email/name/password
2. **Step 2 — Clarity Statement and Interview**: 37 fields (personal, financial, ratings, geo cascading selects)
3. **Step 3 — Application Enrollment**: 3 legal agreements + digital signature
4. **Step 4 — Confirm & Submit**: Confirmation message + Submit button

**Features:**
- Dynamic form fields stored in `enrollment_fields` collection (49 seeded defaults)
- Admin CMS: Full CRUD for fields (add/edit/hide/delete), grouped by step
- Field types: text, email, password, number, currency, date, select, radio, checkbox, textarea, rating, rating_table, legal_checkbox, signature, country/state/city
- CMS-configurable colors (`--me-*` CSS variables) via Settings > Colors > Membership Enrollment
- Enrollment logo in Settings > General
- On submit: creates member with Level 1, sends credentials email, auto-login redirect to /my-account
- Password strength indicator, currency formatting, field tooltips, real-time validation
- Reuses existing invite code validation and geo API (countries/states/cities)

## Credentials
Admin: admin@consultant.com / Admin123!

## Pending/Backlog
- (P2) S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
