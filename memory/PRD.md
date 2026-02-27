# Legacy Consultant Website - PRD

## Original Problem Statement
Multi-page consultant website ("Legacy") with login, CMS admin panel, Stripe payments, JWT + Google OAuth auth, interactive Leaflet maps, blog, gallery, reading list, portfolio, testimonials, contact form. Brand: "Legacy". Dark navy + white + teal color scheme.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Leaflet + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT custom auth + Emergent Google OAuth
- **Payments**: Stripe (via emergentintegrations library)
- **Map**: React-Leaflet (open-source, no API key)
- **Email**: aiosmtplib for SMTP

## User Personas
1. **Public Visitor**: Views homepage, news, gallery, reading list, map, contact form
2. **Admin**: Manages all content via CMS at /admin
3. **Registered User**: Can login to access protected pages, separate from admin

## Core Requirements (Phase 1 - COMPLETE)
- Public homepage with 11 sections (hero, about, services, news, external blog, reading list, map, portfolio, gallery, testimonials, contact)
- Internal pages: News listing + detail, Reading List, Gallery, Map detail, Terms, Privacy
- Admin panel with full CRUD for all content
- Stripe payment integration for services/products
- JWT + Google OAuth authentication
- Interactive Leaflet map with dynamic markers
- Contact form with DB storage
- Responsive design (mobile-first)
- Section enable/disable from CMS

## Phase 2 Requirements (COMPLETE)
- **Separate Login Flows**: User/Admin tabs in LoginModal, role-based access control
- **Dynamic Pages Module**: CRUD for nav_pages with header/footer visibility, ordering, login-required, external URL support
- **User Management**: Admin CRUD for frontend user accounts
- **Color Management**: Full website color theming via CMS (14 color variables)
- **Social Links**: Configurable social media links in header/footer
- **Advanced SMTP**: Configure host, port, user, pass with Test Connection and Send Test Email
- **External Blog API**: Proxy to external blog API URL for "From Our Blog" section
- **Reading List Redesign**: Quote, intro text, book grid with detail modal (synopsis, who_is_it_for, about_author)
- **Map Marker Links**: Link field on map locations
- **Password Recovery**: Forgot password and reset token flow for users

## What's Been Implemented
### Phase 1 (Feb 26, 2026) - COMPLETE
- Full backend API (35+ endpoints) with seed data
- Homepage with all sections
- All internal pages
- Admin panel with 13 managers
- JWT login + Google OAuth
- Stripe checkout integration
- Interactive Leaflet map
- Contact form submission
- Settings manager
- Professional branding (Playfair Display + Manrope fonts)

### Phase 2 (Feb 27, 2026) - COMPLETE
- Separate admin/user login flows with tabs
- Dynamic Pages Manager (nav_pages CRUD)
- Users Manager (frontend user CRUD)
- Settings Manager with 6 tabs (General, Colors, Sections, Social Links, Email/SMTP, Blog API)
- External blog API proxy
- Reading List page redesign with book detail modal
- CSS variables for global color theming
- Social links bar in header/footer
- Map location link field
- Password recovery flow (forgot/reset)
- DynamicPage component for CMS-managed pages
- Book data migration for extended fields

### Testing (Feb 27, 2026)
- Phase 1: 35/35 backend tests passed
- Phase 2: 22/22 backend tests + all 16 UI features verified

## Prioritized Backlog
### P1 (Important)
- [ ] Rich text editor (WYSIWYG) in admin for blog/page content
- [ ] Image upload functionality (currently URL-based)
- [ ] Map marker clustering on zoom out

### P2 (Nice to have)
- [ ] Blog pagination on frontend
- [ ] Search functionality
- [ ] SEO meta tags per page
- [ ] Advanced analytics in admin dashboard
- [ ] Export contacts as CSV
- [ ] Bulk operations in admin

### Refactoring
- [ ] Split server.py into modular FastAPI routers

## Key Credentials
- **Admin**: admin@consultant.com / Admin123!
- **User**: user@example.com / User123!

## Key API Endpoints
- POST /api/auth/login (with login_type: 'admin'|'user'|'any')
- GET/POST/PUT/DELETE /api/admin/nav-pages
- GET/POST/PUT/DELETE /api/admin/users
- GET/PUT /api/admin/settings
- POST /api/admin/smtp/test-connection
- POST /api/admin/smtp/test-email
- GET /api/blog/latest (external proxy)
- GET /api/public/nav-pages
- GET /api/public/settings

## Key DB Collections
- users: {user_id, email, password_hash, role, first_name, last_name, phone}
- settings: {brand_name, colors, social_links[], smtp_*, blog_api_url, sections}
- nav_pages: {title, url, show_in_header, show_in_footer, order, login_required, page_type}
- pages: {page_type, title, content, banner_image}
- books: {title, author, synopsis, who_is_it_for, about_author, amazon_link, other_links[]}
- map_locations: {name, lat, lng, description, category, link}
