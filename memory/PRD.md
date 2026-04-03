# Legacy Consultant Website - PRD

## Original Problem Statement
Multi-page consultant website ("Legacy") with login, CMS admin panel, Stripe payments, JWT + Google OAuth auth, interactive maps, blog, gallery, reading list, portfolio, testimonials, contact form. Membership system with invite codes, sponsor trees, portfolio management. Visual Page Builder with 14 layouts and block-based content management.

## Architecture
```
/app/backend/
  server.py              # App entry, seed data
  models/database.py     # MongoDB, unified auth, JWT, SMTP, UPLOAD_DIR
  routes/
    auth.py              # Unified login, session exchange, password
    public.py            # Public content, search, blog, contact
    admin_content.py     # Admin CRUD, dashboard
    admin_tools.py       # Upload (admin), analytics, SEO, section order, SMTP
    payments.py          # Stripe checkout, webhook
    membership.py        # Member CRUD, invite codes, community tree, portfolios,
                         # sectors/industries/companies, geo, levels, member upload
/app/frontend/src/
  components/
    admin/
      PageBuilder.js       # Zone-based block editor (add/edit/delete/reorder blocks)
      BlockConfigModal.js  # Block configuration forms per block type
    layouts/
      BlockRenderer.js     # Renders individual blocks (9 types)
      LayoutRenderer.js    # Renders 14 builder layouts with zone arrangements
      LayoutAboutBio.js    # Legacy layout_1
      LayoutServicesGrid.js # Legacy layout_2
      LayoutGalleryAlbums.js # Legacy layout_3
      LayoutFullContent.js  # Legacy layout_5
  lib/
    layoutDefinitions.js  # LAYOUTS (14), BLOCK_TYPES (9), zone/block configs
  pages/
    admin/
      PagesManager.js     # Tabs (Settings/Content), layout selector, PageBuilder
    DynamicPage.js        # Routes to LayoutRenderer or legacy layouts
```

## DB Schema
- `members`: ALL users. Fields: member_id, membership_id, email, password_hash, role, level_id, is_mentor, sponsor_id, mentor_id, country, state, city
- `nav_pages`: { id, title, url, layout, zones: { zoneName: [{ id, type, order, config }] }, show_in_header, show_in_footer, login_required, open_in_new_tab, order, summary, content, page_type, layout_image }
- `portfolios`: {id, owner_member_id, title, holdings[], status, shared_mode, shared_with[], cash_balance}
- `member_levels`, `member_types`, `countries`, `states`, `cities`, `sectors`, `industries`, `companies`

## Page Builder Architecture

### 14 Visual Builder Layouts
Each layout defines zones (content areas) where blocks are placed:
1. **Full Width** — zones: [main]
2. **Boxed** — zones: [main]
3. **Split Screen** — zones: [left, right]
4. **Grid 2x2** — zones: [cell_1, cell_2, cell_3, cell_4]
5. **Masonry** — zones: [main]
6. **List** — zones: [main]
7. **Carousel** — zones: [main]
8. **Two Column** — zones: [main, sidebar]
9. **Three Column** — zones: [col_1, col_2, col_3]
10. **Profile** — zones: [sidebar, main]
11. **Card Based** — zones: [main]
12. **Hero Banner** — zones: [hero, main]
13. **Sidebar** — zones: [sidebar, main]
14. **Landing Page** — zones: [hero, features, cta]

### 10 Block Types
1. Rich Text — WYSIWYG content
2. Image — Upload/URL with alt, caption, link
3. Video — YouTube/Vimeo embed
4. Service List — Auto-fetches all services
5. Gallery — Auto-fetches gallery albums
6. Profile Card — Name, title, photo, bio
7. Button — CTA with text, URL, style (primary/outline)
8. Separator — Line, dots, or space
9. Custom HTML — Raw HTML injection
10. Legends & Testimonials — Auto-sliding quote carousel

### 5 Legacy/Preset Layouts (backward compat)
- Default — RichTextEditor content
- About/Bio (layout_1) — Image + text + social
- Services Grid (layout_2) — Auto-populates services
- Gallery Albums (layout_3) — Auto-populates albums
- Full Content (layout_5) — Centered text

## Completed Features

### Phase 1-2 (Initial + CMS Enhancement) - COMPLETE
- Full public website, admin panel, JWT + Google OAuth, WYSIWYG, image upload, drag-drop, maps, search, analytics, SEO

### Phase 3 (Membership System) - COMPLETE
- Member portal, invite codes, sponsor tree, portfolios, admin Members Manager

