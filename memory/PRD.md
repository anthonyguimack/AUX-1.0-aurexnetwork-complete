# Legacy Consultant Website - PRD

## Original Problem Statement
Multi-page consultant website ("Legacy") with login, CMS admin panel, Stripe payments, JWT + Google OAuth auth, interactive Leaflet maps, blog, gallery, reading list, portfolio, testimonials, contact form. Brand: "Legacy". Dark navy + white + teal color scheme.

## Architecture
```
/app/backend/
  server.py              # App entry, seed data, router orchestration
  models/
    database.py          # MongoDB, auth helpers, JWT, password hashing, SMTP
  routes/
    auth.py              # Login, logout, session exchange, password recovery
    public.py            # Public content, search, external blog, contact form
    admin_content.py     # Admin CRUD for all collections + dashboard
    admin_tools.py       # Upload, bulk ops, analytics, SEO, section order, SMTP
    payments.py          # Stripe checkout, webhook, status
/app/frontend/
  src/
    components/
      RichTextEditor.js  # ReactQuill WYSIWYG wrapper
      ImageUpload.js     # Drag-drop + URL image upload
      SearchBar.js       # Global search with debounce
      LoginModal.js      # User/Admin tab switcher
      layout/
        Navbar.js        # Social bar + nav + search
        Footer.js        # Dynamic pages + social links
    pages/
      admin/
        AnalyticsDashboard.js  # Recharts charts
        SectionOrderManager.js # @dnd-kit drag-and-drop
        SeoManager.js          # Per-page meta tags
        BlogManager.js         # WYSIWYG + image upload + bulk ops
        ContactsManager.js     # CSV export + bulk ops
        GalleryManager.js      # Image upload + bulk delete
```

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Leaflet + Framer Motion + Recharts
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT + Emergent Google OAuth
- **Payments**: Stripe
- **Editor**: React-Quill-New (React 19 compatible)
- **Drag-Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Map Clustering**: react-leaflet-markercluster + leaflet.markercluster
- **Email**: aiosmtplib

## Completed Features

### Phase 1 (Feb 26, 2026) - COMPLETE
- Full backend API (35+ endpoints) with seed data
- Homepage with 11 sections
- All internal pages (News, Gallery, Reading List, Map, Terms, Privacy)
- Admin panel with 13 managers
- JWT login + Google OAuth
- Stripe checkout integration
- Interactive Leaflet map

### Phase 2 (Feb 27, 2026) - COMPLETE
- Separate admin/user login flows
- Dynamic Pages Manager (nav_pages CRUD)
- Users Manager (frontend user CRUD)
- Settings Manager with 6 tabs
- External blog API proxy
- Reading List redesign with book detail modal
- CSS variable theming
- Social links
- Password recovery flow

### Batch 1-3 Features (Feb 27, 2026) - COMPLETE
- WYSIWYG rich text editor (ReactQuill) in Blog + Pages managers
- Image upload (drag-drop + URL fallback) in Blog, Gallery, Hero, Portfolio, Pages
- Drag-and-drop homepage section reordering
- Map marker clustering (react-leaflet-markercluster)
- Blog pagination (already existed)
- Global search bar (search across blog, services, portfolio, books, pages)
- SEO Manager (per-page meta title, description, OG image)
- Advanced Analytics Dashboard (monthly contacts/revenue charts, content stats)
- CSV contact export
- Bulk delete in Blog, Gallery, Contacts managers
- Bulk mark-as-read in Contacts

### Batch 4: Refactoring (Feb 27, 2026) - COMPLETE
- Backend split into modular FastAPI routers
- Shared database/auth module extracted
- 5 route modules: auth, public, admin_content, admin_tools, payments

## Testing History
- Phase 1: 35/35 backend (iteration_1.json)
- Phase 2: 22/22 backend + 16/16 frontend (iteration_2.json)
- Batch 1-3: 23/25 backend + 100% frontend (iteration_3.json)
- Post-refactoring: 44/44 backend + 17/17 frontend (iteration_4.json)

## Key Credentials
- **Admin**: admin@consultant.com / Admin123!
- **User**: user@example.com / User123!

## Remaining Backlog
All tasks from the original plan have been completed. No remaining items.
