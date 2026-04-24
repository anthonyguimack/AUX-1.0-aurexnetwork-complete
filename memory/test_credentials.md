# Test Credentials

## Admin (full access)
- Email: `admin@consultant.com`
- Password: `Admin123!`
- Role: admin
- CMS Roles: `role_admin` (all 42 sections)

## Operator / Member (carlos)
- Email: `carlos@example.com`
- Password: `Test123!`
- Role: member (mentor-enabled)
- CMS Roles: `role_member` + `Analyst` (dashboard, analytics, blog only)
- Use for testing sidebar filtering + 403 forbidden + operator-login-allowed flows.

## Notes
- Used for all admin/CMS flows including `/admin/settings`, `/admin/aurex-sections`, `/admin/hero-ab`, `/admin/roles`, etc.
- Member login at `/my-account/register` and standard public login modal.
- Operator-style accounts (role=member + a custom CMS role with permissions) may now log in through `/admin/login` and will land on the admin dashboard with their sidebar filtered by `effective_permissions`.
