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
│   ├── server.py             # App entry point (52 lines)
│   ├── seed.py               # Seed data function (407 lines)
│   ├── models/database.py    # DB connection, helpers
│   └── routes/
│       ├── auth.py, public.py, admin_content.py
│       ├── admin_tools.py    # Uploads, SMTP, Backup & Restore
│       ├── payments.py, membership.py
└── frontend/src/
    ├── components/admin/     # PageBuilder, SortableBlock, LayoutPreview, PageEditorDialog, BlockConfigModal
    ├── components/layouts/   # LayoutRenderer, BlockRenderer, LayoutServicesGrid
    ├── pages/admin/          # All admin managers + BackupManager (NEW)
    └── lib/api.js            # API client
```

## What's Been Implemented

### Phase 1 (Complete)
- Public website with Hero, About, Services, News/Blog, Reading List, Maps, Portfolio, Gallery, Testimonials, Contact
- Admin Panel with full CRUD, JWT & Google OAuth, responsive 3-theme design

### Phase 2 (Complete)
- Visual Page Builder (14 layouts, zones, drag-and-drop), Theme Engine, Dynamic Pages
- Legends & Testimonials carousel, SMTP config, External Blog API

### Bug Fixes (Feb 4, 2026)
- Service HTML rendering (cleanHtml), word-break CSS, service fallback links
- Hero video URL input (iframe → URL), YouTube/Vimeo auto-embed

### Features (Feb 4, 2026)
- Hero Slide Live Preview panel in admin CMS
- **Backup & Restore** — Full CMS content export/import as JSON:
  - Export: Select from 16 collections, download as timestamped JSON file
  - Import: Upload JSON backup, preview contents, choose Merge (safe upsert) or Replace (clear + insert) mode
  - Results panel shows per-collection item counts
  - Backend: `GET /api/admin/export-content`, `POST /api/admin/import-content`

### Refactoring (Feb 4, 2026)
- Backend: Extracted seed_data() → seed.py (server.py: 455→52 lines)
- Frontend: Extracted SortableBlock, LayoutPreview, PageEditorDialog from PageBuilder/PagesManager

## Credentials
- Admin: admin@consultant.com / Admin123!

## Pending/Backlog (P2)
- Real S3/Cloud Image Storage migration
- Production SMTP Configuration

## Mocked/Placeholder
- S3/Cloud Storage (using local container uploads)
- Production SMTP (configured but needs real credentials)
