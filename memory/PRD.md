# Consultant CMS - Product Requirements Document

## Original Problem Statement
A multi-page website with a login, modern and production-ready, for a consultant. It includes a complete CMS admin panel, Stripe payment integration, Theme Switcher, 3-tier global Color Management, and a Phase 2 Visual Page Builder architecture allowing per-page layouts, block-based content zones, drag-and-drop block reordering, and 14 distinct layout types.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, @dnd-kit (Drag & Drop), Framer Motion, Leaflet, React-Quill
- **Backend**: FastAPI, Motor (Async MongoDB), Pydantic
- **Database**: MongoDB
- **Auth**: JWT + Emergent-managed Google OAuth
- **Payments**: Stripe (test key)

## Core Architecture
```
/app
├── backend/
│   ├── routes/               
│   │   ├── admin_content.py  
│   │   ├── public.py         
│   │   └── ...
│   └── server.py             
└── frontend/
    └── src/
        ├── admin/            # PagesManager.js, HeroSlideForm.js, TestimonialsManager.js
        ├── components/       
        │   ├── admin/        # PageBuilder.js, BlockConfigModal.js
        │   └── layouts/      # LayoutRenderer.js, BlockRenderer.js, LayoutServicesGrid.js
        ├── lib/              # layoutDefinitions.js, api.js
        ├── pages/            # DynamicPage.js, HomePage.js
        └── App.js            
```

## What's Been Implemented

### Phase 1 (Complete)
- Public website: Homepage with Hero, About, Services (Stripe), News/Blog, Reading List, Maps, Portfolio, Gallery, Testimonials, Contact
- Admin Panel: Full CRUD for all content sections
- JWT & Google OAuth authentication
- Responsive design with 3 themes (default, modern, classic)

### Phase 2 (Complete)
- Visual Page Builder with 14 layouts and zones
- Drag-and-drop block reordering (@dnd-kit)
- Theme Engine with 3-tier Color Management (website, admin, member area)
- Dynamic Pages module
- Separate admin/user login flows
- User management in admin
- SMTP configuration with test connection
- External Blog API integration
- Legends & Testimonials carousel block

### Bug Fixes (Feb 4, 2026)
- Service description HTML rendering (dangerouslySetInnerHTML + cleanHtml for &nbsp;)
- Word-break CSS fix (word-break: break-word, hyphens: auto)
- Service fallback link logic (always show /service/{id} if no external_url)
- Hero video input changed from iframe textarea to URL input
- HeroSection auto-detects YouTube/Vimeo URLs for embedding

### New Feature (Feb 4, 2026)
- **Hero Slide Live Preview**: Added a collapsible live preview panel to the Hero Slide Form in the admin CMS. Shows real-time rendering of background, title, subtitle, description, button, and media (video/photo) at their positioned X/Y coordinates. Supports YouTube/Vimeo auto-embed, rich text formatting, and updates instantly as the admin types.

## Credentials
- Admin: admin@consultant.com / Admin123!

## Pending/Backlog (P2)
- Real S3/Cloud Image Storage migration
- Production SMTP Configuration
- Split PageBuilder.js / PagesManager.js into smaller components
- Backend server.py modularization with APIRouter

## Mocked/Placeholder
- S3/Cloud Storage (using local container uploads)
- Production SMTP (configured but needs real credentials)
