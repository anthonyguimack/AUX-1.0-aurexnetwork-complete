# Legacy Consultant Website - PRD

## Original Problem Statement
Multi-page consultant website ("Legacy") with login, CMS admin panel, Stripe payments, JWT + Google OAuth auth, interactive maps, blog, gallery, reading list, portfolio, testimonials, contact form. Membership system with invite codes, sponsor trees, portfolio management.

## Architecture
```
/app/backend/
  server.py              # App entry, seed data (incl. sectors/industries/companies)
  models/database.py     # MongoDB, unified auth (members collection), JWT, SMTP
  routes/
    auth.py              # Unified login (members table), session exchange, password
    public.py            # Public content, search, external blog, contact
    admin_content.py     # Admin CRUD, dashboard (counts from members)
    admin_tools.py       # Upload, analytics, SEO, section order, SMTP
    payments.py          # Stripe checkout, webhook
    membership.py        # Member CRUD, invite codes, community tree, portfolios,
                         # sectors/industries/companies, geo (countries/states/cities),
                         # member levels
/app/frontend/src/
  components/
    LoginModal.js        # Unified login (no tabs), Google OAuth, Register link
    TreeNode.js          # Iterative community tree renderer
  lib/
    api.js               # Unified auth_token for all APIs (incl. memberAPI, geoAPI)
    auth.js              # Main auth provider
    memberAuth.js        # Thin wrapper over useAuth()
  pages/
    admin/
      MembersManager.js  # SELECT: Sponsor, Mentor, Member Type
      MemberLevelsManager.js # CRUD for member levels with permissions
      SettingsManager.js # Tabs: General, Colors, Sections, Social, Email/SMTP, Blog API, Membership, APIs
    myaccount/
      MyAccountLayout.js    # Dynamic sidebar filtered by member's level permissions
      MembershipProfile.js  # Cascading Country/State/City, tabs, Bio modal (no cover image)
      MentorshipProfile.js  # Mentor info display with empty state handling
      PortfolioForm.js      # Rank/Cost fields, single-row layout, delete confirmation, no Activities
      PortfolioDetail.js    # 10 columns, 3 pie charts, ownership-based edit button
      PortfolioList.js      # mm/dd/yyyy dates, $0.00 currencies, HTML-stripped descriptions
```

## DB Schema
- `members`: ALL users (admin/member). Fields: member_id, membership_id, email, password_hash, role, is_mentor, portfolio_development, sponsor_id, mentor_id, social_links, biography, cover_image, country, state, city, level_id
- `sectors`: {id, name}
- `industries`: {id, name, sector_id}
- `companies`: {id, symbol, name, security, sector_id, industry_id, price}
- `portfolios`: {id, owner_member_id, title, holdings[{symbol, security, sector, industry, price, cost, shares, rank}], status, shared_mode, shared_with[], cash_balance}
- `countries`, `states`, `cities`: Hierarchical location collections
- `member_levels`: {id, name, permissions[], order}
- `invite_codes`, `settings`, `nav_pages`, etc.

## Completed Features

### Phase 1-2 (Initial + CMS Enhancement) - COMPLETE
- Full public website, admin panel, JWT + Google OAuth, WYSIWYG, image upload, drag-drop, maps, search, analytics, SEO

### Phase 3 (Membership System) - COMPLETE
- Member portal, invite codes, sponsor tree, portfolios, admin Members Manager

### Phase A (Auth Unification) - COMPLETE (Mar 27, 2026)
- Unified users/members into single `members` collection
- Single login system for both Navbar and /my-account
- **Phase A Fixes**: Email=Username, CMS Sponsor/Mentor as SELECT dropdowns, Member Type SELECT

### Phase B (Membership Profile Redesign) - COMPLETE (Mar 27, 2026)
- Membership Profile page with 3 tabs: General Info (view/edit), Social Links, Activities
- Update Biography moved to modal button (removed from sidebar)

### Phase D (Portfolio Overhaul) - COMPLETE (Mar 27, 2026)
- Sectors/Industries/Companies DB tables with 6 sectors, 13 industries, 15 companies
- Cascading selects in portfolio form (Sector -> Industry -> Symbol auto-populates)
- Shared Members: All Members / Select Members with member search picker

### Phase E (Community Polish) - COMPLETE (Mar 27, 2026)
- My Community search shows clickable results list below search bar

### Phase F (My Account UI/UX Updates) - COMPLETE (Mar 27, 2026)
- MembershipProfile: Cascading Country/State/City, Cover Image removed from Bio modal
- MentorshipProfile: Fixed mentor display with empty state
- PortfolioForm: Rank/Cost, single-row layout, delete confirmation, no Activities
- PortfolioDetail: 10 columns, 3 pie charts, ownership edit hide
- Global formatting: mm/dd/yyyy, $0.00, 0.00%

### Phase C (Member Levels & Permissions) - COMPLETE (Mar 27, 2026)
- CMS Member Levels Manager with permission checkboxes for each sidebar section
- Dynamic My Account sidebar: filters nav items based on member's assigned level
- Admins see all items; members without level see all items; members with level see only permitted items

### CMS Settings APIs Tab - COMPLETE (Mar 27, 2026)
- New "APIs" tab in Settings listing all 6 third-party integrations (Stripe, Google OAuth, SMTP, Blog API, Leaflet, MongoDB)
- Active/Inactive status indicators based on configuration

## Testing History
- Phase 1: 35/35 backend (iteration_1.json)
- Phase 2: 22/22 + 16/16 frontend (iteration_2.json)
- Batch 1-3: 23/25 + frontend (iteration_3.json)
- Post-refactoring: 44/44 + 17/17 (iteration_4.json)
- Phase 3: 13/13 + 12/12 (iteration_5.json)
- Phase A: 13/13 + 14/14 (iteration_6.json)
- Phases A-E: 13/13 + 19/19 (iteration_7.json)
- Phase F (UI/UX): 11/11 + 26/26 (iteration_8.json)
- Phase C + APIs Tab: 9/9 + 19/19 (iteration_9.json)

## Key Credentials
- **Admin**: admin@consultant.com / Admin123!

## Remaining Backlog
- **(P2)** Real S3/Cloud image storage (currently local uploads)
- **(P2)** Production SMTP configuration
