# Legacy Consultant Website - PRD

## Original Problem Statement
Multi-page consultant website ("Legacy") with login, CMS admin panel, Stripe payments, JWT + Google OAuth auth, interactive Leaflet maps, blog, gallery, reading list, portfolio, testimonials, contact form. Brand: "Legacy". Dark navy + white + teal color scheme.

## Architecture
```
/app/backend/
  server.py              # App entry, seed data, router orchestration
  models/
    database.py          # MongoDB, auth helpers (unified members), JWT, SMTP
  routes/
    auth.py              # Unified login (members table), logout, session, password
    public.py            # Public content, search, external blog, contact form
    admin_content.py     # Admin CRUD for all collections + dashboard
    admin_tools.py       # Upload, bulk ops, analytics, SEO, section order, SMTP
    payments.py          # Stripe checkout, webhook, status
    membership.py        # Member CRUD, invite codes, community tree, portfolios
/app/frontend/
  src/
    components/
      LoginModal.js      # Unified login (no tabs), forgot password, Google OAuth
      TreeNode.js        # Iterative community tree renderer
      layout/
        Navbar.js        # Shows My Account + Admin Panel when logged in
        Footer.js        # Dynamic pages + social links
    lib/
      api.js             # Unified auth_token for all APIs
      auth.js            # Main auth provider (AuthProvider/useAuth)
      memberAuth.js      # Thin wrapper over useAuth (MemberProvider/useMember)
    pages/
      admin/
        MembersManager.js    # CRUD + Mentor/Portfolio Dev radio buttons
      myaccount/
        MemberLogin.js       # Unified login + Register link
        MemberRegister.js    # Editable invite code + auto-login after registration
```

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Leaflet + Framer Motion + Recharts
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: Unified JWT (single members table) + Emergent Google OAuth
- **Payments**: Stripe

## DB Schema (Unified)
- `members`: ALL users (admin + regular members). Fields: member_id, membership_id, email, password_hash, role (admin|member), is_mentor, portfolio_development, sponsor_id, mentor_id, social_links, etc.
- `invite_codes`: invite code tracking
- `portfolios`: member portfolios with holdings
- `settings`: global site settings, SMTP, colors, membership config

## Completed Features

### Phase 1 (Initial Build) - COMPLETE
- Full public website with 11 sections, admin panel with 13 managers, JWT + Google OAuth, Stripe

### Phase 2 (CMS Enhancement) - COMPLETE
- Dynamic Pages, WYSIWYG, image upload, drag-drop section ordering, map clustering, search, analytics, SEO

### Phase 3 (Membership System) - COMPLETE
- Member portal (/my-account), invite codes, sponsor tree, portfolios, admin Members Manager

### Phase A (Auth Unification) - COMPLETE (Mar 27, 2026)
- **Unified users/members**: Single `members` collection for all users including admin
- **Single login**: Both Navbar LoginModal and /my-account/login use same `/api/auth/login` endpoint
- **Navbar**: Shows "My Account" link for all logged-in users, "Admin Panel" for admins
- **LoginModal**: Removed User/Admin tabs, single unified form with Google OAuth + Register link
- **MemberLogin**: Added Register button linking to registration form
- **MemberRegister**: Editable invite code field, email uniqueness validation, auto-login after registration
- **MembersManager CMS**: Added Mentor (YES/NO) and Portfolio Development (YES/NO) radio buttons
- **Admin sidebar**: Removed "Users" link, kept "Members" as unified manager
- **Backend migration**: Admin auto-migrated from users to members collection
- Testing: 13/13 backend + 14/14 frontend (iteration_6.json)

## Testing History
- Phase 1: 35/35 backend (iteration_1.json)
- Phase 2: 22/22 backend + 16/16 frontend (iteration_2.json)
- Batch 1-3: 23/25 backend + 100% frontend (iteration_3.json)
- Post-refactoring: 44/44 backend + 17/17 frontend (iteration_4.json)
- Phase 3 Membership: 13/13 backend + 12/12 frontend (iteration_5.json)
- Phase A Auth Unification: 13/13 backend + 14/14 frontend (iteration_6.json)

## Key Credentials
- **Admin**: admin@consultant.com / Admin123! (now in `members` collection with role="admin")
- **Members**: Created via admin panel or invite code registration

## Remaining Backlog

### Phase B — Membership Profile Redesign (P1)
- Membership Profile with tabs: General Info (view/edit), Social Links (platform networks), Activities (log)
- Move Update Biography into Membership Profile as a modal button; remove from sidebar
- Mentorship Profile: Show assigned mentor info

### Phase C — Levels & Permissions (P1)
- User Levels CMS: Admin section to manage levels and sidebar permissions
- Dynamic sidebar in My Account based on member's level
- Portfolio visibility rules (Level 1 sees shared only, Portfolio Dev can create)

### Phase D — Portfolio Overhaul (P1)
- New DB tables: Sectors, Industries, Companies (with hierarchy and test data)
- Symbol select with auto-populate sector/industry/price
- Shared Members (All Members / Select Members) with member picker
- Status (Active/Inactive) with visibility rules
- Date picker fix, cover image auth fix, rich text description

### Phase E — Community & Polish (P2)
- My Community search: clickable results as list below search bar
- Minor UI fixes

### Future (P2)
- Real S3/Cloud image storage
- Production SMTP configuration
