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
                         # sectors/industries/companies endpoints, members-list
/app/frontend/src/
  components/
    LoginModal.js        # Unified login (no tabs), Google OAuth, Register link
    TreeNode.js          # Iterative community tree renderer
  lib/
    api.js               # Unified auth_token for all APIs (incl. memberAPI)
    auth.js              # Main auth provider
    memberAuth.js        # Thin wrapper over useAuth()
  pages/
    admin/
      MembersManager.js  # SELECT: Sponsor, Mentor (mentors only), Member Type;
                         # Radio: Mentor YES/NO, Portfolio Development YES/NO
    myaccount/
      MembershipProfile.js  # Tabs: General Info, Social Links, Activities + Biography modal
      MentorshipProfile.js  # Assigned mentor info
      MyCommunity.js        # Tree view + clickable search results list
      PortfolioForm.js      # Cascading selects, Shared Members, Status
```

## DB Schema
- `members`: ALL users (admin/member). Fields: member_id, membership_id, email, password_hash, role, is_mentor, portfolio_development, sponsor_id, mentor_id, social_links, biography, cover_image
- `sectors`: {id, name}
- `industries`: {id, name, sector_id}
- `companies`: {id, symbol, name, security, sector_id, industry_id, price}
- `portfolios`: {id, owner_member_id, title, holdings[], status(active/inactive), shared_mode(all/select), shared_with[]}
- `invite_codes`, `settings`, `nav_pages`, etc.

## Completed Features

### Phase 1-2 (Initial + CMS Enhancement) - COMPLETE
- Full public website, admin panel, JWT + Google OAuth, WYSIWYG, image upload, drag-drop, maps, search, analytics, SEO

### Phase 3 (Membership System) - COMPLETE
- Member portal, invite codes, sponsor tree, portfolios, admin Members Manager

### Phase A (Auth Unification) - COMPLETE (Mar 27, 2026)
- Unified users/members into single `members` collection
- Single login system for both Navbar and /my-account
- Navbar shows "My Account" + "Admin Panel" (for admins)
- **Phase A Fixes**: Email=Username, CMS Sponsor/Mentor as SELECT dropdowns, Member Type SELECT

### Phase B (Membership Profile Redesign) - COMPLETE (Mar 27, 2026)
- Membership Profile page with 3 tabs: General Info (view/edit), Social Links, Activities
- Update Biography moved to modal button (removed from sidebar)
- Sidebar: Membership Profile, Mentorship Profile, My Sponsor, Invite Code, My Community, Portfolios

### Phase D (Portfolio Overhaul) - COMPLETE (Mar 27, 2026)
- Sectors/Industries/Companies DB tables with 6 sectors, 13 industries, 15 companies
- Cascading selects in portfolio form (Sector → Industry → Symbol auto-populates security/price)
- Shared Members: All Members / Select Members with member search picker
- Status: Active/Inactive with visibility rules
- Rich text description, cover image, date picker fix

### Phase E (Community Polish) - COMPLETE (Mar 27, 2026)
- My Community search shows clickable results list below search bar (CODE + Full Name)

## Testing History
- Phase 1: 35/35 backend (iteration_1.json)
- Phase 2: 22/22 + 16/16 frontend (iteration_2.json)
- Batch 1-3: 23/25 + frontend (iteration_3.json)
- Post-refactoring: 44/44 + 17/17 (iteration_4.json)
- Phase 3: 13/13 + 12/12 (iteration_5.json)
- Phase A: 13/13 + 14/14 (iteration_6.json)
- Phases A-E: 13/13 + 19/19 (iteration_7.json)

## Key Credentials
- **Admin**: admin@consultant.com / Admin123!

## Remaining Backlog
- **(P1) Phase C — User Levels & Permissions**: CMS-managed levels controlling sidebar visibility, dynamic sidebar based on member's level, portfolio visibility rules
- **(P2)** Real S3/Cloud image storage
- **(P2)** Production SMTP configuration
