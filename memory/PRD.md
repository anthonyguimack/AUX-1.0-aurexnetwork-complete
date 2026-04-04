# Consultant CMS - Product Requirements Document

## Original Problem Statement
A multi-page website with a login, modern and production-ready, for a consultant. Complete CMS admin panel, Stripe payment integration, Theme Switcher, 3-tier Color Management, Visual Page Builder with drag-and-drop block reordering.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, Leaflet, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic, APIRouter
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## Code Architecture
```
/app/backend/
  server.py (entry point), seed.py, scheduler.py
  routes/ (auth, public, admin_content, admin_tools, payments, membership)
  models/database.py

/app/frontend/src/
  components/admin/ (PageBuilder, SortableBlock, LayoutPreview, PageEditorDialog, BlockConfigModal)
  components/layouts/ (LayoutRenderer, BlockRenderer, LayoutAboutBio, LayoutServicesGrid, LayoutGalleryAlbums, LayoutFullContent)
  pages/admin/ (All managers + BackupManager, ContactSettingsManager)
  lib/ (api.js, layoutDefinitions.js)
```

## What's Been Implemented

### Phase 1 & 2 (Complete)
- Full public website, admin CMS, Visual Page Builder, Theme Engine, Dynamic Pages
- Legends & Testimonials carousel, SMTP config, External Blog API

### Session: Feb 4, 2026
1. Bug Fixes: Service HTML rendering, word-break CSS, service fallback links, Hero video URL input
2. Hero Slide Live Preview with background logic
3. Code Refactoring: server.py modularized with APIRouter, PageBuilder/PagesManager split
4. Backup & Restore: Manual export/import (16 collections, merge/replace modes)
5. Scheduled Automatic Backups: Background scheduler
6. Unified Pages Manager: System + Custom pages in single table
7. Contact Section CMS: Editable via admin

### Session: Apr 4, 2026
1. Removed "Simple & Preset Layouts" from page editor - only Visual Builder Layouts remain (15 layouts)
2. System page deletion enabled - backend restriction removed, frontend delete button visible for all pages
3. Gallery Albums block type confirmed as Content Block in Visual Builder
4. About Bio already migrated as Visual Builder Layout

## Visual Builder Layouts (15)
Full Width, Boxed, Split Screen, About/Bio, Grid 2x2, Masonry, List, Carousel, Two Column, Three Column, Profile, Card Based, Hero Banner, Sidebar, Landing Page

## Content Block Types (11)
Rich Text, Image, Video, Service List, Gallery, Gallery Albums, Profile Card, Button, Separator, Custom HTML, Legends & Testimonials

## Credentials
- Admin: admin@consultant.com / Admin123!

## Key API Endpoints
- GET/PUT /api/admin/contact-settings
- POST /api/admin/seed-system-pages
- GET/PUT /api/admin/backup-settings
- GET/POST/DELETE /api/admin/backups
- GET/POST /api/admin/export-content, POST /api/admin/import-content
- GET/POST/PUT/DELETE /api/admin/nav-pages (system pages now deletable)

## Pending/Backlog
- (P2) Real S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration

## Mocked/Placeholder
- S3/Cloud Storage (local container uploads)
- Production SMTP (configured but needs real credentials)
