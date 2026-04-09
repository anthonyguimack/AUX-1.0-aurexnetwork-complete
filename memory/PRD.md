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

## Credentials
Admin: admin@consultant.com / Admin123!

## Pending/Backlog
- (P2) S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
