# Consultant CMS - Product Requirements Document

## Original Problem Statement
A multi-page website with a login, modern and production-ready, for a consultant. It includes a complete CMS admin panel, Stripe payment integration, Theme Switcher, 3-tier global Color Management, and a Phase 2 Visual Page Builder architecture allowing per-page layouts, block-based content zones, drag-and-drop block reordering, and 14 distinct layout types.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit (Drag & Drop), Framer Motion, Leaflet, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic
- **Database**: MongoDB
- **Auth**: JWT + Emergent-managed Google OAuth
- **Payments**: Stripe (test key)

## Code Architecture (Post-Refactor)
```
/app
├── backend/
│   ├── server.py             # App entry point (52 lines) - mounts routes, CORS, startup
│   ├── seed.py               # Seed data function (407 lines) - extracted from server.py
│   ├── models/
│   │   └── database.py       # DB connection, helpers, constants
│   └── routes/
│       ├── auth.py            # JWT & Google OAuth
│       ├── public.py          # Public-facing APIs
│       ├── admin_content.py   # Admin CRUD
│       ├── admin_tools.py     # Settings, SMTP, uploads
│       ├── payments.py        # Stripe checkout
│       └── membership.py      # Member area
└── frontend/
    └── src/
        ├── components/
        │   ├── admin/
        │   │   ├── PageBuilder.js       # Zone management + DnD context (141 lines)
        │   │   ├── SortableBlock.js     # Draggable block component (51 lines) - extracted
        │   │   ├── LayoutPreview.js     # Layout thumbnails + constants (51 lines) - extracted
        │   │   ├── PageEditorDialog.js  # Page edit dialog (187 lines) - extracted
        │   │   └── BlockConfigModal.js
        │   ├── layouts/
        │   └── ui/
        ├── pages/
        │   └── admin/
        │       └── PagesManager.js      # Pages list/table (185 lines) - refactored
        └── App.js
```

## What's Been Implemented

### Phase 1 (Complete)
- Public website with Hero, About, Services, News/Blog, Reading List, Maps, Portfolio, Gallery, Testimonials, Contact
- Admin Panel with full CRUD, JWT & Google OAuth, responsive design with 3 themes

### Phase 2 (Complete)
- Visual Page Builder with 14 layouts, drag-and-drop, Theme Engine, Dynamic Pages
- Legends & Testimonials carousel, SMTP config, External Blog API

### Bug Fixes (Feb 4, 2026)
- Service HTML rendering with cleanHtml, word-break CSS, service fallback links
- Hero video URL input (iframe → URL), HeroSection YouTube/Vimeo auto-embed

### Features (Feb 4, 2026)
- Hero Slide Live Preview panel in admin CMS

### Refactoring (Feb 4, 2026)
- Backend: Extracted `seed_data()` from `server.py` → `seed.py` (455 → 52 lines)
- Frontend: Extracted `SortableBlock`, `LayoutPreview`, `PageEditorDialog` from PageBuilder/PagesManager
- All tests pass at 100% with zero regressions (Iteration 32)

## Credentials
- Admin: admin@consultant.com / Admin123!

## Pending/Backlog (P2)
- Real S3/Cloud Image Storage migration
- Production SMTP Configuration

## Mocked/Placeholder
- S3/Cloud Storage (using local container uploads)
- Production SMTP (configured but needs real credentials)
