# Consultant CMS - Product Requirements Document

## Original Problem Statement
A multi-page website with a login, modern and production-ready, for a consultant. Complete CMS admin panel, Stripe payment integration, Theme Switcher, 3-tier Color Management, Visual Page Builder with 14 layouts, drag-and-drop block reordering.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, Leaflet, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## Code Architecture
```
/app/backend/
  server.py (55 lines), seed.py, scheduler.py
  routes/ (auth, public, admin_content, admin_tools, payments, membership)
  models/database.py

/app/frontend/src/
  components/admin/ (PageBuilder, SortableBlock, LayoutPreview, PageEditorDialog, BlockConfigModal)
  components/layouts/ (LayoutRenderer, BlockRenderer, LayoutServicesGrid)
  pages/admin/ (All managers + BackupManager, ContactSettingsManager)
  lib/api.js
```

## What's Been Implemented

### Phase 1 & 2 (Complete)
- Full public website, admin CMS, Visual Page Builder, Theme Engine, Dynamic Pages
- Legends & Testimonials carousel, SMTP config, External Blog API

### Session: Feb 4, 2026
1. **Bug Fixes**: Service HTML rendering (cleanHtml), word-break CSS, service fallback links, Hero video URL input
2. **Hero Slide Live Preview**: Real-time preview panel in admin
3. **Code Refactoring**: server.py 455→52 lines, PageBuilder/PagesManager split into sub-components
4. **Backup & Restore**: Manual export/import (16 collections, merge/replace modes)
5. **Scheduled Automatic Backups**: Background scheduler (daily/weekly/monthly), snapshot CRUD, max retention
6. **Hero Preview Reposition**: Moved between Layer Positioning and Page Assignment sections
7. **Hero Preview Background Fix**: Gradient overlay only when NO background image is set
8. **Unified Pages Manager**: Merged Custom + System pages into single table. System pages (Home, News, Gallery, Reading List) seeded with `system: true` flag, editable but not deletable
9. **Contact Section CMS**: New ContactSettingsManager admin page. Title, subtitle, description editable via CMS and rendered on homepage

## Credentials
- Admin: admin@consultant.com / Admin123!

## Key API Endpoints (New)
- `GET/PUT /api/admin/contact-settings` — Contact section text
- `POST /api/admin/seed-system-pages` — Seeds system pages into nav_pages
- `GET/PUT /api/admin/backup-settings` — Backup schedule config
- `GET/POST/DELETE /api/admin/backups` — Snapshot CRUD
- `GET/POST /api/admin/export-content`, `POST /api/admin/import-content` — Bulk export/import

## Pending/Backlog (P2)
- Real S3/Cloud Image Storage migration
- Production SMTP Configuration

## Mocked/Placeholder
- S3/Cloud Storage (local container uploads)
- Production SMTP (configured but needs real credentials)
