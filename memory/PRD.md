# Legacy Consultant Website - PRD

## Original Problem Statement
Multi-page consultant website ("Legacy") with login, CMS admin panel, Stripe payments, JWT + Google OAuth auth, interactive Leaflet maps, blog, gallery, reading list, portfolio, testimonials, contact form. Brand: "Legacy". Dark navy + white + teal color scheme.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Leaflet + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT custom auth + Emergent Google OAuth
- **Payments**: Stripe (via emergentintegrations library)
- **Map**: React-Leaflet (open-source, no API key)

## User Personas
1. **Public Visitor**: Views homepage, news, gallery, reading list, map, contact form
2. **Admin**: Manages all content via CMS at /admin
3. **Client**: Can login to access protected pages

## Core Requirements
- Public homepage with 10 sections (hero, about, services, blog, reading list, map, portfolio, gallery, testimonials, contact)
- Internal pages: News listing + detail, Reading List, Gallery, Map detail, Terms, Privacy
- Admin panel with full CRUD for all content
- Stripe payment integration for services/products
- JWT + Google OAuth authentication
- Interactive Leaflet map with dynamic markers
- Contact form with DB storage
- Responsive design (mobile-first)
- Section enable/disable from CMS
- Page access control from CMS

## What's Been Implemented (Feb 26, 2026)
- ✅ Full backend API (35+ endpoints) with seed data
- ✅ Homepage with all 10 sections
- ✅ All internal pages (News, Gallery, Reading List, Map Detail, Terms, Privacy)
- ✅ Admin panel with 13 managers (Dashboard, Hero, About, Services, Blog, Books, Maps, Gallery, Portfolio, Testimonials, Contacts, Purchases, Settings)
- ✅ JWT login + Google OAuth
- ✅ Stripe checkout integration
- ✅ Interactive Leaflet map with markers
- ✅ Contact form submission
- ✅ Settings manager (sections toggle, page access, social media, SMTP, appearance)
- ✅ Professional branding (Playfair Display + Manrope fonts, Navy + Teal palette)

## Prioritized Backlog
### P0 (Critical) - DONE
- [x] Full CRUD for all content types
- [x] Auth system (JWT + Google OAuth)
- [x] Stripe payments
- [x] All public pages

### P1 (Important)
- [ ] Rich text editor (WYSIWYG) in admin for blog/page content
- [ ] Image upload functionality (currently URL-based)
- [ ] Marker clustering on map zoom out
- [ ] Dark/light map style toggle
- [ ] Email notifications for contact form (real SMTP)

### P2 (Nice to have)
- [ ] Blog pagination on frontend
- [ ] Search functionality
- [ ] SEO meta tags per page
- [ ] Advanced analytics in admin dashboard
- [ ] Export contacts as CSV
- [ ] Bulk operations in admin

## Next Tasks
1. Add WYSIWYG rich text editor for blog/page content editing
2. Implement image upload (S3 or local)
3. Add marker clustering on the Leaflet map
4. Configure real SMTP for contact form emails
5. Add search functionality across the site
