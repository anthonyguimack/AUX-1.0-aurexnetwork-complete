# Consultant CMS - Product Requirements Document

## Original Problem Statement
Multi-page consultant website with CMS admin panel, Stripe payments, Theme Engine, Visual Page Builder, Maps management, and Landing Page.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, react-leaflet, react-leaflet-cluster, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic, APIRouter
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## What's Been Implemented

### Core (Phase 1-2)
Full public website, admin CMS, Visual Page Builder (16 content blocks), Theme Engine, Dynamic Pages, SMTP config, External Blog API, Backup/Restore, Gallery (lightbox/categories/reorder), Portfolio, Maps (3 types + clustering), Reading List, Blog Categories CRUD

### Landing Page Module (Apr 9, 2026)
**5-Section Layout (matching reference design):**
1. **Header/Nav** — Fixed position, logo left + 4 configurable nav links (Home, More Information, Membership Lounge, Waiting List). Mobile hamburger menu.
2. **Hero** — 2-column: Left has editable title (rich text), animated countdown, description, 3 CTA buttons. Right has embedded video (YouTube/Vimeo URL from hero slide).
3. **Get in Touch** — 2-column: Left has configurable image, Right has title/subtitle/description + contact form (Name, Email, Subject, Message). Saves to `landing_contacts`.
4. **Waiting List** — White background, centered form (Name, Last Name, Email + Submit). Saves to `landing_subscribers`.
5. **Footer** — 2-column: Left has logo + description, Right has "Follow Us" + social media icons (from settings). Copyright centered below.

**CMS Admin — Landing Page Section:**
- **Hero** — Full CRUD for hero slides (title, subtitle, description w/ rich text, background image, video URL, 3 CTA button texts, display order)
- **Content** — All text/images: nav link texts (4), contact section (title/subtitle/description/image/placeholders/button text), waiting list (title/subtitle/button text), footer (description/social title/copyright), cookie banner message
- **Subscribers** — Table of waiting list signups, sorted by most recent, with delete
- **Contacts** — Table of contact form submissions with Subject column, click-to-view detail dialog, delete

**CMS Settings Integration:**
- Settings > General: LP toggle (Yes/No), Launch Date (datetime), Logo upload, Background Image upload
- Settings > Colors: 25 CSS variables (`--lp-*`) for all visual elements
- Routing: Auto-switch LP ↔ Website when countdown expires (client-side, no reload)
- Admin Login: Standalone dark page at `/admin/login` accessible during LP mode
- Complete Isolation: No shared layout/styles with Website or My Account

### Map Improvements (Apr 8, 2026)
MapBlock crash fix, Maps "Open in new tab" fix, Global Maps Language (11 languages), Interactive Map Picker, Tile provider integration

## Key API Endpoints (Landing)
```
GET/PUT    /api/admin/landing-content
GET/POST   /api/admin/landing-hero
GET/PUT/DELETE /api/admin/landing-hero/:id
GET/DELETE /api/admin/landing-subscribers/:id
GET/DELETE /api/admin/landing-contacts/:id
POST       /api/public/landing-subscribe
POST       /api/public/landing-contact
GET        /api/public/landing-hero
GET        /api/public/landing-content
```

## DB Collections (Landing)
- `landing_hero`: `{ id, title, subtitle, description, background, video_url, button1_text, button2_text, button3_text, order }`
- `landing_content`: Single document with all text fields
- `landing_subscribers`: `{ id, first_name, last_name, email, created_at }`
- `landing_contacts`: `{ id, first_name, email, subject, message, created_at }`

## Credentials
Admin: admin@consultant.com / Admin123!

## Pending/Backlog
- (P2) S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
