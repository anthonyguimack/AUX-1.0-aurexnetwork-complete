# Consultant CMS - Product Requirements Document

## Original Problem Statement
A multi-page website with a login, modern and production-ready, for a consultant. Complete CMS admin panel, Stripe payment integration, Theme Switcher, 3-tier Color Management, Visual Page Builder with drag-and-drop.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, Leaflet, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic, APIRouter
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## What's Been Implemented

### Phase 1 & 2 (Complete)
Full public website, admin CMS, Visual Page Builder, Theme Engine, Dynamic Pages, Legends & Testimonials, SMTP config, External Blog API

### Session: Feb 4, 2026
Bug Fixes, Hero Slide Live Preview, Code Refactoring (APIRouter), Backup & Restore, Unified Pages Manager, Contact Section CMS

### Session: Apr 4, 2026
Removed legacy layouts, System page deletion, `hyphens: none` CSS fix

### Session: Apr 6, 2026
Blog/News + Reading List blocks, Gallery Categories CRUD, Gallery page redesign (tabs, lightbox), Gallery open_in_new_tab, Footer dynamic sitemap, Drag-to-Reorder gallery, Navbar fully dynamic

### Session: Apr 6, 2026 (Bug Fixes)
1. **Rich Text Alignment** — Added left/center/right/justify alignment to Quill toolbar
2. **Reading List Block Modal** — BookDetailModal now opens when clicking books in the block (matching system page behavior)
3. **Page Delete Fix** — Removed auto-seed from PagesManager mount; deleted pages stay deleted
4. **Blog Categories CRUD** — New admin dialog for managing blog categories (A→Z sorted, select dropdown in post editor)
5. **Gallery Categories A→Z** — Both admin and public endpoints now sort by name alphabetically
6. **Homepage News Link Fix** — Post cards now use `slug` for navigation instead of `id`

## Credentials
- Admin: admin@consultant.com / Admin123!

## Key API Endpoints
- GET/POST/PUT/DELETE /api/admin/blog-categories
- GET/POST/PUT/DELETE /api/admin/gallery-categories (sorted A→Z)

## Pending/Backlog
- (P2) Real S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
