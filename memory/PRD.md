# Consultant CMS - Product Requirements Document

## Original Problem Statement
A multi-page website with a login, modern and production-ready, for a consultant. Complete CMS admin panel, Stripe payment integration, Theme Switcher, 3-tier Color Management, Visual Page Builder with drag-and-drop block reordering.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, Leaflet, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic, APIRouter
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## What's Been Implemented

### Phase 1 & 2 (Complete)
- Full public website, admin CMS, Visual Page Builder, Theme Engine, Dynamic Pages
- Legends & Testimonials carousel, SMTP config, External Blog API

### Session: Feb 4, 2026
- Bug Fixes, Hero Slide Live Preview, Code Refactoring (APIRouter)
- Backup & Restore (manual + scheduled), Unified Pages Manager, Contact Section CMS

### Session: Apr 4, 2026
- Removed "Simple & Preset Layouts" — only 15 Visual Builder Layouts remain
- System page deletion enabled
- `hyphens: none` CSS fix

### Session: Apr 6, 2026
- Blog/News + Reading List content blocks for Visual Builder
- Gallery Categories CRUD (admin dialog)
- Gallery page redesign (tabs, lightbox, title/summary overlay)
- Gallery open_in_new_tab toggle
- Footer sitemap: dynamic two-column from CMS pages
- **Drag-to-Reorder gallery photos** (auto-save via @dnd-kit)
- **Navbar fully dynamic** — removed all hardcoded links (Home, News, Gallery, Reading List). All 3 navbar variants (Default, Modern, Classic) + mobile menus now use only CMS nav_pages with show_in_header=true. News header toggle verified working.

## Content Block Types (13)
Rich Text, Image, Video, Service List, Gallery, Gallery Albums, Blog/News, Reading List, Profile Card, Button, Separator, Custom HTML, Legends & Testimonials

## Credentials
- Admin: admin@consultant.com / Admin123!

## Key API Endpoints
- PUT /api/admin/gallery/reorder/batch — Batch reorder gallery photos
- GET/POST/PUT/DELETE /api/admin/gallery-categories
- GET /api/public/gallery-categories

## Pending/Backlog
- (P2) Real S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
