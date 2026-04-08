# Consultant CMS - Product Requirements Document

## Original Problem Statement
Multi-page consultant website with CMS admin panel, Stripe payments, Theme Engine, Visual Page Builder, and Maps management.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, react-leaflet, react-leaflet-cluster, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic, APIRouter
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## What's Been Implemented

### Core (Phase 1-2)
Full public website, admin CMS, Visual Page Builder (16 content blocks), Theme Engine, Dynamic Pages, SMTP config, External Blog API, Backup/Restore

### Session: Apr 8, 2026 (Latest)
1. **MapBlock Crash Fix** — Replaced `React.lazy()` inside component body with direct imports in `BlockRenderer.js`, resolving crashes on "Our Group" dynamic page
2. **Maps "Open in new tab" Fix** — Fixed hardcoded `target="_blank"` in `HomePage.js` MapSection popups to respect `open_in_new_tab` setting
3. **Global Maps Language Setting** — Added `maps_language` field to CMS Settings > General tab with 11 language options. All map TileLayers now use centralized `mapConfig.js` for tile URLs
4. **Interactive Map Picker** — Added Leaflet `ClickableMap` component in MapsManager location edit dialog for click-to-set lat/lng coordinates
5. **Tile Provider Integration** — All maps (HomePage, MapTypePage, BlockRenderer) now use `getTileUrl(lang)` and `getTileAttribution(lang)` from `/app/frontend/src/lib/mapConfig.js`

### Session: Apr 6, 2026
1. Quill Alignment CSS, Featured Projects Page, Homepage Portfolio
2. Maps Module Refactor — 3 map types: Global Business, Conferences, Recommended Sites
3. Blog Categories CRUD, Gallery Categories A→Z, Gallery drag-to-reorder
4. Navbar fully dynamic, Footer dynamic sitemap

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
