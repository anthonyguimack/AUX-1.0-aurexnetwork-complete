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
- Visual drag-and-drop canvas: Replaced manual X/Y inputs with interactive canvas editor (5 color-coded draggable blocks)
- Subtitle color: Changed to white to match title styling
- Expired slides properly excluded from public website

## Key Credentials
- **Admin**: admin@consultant.com / Admin123!

## Remaining Backlog
- **(P2)** Real S3/Cloud image storage (currently local uploads)
- **(P2)** Production SMTP configuration