### Phase A-E (Auth, Profile, Portfolio, Community) - COMPLETE
- Unified auth, membership profile, portfolio overhaul, community tree, member levels

### Theme Engine & Color Management - COMPLETE
- 3 themes (Default, Modern, Classic), 67-color management system, per-theme homepage sections

### Logo/Favicon, Footer CMS, Per-Page Layout System - COMPLETE
- Dual logo system, dynamic footer, per-page layouts, gallery albums

### Visual Page Builder (Apr 3, 2026) - COMPLETE
- **14 Visual Builder Layouts**: Full Width, Boxed, Split Screen, Grid 2x2, Masonry, List, Carousel, Two Column, Three Column, Profile, Card Based, Hero Banner, Sidebar, Landing Page
- **9 Block Types**: Rich Text, Image, Video, Service List, Gallery, Profile Card, Button, Separator, Custom HTML
- **Zone-based editing**: Each layout defines zones, blocks added/edited/reordered/deleted per zone with **drag-and-drop reordering** (@dnd-kit/sortable v10)
- **PagesManager overhaul**: Two tabs (Settings / Content & Layout), visual layout selector with thumbnail previews
- **LayoutRenderer**: Public rendering of all 14 layouts with correct zone arrangements
- **BlockRenderer**: Renders all 9 block types with proper styling
- **Backward compatible**: Legacy layouts (layout_1 through layout_5) still work
- **Homepage Service Links**: "Read More" links on service cards navigate to /service/:id across all 3 themes
- Testing: 39/39 backend + 100% frontend verification (Iteration 28)

### CMS Bug Fixes & Legends Block (Apr 3, 2026) - COMPLETE
- **Gallery block URL fix**: Changed `/gallery/:id` to `/album/:id` in BlockRenderer
- **Scroll to top**: Added ScrollToTop component with retry-based hash anchor scrolling
- **Hyphen word-break**: CSS `word-break: normal; hyphens: manual; overflow-wrap: break-word`
- **H1 headings**: Added `.rich-text-content h1` CSS rule with Playfair Display
- **Nested lists**: Added indent/outdent buttons + CSS for nested ul/ol in RichTextEditor
- **Short description HTML**: Service cards now render `short_description` as rich text HTML
- **Hero text colors**: Removed `[&_strong]:text-white` forced selectors, preserved Quill inline styles; added predefined color palette with explicit #000000 (black)
- **Hero media dimensions**: Admin can set custom `media_width` and `media_height` for hero images/videos
- **Service external URL**: Services can have `external_url` + `open_in_new_tab` for custom links when no full_content
- **Anchor scrolling**: Hash URLs like `/#services` scroll to the correct homepage section via Navbar + ScrollToTop
- **Legends & Testimonials block**: New block type with auto-sliding carousel (5s), arrow nav, dot indicators. Enhanced TestimonialsManager with image upload + ordering
- Testing: 16/16 backend + 95% frontend (Iteration 29)

## Testing History
- Phase 1: 35/35 backend
- Phase 2: 22/22 + 16/16 frontend
- Post-refactoring: 44/44 + 17/17
- Phase 3: 13/13 + 12/12
- Phase A: 13/13 + 14/14
- Phases A-E: 13/13 + 19/19
- Phase F UI/UX: 11/11 + 26/26
- Phase C + APIs: 9/9 + 19/19
- Bug fixes: 7/7 + visual
- Bug fixes R2: tested
- Hero Slides: 17/17 + 100%
- Hero Improvements: tested
- Hero Responsive: 17/17 + 100%
- CMS Pages & Hero: 20/20 + 100%
- Banner/Member Types: 17/17 + 100%
- Permissions/Page Access: 12/12 + 100%
- Mentor Migration: 11/11 + 100%
- Ebank/QR: 14/14 + 100%
- Membership Settings: 11/11 + 100%
- Profile/Ebank Fixes: 9/9 + 100%
- Colors/Themes: 11/11 + 100%
- Theme HomePage: 22/22 + 100%
- Colors/Logos: 12/12 + 100%
- Logos/Footer: 16/16 + 100%
- Footer/Layout System: 23/23 + 100%
- Footer 4-Col/Hero Fix: 19/19 + 100%
- **Visual Page Builder: 39/39 + 100% (Iteration 28)**
- **CMS Bug Fixes & Legends: 16/16 + 95% (Iteration 29)**

## Key Credentials
- **Admin**: admin@consultant.com / Admin123!

## Remaining Backlog
- **(P2)** Real S3/Cloud image storage (currently local uploads)
- **(P2)** Production SMTP configuration
