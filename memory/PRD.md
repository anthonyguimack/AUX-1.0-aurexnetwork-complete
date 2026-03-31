# Legacy Consultant Website - PRD

## Original Problem Statement
Multi-page consultant website ("Legacy") with login, CMS admin panel, Stripe payments, JWT + Google OAuth auth, interactive maps, blog, gallery, reading list, portfolio, testimonials, contact form. Membership system with invite codes, sponsor trees, portfolio management.

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
    MemberImageUpload.js # Upload + URL combo for member-accessible image uploads
  pages/
    admin/
      SettingsManager.js # Tabs: General, Colors, Sections, Social, Email/SMTP, Blog API, Membership, APIs
      MemberLevelsManager.js # CRUD for member levels with permissions
    myaccount/
      MyAccountLayout.js    # Dynamic sidebar with route protection + loading state
      MembershipProfile.js  # Cascading geo, editable email, avatar upload+URL
      PortfolioForm.js      # Rank/Cost, sort by rank on load, MemberImageUpload for cover
      PortfolioDetail.js    # CASH row, 4 charts, 9 columns (no Cost), date fix
      PortfolioList.js      # HTML descriptions, timezone-safe dates
```

## DB Schema
- `members`: ALL users. Fields: member_id, membership_id, email, password_hash, role, level_id, is_mentor, sponsor_id, mentor_id, country, state, city
- `portfolios`: {id, owner_member_id, title, holdings[{symbol, security, sector, industry, price, cost, shares, rank}], status, shared_mode, shared_with[], cash_balance}
- `member_levels`: {id, name, permissions[], order}
- `countries`, `states`, `cities`: Hierarchical location collections
- `sectors`, `industries`, `companies`: Stock reference data

## Completed Features

### Phase 1-2 (Initial + CMS Enhancement) - COMPLETE
- Full public website, admin panel, JWT + Google OAuth, WYSIWYG, image upload, drag-drop, maps, search, analytics, SEO

### Phase 3 (Membership System) - COMPLETE
- Member portal, invite codes, sponsor tree, portfolios, admin Members Manager

### Phase A (Auth Unification) - COMPLETE
- Unified users/members into single `members` collection, single login

### Phase B-E (Profile, Portfolio, Community) - COMPLETE
- Membership Profile with tabs, Bio modal, cascading geo selects
- Portfolio overhaul with sectors/industries/companies, shared members
- Community tree with searchable results

### Phase C (Member Levels & Permissions) - COMPLETE
- CMS Member Levels Manager, dynamic sidebar filtering, route protection

### CMS Settings APIs Tab - COMPLETE
- Lists 6 integrations (Stripe, Google OAuth, SMTP, Blog API, Leaflet, MongoDB) with Active/Inactive status

### Bug Fixes & UX Improvements (Mar 27, 2026) - COMPLETE
- **Sidebar route protection**: Members can't access restricted sections via URL
- **Sidebar flash fix**: Loading spinner shown while permissions load (no flash)
- **Default Level 1**: New members auto-assigned lowest-order level on registration
- **Email editable**: Members can change email (syncs username)
- **Avatar upload + URL**: MemberImageUpload component supports both file upload and URL input
- **Member upload endpoint**: POST /api/member/upload accessible to any authenticated member
- **Date timezone fix**: Dates parsed as YYYY-MM-DD directly (no Date object timezone shift)
- **Portfolio list**: HTML description rendering (bold/italic visible), correct dates
- **Portfolio view**: "Price" column (renamed from "Share Price"), Cost column hidden
- **CASH row**: Added at rank 0 with cash_balance as price, 1 share, CASH for all text fields
- **Total includes CASH**: Grand total = stocks + cash
- **4 charts**: Current Stock Holdings, By Sector, By Industry, Portfolio Balance (2x2 grid, 280px height)
- **Portfolio edit sort**: Holdings sorted by rank on load
- **Portfolio form columns**: Symbol narrower, Security wider for readability

## Testing History
- Phase 1: 35/35 backend
- Phase 2: 22/22 + 16/16 frontend
- Post-refactoring: 44/44 + 17/17
- Phase 3: 13/13 + 12/12
- Phase A: 13/13 + 14/14
- Phases A-E: 13/13 + 19/19
- Phase F UI/UX: 11/11 + 26/26
- Phase C + APIs: 9/9 + 19/19
- Bug fixes: 7/7 backend + visual verification

### Bug Fixes Round 2 (Mar 28, 2026) - COMPLETE
- Route protection instant block: Unauthorized routes show spinner immediately (no content flash before redirect)
- Registration form: Removed Avatar section
- Portfolio charts CASH inclusion: CASH added to Current Stock Holdings, By Sector, and By Industry charts so percentages sum to 100%

### Hero Slides CRUD (Mar 28, 2026) - COMPLETE
- Full CRUD: List table (Title, Subtitle, Type, Dates, Actions), Add/Edit form, Delete with confirmation
- Form sections: Timer (date start/end), WYSIWYG (title/subtitle/desc), Links (button text/url/window), Slide Type (photo/video), Background, Animation Effects (5 selects), X/Y Coordinates (5 pairs), Revolution Slider Params (transition, speed, delays)
- Frontend hero renders multiple slides with layer animations, auto-rotation, and indicator dots
- Backward compatible: Falls back to legacy single-doc hero if no slides exist

### Hero Slides Improvements (Mar 28, 2026) - COMPLETE
- Timer filtering: Public endpoint only returns slides within their date_start/date_end range
- Visual drag-and-drop canvas: Replaced manual X/Y inputs with interactive canvas editor
- Subtitle color: Changed to white to match title styling
- Expired slides properly excluded from public website
- Layer Positioning affects homepage: All layers use absolute positioning with X/Y coordinates from CMS
- Canvas background: Admin canvas shows the slide's background image with dark overlay for context

### Hero Responsive Layout Fix (Mar 30, 2026) - COMPLETE
- Desktop (lg+): Absolute positioning from CMS X/Y coordinates via `hidden lg:block` container
- Mobile & Tablet (<1024px): Stacked flex column layout via `lg:hidden` container - no text overlap
- Slide navigation indicator dots working across all viewports
- Testing: 17/17 backend + 100% frontend verification (Iteration 13)

### CMS Pages & Hero Improvements (Mar 30, 2026) - COMPLETE
- **Hero per-page assignment**: Each hero slide has `assigned_pages` array. Admin form shows checklist of all site pages. Public endpoint accepts `?page=X` to filter slides by page.
- **Pages content dynamic**: Backend syncs nav_pages to `pages` collection when `page_type` is set, so TermsPage/PrivacyPage always show latest CMS content.
- **Login Required URL protection**: New `PageProtectedRoute` in App.js checks nav_pages `login_required` field before rendering /terms, /privacy, /page/:pageId. Shows "Login Required" screen for unauthenticated users.
- **Open in New Tab fix**: Navbar and Footer use `<a target="_blank">` instead of `<Link>` for pages with `open_in_new_tab: true`.
- **Pages Manager reorganized**: Two tabs — Custom Pages (editable, deletable) and System Pages (built-in, read-only info display).
### Hero Per-Page Assignment & Custom Page Routing Fix (Mar 30, 2026) - COMPLETE
- **Hero on all pages**: Extracted HeroSection into shared component (`/components/HeroSection.js`). System pages (News, Gallery, Reading List) show hero slides via `SystemPageHero` in App.js. Custom pages (KLS, Terms, etc.) show hero slides via DynamicPage.
- **Custom page URL routing**: Added catch-all route `*` in App.js. DynamicPage now looks up pages by URL path (not just by ID). Custom pages like `/kls` now load correctly.
- **Terms/Privacy unified**: Both now route through DynamicPage for consistent hero + content rendering.
- Testing: 20/20 backend + 100% frontend verification (Iteration 15)

### Banner Image Removal & Member Types Module (Mar 30, 2026) - COMPLETE
- **Banner Image removed**: Removed from PagesManager form, DynamicPage, and all system pages (News, Gallery, ReadingList). Hero carousel is now the sole visual header system.
- **Member Types CRUD**: New `/api/admin/member-types` endpoints + `MemberTypesManager` admin page with full CRUD. Feeds the Member Type dropdown in Members form.
- **Extended Membership Info**: Added 14 fields to membership tab: Membership Ranking, Status (Free/Professional), Active Date, Expiration Date, Membership Fee, Member Type (dropdown from member_types), Corporate, Application Reviewer, Opportunities Development/Reviewer, Project Development/Reviewer/Management, Content Operator.
- Testing: 17/17 backend + 100% frontend verification (Iteration 16)

### Permissions Moved to Member Types + Page Access Control (Mar 30, 2026) - COMPLETE
- **Permissions on Member Types**: Moved all 10 role permission radio buttons (Corporate, Mentor, Portfolio Dev, Application Reviewer, Opportunities Dev/Reviewer, Project Dev/Reviewer/Management, Content Operator) from the Members form to the Member Types module. Types now have 3 tabs: General, Permissions, Page Access.
- **Page Access Checklist**: Each Member Type has a page access checklist (all site pages). Controls which pages members of that type can access.
- **Inherited Permissions**: When editing a member and selecting a type, inherited permissions + page count shown as read-only badges.
- **Page Access Enforcement**: PageProtectedRoute in App.js checks member's type `allowed_pages` before granting access to login-required pages. Admins bypass all restrictions.
- **Backend enrichment**: `/auth/me` and `/member/me` now return `_member_type` with `allowed_pages` and `permissions` dict.
- Testing: 12/12 backend + 100% frontend verification (Iteration 17)

### Mentor System Migrated to Member Types (Mar 30, 2026) - COMPLETE
- **Mentor dropdown now uses Member Types**: Admin Members form mentor dropdown populated from `GET /api/admin/mentors` which queries member types with `is_mentor: true`. Old per-member `is_mentor` flag no longer used for filtering.
- **New endpoints**: `GET /api/admin/mentors` and `GET /api/member/available-mentors` for type-based mentor lists.
- **My Account updated**: MentorshipProfile and MembershipProfile show mentor badge from `_member_type.permissions.is_mentor`.
- Testing: 11/11 backend + 100% frontend verification (Iteration 18)

### Ebank, Business Card QR, New Member Fields (Mar 30, 2026) - COMPLETE
- **New Personal Info fields**: HTTP Access (read-only, auto-captured from registration domain), Passport ID#, Zelle #
- **Ebank tab (Admin)**: Read-only display of 16 financial fields per member, populated from My Account
- **Business Card tab (Admin)**: Generate QR code for sponsor-based registration, "Click Here"/"View QR" toggle
- **My Ebank (My Account)**: Editable form for all 16 financial fields + Activities tab (auto-logs each field change with timestamp)
- **QR/Sponsor Registration**: New registration method via `?sponsor=X` param, independent from invite codes. QR URL built dynamically.
- **Passport ID#**: Added to My Account Membership Profile (edit + view modes)
- Testing: 14/14 backend + 100% frontend verification (Iteration 19)

### Membership Settings & Profile Action Buttons (Mar 31, 2026) - COMPLETE
- **Admin Membership Settings**: New CMS page (`/admin/membership-settings`) with checkbox grid for 16 profile + 16 ebank fields. Admin selects which fields are "mandatory" for profile completion.
- **Profile Completion Progress Bar**: Calculates % based only on admin-defined mandatory fields. Color-coded: red (<50%), gold (50-79%), green (80%+).
- **Change Password Modal**: Wired to `PUT /api/member/change-password` with min 8-char and match validation.
- **View Full Bio Modal**: Read-only display of member's formatted Summary & Biography HTML.
- **Steps to Complete Profile Modal**: Lists missing mandatory fields (red) and missing optional fields (gray) separately.
- **Backend endpoints**: `GET/PUT /api/admin/membership-settings`, `GET /api/public/membership-settings`, `PUT /api/member/change-password`
- Testing: 11/11 backend + 100% frontend verification (Iteration 20)

### Profile & Ebank Fixes (Mar 31, 2026) - COMPLETE
- **Passport ID# field bug fix**: Added `passport_id` to allowed update fields in backend. Label changed to "ID# (Passport or DNI or etc.)".
- **Bio Modal overhaul**: Close button (X) visible on dark bg, vertical-only scrolling (no horizontal overflow), proper WYSIWYG rendering (h1=2rem, h2=1.5rem, bold, italic, lists, blockquotes via `.bio-rich-content` CSS).
- **Profile Activities tab**: New detailed field-level activity log (like MyEbank), tracks old/new values with timestamps via `GET /api/member/profile-activities`.
- **iOS select fix**: Country/State/City/Gender selects use `text-base` (16px) + `colorScheme: 'dark'` to prevent iOS Safari zoom and picker issues.
- **Ebank date calendar**: Deposit Date & Target Date inputs get `colorScheme: 'dark'` for native calendar picker styling.
- Testing: 9/9 backend + 100% frontend verification (Iteration 21)

## Key Credentials
- **Admin**: admin@consultant.com / Admin123!

## Remaining Backlog
- **(P2)** Real S3/Cloud image storage (currently local uploads)
- **(P2)** Production SMTP configuration
