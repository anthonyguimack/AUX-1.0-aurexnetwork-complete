# Consultant CMS - Product Requirements Document

## Original Problem Statement
Multi-page consultant website with CMS admin panel, Stripe payments, Theme Engine, Visual Page Builder, and Maps management.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, react-leaflet, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic, APIRouter
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## What's Been Implemented

### Core (Phase 1-2)
Full public website, admin CMS, Visual Page Builder (15 layouts), Theme Engine, Dynamic Pages, SMTP config, External Blog API, Backup/Restore

### Session: Apr 6, 2026 (Latest)
1. **Quill Alignment CSS** — Added .ql-align-center/right/justify CSS rules to index.css for proper rendering on all frontend pages
2. **Featured Projects Page** — New page at `/featured-projects` showing all portfolio items with title, category, description, and "View Project" links
3. **Homepage Portfolio** — Added "View All" → `/featured-projects` link + project links visible on cards
4. **Maps Module Refactor** — 3 map types: Global Business Presence, Conferences, Recommended Sites
   - Location model: `map_type` dropdown (replaces free-text category), `link`, `open_in_new_tab`
   - Admin: Map Type dropdown, Link + Open in New Tab fields
   - Pages: `/conferences` and `/recommended_sites` with react-leaflet map + location list
   - Content Blocks: `map_global`, `map_conferences`, `map_recommended` for Visual Builder
   - Homepage Sections: All 3 map types controllable via Sections manager (show/hide + order)
5. Blog Categories CRUD, Gallery Categories A→Z, Gallery drag-to-reorder
6. Navbar fully dynamic (no hardcoded links), Footer dynamic sitemap

## Content Block Types (16)
Rich Text, Image, Video, Service List, Gallery, Gallery Albums, Blog/News, Reading List, Profile Card, Button, Separator, Custom HTML, Legends & Testimonials, Global Business Map, Conferences Map, Recommended Sites Map

## Map Types
| Type | Page URL | Block Key | Description |
|------|----------|-----------|-------------|
| Global Business Presence | (homepage section) | map_global | Existing world map |
| Conferences | /conferences | map_conferences | Events + locations |
| Recommended Sites | /recommended_sites | map_recommended | Recommended places |

## Credentials
Admin: admin@consultant.com / Admin123!

## Pending/Backlog
- (P2) S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
