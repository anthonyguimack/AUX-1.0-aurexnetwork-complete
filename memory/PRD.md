# Consultant CMS - Product Requirements Document

## Original Problem Statement
A multi-page website with a login, modern and production-ready, for a consultant. It includes a complete CMS admin panel, Stripe payment integration, Theme Switcher, 3-tier global Color Management, and a Phase 2 Visual Page Builder architecture allowing per-page layouts, block-based content zones, drag-and-drop block reordering, and 14 distinct layout types.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit (Drag & Drop), Framer Motion, Leaflet, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic
- **Database**: MongoDB
- **Auth**: JWT + Emergent-managed Google OAuth
- **Payments**: Stripe (test key)

## Code Architecture
```
/app
├── backend/
│   ├── server.py             # App entry point (55 lines)
│   ├── seed.py               # Seed data (407 lines)
│   ├── scheduler.py          # Background backup scheduler (NEW)
│   ├── models/database.py
│   └── routes/
│       ├── auth.py, public.py, admin_content.py
│       ├── admin_tools.py    # Uploads, SMTP, Backup & Restore, Snapshots
│       ├── payments.py, membership.py
└── frontend/src/
    ├── components/admin/     # PageBuilder, SortableBlock, LayoutPreview, PageEditorDialog
    ├── pages/admin/          # All managers + BackupManager
    └── lib/api.js
```

## What's Been Implemented

### Phase 1 & 2 (Complete)
- Full public website, admin CMS, Visual Page Builder, Theme Engine, Dynamic Pages

### Features Added (Feb 4, 2026 Session)
1. **Hero Slide Live Preview** — Real-time preview panel in admin
2. **Code Refactoring** — server.py (455→52 lines), PageBuilder/PagesManager split into 3 sub-components
3. **Backup & Restore** — Manual export/import with 16 selectable collections, merge/replace modes
4. **Scheduled Automatic Backups** — Background scheduler with:
   - Enable/disable toggle, frequency (daily/weekly/monthly), max snapshots (3-20)
   - Background asyncio loop checking every 5 minutes
   - Auto-cleanup of old backups beyond max_snapshots limit
   - Snapshot list with Download, Restore (replace import), Delete actions
   - Manual "Create Backup Now" button
   - API: GET/PUT /api/admin/backup-settings, GET/POST/DELETE /api/admin/backups

### Bug Fixes (Feb 4, 2026)
- Service HTML rendering (cleanHtml), word-break CSS, service fallback links
- Hero video URL input (iframe → URL), YouTube/Vimeo auto-embed

## Credentials
- Admin: admin@consultant.com / Admin123!

## Pending/Backlog (P2)
- Real S3/Cloud Image Storage migration
- Production SMTP Configuration

## Mocked/Placeholder
- S3/Cloud Storage (using local container uploads)
- Production SMTP (configured but needs real credentials)
