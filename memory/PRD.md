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
  components/layouts/ (LayoutRenderer, BlockRenderer)
  components/layout/ (Navbar, Footer)
  pages/admin/ (All managers + BackupManager, ContactSettingsManager, GalleryManager)
  pages/ (GalleryPage, HomePage, DynamicPage, etc.)
  lib/ (api.js, layoutDefinitions.js)
```

## What's Been Implemented

### Phase 1 & 2 (Complete)
- Full public website, admin CMS, Visual Page Builder, Theme Engine, Dynamic Pages
- Legends & Testimonials carousel, SMTP config, External Blog API

### Session: Feb 4, 2026
1. Bug Fixes, Hero Slide Live Preview, Code Refactoring
2. Backup & Restore (manual + scheduled), Unified Pages Manager
3. Contact Section CMS

### Session: Apr 4, 2026
1. Removed "Simple & Preset Layouts" — only 15 Visual Builder Layouts remain
2. System page deletion enabled
3. `hyphens: none` CSS fix for rich text content

### Session: Apr 6, 2026
1. **Blog/News Content Block** — New auto-content block for Visual Builder displaying latest blog posts
2. **Reading List Content Block** — New auto-content block displaying books collection
3. **Gallery Categories CRUD** — Admin interface with categories management dialog (create/edit/delete). Dynamic categories replace hardcoded "professional"/"personal"
4. **Gallery open_in_new_tab** — Toggle in photo edit dialog when link is present
5. **Gallery Page Redesign** — Dynamic category tabs, 3-column grid with title/category overlay, fullscreen lightbox with dark background, arrow navigation, keyboard support, title/summary in lightbox
6. **Gallery Block with Tabs** — Visual Builder gallery block shows category tabs and lightbox
7. **Footer Sitemap** — Dynamic two-column sitemap from CMS pages with show_in_footer=true, sorted by order. Removed hardcoded links.

## Visual Builder Layouts (15)
Full Width, Boxed, Split Screen, About/Bio, Grid 2x2, Masonry, List, Carousel, Two Column, Three Column, Profile, Card Based, Hero Banner, Sidebar, Landing Page

## Content Block Types (13)
Rich Text, Image, Video, Service List, Gallery, Gallery Albums, Blog/News, Reading List, Profile Card, Button, Separator, Custom HTML, Legends & Testimonials

## Credentials
- Admin: admin@consultant.com / Admin123!

## Key DB Collections
- `gallery_categories`: `{ name, slug, order }`
- `gallery`: `{ title, summary, image, category, link, open_in_new_tab }`

## Key API Endpoints (New)
- GET/POST/PUT/DELETE /api/admin/gallery-categories
- GET /api/public/gallery-categories

## Pending/Backlog
- (P2) Real S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration

## Mocked/Placeholder
- S3/Cloud Storage (local container uploads)
- Production SMTP (configured but needs real credentials)
