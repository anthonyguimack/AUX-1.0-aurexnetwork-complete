# Consultant CMS - Product Requirements Document

## Original Problem Statement
Multi-page consultant website with CMS admin panel, Stripe payments, Theme Engine, Visual Page Builder, and Maps management.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit, Framer Motion, react-leaflet, react-leaflet-cluster, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic, APIRouter
- **Database**: MongoDB | **Auth**: JWT + Google OAuth | **Payments**: Stripe

## What's Been Implemented

### Core (Phase 1-2)
Full public website, admin CMS, Visual Page Builder (16 content blocks), Theme Engine, Dynamic Pages, SMTP config, External Blog API, Backup/Restore, Gallery (lightbox/categories/reorder), Portfolio, Maps (3 types + clustering), Reading List, Blog Categories CRUD

### Landing Page Module (Apr 9, 2026)
1. **"Coming Soon" Landing Page** — Dark premium design with animated countdown, 3 CTA buttons, Description/Value section, Contact Form, "Notify Me!" modal, GDPR Cookie Banner, multi-layer background
2. **Scroll Reveal Animations** — IntersectionObserver-based fade-in/slide-up animations on Description, Contact Form, Dividers, and Footer sections with staggered delays
3. **CMS Routing Logic** — Auto-switch LP ↔ Website based on `landing_page_enabled` + `landing_page_launch_date`. Client-side countdown expires → auto-shows website without reload
4. **CMS > Settings > General** — LP toggle (Yes/No), Launch Date, Logo upload, Background Image upload
5. **CMS > Settings > Colors** — 25 CSS variables (`--lp-*`) for backgrounds, countdown, buttons, inputs, modal, footer, cookie
6. **CMS > Landing Page > Content** — All text editable: hero, buttons, description (rich text), contact form, notify modal, footer, cookie banner
7. **CMS > Landing Page > Subscribers** — CRUD table for "Notify Me!" newsletter signups
8. **CMS > Landing Page > Contacts** — CRUD table for contact form submissions
9. **Admin Login Page** — Standalone dark admin login at `/admin/login` accessible even when LP is active
10. **Complete Isolation** — Own component, own CSS variables, no shared layout/logic with Website or My Account

### Map Improvements (Apr 8, 2026)
- MapBlock crash fix, Maps "Open in new tab" fix, Global Maps Language setting (11 languages), Interactive Map Picker, Tile provider integration via mapConfig.js

## Landing Page Architecture
```
Settings (MongoDB):
  landing_page_enabled: boolean
  landing_page_launch_date: ISO datetime
  landing_page_logo: image URL
  landing_page_bg_image: image URL
  theme_colors.landing_page: { 25 color fields }

Collections:
  landing_content: { hero_title, hero_subtitle, hero_positioning, btn1-3_text, desc_title/subtitle/body/cta_text, contact_title/btn_text, notify_title/text/btn_text, footer_text, cookie_message }
  landing_subscribers: { id, first_name, last_name, email, created_at }
  landing_contacts: { id, first_name, last_name, email, message, created_at }

API Endpoints:
  GET/PUT /api/admin/landing-content
  GET/DELETE /api/admin/landing-subscribers/:id
  GET/DELETE /api/admin/landing-contacts/:id
  POST /api/public/landing-subscribe
  POST /api/public/landing-contact
  GET /api/public/landing-content
```

## Credentials
Admin: admin@consultant.com / Admin123!

## Pending/Backlog
- (P2) S3/Cloud Image Storage migration
- (P2) Production SMTP Configuration
