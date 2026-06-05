import html as _html
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from models.database import db, get_current_user, get_user_permissions
from models.cms_sections import get_section_for_path
from datetime import datetime


async def _doc_guard(request: Request) -> dict:
    """Auth guard for HTML documentation routes.

    • Not authenticated          → 302 redirect to /admin/login
    • Admin                      → allow
    • Has the matching doc perm  → allow
    • Logged-in, wrong perm      → 302 redirect to /admin/documentation
    """
    try:
        user = await get_current_user(request)
    except HTTPException:
        raise HTTPException(status_code=302, headers={"Location": "/admin/login"})

    if user.get("role") == "admin":
        return user

    section_key, _ = get_section_for_path(request.url.path)
    perms = await get_user_permissions(user)
    if section_key and section_key in perms:
        return user

    # Authenticated but no access to this specific doc
    raise HTTPException(status_code=302, headers={"Location": "/admin/documentation"})

router = APIRouter()

PRINT_CSS = """
@media print {
  body { margin: 0; padding: 20px; }
  .no-print { display: none !important; }
  .page-break { page-break-before: always; }
}
@page { margin: 1cm; }
"""

BASE_CSS = """
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #fff; color: #1a2332; line-height: 1.6; }
.cover { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a2332 0%, #0D9488 100%); color: #fff; text-align: center; padding: 40px; }
.cover h1 { font-size: 36px; margin-bottom: 10px; font-weight: 700; }
.cover .subtitle { font-size: 18px; opacity: 0.85; margin-bottom: 30px; }
.cover .meta { font-size: 14px; opacity: 0.65; }
.content { max-width: 900px; margin: 0 auto; padding: 40px 30px; }
h1 { color: #1a2332; font-size: 28px; border-bottom: 3px solid #0D9488; padding-bottom: 8px; margin-top: 40px; }
h2 { color: #0D9488; font-size: 22px; margin-top: 30px; }
h3 { color: #374151; font-size: 18px; margin-top: 20px; }
p { margin: 10px 0; }
table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
th { background: #0D9488; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; }
td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
tr:nth-child(even) { background: #f8fafb; }
code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 13px; color: #0D9488; }
pre { background: #1a2332; color: #e5e7eb; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
.info-box { background: #f0fdfa; border-left: 4px solid #0D9488; padding: 12px 16px; margin: 15px 0; border-radius: 0 4px 4px 0; }
.warn-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 15px 0; border-radius: 0 4px 4px 0; }
.toolbar { position: fixed; top: 0; left: 0; right: 0; background: #1a2332; color: #fff; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; z-index: 100; }
.toolbar a, .toolbar button { color: #c9a84c; text-decoration: none; cursor: pointer; background: none; border: 1px solid #c9a84c; padding: 6px 16px; border-radius: 4px; font-size: 13px; }
.toolbar a:hover, .toolbar button:hover { background: #c9a84c; color: #1a2332; }
.spacer { height: 60px; }
ul, ol { padding-left: 24px; }
li { margin: 5px 0; }
"""


@router.get("/docs/flow-diagram", response_class=HTMLResponse)
async def flow_diagram(user: dict = Depends(_doc_guard)):
    """Serve the use case flow diagram as an interactive HTML/SVG page."""
    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Use Case & Business Flow Diagram</title>
<style>{BASE_CSS}{PRINT_CSS}
svg {{ max-width: 100%; height: auto; }}
.diagram-container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
</style></head><body>
<div class="toolbar no-print">
  <span style="font-weight:600;">Use Case & Business Flow Diagram</span>
  <div><button onclick="window.print()">Save as PDF</button> <a href="/admin/documentation">Back to Docs</a></div>
</div>
<div class="spacer no-print"></div>
<div class="diagram-container">
<svg viewBox="0 0 1100 2200" xmlns="http://www.w3.org/2000/svg" style="font-family:Segoe UI,sans-serif;">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#374151"/></marker>
    <marker id="arrow-blue" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#2563eb"/></marker>
    <marker id="arrow-green" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#059669"/></marker>
    <marker id="arrow-orange" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#d97706"/></marker>
  </defs>

  <!-- TITLE -->
  <text x="550" y="35" text-anchor="middle" font-size="24" font-weight="700" fill="#1a2332">System Use Case &amp; Business Flow Diagram</text>
  <text x="550" y="55" text-anchor="middle" font-size="12" fill="#6b7280">Acapital Group LLC - Membership Platform</text>

  <!-- ACTORS -->
  <circle cx="120" cy="100" r="16" fill="#2563eb"/><text x="120" y="135" text-anchor="middle" font-size="11" fill="#2563eb" font-weight="600">Visitor</text>
  <circle cx="300" cy="100" r="16" fill="#059669"/><text x="300" y="135" text-anchor="middle" font-size="11" fill="#059669" font-weight="600">New Member</text>
  <circle cx="500" cy="100" r="16" fill="#c9a84c"/><text x="500" y="135" text-anchor="middle" font-size="11" fill="#c9a84c" font-weight="600">Member</text>
  <circle cx="700" cy="100" r="16" fill="#d97706"/><text x="700" y="135" text-anchor="middle" font-size="11" fill="#d97706" font-weight="600">Sponsor</text>
  <circle cx="900" cy="100" r="16" fill="#dc2626"/><text x="900" y="135" text-anchor="middle" font-size="11" fill="#dc2626" font-weight="600">Administrator</text>

  <!-- SECTION 1: LANDING PAGE -->
  <rect x="50" y="160" width="1000" height="250" rx="8" fill="#f0f9ff" stroke="#bfdbfe" stroke-width="1.5"/>
  <text x="80" y="185" font-size="15" font-weight="700" fill="#1e40af">SECTION 1: Landing Page ( / )</text>

  <!-- Visitor enters site -->
  <rect x="120" y="210" width="180" height="40" rx="20" fill="#2563eb" stroke="none"/><text x="210" y="235" text-anchor="middle" font-size="12" fill="#fff">Visitor enters site</text>

  <!-- Decision: LP Active? -->
  <polygon points="550,210 630,240 550,270 470,240" fill="#fff" stroke="#d97706" stroke-width="2"/>
  <text x="550" y="244" text-anchor="middle" font-size="11" fill="#374151">LP Active?</text>

  <!-- Arrow from visitor to decision -->
  <line x1="300" y1="230" x2="468" y2="240" stroke="#374151" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Yes: Coming Soon -->
  <rect x="680" y="200" width="160" height="36" rx="4" fill="#fff" stroke="#d97706" stroke-width="1.5"/><text x="760" y="223" text-anchor="middle" font-size="11" fill="#374151">Coming Soon Page</text>
  <line x1="630" y1="234" x2="678" y2="220" stroke="#d97706" stroke-width="1.5" marker-end="url(#arrow-orange)"/>
  <text x="645" y="218" font-size="9" fill="#d97706" font-weight="600">Yes</text>

  <!-- Decision: Launch Date Met? -->
  <polygon points="760,270 830,300 760,330 690,300" fill="#fff" stroke="#d97706" stroke-width="2"/>
  <text x="760" y="303" text-anchor="middle" font-size="10" fill="#374151">Launch Date</text>
  <text x="760" y="314" text-anchor="middle" font-size="10" fill="#374151">Met?</text>
  <line x1="760" y1="236" x2="760" y2="268" stroke="#d97706" stroke-width="1.5" marker-end="url(#arrow-orange)"/>

  <!-- No: Main Website -->
  <rect x="380" y="290" width="160" height="36" rx="4" fill="#fff" stroke="#2563eb" stroke-width="1.5"/><text x="460" y="313" text-anchor="middle" font-size="11" fill="#374151">Main Website</text>
  <line x1="550" y1="270" x2="500" y2="290" stroke="#2563eb" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
  <text x="510" y="278" font-size="9" fill="#2563eb" font-weight="600">No</text>

  <!-- Launch date Yes -> Main Website -->
  <line x1="690" y1="300" x2="542" y2="308" stroke="#059669" stroke-width="1.5" marker-end="url(#arrow-green)"/>
  <text x="610" y="295" font-size="9" fill="#059669" font-weight="600">Yes</text>

  <!-- Auto-switch note -->
  <rect x="820" y="340" width="200" height="36" rx="4" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/><text x="920" y="357" text-anchor="middle" font-size="10" fill="#92400e">Client-side auto-switch</text><text x="920" y="369" text-anchor="middle" font-size="10" fill="#92400e">(no reload)</text>
  <line x1="830" y1="300" x2="850" y2="340" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4"/>

  <!-- SECTION 2: REGISTRATION PATHS -->
  <rect x="50" y="430" width="1000" height="600" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
  <text x="80" y="455" font-size="15" font-weight="700" fill="#166534">SECTION 2: Two Registration Paths</text>

  <!-- Sponsor generates invite code (center top) -->
  <rect x="370" y="470" width="260" height="44" rx="22" fill="#d97706" stroke="none"/><text x="500" y="497" text-anchor="middle" font-size="12" fill="#fff" font-weight="600">Sponsor Generates Invite Code</text>

  <!-- Split arrow -->
  <line x1="430" y1="514" x2="250" y2="560" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-blue)"/>
  <line x1="570" y1="514" x2="750" y2="560" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- PATH A -->
  <rect x="100" y="560" width="300" height="44" rx="6" fill="#2563eb" stroke="none"/><text x="250" y="587" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">PATH A: /my-account/register</text>
  <rect x="120" y="620" width="260" height="30" rx="4" fill="#fff" stroke="#2563eb" stroke-width="1.5"/><text x="250" y="640" text-anchor="middle" font-size="11" fill="#374151">Simplified Registration Form</text>
  <rect x="120" y="660" width="260" height="30" rx="4" fill="#fff" stroke="#2563eb" stroke-width="1.5"/><text x="250" y="680" text-anchor="middle" font-size="11" fill="#374151">Invite Code + Name + Email + Password</text>
  <line x1="250" y1="604" x2="250" y2="618" stroke="#2563eb" stroke-width="1.5" marker-end="url(#arrow-blue)"/>
  <line x1="250" y1="650" x2="250" y2="658" stroke="#2563eb" stroke-width="1.5" marker-end="url(#arrow-blue)"/>

  <!-- PATH B -->
  <rect x="600" y="560" width="350" height="44" rx="6" fill="#059669" stroke="none"/><text x="775" y="587" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">PATH B: /membership-enrollment</text>
  <rect x="620" y="620" width="310" height="26" rx="4" fill="#fff" stroke="#059669" stroke-width="1.5"/><text x="775" y="638" text-anchor="middle" font-size="10" fill="#374151">Step 1: Invite Code + Email + Password</text>
  <rect x="620" y="652" width="310" height="26" rx="4" fill="#fff" stroke="#059669" stroke-width="1.5"/><text x="775" y="670" text-anchor="middle" font-size="10" fill="#374151">Step 2: Clarity Statement (37 fields)</text>
  <rect x="620" y="684" width="310" height="26" rx="4" fill="#fff" stroke="#059669" stroke-width="1.5"/><text x="775" y="702" text-anchor="middle" font-size="10" fill="#374151">Step 3: Legal Agreements + Signature</text>
  <rect x="620" y="716" width="310" height="26" rx="4" fill="#fff" stroke="#059669" stroke-width="1.5"/><text x="775" y="734" text-anchor="middle" font-size="10" fill="#374151">Step 4: Confirm &amp; Submit</text>
  <line x1="775" y1="604" x2="775" y2="618" stroke="#059669" stroke-width="1.5" marker-end="url(#arrow-green)"/>
  <line x1="775" y1="646" x2="775" y2="650" stroke="#059669" stroke-width="1.2"/>
  <line x1="775" y1="678" x2="775" y2="682" stroke="#059669" stroke-width="1.2"/>
  <line x1="775" y1="710" x2="775" y2="714" stroke="#059669" stroke-width="1.2"/>

  <!-- CONVERGENCE -->
  <line x1="250" y1="690" x2="250" y2="780" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-blue)"/>
  <line x1="775" y1="742" x2="775" y2="780" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- Validate invite code diamond -->
  <polygon points="500,780 600,815 500,850 400,815" fill="#fff" stroke="#374151" stroke-width="2"/>
  <text x="500" y="812" text-anchor="middle" font-size="11" fill="#374151">Invite Code</text>
  <text x="500" y="824" text-anchor="middle" font-size="11" fill="#374151">Valid?</text>
  <line x1="250" y1="780" x2="398" y2="810" stroke="#2563eb" stroke-width="1.5"/>
  <line x1="775" y1="780" x2="602" y2="810" stroke="#059669" stroke-width="1.5"/>

  <!-- Invalid: Error -->
  <rect x="650" y="850" width="120" height="30" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5"/><text x="710" y="870" text-anchor="middle" font-size="11" fill="#dc2626">Error: Invalid</text>
  <line x1="580" y1="830" x2="648" y2="855" stroke="#dc2626" stroke-width="1.5"/>
  <text x="610" y="838" font-size="9" fill="#dc2626" font-weight="600">No</text>

  <!-- Valid: Create account -->
  <line x1="500" y1="850" x2="500" y2="880" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="520" y="868" font-size="9" fill="#059669" font-weight="600">Yes</text>

  <rect x="370" y="882" width="260" height="40" rx="6" fill="#0D9488" stroke="none"/><text x="500" y="907" text-anchor="middle" font-size="12" fill="#fff" font-weight="600">Create Account (Level 1)</text>
  <line x1="500" y1="922" x2="500" y2="940" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>

  <rect x="350" y="942" width="300" height="36" rx="6" fill="#fff" stroke="#0D9488" stroke-width="2"/><text x="500" y="965" text-anchor="middle" font-size="11" fill="#374151">Assign membership_id &amp; sponsor_id</text>
  <line x1="500" y1="978" x2="500" y2="996" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>

  <rect x="380" y="998" width="240" height="36" rx="18" fill="#c9a84c" stroke="none"/><text x="500" y="1021" text-anchor="middle" font-size="12" fill="#1a2332" font-weight="600">Auto-login &amp; Redirect</text>

  <!-- SECTION 3: MY ACCOUNT -->
  <rect x="50" y="1060" width="1000" height="280" rx="8" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5"/>
  <text x="80" y="1085" font-size="15" font-weight="700" fill="#92400e">SECTION 3: My Account ( /my-account )</text>

  <rect x="100" y="1105" width="180" height="32" rx="4" fill="#fff" stroke="#c9a84c" stroke-width="1.5"/><text x="190" y="1126" text-anchor="middle" font-size="11" fill="#374151">Membership Profile</text>
  <rect x="300" y="1105" width="180" height="32" rx="4" fill="#fff" stroke="#c9a84c" stroke-width="1.5"/><text x="390" y="1126" text-anchor="middle" font-size="11" fill="#374151">Mentorship Profile</text>
  <rect x="500" y="1105" width="180" height="32" rx="4" fill="#fff" stroke="#c9a84c" stroke-width="1.5"/><text x="590" y="1126" text-anchor="middle" font-size="11" fill="#374151">My Sponsor</text>
  <rect x="700" y="1105" width="180" height="32" rx="4" fill="#fff" stroke="#c9a84c" stroke-width="1.5"/><text x="790" y="1126" text-anchor="middle" font-size="11" fill="#374151">My Ebank</text>

  <rect x="100" y="1155" width="180" height="32" rx="4" fill="#fff" stroke="#c9a84c" stroke-width="1.5"/><text x="190" y="1176" text-anchor="middle" font-size="11" fill="#374151">My Community</text>
  <rect x="300" y="1155" width="180" height="32" rx="4" fill="#fff" stroke="#c9a84c" stroke-width="1.5"/><text x="390" y="1176" text-anchor="middle" font-size="11" fill="#374151">Portfolios</text>
  <rect x="500" y="1155" width="180" height="32" rx="4" fill="#fff" stroke="#c9a84c" stroke-width="1.5"/><text x="590" y="1176" text-anchor="middle" font-size="11" fill="#374151">Invite Codes</text>
  <rect x="700" y="1155" width="180" height="32" rx="4" fill="#fff" stroke="#c9a84c" stroke-width="1.5"/><text x="790" y="1176" text-anchor="middle" font-size="11" fill="#374151">Business QR</text>

  <!-- QR Flow -->
  <rect x="130" y="1210" width="380" height="110" rx="6" fill="#fff" stroke="#d97706" stroke-width="1.5"/>
  <text x="150" y="1232" font-size="11" font-weight="600" fill="#d97706">Invite Code Flow:</text>
  <text x="150" y="1250" font-size="10" fill="#374151">1. Sponsor generates invite code</text>
  <text x="150" y="1266" font-size="10" fill="#374151">2. Shares code/link with invitee</text>
  <text x="150" y="1282" font-size="10" fill="#374151">3. Invitee uses Path A or Path B</text>
  <text x="150" y="1298" font-size="10" fill="#374151">4. New member linked as sponsored</text>

  <rect x="540" y="1210" width="380" height="110" rx="6" fill="#fff" stroke="#d97706" stroke-width="1.5"/>
  <text x="560" y="1232" font-size="11" font-weight="600" fill="#d97706">Business QR Flow:</text>
  <text x="560" y="1250" font-size="10" fill="#374151">1. Admin enables QR permission for member</text>
  <text x="560" y="1266" font-size="10" fill="#374151">2. Member generates QR in My Account</text>
  <text x="560" y="1282" font-size="10" fill="#374151">3. QR encodes registration URL with sponsor ID</text>
  <text x="560" y="1298" font-size="10" fill="#374151">4. Scanned QR leads to /my-account/register</text>

  <!-- SECTION 4: CMS ADMIN -->
  <rect x="50" y="1360" width="1000" height="230" rx="8" fill="#fef2f2" stroke="#fecaca" stroke-width="1.5"/>
  <text x="80" y="1385" font-size="15" font-weight="700" fill="#991b1b">SECTION 4: CMS Admin Panel ( /admin )</text>

  <rect x="100" y="1405" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="185" y="1426" text-anchor="middle" font-size="10" fill="#374151">Members Manager</text>
  <rect x="290" y="1405" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="375" y="1426" text-anchor="middle" font-size="10" fill="#374151">Enrollment Fields</text>
  <rect x="480" y="1405" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="565" y="1426" text-anchor="middle" font-size="10" fill="#374151">Geo Data (CRUD)</text>
  <rect x="670" y="1405" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="755" y="1426" text-anchor="middle" font-size="10" fill="#374151">Landing Page</text>
  <rect x="860" y="1405" width="150" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="935" y="1426" text-anchor="middle" font-size="10" fill="#374151">Analytics</text>

  <rect x="100" y="1455" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="185" y="1476" text-anchor="middle" font-size="10" fill="#374151">Member Levels</text>
  <rect x="290" y="1455" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="375" y="1476" text-anchor="middle" font-size="10" fill="#374151">Member Types</text>
  <rect x="480" y="1455" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="565" y="1476" text-anchor="middle" font-size="10" fill="#374151">Settings / SMTP</text>
  <rect x="670" y="1455" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="755" y="1476" text-anchor="middle" font-size="10" fill="#374151">Colors (5 groups)</text>
  <rect x="860" y="1455" width="150" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="935" y="1476" text-anchor="middle" font-size="10" fill="#374151">Backup/Restore</text>

  <rect x="100" y="1505" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="185" y="1526" text-anchor="middle" font-size="10" fill="#374151">Hero / Carousel</text>
  <rect x="290" y="1505" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="375" y="1526" text-anchor="middle" font-size="10" fill="#374151">Pages / SEO</text>
  <rect x="480" y="1505" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="565" y="1526" text-anchor="middle" font-size="10" fill="#374151">Gallery / Portfolio</text>
  <rect x="670" y="1505" width="170" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="755" y="1526" text-anchor="middle" font-size="10" fill="#374151">Blog / Books</text>
  <rect x="860" y="1505" width="150" height="32" rx="4" fill="#fff" stroke="#dc2626" stroke-width="1.5"/><text x="935" y="1526" text-anchor="middle" font-size="10" fill="#374151">Maps</text>

  <!-- LEGEND -->
  <rect x="50" y="1620" width="1000" height="100" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="80" y="1645" font-size="13" font-weight="700" fill="#374151">LEGEND</text>

  <circle cx="100" cy="1675" r="8" fill="#2563eb"/><text x="115" y="1680" font-size="11" fill="#374151">Visitor / Path A (Simplified)</text>
  <circle cx="330" cy="1675" r="8" fill="#059669"/><text x="345" y="1680" font-size="11" fill="#374151">New Member / Path B (4-Step)</text>
  <circle cx="580" cy="1675" r="8" fill="#c9a84c"/><text x="595" y="1680" font-size="11" fill="#374151">Member (Authenticated)</text>
  <circle cx="790" cy="1675" r="8" fill="#d97706"/><text x="805" y="1680" font-size="11" fill="#374151">Sponsor / Decision</text>
  <circle cx="970" cy="1675" r="8" fill="#dc2626"/><text x="985" y="1680" font-size="11" fill="#374151">Admin</text>

  <rect x="90" y="1695" width="30" height="12" rx="2" fill="none" stroke="#374151" stroke-width="1.5"/><text x="130" y="1705" font-size="10" fill="#374151">Process</text>
  <polygon points="270,1695 295,1701 270,1707 245,1701" fill="none" stroke="#374151" stroke-width="1.5"/><text x="305" y="1705" font-size="10" fill="#374151">Decision</text>
  <rect x="430" y="1695" width="30" height="12" rx="6" fill="#0D9488" stroke="none"/><text x="470" y="1705" font-size="10" fill="#374151">Action / Result</text>
  <line x1="600" y1="1701" x2="650" y2="1701" stroke="#374151" stroke-width="1.5" marker-end="url(#arrow)"/><text x="660" y="1705" font-size="10" fill="#374151">Flow Direction</text>

</svg>
</div>
</body></html>"""
    return HTMLResponse(content=html)


async def _get_settings():
    s = await db.settings.find_one({}, {"_id": 0})
    return s or {}


@router.get("/docs/technical", response_class=HTMLResponse)
async def technical_documentation(user: dict = Depends(_doc_guard)):
    settings = await _get_settings()
    brand = settings.get("brand_name", "Acapital Group LLC")
    today = datetime.now().strftime("%B %d, %Y")

    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Technical Documentation - {brand}</title>
<style>{BASE_CSS}{PRINT_CSS}</style></head><body>
<div class="toolbar no-print">
  <span style="font-weight:600;">Technical Documentation</span>
  <div><button onclick="window.print()">Save as PDF</button> <a href="/admin/documentation">Back to Docs</a></div>
</div>
<div class="spacer no-print"></div>

<div class="cover">
  <h1>{brand}</h1>
  <p class="subtitle">Project Technical Documentation</p>
  <p class="meta">Version 1.0 &middot; {today}</p>
</div>

<div class="content">
<h1>1. System Architecture</h1>
<h2>1.1 Overview</h2>
<p>The platform is a full-stack web application designed for membership management, financial consulting, and community engagement. It comprises a public-facing website, a member portal (My Account), a 4-step membership enrollment wizard, and a comprehensive CMS admin panel.</p>

<h2>1.2 Tech Stack</h2>
<table>
<tr><th>Layer</th><th>Technology</th><th>Details</th></tr>
<tr><td>Frontend</td><td>React 18</td><td>SPA with React Router, TailwindCSS, Shadcn/UI, Framer Motion</td></tr>
<tr><td>Backend</td><td>FastAPI (Python)</td><td>Async REST API with Motor (async MongoDB driver)</td></tr>
<tr><td>Database</td><td>MongoDB</td><td>Document-based NoSQL, accessed via Motor</td></tr>
<tr><td>Auth</td><td>JWT + Google OAuth</td><td>Emergent-managed Google Auth integration</td></tr>
<tr><td>Payments</td><td>Stripe</td><td>Test keys pre-configured</td></tr>
<tr><td>Maps</td><td>Leaflet + React-Leaflet</td><td>Interactive maps with clustering</td></tr>
<tr><td>Rich Text</td><td>React-Quill</td><td>WYSIWYG editor for content management</td></tr>
<tr><td>DnD</td><td>@dnd-kit</td><td>Drag-and-drop sorting for form fields</td></tr>
</table>

<h2>1.3 Architecture Diagram</h2>
<pre>
Browser (React SPA)
    |
    v
Kubernetes Ingress (/api/* -> :8001, /* -> :3000)
    |
    +-- Frontend (React :3000) -- Static assets + SPA routing
    |
    +-- Backend (FastAPI :8001)
            |
            +-- MongoDB (Motor async driver)
            +-- File uploads (/api/uploads/)
            +-- SMTP (configurable)
</pre>

<h1>2. Database Structure</h1>
<h2>2.1 Collections</h2>
<table>
<tr><th>Collection</th><th>Purpose</th><th>Key Fields</th></tr>
<tr><td><code>members</code></td><td>All users (members + admins)</td><td>member_id, membership_id, email, password_hash, level_id, sponsor_id, can_create_qr</td></tr>
<tr><td><code>member_levels</code></td><td>Access tiers</td><td>id, name, order, permissions</td></tr>
<tr><td><code>member_types</code></td><td>Role templates</td><td>id, name, is_mentor, corporate, allowed_pages</td></tr>
<tr><td><code>invite_codes</code></td><td>Invitation system</td><td>code, owner_member_id, status, used_by_member_id</td></tr>
<tr><td><code>enrollment_fields</code></td><td>Dynamic form config</td><td>id, step, field_key, label, field_type, order, required, visible, options</td></tr>
<tr><td><code>enrollment_applications</code></td><td>Submitted applications</td><td>id, member_id, email, form_data</td></tr>
<tr><td><code>enrollment_content</code></td><td>CMS-managed step content</td><td>key (step4), title, description</td></tr>
<tr><td><code>countries</code></td><td>Geo: 249 countries</td><td>id, name, code</td></tr>
<tr><td><code>states</code></td><td>Geo: 5,046 states</td><td>id, name, country_id, code</td></tr>
<tr><td><code>cities</code></td><td>Geo: 32,423 cities</td><td>id, name, state_id</td></tr>
<tr><td><code>settings</code></td><td>Global configuration</td><td>brand_name, site_logo, landing_enabled, smtp_*</td></tr>
<tr><td><code>theme_colors</code></td><td>CSS variable management</td><td>website, my_account, admin, landing_page, enrollment</td></tr>
<tr><td><code>portfolios</code></td><td>Investment portfolios</td><td>id, member_id, positions, shared_mode</td></tr>
<tr><td><code>hero_slides</code></td><td>Homepage carousel</td><td>id, title, subtitle, media_type, buttons</td></tr>
<tr><td><code>landing_hero_slides</code></td><td>Landing page carousel</td><td>Same structure as hero_slides</td></tr>
<tr><td><code>pages</code></td><td>Dynamic CMS pages</td><td>id, slug, title, sections (Visual Page Builder)</td></tr>
</table>

<h1>3. API Endpoints</h1>
<h2>3.1 Authentication</h2>
<table>
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>POST</td><td><code>/api/auth/login</code></td><td>Admin login</td></tr>
<tr><td>POST</td><td><code>/api/member/login</code></td><td>Member login</td></tr>
<tr><td>GET</td><td><code>/api/member/me</code></td><td>Current member profile</td></tr>
<tr><td>POST</td><td><code>/api/auth/google</code></td><td>Google OAuth callback</td></tr>
</table>

<h2>3.2 Membership Enrollment</h2>
<table>
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>GET</td><td><code>/api/public/enrollment-fields</code></td><td>Get visible form fields</td></tr>
<tr><td>POST</td><td><code>/api/public/enrollment/validate-code</code></td><td>Validate invite code</td></tr>
<tr><td>POST</td><td><code>/api/public/enrollment/check-email</code></td><td>Check email availability</td></tr>
<tr><td>POST</td><td><code>/api/public/enrollment/submit</code></td><td>Submit enrollment + auto-create account</td></tr>
<tr><td>GET/PUT</td><td><code>/api/public/enrollment-content/step4</code></td><td>Step 4 CMS content</td></tr>
<tr><td>CRUD</td><td><code>/api/admin/enrollment-fields</code></td><td>Admin field management</td></tr>
<tr><td>PUT</td><td><code>/api/admin/enrollment-fields/reorder</code></td><td>Drag-and-drop reorder</td></tr>
</table>

<h2>3.3 Geo Data</h2>
<table>
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>GET</td><td><code>/api/geo/countries</code></td><td>List all countries</td></tr>
<tr><td>GET</td><td><code>/api/geo/states?country_id=X</code></td><td>States for a country</td></tr>
<tr><td>GET</td><td><code>/api/geo/cities?state_id=X</code></td><td>Cities for a state</td></tr>
</table>

<h2>3.4 Member Operations</h2>
<table>
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>POST</td><td><code>/api/member/generate-codes</code></td><td>Generate invite codes</td></tr>
<tr><td>GET</td><td><code>/api/member/codes</code></td><td>List member's codes</td></tr>
<tr><td>POST</td><td><code>/api/member/generate-qr</code></td><td>Generate QR code for sponsorship</td></tr>
<tr><td>PUT</td><td><code>/api/member/profile</code></td><td>Update member profile</td></tr>
<tr><td>GET</td><td><code>/api/member/community</code></td><td>Get sponsored members tree</td></tr>
<tr><td>CRUD</td><td><code>/api/member/portfolios</code></td><td>Portfolio management</td></tr>
</table>

<h1>4. Authentication System</h1>
<h2>4.1 JWT Tokens</h2>
<p>The system uses JWT (JSON Web Tokens) for stateless authentication. Tokens are signed with <code>JWT_SECRET</code> from environment variables and expire after 10 days.</p>
<div class="info-box"><strong>Token payload:</strong> user_id, email, role (admin/member), exp, iat</div>

<h2>4.2 Password Security</h2>
<p>Passwords are hashed using <strong>bcrypt</strong> with automatic salt generation. Minimum password length is 8 characters, enforced on both frontend and backend.</p>

<h2>4.3 Invite Code Logic</h2>
<p>Each invite code has a unique format: <code>{{prefix}}-{{uuid_fragment}}</code>. When used, the code is marked with <code>status: used</code>, and the new member is linked via <code>sponsor_id</code> and <code>sponsor_membership_number</code>.</p>

<h2>4.4 Membership ID Logic</h2>
<p>Every new member receives a sequential membership number. The display format is <code>{{AUX_PREFIX}}-{{number}}</code> (e.g., AUX-24). The prefix is configurable via CMS &gt; Membership Settings.</p>

<h1>5. Color Scheme &amp; CSS Variables</h1>
<p>The platform uses 5 separate color groups, each with its own CSS variable prefix:</p>
<table>
<tr><th>Group</th><th>Prefix</th><th>Count</th><th>Managed In</th></tr>
<tr><td>Website</td><td><code>--color-*</code></td><td>18 vars</td><td>Settings &gt; Colors &gt; Website</td></tr>
<tr><td>My Account</td><td><code>--ma-*</code></td><td>25 vars</td><td>Settings &gt; Colors &gt; My Account</td></tr>
<tr><td>Admin</td><td><code>--ad-*</code></td><td>15 vars</td><td>Settings &gt; Colors &gt; Admin</td></tr>
<tr><td>Landing Page</td><td><code>--lp-*</code></td><td>20 vars</td><td>Settings &gt; Colors &gt; Landing Page</td></tr>
<tr><td>Enrollment</td><td><code>--me-*</code></td><td>20 vars</td><td>Settings &gt; Colors &gt; Enrollment</td></tr>
</table>

<h1>6. Environment Variables</h1>
<table>
<tr><th>Variable</th><th>File</th><th>Purpose</th></tr>
<tr><td><code>MONGO_URL</code></td><td>backend/.env</td><td>MongoDB connection string</td></tr>
<tr><td><code>DB_NAME</code></td><td>backend/.env</td><td>Database name</td></tr>
<tr><td><code>JWT_SECRET</code></td><td>backend/.env</td><td>JWT signing secret</td></tr>
<tr><td><code>ADMIN_EMAIL</code></td><td>backend/.env</td><td>Default admin email (seed)</td></tr>
<tr><td><code>ADMIN_PASSWORD</code></td><td>backend/.env</td><td>Default admin password (seed)</td></tr>
<tr><td><code>STRIPE_API_KEY</code></td><td>backend/.env</td><td>Stripe test key</td></tr>
<tr><td><code>REACT_APP_BACKEND_URL</code></td><td>frontend/.env</td><td>API base URL for frontend</td></tr>
</table>

<h1>7. Security Considerations</h1>
<ul>
<li><strong>Password encryption:</strong> bcrypt with automatic salting</li>
<li><strong>JWT expiration:</strong> 10-day token lifetime</li>
<li><strong>CORS:</strong> Configurable origins via environment variable</li>
<li><strong>MongoDB:</strong> All queries exclude <code>_id</code> and <code>password_hash</code> from responses</li>
<li><strong>Input validation:</strong> Email format, password length, invite code existence checked server-side</li>
<li><strong>Admin routes:</strong> Protected by <code>require_admin</code> middleware</li>
<li><strong>Member routes:</strong> Protected by <code>get_current_member</code> JWT verification</li>
</ul>
</div>
</body></html>"""
    return HTMLResponse(content=html)


@router.get("/docs/operator-manual", response_class=HTMLResponse)
async def operator_manual(user: dict = Depends(_doc_guard)):
    settings = await _get_settings()
    brand = settings.get("brand_name", "Acapital Group LLC")
    today = datetime.now().strftime("%B %d, %Y")

    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Operator Manual (CMS) - {brand}</title>
<style>{BASE_CSS}{PRINT_CSS}</style></head><body>
<div class="toolbar no-print">
  <span style="font-weight:600;">Operator Manual (CMS)</span>
  <div><button onclick="window.print()">Save as PDF</button> <a href="/admin/documentation">Back to Docs</a></div>
</div>
<div class="spacer no-print"></div>

<div class="cover">
  <h1>{brand}</h1>
  <p class="subtitle">Operator Manual &mdash; CMS Administration Guide</p>
  <p class="meta">Version 1.0 &middot; {today}</p>
</div>

<div class="content">
<h1>1. Getting Started</h1>
<h2>1.1 How to Log In</h2>
<p>Navigate to <code>/admin/login</code> and enter your admin email and password. If this is your first login, use the credentials provided by your system administrator.</p>
<div class="warn-box"><strong>Important:</strong> The admin login is separate from the member login. Admin access is at <code>/admin/login</code>, not <code>/my-account/login</code>.</div>

<h2>1.2 Dashboard Overview</h2>
<p>After login, you'll see the admin dashboard with quick stats: total members, recent enrollments, contact submissions, and page views. The left sidebar provides navigation to all management sections.</p>

<h1>2. Member Management</h1>
<h2>2.1 Members Manager</h2>
<p>Navigate to <strong>Members Manager</strong> from the sidebar. This displays all registered members in a table with their Membership ID, Name, Email, Type, Level, and Sponsor.</p>

<h3>Creating a New Member</h3>
<ol>
<li>Click <strong>+ Add Member</strong></li>
<li>Fill in the <strong>Personal</strong> tab: Name, Email, Password, Gender, Phone, Date of Birth, Address, Country/State/City</li>
<li>Switch to the <strong>Membership</strong> tab to assign Level, Sponsor, Mentor, Status, and QR permissions</li>
<li>Click <strong>Save</strong></li>
</ol>

<h3>Editing a Member</h3>
<p>Click the pencil icon next to any member. The edit dialog has 4 tabs:</p>
<table>
<tr><th>Tab</th><th>Contents</th></tr>
<tr><td>Personal</td><td>Name, email, address, geo data, avatar, passport ID, Zelle</td></tr>
<tr><td>Membership</td><td>Level, ranking, status, fee, dates, type, sponsor, mentor, QR permission, password reset</td></tr>
<tr><td>Ebank</td><td>Read-only financial data entered by the member</td></tr>
<tr><td>Business Card</td><td>Generate QR codes for the member (admin-initiated)</td></tr>
</table>

<h3>QR Code Permission</h3>
<p>In the <strong>Membership</strong> tab, the <strong>Create QR Code</strong> radio (Yes/No) controls whether the member can generate their own QR code from My Account. When set to <strong>Yes</strong>, the member sees a "Business QR" section in their Invite Code page.</p>

<h2>2.2 Member Levels</h2>
<p>Levels define access tiers. Navigate to <strong>Member Levels</strong> to create/edit levels. Each level has a name, order number, and icon. New members from enrollment start at the lowest-order level (Level 1).</p>

<h2>2.3 Member Types</h2>
<p>Types define role templates with permissions. Create types like "Mentor", "Portfolio Manager", etc. Each type can have permissions like: corporate, is_mentor, portfolio_development, application_reviewer, and specific page access.</p>

<h1>3. Membership Enrollment</h1>
<h2>3.1 Form Fields</h2>
<p>Navigate to <strong>Membership Enrollment &gt; Content</strong>. The <strong>Form Fields</strong> tab shows all fields organized by step:</p>
<ul>
<li><strong>Step 1:</strong> Invite Code, Email, Name, Password</li>
<li><strong>Step 2:</strong> Personal, financial, and knowledge assessment fields</li>
<li><strong>Step 3:</strong> Legal agreements and signatures</li>
<li><strong>Step 4:</strong> Confirmation (managed in Step 4 Content tab)</li>
</ul>

<h3>Adding a Field</h3>
<ol>
<li>Click <strong>+ Add Field</strong></li>
<li>Select the Step, Field Type (20 types available), enter Field Key and Label</li>
<li>Optionally set Placeholder, Tooltip, Icon, and Options (for selects/radios)</li>
<li>Toggle Required and Visible</li>
<li>Click <strong>Create Field</strong></li>
</ol>

<h3>Reordering Fields</h3>
<p>Drag fields using the grip handle on the left side of each row. The order is saved automatically.</p>

<h2>3.2 Step 4 Content</h2>
<p>Switch to the <strong>Step 4 Content</strong> tab to customize the confirmation message. Enter a Title and Description (rich text). This content appears when users reach the final step of enrollment.</p>

<h1>4. Geographic Data</h1>
<p>Navigate to <strong>System &gt; Countries, States, Cities</strong>. The system comes pre-loaded with 249 countries, 5,046 states, and 32,423 cities. You can:</p>
<ul>
<li>Search and browse using the breadcrumb navigation</li>
<li>Add new countries, states, or cities</li>
<li>Edit existing entries</li>
<li>Delete entries (cascade warning for states/cities)</li>
</ul>

<h1>5. Landing Page</h1>
<h2>5.1 Activation</h2>
<p>Go to <strong>Settings &gt; General</strong> and toggle <strong>Landing Page Enabled</strong>. Set the <strong>Launch Date</strong> for automatic transition to the main website.</p>

<h2>5.2 Hero Carousel</h2>
<p>Navigate to <strong>Landing Page &gt; Hero</strong>. Add multiple slides with: title, subtitle, description, countdown timer, media (photo/video), buttons, and background images.</p>

<h2>5.3 Content Sections</h2>
<p>Navigate to <strong>Landing Page &gt; Content</strong> to manage: navigation links, contact form section, waiting list section, footer, and cookie banner text.</p>

<h1>6. Website Content</h1>
<h2>6.1 Hero Section</h2>
<p>Manage homepage hero slides: images, text, call-to-action buttons, and revolution slider effects.</p>

<h2>6.2 Dynamic Pages</h2>
<p>Create custom pages with the Visual Page Builder. 16 content block types are available including text, images, galleries, maps, and more.</p>

<h2>6.3 Blog &amp; Reading List</h2>
<p>Manage blog posts with categories, and reading list items with cover images and descriptions.</p>

<h1>7. Settings</h1>
<h2>7.1 General Settings</h2>
<p>Brand name, logos, social links, landing page toggle, launch date.</p>

<h2>7.2 SMTP Configuration</h2>
<p>Configure email sending: SMTP host, port, username, password, sender name, and sender email.</p>
<div class="warn-box"><strong>Critical:</strong> Without valid SMTP credentials, enrollment welcome emails and invite emails will fail silently.</div>

<h2>7.3 Color Management</h2>
<p>5 color groups (Website, My Account, Admin, Landing Page, Enrollment) with live preview. Changes apply instantly to all connected users.</p>

<h1>8. Backup &amp; Restore</h1>
<p>Navigate to <strong>System &gt; Backup</strong>. Export the entire database as JSON, or import a previously exported backup. Always create a backup before major changes.</p>

<h1>9. Roles &amp; Permissions</h1>
<p>Navigate to <strong>Security &gt; Roles &amp; Permissions</strong>. Two roles are seeded as <em>system</em> and cannot be deleted: <strong>Administrator</strong> (full access) and <strong>Member</strong> (no CMS access). Create custom roles by selecting a subset of the CMS section catalog &mdash; the assigned CMS sections become visible to operators logging in at <code>/admin/login</code>.</p>
<p>Built-in operator roles seeded in the testing scenario:</p>
<ul>
<li><strong>CMS Manager</strong> &mdash; full CMS access except Backup and Roles &amp; Permissions.</li>
<li><strong>Content Editor</strong> &mdash; Landing Page, Aurex Sections, Portfolio and SEO.</li>
<li><strong>Support</strong> &mdash; Members, Contacts, Contact Section, Purchases.</li>
<li><strong>Mentor Coordinator</strong> &mdash; Calendar group only (events, schedule, slot templates, blocked dates, bundles, coupons, payouts).</li>
</ul>
<div class="info-box"><strong>Tip:</strong> the <strong>Testing Manual</strong> (Documentation &rarr; Testing Manual) lists every preconfigured test account with login, type, level, mentor flag and sponsor &mdash; auto-generated from the live database.</div>

<h1>10. My Account Navigation</h1>
<p>Navigate to <strong>My Account &gt; My Account Navigation</strong>. Drag rows to reorder the public member sidebar, click any row label to <em>rename</em> the section, and toggle the eye-switch to hide an item globally. The rename propagates everywhere &mdash; sidebar, page H1, breadcrumb, "Back to..." links on detail pages.</p>
</div>
</body></html>"""
    return HTMLResponse(content=html)


@router.get("/docs/user-guide", response_class=HTMLResponse)
async def user_guide(user: dict = Depends(_doc_guard)):
    settings = await _get_settings()
    brand = settings.get("brand_name", "Acapital Group LLC")
    today = datetime.now().strftime("%B %d, %Y")

    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>User Guide (My Account) - {brand}</title>
<style>{BASE_CSS}{PRINT_CSS}</style></head><body>
<div class="toolbar no-print">
  <span style="font-weight:600;">User Guide (My Account)</span>
  <div><button onclick="window.print()">Save as PDF</button> <a href="/admin/documentation">Back to Docs</a></div>
</div>
<div class="spacer no-print"></div>

<div class="cover">
  <h1>{brand}</h1>
  <p class="subtitle">Member User Guide &mdash; My Account</p>
  <p class="meta">Version 1.0 &middot; {today}</p>
</div>

<div class="content">
<h1>1. Getting Started</h1>
<h2>1.1 How to Log In</h2>
<p>Go to the member login page and enter your email and password. If you registered through the Membership Enrollment form, use the credentials you created during registration.</p>
<div class="info-box"><strong>Tip:</strong> If you forgot your password, contact your administrator or sponsor for assistance.</div>

<h2>1.2 Your Dashboard</h2>
<p>After login, you'll see the My Account sidebar with all available sections. Your name, avatar, and role appear at the top of the sidebar.</p>

<h1>2. Membership Profile</h1>
<h2>2.1 General Info</h2>
<p>Click <strong>Membership Profile</strong> in the sidebar. Here you can view and update your personal information:</p>
<ul>
<li>First Name, Last Name, Email</li>
<li>Phone, Date of Birth, Gender</li>
<li>Address, Country, State, City, ZIP Code</li>
<li>Profile photo (avatar)</li>
</ul>
<p>Your Membership ID and membership level are displayed at the top of the profile.</p>

<h2>2.2 Social Networks</h2>
<p>Add your social media profiles (Twitter, Facebook, LinkedIn, Instagram, YouTube, TikTok, Website). These appear on your member profile visible to other community members.</p>

<h2>2.3 Profile Completion</h2>
<p>A progress bar shows how complete your profile is. Try to fill in as many fields as possible to reach 100% completion.</p>

<h1>3. Mentorship</h1>
<h2>3.1 Mentorship Profile</h2>
<p>If you've been assigned a mentor, this section shows your mentor's profile including their name, contact information, and biography.</p>

<h1>4. My Sponsor</h1>
<p>View your sponsor's profile &mdash; the person who invited you to the platform. You can see their membership ID, name, and contact details.</p>

<h1>5. My Ebank</h1>
<p>The Ebank section allows you to manage your financial profile. You can enter and update:</p>
<ul>
<li>Investment amounts and goals</li>
<li>Monthly savings and credit information</li>
<li>Risk tolerance and investment preferences</li>
<li>Financial independence targets</li>
</ul>
<div class="info-box"><strong>Note:</strong> This information is visible to administrators and may be used for personalized financial guidance.</div>

<h1>6. My Community</h1>
<p>Explore the community of members you've sponsored. See a visual tree of your network, including:</p>
<ul>
<li>Direct sponsored members</li>
<li>Total invitations count</li>
<li>Member details when clicking on a community member</li>
</ul>
<p>Use the filters to view: All members, Direct sponsors only, or by Level.</p>

<h1>7. Invite Codes</h1>
<h2>7.1 Generating Codes</h2>
<p>At the top of the Invite Code page, enter the number of codes to generate (1-50) and click <strong>Generate Unique Key</strong>. Each code is a unique identifier your invitees can use to register.</p>

<h2>7.2 Sharing Codes</h2>
<p>For each available code, you can:</p>
<ul>
<li><strong>Copy:</strong> Click the copy icon next to the code to copy it to clipboard</li>
<li><strong>Send by email:</strong> Click the send icon to open the invitation dialog. Fill in the invitee's name, email, phone, and gender, then click Send</li>
</ul>

<h2>7.3 Business QR Code</h2>
<p>If your administrator has enabled QR code creation for your account, you'll see a <strong>Business QR</strong> section between your Membership ID and the codes table.</p>
<ul>
<li>Click <strong>Generate QR Code</strong> to create your personal QR code</li>
<li>The QR encodes a registration URL with your sponsor ID</li>
<li>Anyone who scans the QR code will be directed to the registration page as your sponsored member</li>
<li><strong>Download:</strong> Save the QR code image to share in print or digitally</li>
<li><strong>View Full:</strong> Open the QR code in a new window for easy scanning</li>
<li><strong>Regenerate:</strong> Create a fresh QR code if needed</li>
</ul>

<h1>8. Portfolios</h1>
<h2>8.1 Creating a Portfolio</h2>
<ol>
<li>Navigate to <strong>Portfolios</strong> in the sidebar</li>
<li>Click <strong>New Portfolio</strong></li>
<li>Enter a name and description</li>
<li>Add positions: ticker symbol, quantity, purchase price, purchase date</li>
<li>Set sharing preferences (share with all members or select specific members)</li>
<li>Click <strong>Save</strong></li>
</ol>

<h2>8.2 Viewing Portfolios</h2>
<p>Your portfolio list shows all your investments with current values and performance. Click on any portfolio to see detailed charts and position breakdowns.</p>

<h1>9. Tips &amp; Best Practices</h1>
<ul>
<li>Complete your profile to 100% for better community engagement</li>
<li>Generate multiple invite codes ahead of time to always have available codes</li>
<li>Use the Business QR code at networking events for easy bulk invitations</li>
<li>Check your Community section regularly to stay connected with your network</li>
<li>Keep your Ebank data updated for accurate financial tracking</li>
</ul>
</div>
</body></html>"""
    return HTMLResponse(content=html)



@router.get("/docs/testing-manual", response_class=HTMLResponse)
async def testing_manual(user: dict = Depends(_doc_guard)):
    """Live testing manual: lists every test member with login, role, type,
    level, mentor flag, sponsor + the full role/level matrix. Renders directly
    from the database so it stays accurate even after seed re-runs."""
    settings = await _get_settings()
    brand = settings.get("brand_name", "Acapital Group LLC")
    if isinstance(brand, dict):
        brand = brand.get("en") or "Acapital Group LLC"
    today = datetime.now().strftime("%B %d, %Y")

    # Live data
    types_list = await db.member_types.find({}, {"_id": 0, "id": 1, "name": 1, "is_mentor": 1}).to_list(100)
    type_by_id = {t["id"]: t for t in types_list}
    type_mentor = {t["id"]: bool(t.get("is_mentor")) for t in types_list}

    levels = await db.member_levels.find({}, {"_id": 0}).sort("order", 1).to_list(100)

    roles = await db.cms_roles.find({}, {"_id": 0}).to_list(100)
    role_by_id = {r["id"]: r for r in roles}

    members = await db.members.find(
        {}, {"_id": 0, "password_hash": 0}
    ).sort("membership_number", 1).to_list(1000)

    # Sample members are those whose username starts with "samplemember"
    # but only the seed-script ones (samplemember1..samplememberN). UI-created
    # members may have email-as-username like "samplemember11@gmail.com" — those
    # should sort to the end and not crash the integer key extraction.
    import re as _re
    sample = [m for m in members if (m.get("username") or "").startswith("samplemember")]
    def _sample_sort_key(m):
        u = m.get("username") or ""
        match = _re.match(r"^samplemember(\d+)$", u)
        return (0, int(match.group(1))) if match else (1, u)
    sample.sort(key=_sample_sort_key)

    # Resolve sponsor display
    by_member_id = {m["member_id"]: m for m in members}
    def sponsor_display(m):
        sid = m.get("sponsor_id")
        if not sid:
            return "—"
        sp = by_member_id.get(sid)
        if not sp:
            return f"<code>{sid}</code>"
        return f"{sp.get('membership_id', '')} ({sp.get('first_name', '')} {sp.get('last_name', '')})"

    # ---- Build sample-member rows ----
    rows = []
    for m in sample:
        type_doc = type_by_id.get(m.get("member_type_id")) or {}
        is_mentor = type_mentor.get(m.get("member_type_id"), False)
        non_member_roles = [r for r in (m.get("cms_roles") or []) if r != "role_member"]
        role_names = [role_by_id.get(r, {}).get("name", r) for r in non_member_roles] or ["—"]
        level = next((lvl for lvl in levels if lvl.get("id") == m.get("level_id")), None)
        rows.append({
            "membership_id": m.get("membership_id", ""),
            "name": f"{m.get('first_name', '')} {m.get('last_name', '')}".strip(),
            "email": m.get("email", ""),
            "username": m.get("username", ""),
            "level": level.get("name", "—") if level else "—",
            "type": type_doc.get("name", "—"),
            "is_mentor": is_mentor,
            "cms_roles": ", ".join(role_names),
            "sponsor": sponsor_display(m),
        })

    member_rows_html = "".join(
        f"""<tr>
        <td><strong>{r['membership_id']}</strong></td>
        <td>{r['name']}</td>
        <td><code>{r['email']}</code></td>
        <td><code>123456789</code></td>
        <td>{r['level']}</td>
        <td>{r['type']}</td>
        <td>{'<span style="color:#0D9488;font-weight:700">YES</span>' if r['is_mentor'] else '—'}</td>
        <td>{r['cms_roles']}</td>
        <td>{r['sponsor']}</td>
        </tr>"""
        for r in rows
    )

    # ---- Roles matrix ----
    roles_matrix_html = "".join(
        f"""<tr>
        <td><strong>{r.get('name','')}</strong><br><code>{r.get('id','')}</code></td>
        <td>{r.get('description','—')}</td>
        <td>{'<strong>Full access</strong>' if r.get('full_access') else (str(len(r.get('permissions') or [])) + ' sections')}</td>
        <td>{'System' if r.get('is_system') else 'Custom'}</td>
        </tr>"""
        for r in roles
    )

    # ---- Levels matrix ----
    levels_matrix_html = "".join(
        f"""<tr>
        <td><strong>{lvl.get('name','')}</strong> (order {lvl.get('order','')})</td>
        <td>{', '.join(lvl.get('permissions') or []) or '—'}</td>
        <td><code>{lvl.get('id','')}</code></td>
        </tr>"""
        for lvl in levels
    )

    # ---- Reset instructions ----
    reset_block = """
<h2>How to reset / reseed the testing scenario</h2>
<p>Run the seed script from the backend container. It is <em>idempotent</em> &mdash;
safe to run multiple times.</p>
<pre>cd /app/backend
python scripts/seed_test_scenario.py</pre>
<div class="warn-box"><strong>Heads up:</strong> the seed script HARD-DELETES every
member except <code>admin@consultant.com</code>, <code>AUX-1</code>, <code>AUX-2</code>
and <code>AUX-3</code>. Their bookings, portfolios and ebank data are wiped along
with them. Use with care.</div>
"""

    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Testing Manual - {brand}</title>
<style>{BASE_CSS}{PRINT_CSS}
.cred {{ font-family: 'Courier New', monospace; }}
.role-badge {{ display:inline-block; padding:2px 8px; border-radius:3px; background:#e0f2f1; color:#0D9488; font-size:12px; font-weight:600; }}
</style></head><body>
<div class="toolbar no-print">
  <span style="font-weight:600;">Testing Manual</span>
  <div><button onclick="window.print()">Save as PDF</button> <a href="/admin/documentation">Back to Docs</a></div>
</div>
<div class="spacer no-print"></div>

<div class="cover">
  <h1>{brand}</h1>
  <p class="subtitle">Testing Manual &mdash; Test Accounts &amp; Scenarios</p>
  <p class="meta">Version 1.0 &middot; {today}</p>
</div>

<div class="content">
<h1>1. Overview</h1>
<p>This manual lists every preconfigured test account, its role, type, member
level, mentor flag and sponsor. Use it to log in as different personas and
verify behaviour across the CMS and My Account.</p>

<div class="info-box"><strong>Default password for ALL sample members:</strong>
<code>123456789</code>. Login URL: <code>/my-account/login</code>. CMS login:
<code>/admin/login</code>.</div>

<h1>2. Sample test members</h1>
<p>Generated by <code>scripts/seed_test_scenario.py</code>. Each row covers a
distinct combination of <em>level</em>, <em>type</em>, <em>mentor flag</em> and
<em>CMS role</em>.</p>
<table>
<tr>
  <th>Membership ID</th><th>Name</th><th>Email / Username</th>
  <th>Password</th><th>Level</th><th>Type</th><th>Mentor</th>
  <th>CMS Roles</th><th>Sponsor</th>
</tr>
{member_rows_html}
</table>

<h1>3. CMS roles</h1>
<p>Two roles are <strong>system</strong> (Administrator + Member) and cannot be
deleted. The remaining roles are scoped operator profiles created by the seed
script.</p>
<table>
<tr><th>Role</th><th>Description</th><th>Sections</th><th>Type</th></tr>
{roles_matrix_html}
</table>

<h1>4. Member levels</h1>
<p>Levels gate which sidebar items a member can see in My Account. Visibility
also respects the global toggle in <strong>CMS &gt; My Account &gt; My Account
Navigation</strong>.</p>
<table>
<tr><th>Level</th><th>Granted permissions</th><th>ID</th></tr>
{levels_matrix_html}
</table>

<h1>5. Mentor logic</h1>
<p>The <strong>Mentor</strong> column in the Members table is now <em>derived</em>
from the assigned <strong>Member Type</strong>. A member is shown as
<strong>YES</strong> in the Mentor column if and only if their assigned type
has the <code>is_mentor</code> flag enabled. The <code>is_mentor</code> field
on the member document itself is treated as legacy and is not consulted.</p>

<h1>6. Sponsor tree (sample members)</h1>
<ul>
<li><strong>AUX-101</strong> Sample Member 1 &rarr; sponsored by <strong>AUX-1</strong></li>
<li><strong>AUX-102</strong> Sample Member 2 &rarr; sponsored by <strong>AUX-2</strong></li>
<li><strong>AUX-103</strong> Sample Member 3 &rarr; sponsored by <strong>AUX-3</strong></li>
<li><strong>AUX-104</strong> ... <strong>AUX-110</strong> &rarr; all sponsored by
<strong>AUX-101</strong> (Sample Member 1)</li>
</ul>

<h1>7. Suggested test scenarios</h1>
<ol>
<li><strong>Free level visibility:</strong> log in as <code>samplemember2</code>;
verify the My Account sidebar shows ONLY <em>Membership Profile</em>.</li>
<li><strong>Premium level:</strong> log in as <code>samplemember3</code>;
verify access to Sponsor, Community, Portfolios, AUX Calendar, Bundles,
My Reservations, Calendar Sync.</li>
<li><strong>Mentor flow:</strong> log in as <code>samplemember5</code> (Mentors
type, Mentor level); verify <em>My Calendar</em> and <em>Earnings</em> appear in
the sidebar.</li>
<li><strong>Mentor column:</strong> open CMS &gt; Members; only members with
<em>Mentors</em> type should show <strong>YES</strong> in the Mentor column.</li>
<li><strong>CMS Manager scope:</strong> log in as <code>samplemember10</code>
at <code>/admin/login</code>; verify access to every CMS section <em>except</em>
Backup and Roles &amp; Permissions.</li>
<li><strong>Content Editor:</strong> log in as <code>samplemember7</code>;
verify CMS sidebar shows only Landing Page, Aurex Sections, Portfolio and SEO.</li>
<li><strong>Support:</strong> log in as <code>samplemember8</code>; verify
access to Members, Contacts, Contact Section and Purchases.</li>
<li><strong>Mentor Coordinator:</strong> log in as <code>samplemember9</code>;
verify access only to the Calendar group.</li>
<li><strong>Hide-section URL block:</strong> in CMS &gt; My Account &gt; My Account
Navigation, hide <em>My Community</em>; visit <code>/my-account/my-community</code>
as any sample member &mdash; should redirect, not 200.</li>
<li><strong>Rename propagation:</strong> rename <em>Portfolios</em> in My Account
Navigation; verify the sidebar entry, the page H1, the Bundle/Event back-links
and the breadcrumb all pick up the new label.</li>
</ol>

<h1>8. Reset / reseed</h1>
{reset_block}

</div>
</body></html>"""
    return HTMLResponse(content=html)


@router.get("/docs/aws-install", response_class=HTMLResponse)
async def aws_install_guide(user: dict = Depends(_doc_guard)):
    """Renders /app/INSTALL.md as styled HTML so admins can read the deploy
    guide directly inside the CMS at /admin/documentation. The markdown file
    is the source of truth — any edits to INSTALL.md are picked up on the
    next request without a restart."""
    import os
    from markdown_it import MarkdownIt

    settings = await _get_settings()
    brand = settings.get("brand_name", "Acapital Group LLC")
    if isinstance(brand, dict):
        brand = brand.get("en") or "Acapital Group LLC"
    today = datetime.now().strftime("%B %d, %Y")

    md_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "INSTALL.md")
    md_path = os.path.normpath(md_path)
    try:
        with open(md_path, "r", encoding="utf-8") as f:
            md_text = f.read()
    except FileNotFoundError:
        md_text = "_INSTALL.md not found at_ `" + md_path + "`."

    md = MarkdownIt("commonmark", {"html": False, "linkify": True, "typographer": True}).enable("table").enable("strikethrough")
    body_html = md.render(md_text)

    extra_css = """
    .content h1 { font-size: 24px; margin-top: 32px; padding-bottom: 6px; border-bottom: 2px solid #0D9488; }
    .content h2 { font-size: 18px; margin-top: 28px; color: #0D9488; }
    .content h3 { font-size: 15px; margin-top: 20px; }
    .content table { border-collapse: collapse; margin: 14px 0; width: 100%; font-size: 13px; }
    .content th, .content td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
    .content th { background: #f8fafc; color: #1a2332; font-weight: 600; }
    .content code { background: #f1f5f9; padding: 1px 6px; border-radius: 3px; font-size: 0.92em; }
    .content pre { background: #0f172a; color: #e2e8f0; padding: 14px 16px; border-radius: 6px; overflow-x: auto; font-size: 12px; line-height: 1.55; }
    .content pre code { background: transparent; color: inherit; padding: 0; }
    .content blockquote { border-left: 3px solid #0D9488; background: #f0fdfa; padding: 10px 14px; margin: 14px 0; border-radius: 0 4px 4px 0; }
    .content ul, .content ol { padding-left: 22px; }
    .content hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    .content a { color: #0D9488; }
    """

    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>AWS Installation Guide - {brand}</title>
<style>{BASE_CSS}{PRINT_CSS}{extra_css}</style></head><body>
<div class="toolbar no-print">
  <span style="font-weight:600;">AWS Installation Guide</span>
  <div>
    <button onclick="window.print()">Save as PDF</button>
    <a href="/api/docs/aws-install/markdown" download="INSTALL.md">Download .md</a>
    <a href="/admin/documentation">Back to Docs</a>
  </div>
</div>
<div class="spacer no-print"></div>

<div class="cover">
  <h1>{brand}</h1>
  <p class="subtitle">AWS Installation Guide</p>
  <p class="meta">Step-by-step deploy &middot; {today}</p>
</div>

<div class="content">
{body_html}
</div>
</body></html>"""
    return HTMLResponse(content=html)


@router.get("/docs/feature-audit", response_class=HTMLResponse)
async def feature_audit(user: dict = Depends(_doc_guard)):
    """Feature Audit — complete inventory of all system features, grouped by section."""
    settings = await _get_settings()
    brand = settings.get("brand_name", "Acapital Group LLC")
    if isinstance(brand, dict):
        brand = brand.get("en") or "Acapital Group LLC"
    today = datetime.now().strftime("%B %d, %Y")

    # Pull site theme colours so the audit page matches the live brand
    tc = (settings.get("theme_colors") or {}).get("website") or {}
    C_WIN    = tc.get("color_win",    "#16a34a")
    C_OPEN   = tc.get("color_open",   "#d97706")
    C_LOSS   = tc.get("color_loss",   "#dc2626")
    C_BORDER = tc.get("border_color", "#e2e8f0")
    C_PRIMARY   = tc.get("primary",   "#1a2332")
    C_ACCENT    = tc.get("accent",    "#0D9488")
    C_HEADING   = tc.get("heading",   "#1a2332")
    C_TEXT      = tc.get("text",      "#374151")
    C_BG        = tc.get("background","#ffffff")
    C_SUBTLE    = tc.get("subtle",    "#f8fafc")

    # ── Feature Data ────────────────────────────────────────────────────────
    SECTIONS = [
        {
            "title": "Authentication & Access Control",
            "features": [
                ("Admin / CMS Login",      "Email + password login for admins and CMS operators",                     "/admin/login",                         "POST /api/auth/login",                                                  "complete",
                 "Build a secure admin login page with email and password fields. On submit, validate credentials against a hashed password store using bcrypt comparison. On success, create a server-side session with a signed token stored as an HttpOnly cookie with configurable expiry. Return the authenticated user's role and permission set. Apply rate limiting: max 5 attempts per minute per IP. Display an inline error on invalid credentials. Redirect to the admin dashboard on success. Protect all admin routes with a session-check middleware that verifies the cookie on every request."),
                ("Member Login",            "Email/username + password for My Account area",                           "/my-account/login",                    "POST /api/auth/login",                                                  "complete",
                 "Build a member login page accepting email (or username) and password. Compare credentials server-side using bcrypt hashing. On success, issue a signed session token as an HttpOnly cookie. Return the member's profile, role, and permissions. Display an inline error on failure. Redirect to the member dashboard. All member-area routes must verify the session server-side before rendering content."),
                ("Logout",                  "Clears HttpOnly cookie and session token",                                 "—",                                    "POST /api/auth/logout",                                                 "complete",
                 "Implement a logout endpoint that invalidates the current session. Delete or expire the server-side session record. Clear the HttpOnly cookie in the response headers. Return a 200 confirmation. Redirect the user to the login page. Ensure subsequent requests with the same cookie are rejected."),
                ("Session Check",           "Validates active token, returns user + effective permissions",             "—",                                    "GET /api/auth/me",                                                      "complete",
                 "Build a /me endpoint that reads the session cookie, validates the token against the server-side session store, and returns the authenticated user's profile plus their effective permissions. If the token is missing, expired, or invalid, return 401. Call this endpoint on every protected page load to confirm authentication status and refresh the client-side user state."),
                ("Forgot Password",         "Rate-limited email reset link via SMTP (30-min token)",                   "/my-account/forgot-password",          "POST /api/auth/forgot-password",                                        "complete",
                 "Implement a forgot-password flow. Accept an email address. If the email exists, generate a cryptographically random reset token, store it with a 30-minute expiry, and send a reset link via SMTP. Rate-limit to 3 requests per 15 minutes per IP. Always return a generic success message regardless of whether the email exists, to prevent user enumeration."),
                ("Reset Password",          "Token validation + new password submission",                              "/my-account/reset-password",           "GET /api/auth/reset-password/verify · POST /api/auth/reset-password",    "complete",
                 "Build a two-step password reset. Step 1 (GET): validate the reset token from the URL query string and return whether it is valid and unexpired. Step 2 (POST): accept the token and a new password, verify the token, hash and save the new password, then invalidate the token. Show a clear error if the token has expired or was already used."),
                ("Change Password",         "Authenticated in-place password update",                                  "/my-account/membership-profile",       "POST /api/auth/change-password",                                        "complete",
                 "Build an authenticated change-password endpoint. Require the current password and the new password. Verify the current password against the stored hash. If correct, hash the new password and update the record. Optionally invalidate all other active sessions. Return 400 with a descriptive error if the current password is wrong."),
                ("Google OAuth",            "Social login via Google — button hidden; backend route still calls legacy proxy", "—",               "POST /api/auth/session",                                                "broken",
                 "Implement Google OAuth 2.0 sign-in. Add a sign-in button that initiates the OAuth authorization flow. Exchange the authorization code for a Google ID token server-side. Verify the token signature and expiry. Extract the user's email and sub claim. Find or create a matching user record in the database. Issue a session token. Store the OAuth provider name and subject ID on the user record for future sign-ins."),
                ("CMS Roles & Permissions", "Define operator roles with per-section access grants",                    "/admin/roles",                         "GET/POST/PUT/DELETE /api/admin/cms-roles · PUT /api/admin/members/:id/cms-roles", "complete",
                 "Build a role-based access control system for admin operators. Define roles with a name and a set of section-level permission grants. Endpoints: list all roles, create a role, update a role's permission set, delete a role, and assign one or more roles to a specific user. A user's effective permissions are the union of all assigned roles. Protect each admin section with middleware that checks effective permissions before serving the response."),
                ("Rate Limiting",           "IP-based throttle: 5 req/min login, 3/15min forgot-password",             "—",                                    "(middleware — utils/rate_limit.py)",                                     "complete",
                 "Implement IP-based rate limiting middleware. Configure limits per route group: 5 requests per minute for login, 3 requests per 15 minutes for forgot-password. Track request counts in a fast in-memory store keyed by IP address and route. Return HTTP 429 with a Retry-After header when the limit is exceeded. Apply the middleware selectively to high-risk endpoints only."),
                ("reCAPTCHA Guard",         "Optional Google reCAPTCHA v2 on public forms",                            "—",                                    "POST /api/captcha/verify · GET /api/public/captcha-config",              "complete",
                 "Add optional Google reCAPTCHA v2 protection to public forms. Store the site key and secret key in the database settings. Expose a config endpoint that returns the site key to the frontend. On form submit, include the reCAPTCHA token in the request body. Server-side, verify the token against Google's siteverify API. Reject the request with a validation error if verification fails. Provide a settings toggle to enable or disable reCAPTCHA without redeploying."),
            ],
        },
        {
            "title": "Public Website",
            "features": [
                ("Homepage",            "Main site with hero, services, blog, testimonials, gallery, maps, aurex sections",   "/",                        "GET /api/public/settings · /hero-slides · /services · /blog · /testimonials · /gallery",  "complete",
                 "Build a multi-section public homepage. Each section (hero, services, blog preview, testimonials, gallery, maps, about) is fetched from a dedicated API endpoint and rendered independently. A global settings endpoint provides brand config (name, logo, colors). Sections load in parallel on the client. Admin controls which sections are visible and their display order via a section-config endpoint."),
                ("Hero Slides",         "Scheduled, page-assigned slides (image / video / canvas)",                            "/",                        "GET /api/public/hero-slides?page=",                                                      "complete",
                 "Build a hero slideshow component. Each slide has a background type (image, video, or CSS canvas), overlay headline, sub-text, CTA button, assigned page identifier, start date, and end date. Filter slides by page on the client using a query parameter. Support scheduled publishing: slides with a future start date are hidden. Auto-advance with a configurable interval. Provide full CRUD in the admin."),
                ("Services",            "Public services listing with individual detail pages",                                 "/service/:id",             "GET /api/public/services · /services/:id",                                               "complete",
                 "Build a public services listing page and individual service detail pages. Each service has a title, short description, full description (rich text), image, price, and slug. The listing page renders all published services in a grid. The detail page shows the full description with a CTA button. Admin can create, edit, reorder, and delete services."),
                ("Blog / News",         "Published posts with pagination and category filter",                                  "/news · /news/:slug",      "GET /api/public/blog · /blog/:slug",                                                     "complete",
                 "Build a blog with a listing page and individual post pages. Posts have a title, slug (auto-generated), body (rich text), featured image, category, published date, and a draft/published toggle. The listing page supports pagination and category filtering via query parameters. Individual posts are served by slug. Only published posts are visible publicly. Drafts are accessible to admins only."),
                ("Gallery",             "Photo albums with category filtering and sub-gallery view",                            "/gallery · /album/:id",    "GET /api/public/gallery · /gallery-albums · /gallery-albums/:id/photos",                 "complete",
                 "Build a photo gallery with albums. Each album has a title, cover image, and category. The main gallery page shows all albums, filterable by category. Clicking an album opens a sub-gallery with a lightbox viewer for individual photos. Admin can upload photos, assign them to albums, and drag-drop reorder within albums."),
                ("Books / Reading List","Public reading list",                                                                  "/reading-list",            "GET /api/public/books",                                                                  "complete",
                 "Build a public reading list page. Each entry has a title, author, cover image, description, a purchase or info link, and an optional category tag. The public page renders all entries in a responsive grid. Admin can add, edit, reorder, and delete entries. Support category filtering on the public page."),
                ("Maps",                "Interactive Leaflet maps with markers, filtered by type",                              "/map/:slug",               "GET /api/public/maps · /maps/:slug · /map-locations",                                    "complete",
                 "Build interactive map pages using Leaflet.js. Each map has a slug, title, and a set of location markers. Each marker has a name, description, latitude, longitude, and a type category. Different marker types use distinct icons. Admin can create maps, add and edit markers, and assign types. The public page loads a specific map by its slug."),
                ("Portfolio (public)",  "Featured projects on main site",                                                       "/featured-projects",       "GET /api/public/portfolio",                                                              "complete",
                 "Build a public portfolio page showing featured projects. Each project has a title, description, cover image, tags, and an optional detail URL. Projects are fetched from an API and rendered in a card grid. Admin can create, edit, reorder, and delete projects from the CMS."),
                ("Testimonials",        "Testimonials section on homepage",                                                     "/",                        "GET /api/public/testimonials",                                                           "complete",
                 "Build a testimonials section for the homepage. Each testimonial has a quote, author name, author title or company, and an avatar image. Admin can add, edit, delete, and reorder testimonials via the CMS. The public component renders them in a carousel or responsive grid."),
                ("Dynamic Pages",       "CMS-managed pages with optional member login gate",                                    "/:slug · /page/:id",       "GET /api/public/nav-pages · /public/page/:type",                                         "complete",
                 "Build a CMS-controlled dynamic page system. Each page has a slug, title, rich-text body, published status, and an optional member-login gate. If the gate is enabled, unauthenticated visitors see a login prompt instead of the content. Admin can create, edit, and delete pages. Published pages are accessible at /:slug and optionally appear in the site navigation."),
                ("Contact Form",        "Public contact form with SMTP delivery",                                               "/ (section)",              "POST /api/contact",                                                                      "complete",
                 "Build a public contact form with configurable fields (name, email, phone, subject, message). On submit, validate all fields server-side and send the message via SMTP to a configured list of recipient addresses. Store every submission in the database. Return a success or error response to the frontend. Admin can view all submissions in the CMS."),
                ("Site Search",         "Full-text search across content",                                                      "—",                        "GET /api/search?q=",                                                                     "partial",
                 "Build a full-text search endpoint. Accept a query string parameter (q). Search across multiple content collections: pages, blog posts, services, etc. Return a ranked list of results with title, excerpt, content type, and URL. Highlight matched terms in the excerpt. Support pagination with a page and limit parameter."),
                ("SEO",                 "Per-page meta tags managed in CMS",                                                    "all public pages",         "GET /api/public/seo/:path",                                                              "complete",
                 "Build a per-page SEO management system. For each URL path, store a meta title, meta description, and Open Graph image URL. A public endpoint returns SEO data by path. Each page renders the correct title and meta tags in the HTML head using the fetched data. Admin can edit SEO fields for any path through a CMS interface."),
                ("Navbar / Footer",     "Dynamic navigation with CMS-managed pages and links",                                  "all public pages",         "GET /api/public/nav-pages",                                                              "complete",
                 "Build a dynamic navigation system. Navbar and footer links are sourced from a database of CMS-managed pages and custom links. Admin can add, reorder, and remove links. The footer has its own configurable link sections. Both navbar and footer fetch their data from a shared settings endpoint on page load and update without redeployment."),
                ("Section Order",       "Admin-controlled visibility and ordering of homepage sections",                        "/",                        "GET /api/public/sections",                                                               "complete",
                 "Build an admin interface for controlling homepage section visibility and display order. Store a config entry per section with a visible flag and sort index. A public GET endpoint returns the ordered, visible sections. An admin PUT endpoint saves changes. The admin UI provides drag-drop reordering and visibility toggles that take effect immediately."),
            ],
        },
        {
            "title": "Landing Page System",
            "features": [
                ("Landing Page",              "Toggleable coming-soon page with countdown to launch date",     "/ (when active)",    "GET /api/public/landing-content · /public/landing-hero",          "complete",
                 "Build a toggleable coming-soon landing page. When active, the root URL shows the landing page instead of the main site. The landing page includes a countdown timer to a configured launch date, a hero section, an email capture form, and a contact form. Admin can toggle the landing page on/off and set the launch date from the CMS without redeploying."),
                ("Landing Hero Slides",       "Hero slideshow for the landing page",                          "—",                  "GET/POST/PUT/DELETE /api/admin/landing-hero",                      "complete",
                 "Build a hero slideshow specific to the landing page, separate from the main site hero. Each slide has a background image or video, headline, and sub-text. Admin has full CRUD over landing hero slides. The slides are served via a dedicated API endpoint queried only when the landing page is active."),
                ("Landing Subscriber List",   "Email capture form on landing page",                           "—",                  "POST /api/public/landing-subscribe · GET /api/admin/landing-subscribers", "complete",
                 "Build an email capture form for the landing page. Visitors submit their email address to join a waitlist. Store each subscriber with their email, submission timestamp, and optional name. Prevent duplicate email submissions. Admin can view the full subscriber list in a dedicated CMS table and export it."),
                ("Landing Contact Form",      "Contact form specific to the landing page",                    "—",                  "POST /api/public/landing-contact · GET /api/admin/landing-contacts",    "complete",
                 "Build a contact form specific to the landing page. Submissions are stored in a separate collection from the main site contact form. Admin can view and manage landing-page contact submissions from a dedicated CMS section, keeping them distinct from post-launch inquiries."),
                ("Landing Content Editor",    "Admin editor for landing page body content",                   "/admin/landing-content", "GET/PUT /api/admin/landing-content",                           "complete",
                 "Build a rich-text editor in the admin CMS for managing the landing page body content. The content is stored as HTML or structured data in the database and served via a GET endpoint. The landing page fetches and renders it dynamically. Admin saves changes via a PUT endpoint with immediate effect."),
            ],
        },
        {
            "title": "Member Registration & Enrollment",
            "features": [
                ("Quick Registration (Path A)",    "Simplified form: invite code + name + email + password",                            "/my-account/register",       "POST /api/member/register · GET /api/member/validate-code/:code",                                "complete",
                 "Build a simplified member registration form. Required fields: invite code, first name, last name, email, and password. Validate the invite code against the database before allowing submission — return an error if the code is invalid or already used. On success, create the member record, mark the invite code as used, and auto-log in the user with a session cookie. Show inline validation errors for duplicate emails or invalid codes."),
                ("Full Enrollment Wizard (Path B)","4-step application: credentials → 37-field profile → legal agreements → confirm",   "/membership-enrollment",     "GET /api/public/enrollment-fields · POST /api/public/enrollment/validate-code · submit",      "complete",
                 "Build a multi-step enrollment wizard. Step 1: credentials (email, password, invite code validation). Step 2: a fully configurable profile form with custom fields (text, select, date, checkbox) dynamically loaded from a settings endpoint. Step 3: legal agreements page requiring checkbox acceptance. Step 4: review and submit. Validate each step server-side before allowing progression. On final submit, create the member record with all collected data."),
                ("Invite Codes",                   "Members generate and send invite codes to prospects",                               "/my-account/invite-code",    "POST /api/member/invite-codes/generate · GET /api/member/invite-codes · POST .../send",        "complete",
                 "Build an invite code system. Each member can generate unique invite codes tied to their account. Members can view all their generated codes with status (unused/used) and who used them. A send endpoint emails a specified code to a prospect's email address with a registration link pre-filled. Codes track the generator's ID and the registrant's ID once redeemed."),
                ("Enrollment Fields Admin",        "Add / remove / reorder wizard fields per step",                                     "/admin/enrollment-fields",   "GET/POST/PUT/DELETE /api/admin/enrollment-fields · /reorder · /visibility",                    "complete",
                 "Build an admin interface for configuring enrollment wizard fields. Each field has a label, input type (text, select, checkbox, date), step assignment (1–4), required toggle, display order, and visibility flag. Admin can add, edit, and delete fields. A reorder endpoint accepts a new ordered list of IDs. A visibility toggle hides a field from new registrations without deleting historical data."),
                ("Enrollment Applications",        "Admin view of all submitted enrollment forms",                                      "/admin/members",             "GET /api/admin/enrollment-applications",                                                          "complete",
                 "Build an admin view of all submitted enrollment applications from the full wizard. Display applicant name, email, submission date, and current status. Admin can click any application to view the complete submitted field data. Support filtering by date range and status. Pagination is required for large datasets."),
            ],
        },
        {
            "title": "My Account — Member Area",
            "features": [
                ("Membership Profile",    "View / edit personal info, avatar, contact details",                          "/my-account/membership-profile",   "PUT /api/member/profile · GET /api/auth/me",                           "complete",
                 "Build a member profile page pre-filled from the authenticated session. Display and allow editing of: name, email, phone, address, and avatar image. Avatar upload should be handled as a separate file-upload call returning a URL. Changes are submitted via a PUT endpoint. Show a success toast on save and inline errors on validation failure."),
                ("Biography",             "Rich-text personal bio with history entries",                                 "/my-account/membership-profile",   "PUT /api/member/biography",                                            "complete",
                 "Build a biography section on the member profile page. Members can write and save a rich-text personal bio. Support an ordered list of history entries (e.g., work history, education), each with a title, description, and date range. Members can add, edit, reorder, and delete history entries. All changes are saved via a single PUT endpoint."),
                ("My Sponsor",            "View assigned sponsor's profile and contact info",                            "/my-account/my-sponsor",           "GET /api/member/my-sponsor",                                           "complete",
                 "Build a read-only page showing the current member's assigned sponsor. Display the sponsor's name, profile photo, title, and contact information. Fetch from a dedicated endpoint that returns the sponsor record linked to the current user. Show a friendly placeholder message if no sponsor has been assigned."),
                ("My Mentor",             "View assigned mentor and navigate to booking",                                "/my-account/mentorship-profile",   "GET /api/member/my-mentor",                                            "complete",
                 "Build a read-only page showing the current member's assigned mentor. Display the mentor's name, photo, bio, session types, and a button that links to the booking calendar filtered to that mentor. Fetch from a dedicated endpoint. Show a placeholder if no mentor is assigned."),
                ("Mentorship Profile",    "Mentor's own availability settings and bio",                                  "/my-account/mentorship-profile",   "GET /api/member/mentorship/*",                                         "complete",
                 "Build a mentor configuration page for members with the mentor role. Allow the mentor to set their display bio, availability description, hourly rate, and session types offered. This data populates their public mentor card on the booking calendar. Save changes via a PUT endpoint. Only accessible to users with mentor-level permissions."),
                ("E-Bank",                "Internal financial tracker: assets, debt, savings, investments",              "/my-account/ebank",                "GET/PUT /api/member/ebank · /ebank/activities",                        "complete",
                 "Build a personal financial tracker for members with four categories: assets, liabilities, savings, and investments. Display the current balance per category. Members can log activity entries (amount, description, date, category) that adjust the running total. Show a transaction history list per category. All data is private to the member and fetched from a dedicated endpoint."),
                ("QR Code",               "Generate personal QR for sponsorship / quick registration",                  "/my-account/invite-code",          "POST /api/member/generate-qr",                                         "complete",
                 "Build a QR code generation feature for members. The QR encodes a registration or sponsorship URL with the member's ID pre-filled as the sponsor. Generate the QR image server-side using a QR library and return it as a base64 image or hosted URL. Display it on screen with a download button. Allow regeneration on demand."),
                ("My Community",          "Visual member network tree (sponsor tree, connections)",                      "/my-account/my-community",         "GET /api/member/my-community",                                         "complete",
                 "Build a visual network tree showing the member's community connections. The tree shows the member's sponsor at the top level, the member in the middle, and their direct invitees below. Each node displays a name and avatar. Render the tree using a hierarchical SVG or CSS-based layout. Fetch the tree structure from a dedicated API endpoint."),
                ("Portfolios",            "Member personal portfolio CRUD with public sharing toggle",                   "/my-account/portfolios",           "GET/POST/PUT/DELETE /api/member/portfolios/:id",                       "complete",
                 "Build a personal portfolio CRUD for members. Each entry has a title, description, cover image, tags, project URL, and a public/private visibility toggle. Members can create, edit, and delete their own portfolios. Public portfolios appear on the member's shareable profile page. Fetch the current member's portfolios from a protected endpoint."),
                ("My Account Navigation", "Admin-configurable sidebar with reorder and rename",                          "(sidebar)",                        "GET /api/public/myaccount-nav",                                        "complete",
                 "Build a configurable sidebar navigation for the member area. Nav items are fetched from a public API endpoint on load. Each item has a label, route, icon, and display order. Admin can reorder and rename items from the CMS. Members see only items they have access to based on their membership type permissions."),
                ("Notifications",         "In-app notification bell with unread count and mark-read",                   "(sidebar)",                        "GET /api/member/notifications · /unread-count · PUT .../read",         "partial",
                 "Build an in-app notification system. Store notifications with recipient ID, message, type, link, and read/unread status. A bell icon in the header fetches the unread count on load and polls periodically. Clicking the bell opens a dropdown list of recent notifications. Clicking a notification marks it as read via a PUT endpoint and optionally navigates to a related page."),
                ("Profile Activity Log",  "History of member profile actions",                                           "/my-account/membership-profile",   "GET /api/member/profile-activities",                                   "complete",
                 "Build a read-only activity log displayed on the member profile page. Each log entry records an action type (e.g., profile updated, password changed), a description, and a timestamp. Entries are created server-side whenever the member modifies their profile or account. Display the log in reverse-chronological order with pagination."),
                ("Member File Upload",    "Upload images and documents to member profile",                               "—",                                "POST /api/member/upload · /member/upload-file",                        "complete",
                 "Build a file upload endpoint for members. Accept image files (JPEG, PNG, WebP) up to 10 MB and documents (PDF, DOCX) up to 25 MB. Validate MIME type and file size server-side before saving. Store files in a designated uploads directory with a unique filename. Return the public URL of the uploaded file. Link the file to the member's record."),
            ],
        },
        {
            "title": "Mentorship & Booking System",
            "features": [
                ("Mentorship Calendar (member)", "Browse available mentor slots and book sessions",              "/my-account/mentorship-calendar",        "GET /api/member/mentorship/slots · /mentor-slot-templates",                    "complete",
                 "Build a calendar view showing available mentor booking slots. Fetch all open slots for the member's assigned mentor. Display slots in a monthly or weekly calendar grid. Clicking a slot shows its details (date, time, duration, price, spots remaining) and a Book button. Support filtering by date range."),
                ("Mentor Calendar View",         "Mentor manages their own published availability slots",        "/my-account/mentor-calendar",            "GET/POST/PUT/DELETE /api/member/mentorship/slots",                             "complete",
                 "Build a calendar management interface for mentors to manage their own availability. Mentors can view their slots in a calendar grid, create new slots, edit existing ones, and delete slots. Each slot has a date, start time, duration, capacity, price (0 for free), and published status. Only the authenticated mentor can manage their own slots."),
                ("Slot Booking",                 "Book a mentor slot — free or paid via Stripe",                 "—",                                      "POST /api/member/mentorship/book/:id",                                         "complete",
                 "Build a slot booking flow. When a member selects a slot, show a confirmation modal with slot details and total price. If the slot is free, submit a booking request directly. If paid, create a payment session and redirect to a hosted checkout page. On payment confirmation, create the booking record, decrement slot capacity, and send confirmation emails to both parties."),
                ("Booking Cancellation",         "Cancel a booking with automatic waitlist promotion",           "—",                                      "POST /api/member/mentorship/cancel/:id",                                       "complete",
                 "Build a booking cancellation feature. Members can cancel upcoming bookings up to a configurable cutoff period before the slot time. On cancellation, restore the slot capacity and update the booking status to cancelled. If a waitlist exists for that slot, automatically promote the next waitlisted member and send them a notification email."),
                ("Mentor Stripe Checkout",       "Stripe hosted checkout for paid mentor sessions",              "/my-account/mentorship/checkout-success","POST /api/member/mentorship/book/:id (creates Stripe session)",                "complete",
                 "Build Stripe hosted checkout for paid mentor sessions. On booking a paid slot, create a Stripe Checkout Session server-side with the slot price, description, and success/cancel URLs. Redirect the member to Stripe's hosted payment page. A success URL receives the session ID. A status endpoint confirms payment by checking the Stripe session state and finalises the booking record."),
                ("My Bookings",                  "Member list of all past and upcoming bookings",                "/my-account/my-bookings",                "GET /api/member/my-bookings",                                                  "complete",
                 "Build a bookings history page for members. List all bookings (past and upcoming) with mentor name, date, time, duration, status, and amount paid. Upcoming bookings show a Cancel button if the cancellation window is still open. Sort by date descending. Fetch all data from a single protected endpoint."),
                ("Mentor Earnings",              "Mentor's payout history and session summary",                  "/my-account/earnings",                   "GET /api/member/mentor/earnings",                                              "complete",
                 "Build an earnings summary page for mentors. Show total earnings, total sessions completed, and average session value. List each completed paid booking as a line item with date, member name, session amount, and payout status. Fetch from a dedicated earnings endpoint. Only accessible to users with the mentor role."),
                ("Slot Templates (admin)",       "Define reusable slot patterns with recurrence rules",          "/admin/calendar/mentor-slot-templates",  "GET/POST/PUT/DELETE /api/admin/mentor-slot-templates",                         "complete",
                 "Build an admin interface for creating reusable slot templates. A template defines a title, duration, capacity, price, and recurrence rules (daily, weekly, specific days). Admin can apply a template to a mentor and date range to generate multiple slots automatically. Templates can be edited and deleted without affecting already-generated slots."),
                ("Mentorship Schedule (admin)",  "Admin overview of all mentor slots and bookings",              "/admin/calendar/mentorship",             "GET /api/admin/mentorship/slots · /slots/:id/bookings",                        "complete",
                 "Build an admin overview of all mentor slots across all mentors. Display in a table with mentor name, date, time, capacity, booked count, and status. Admin can click any slot to see the full booking list for that slot. Support filtering by mentor and date range."),
                ("Blocked Dates (admin)",        "Block specific dates system-wide from new bookings",           "/admin/calendar/blocked-dates",          "GET/POST/PUT/DELETE /api/admin/blocked-dates",                                 "complete",
                 "Build an admin interface to block specific dates system-wide. On a blocked date, no new bookings can be made regardless of slot availability. Admin selects dates from a calendar picker and provides an optional reason. The booking endpoint checks blocked dates before confirming any reservation. Admin can remove blocked dates when they are no longer needed."),
                ("Payouts (admin)",              "Record and track mentor payouts",                              "/admin/payouts",                         "GET/POST/DELETE /api/admin/payouts",                                           "complete",
                 "Build an admin payout tracking interface. Admin can record a payout to a mentor with amount, date, payment method, and notes. Each payout can be linked to a set of completed bookings. List all payouts in a table with mentor name, amount, date, and status. Admin can mark payouts as processed and delete erroneous records."),
            ],
        },
        {
            "title": "Global Events & Calendar",
            "features": [
                ("Global Events Calendar", "Member view of organisation events with capacity and waitlist",  "/my-account/global-calendar",  "GET /api/member/calendar/events",                                                        "complete",
                 "Build a member-facing events calendar. Display upcoming organisation events in a monthly calendar grid or list view. Each event card shows title, date, time, location, and available spots. Members click an event to navigate to its detail page. Fetch all visible events from a single API endpoint."),
                ("Event Detail & RSVP",    "View event details, register or cancel registration",            "/my-account/event/:id",        "GET /api/member/calendar/events/:id · POST .../register · .../cancel",                   "complete",
                 "Build an event detail page. Display full description, date, time, location, speaker(s), capacity, and current registration count. Show a Register button if spots remain, a Join Waitlist button if the event is full, or a Cancel Registration button if the member is already registered. Prevent duplicate registrations. Cancellation frees a spot and promotes the next waitlist entry."),
                ("Event File Upload",      "Members attach files to an event they registered for",           "—",                            "POST /api/member/calendar/events/:id/upload",                                             "complete",
                 "Build a file attachment feature for registered event participants. Members who are registered for an event can upload files (e.g., reports, assignments) attached to that event registration. Files are stored server-side and linked to the member's registration record. Admin can view and download submitted files per event from the admin event management view."),
                ("iCal Sync",              "Personal iCal feed URL for Google / Apple Calendar sync",        "/my-account/calendar-sync",    "GET /api/member/ical/info · POST /api/member/ical/regenerate",                           "complete",
                 "Build a personal iCal feed for members. Generate an iCal (.ics) file containing all events the member is registered for. Each feed URL is unique per member and includes a private token for access without requiring login. Members subscribe to the URL in their calendar app. Provide a Regenerate button that creates a new token and invalidates the previous feed URL."),
                ("Global Events (admin)",  "Create/edit/clone events, view registrations, export CSV",       "/admin/calendar/global",       "GET/POST/PUT/DELETE /api/admin/calendar/events · /registrations · /registrations/csv",  "complete",
                 "Build an admin events manager. Admin can create, edit, clone, and delete events. Each event has a title, description, date, time, location, capacity, featured image, and published status. Admin can view the full registration list for any event showing member name, email, and registration date. Provide a CSV export of registrations per event."),
            ],
        },
        {
            "title": "Content Bundles",
            "features": [
                ("Browse Bundles",          "Member browses available session credit packs",                 "/my-account/bundles",                   "GET /api/member/bundles",                                              "complete",
                 "Build a bundle listing page for members. Each bundle is a purchasable pack of session credits. Display bundle name, description, included session count, price, and validity period in a card grid. Members click a card to view the full bundle detail page. Fetch all active bundles from a single endpoint."),
                ("Bundle Detail",           "View bundle contents and session count before purchase",        "/my-account/bundles/:id",               "GET /api/member/bundles/:id",                                          "complete",
                 "Build a bundle detail page. Show the full bundle description, what sessions are included, session count, validity period, and price. Include a Buy button that initiates checkout. Fetch the specific bundle by ID from the API. Display a clear breakdown of what the member receives."),
                ("Bundle Checkout",         "Purchase a bundle via Stripe hosted checkout",                  "/my-account/bundles/checkout-success",  "POST /api/member/bundles/checkout/:id · GET .../status/:sid",          "complete",
                 "Build Stripe hosted checkout for bundle purchases. On clicking Buy, create a Stripe Checkout Session server-side with the bundle name and price. Redirect to the Stripe-hosted payment page. On success, redirect to a success URL with the session ID. A status endpoint polls the Stripe session to confirm payment completion. On confirmation, credit the member's session balance for that bundle."),
                ("Mentor Personal Bundles", "Mentors create bundles redeemable only on their own slots",     "/my-account/mentor-calendar",           "GET/POST/PUT/DELETE /api/member/mentor/bundles",                       "complete",
                 "Build a feature for mentors to create their own credit bundles. Each bundle has a name, session count, price, and validity period. Credits purchased from a mentor bundle are redeemable only on that mentor's own slots. Admin and the mentor can manage these bundles from their respective dashboards."),
                ("Member Credits",          "View remaining session credits per mentor / global",            "—",                                     "GET /api/member/credits",                                              "complete",
                 "Build a credit balance view for members. Display remaining session credits broken down by source: global bundles and mentor-specific bundles. For each credit block show the bundle name, sessions remaining, expiry date, and the mentor it applies to (if applicable). Fetch all credit data from a single protected endpoint."),
                ("Coupon Validation",       "Apply coupon code at checkout for discount",                    "—",                                     "POST /api/member/coupons/validate",                                    "complete",
                 "Build a coupon code system. Each coupon has a code, discount type (percentage or fixed amount), discount value, applicable product targets, usage limit, and expiry date. At checkout, members enter a coupon code. The validation endpoint checks: code exists, not expired, usage limit not exceeded, applicable to the selected product. Return the discounted total and coupon details, or a descriptive error."),
                ("Admin Bundle Manager",    "Create and manage the global bundle catalog",                   "/admin/calendar/bundles",               "GET/POST/PUT/DELETE /api/admin/bundles",                               "complete",
                 "Build an admin interface for managing the global session bundle catalog. Admin can create, edit, and delete bundles. Each bundle has a name, description, session count, price, validity period, and active/inactive status. Inactive bundles are hidden from the member listing but historical purchase records are preserved."),
                ("Admin Coupon Manager",    "Create, configure, and analyse coupon codes",                   "/admin/calendar/coupons",               "GET/POST/PUT/DELETE /api/admin/coupons · GET .../analytics",           "complete",
                 "Build an admin coupon management interface. Admin creates coupons with a unique code, discount type and value, applicable product targets, usage limit, and expiry date. A coupon list table shows each code's usage count, remaining uses, and status. An analytics view shows total discount value given, number of uses, and which products the coupon was applied to most."),
            ],
        },
        {
            "title": "Payments (Stripe)",
            "features": [
                ("Service Checkout",        "Purchase a service via Stripe hosted checkout",                         "/checkout/success",    "POST /api/checkout · GET /api/checkout/status/:id",        "partial",
                 "Build a Stripe hosted checkout flow for purchasing services. On initiation, create a Stripe Checkout Session server-side with the service name, price, and success/cancel URLs. Redirect the user to Stripe's hosted payment page. After payment, Stripe redirects to the success URL with a session ID. A status endpoint verifies the Stripe session and records the completed transaction in the database."),
                ("Purchase History",        "Admin view of all payment transactions",                                 "/admin/purchases",     "GET /api/admin/purchases",                                 "complete",
                 "Build an admin view of all payment transactions. Each record shows buyer name, email, product name, amount paid, payment method, Stripe session ID, status, and date. Support filtering by date range and status. Use pagination for large datasets. Fetch from a protected admin endpoint."),
                ("Stripe Configuration",    "Set Stripe API keys in CMS and test the connection live",               "/admin/settings",      "GET /api/admin/stripe-status · POST /api/admin/stripe-test","complete",
                 "Build a Stripe settings panel in the admin CMS. Admin enters a publishable key and secret key. A Test Connection button calls a server-side endpoint that makes a minimal Stripe API call and returns success or a descriptive error message. Store the keys securely in the database settings document. Display current connection status on the settings page."),
            ],
        },
        {
            "title": "Admin CMS — Content Management",
            "features": [
                ("Hero Slides Manager",      "CRUD slides with scheduling and per-page assignment",          "/admin/hero",            "GET/POST/PUT/DELETE /api/admin/hero-slides",                              "complete",
                 "Build an admin CRUD interface for hero slides. Each slide has a background type (image/video/canvas), overlay headline, sub-text, CTA button text and URL, assigned page(s), start date, end date, and active toggle. Support drag-drop reorder. Inactive and expired slides are hidden on the public frontend."),
                ("About Manager",            "Edit About section content",                                   "/admin/about",           "GET/PUT /api/admin/about",                                               "complete",
                 "Build a simple admin editor for the About section content. The form has fields for a headline, rich-text body, and an optional image. Fetch current content via GET and save changes via PUT. Changes are immediately visible on the public page without redeploying."),
                ("Services Manager",         "CRUD services displayed on homepage",                          "/admin/services",        "GET/POST/PUT/DELETE /api/admin/services",                                 "complete",
                 "Build an admin CRUD interface for public services. Each service has a name, short description, full description (rich text), cover image, price, active toggle, and display order. Support drag-drop reorder. Deleting a service removes it from the public listing. The service detail page uses the slug derived from the name."),
                ("Blog Manager",             "Create / edit published blog posts with categories",           "/admin/blog",            "GET/POST/PUT/DELETE /api/admin/blog · /blog-categories",                 "complete",
                 "Build an admin blog post editor. Posts have a title, auto-generated slug, body (rich text editor), featured image, category, tags, publish date, and draft/published toggle. Support full CRUD plus category management (add, rename, delete categories). Drafts are hidden from the public blog listing."),
                ("Books Manager",            "Manage reading list items",                                    "/admin/books",           "GET/POST/PUT/DELETE /api/admin/books",                                    "complete",
                 "Build an admin CRUD interface for reading list entries. Each entry has a title, author, cover image, description, purchase or info link, category tag, and display order. Support drag-drop reorder and filtering by category. Deletions are permanent."),
                ("Gallery Manager",          "Photos with album assignment and drag-drop reorder",           "/admin/gallery",         "GET/POST/PUT/DELETE /api/admin/gallery · /gallery-albums · /album-photos","complete",
                 "Build an admin gallery manager. Support creating and managing albums with a title, cover image, and category. Within each album, allow bulk photo upload with captions. Support drag-drop reorder of photos within an album. Photos can be moved between albums. Deleting an album prompts whether to delete its photos or reassign them."),
                ("Portfolio Manager",        "Admin-managed portfolio / featured projects",                  "/admin/portfolio",       "GET/POST/PUT/DELETE /api/admin/portfolio",                                "complete",
                 "Build an admin CRUD interface for featured portfolio projects. Each project has a title, description, cover image, tags, project URL, and display order. Support drag-drop reorder. The public portfolio page renders projects in the saved order."),
                ("Testimonials Manager",     "Manage testimonials displayed on homepage",                    "/admin/testimonials",    "GET/POST/PUT/DELETE /api/admin/testimonials",                             "complete",
                 "Build an admin CRUD interface for testimonials. Each testimonial has a quote, author name, author title or company, avatar image, and display order. Support drag-drop reorder. Changes are immediately visible on the homepage testimonials section."),
                ("Maps Manager",             "Interactive maps with markers by type",                        "/admin/maps",            "GET/POST/PUT/DELETE /api/admin/maps · /map-locations",                   "complete",
                 "Build an admin interface for creating and managing interactive maps. Each map has a title, slug, and description. Admin can add markers to a map via a visual map picker or coordinate input. Each marker has a name, description, latitude, longitude, and type. Marker types define icons. Admin can edit and delete both maps and individual markers."),
                ("Pages Manager",            "CMS pages with optional member login gate",                    "/admin/pages",           "GET/POST/PUT/DELETE /api/admin/nav-pages · /pages/:type",                "complete",
                 "Build an admin CMS for dynamic pages. Each page has a title, slug, rich-text body, published status, member-gate toggle, and navigation visibility flag. Admin can create, edit, and delete pages. Published pages are accessible at their slug. Gated pages redirect unauthenticated visitors to the login page."),
                ("Contacts Manager",         "View contact form submissions, export CSV",                    "/admin/contacts",        "GET /api/admin/contacts · GET /api/admin/contacts/export",               "complete",
                 "Build an admin view of all contact form submissions. Display sender name, email, subject, message, and submission date in a sortable table. Support filtering by date range. Provide a CSV export endpoint that returns all submissions for the selected range as a downloadable file."),
                ("Aurex Sections Manager",   "Edit Aurex-branded named homepage content blocks",             "/admin/aurex-sections",  "GET/PUT /api/admin/aurex/:section/config · CRUD /api/admin/aurex/:section/items", "complete",
                 "Build an admin editor for named brand content blocks on the homepage (e.g., Mission, Vision, Values, Partners). Each block has a configurable title, body text, icon, and items list. Admin can edit the block-level config and manage individual items within each block via separate CRUD endpoints."),
                ("Section Order Manager",    "Set visibility and ordering of homepage sections",             "/admin/section-order",   "GET/PUT /api/admin/section-order · /section-config",                     "complete",
                 "Build an admin drag-drop interface for homepage section ordering. Each section entry has a name, visible toggle, and sort index. Admin reorders sections by dragging and toggles visibility with a switch. A PUT endpoint saves the new order. The public homepage fetches and renders sections in the saved order, skipping hidden ones."),
                ("Hero A/B Testing",         "Manage hero variants and view click/view analytics",           "/admin/hero-ab",         "GET /api/admin/hero-ab/...",                                             "complete",
                 "Build a hero A/B testing feature. Define named variants of a hero slide configuration. Serve variants to visitors using a split-test algorithm. Track impressions and CTA clicks per variant using a logging endpoint. The analytics view shows view count, click count, and click-through rate per variant. Admin can activate, pause, and reset variants."),
                ("Geo Manager",              "Countries, states, cities reference data",                     "/admin/geo",             "GET/POST/PUT/DELETE /api/admin/geo/countries · /states · /cities",       "complete",
                 "Build an admin reference data manager for geographic hierarchy data. Manage three tiers: countries, states/regions, and cities. Each entry has a name and a short code. Admin can add, edit, and delete entries at each level. State entries are linked to a parent country. City entries are linked to a parent state. This data populates address dropdowns in member and enrollment forms."),
            ],
        },
        {
            "title": "Admin CMS — Members & Enrollment",
            "features": [
                ("Members Manager",         "Full member CRUD, assign mentor and sponsor",                   "/admin/members",               "GET/POST/PUT/DELETE /api/admin/members · /members/:id/mentor",  "complete",
                 "Build a full member management interface. Display all members in a searchable, filterable, paginated table. Admin can create new members, edit any member's personal info, membership type, level, and status. Assign a mentor and sponsor to each member via dedicated endpoints. Support bulk deactivation and bulk status changes."),
                ("Users Manager",           "Admin-only legacy user management",                              "/admin/users",                 "GET/POST/PUT/DELETE /api/admin/users",                           "complete",
                 "Build an admin user management interface for operator and admin accounts. Support full CRUD: create a new operator with name, email, and role; edit their profile; deactivate or delete them. Admin can trigger a password reset email for any user. List all users with their role and last-login date."),
                ("Member Levels",           "Define membership progression levels",                           "/admin/member-levels",         "GET/POST/PUT/DELETE /api/admin/member-levels",                   "complete",
                 "Build an admin interface for configuring membership levels. Each level has a name, description, optional badge image, and sort order. Admin can add, edit, and delete levels. Levels are assigned to members and can be used to gate content or unlock features based on progression criteria."),
                ("Member Types",            "Define role templates with page-access permissions",             "/admin/member-types",          "GET/POST/PUT/DELETE /api/admin/member-types",                    "complete",
                 "Build an admin interface for configuring member type templates. Each type has a name, description, and a set of per-page access permission toggles. When a member is assigned a type, their page access is derived from that type's permission set. Admin can create, edit, and delete types."),
                ("Membership Settings",     "Registration rules, AUX prefix, membership ID config",          "/admin/membership-settings",   "GET/PUT /api/admin/membership-settings",                         "complete",
                 "Build an admin settings panel for membership configuration. Settings include: registration mode (open or invite-only), membership ID prefix string, auto-increment starting number, required fields for registration, and default type and level assigned to new members. Changes take effect immediately for all new registrations."),
                ("E-Bank Admin View",       "View a member's e-bank balance from admin panel",               "/admin/members/:id",           "GET /api/admin/members/:id/ebank",                               "complete",
                 "Build a read-only admin view of a specific member's e-bank financial data. Accessible from the member's admin detail page. Display current balance per category (assets, liabilities, savings, investments) and a chronological transaction history. Admin cannot edit the e-bank data from this view."),
                ("QR Code Generator",       "Admin generates QR business cards for members",                 "/admin/members",               "POST /api/admin/members/:id/generate-qr",                        "complete",
                 "Build an admin tool to generate a QR code for any member. The QR encodes a sponsorship or registration URL with the member's ID pre-filled. Admin selects a member from the members list, clicks Generate QR, and sees the resulting QR image with a download option. The generated QR is also stored on the member's record."),
                ("Enrollment Fields Admin", "Manage all 4-step wizard fields per step",                      "/admin/enrollment-fields",     "Full CRUD + /reorder + /visibility",                             "complete",
                 "Build an admin interface to configure all fields of the enrollment wizard. Fields have a label, input type (text, select, checkbox, date), step assignment (1–4), required flag, display order, and visibility toggle. Admin can add, edit, and delete fields. A reorder endpoint accepts a new ordered ID list. Toggling visibility hides a field without deleting historical submission data."),
            ],
        },
        {
            "title": "Admin CMS — Settings & Tools",
            "features": [
                ("Site Settings",        "Brand, colors, theme, SMTP, Stripe, social links, favicon",      "/admin/settings",          "GET/PUT /api/admin/settings",                                                              "complete",
                 "Build a comprehensive site settings panel. Settings cover: brand name, logo URL, favicon, primary and accent colors, font choices, SMTP server host/port/credentials, Stripe publishable and secret keys, and social media profile links. All settings are stored in a single database document. A public GET endpoint returns non-sensitive settings. Admin saves all changes via a single PUT endpoint."),
                ("SEO Manager",          "Per-page title, description, and Open Graph tags",                "/admin/seo",               "GET/PUT /api/admin/seo/:path",                                                             "complete",
                 "Build an admin SEO editor. For each tracked URL path, admin sets a meta title, meta description (max 160 chars), and Open Graph image. A list view shows all configured paths. Admin can add new path entries and edit or delete existing ones. Each page fetches its SEO data by exact path match on load and injects the meta tags."),
                ("Email Management",     "Edit transactional templates with live preview and test-send",    "/admin/email-management",  "GET/PUT /api/admin/email-templates/:key · /reset · /preview · /test-send",                 "complete",
                 "Build an admin email template editor. Store transactional templates (welcome, password reset, booking confirmation, etc.) in the database, each identified by a key. Admin can edit a template's subject line and HTML body with variable placeholders. A preview endpoint renders the template with sample data. A test-send endpoint sends a rendered email to a specified address. A reset endpoint restores the default template."),
                ("Contact Settings",     "Configure contact form fields and recipient list",                "/admin/contact-settings",  "GET/PUT /api/admin/contact-settings",                                                      "complete",
                 "Build an admin interface for configuring the public contact form. Settings include: which fields are displayed (name, email, phone, subject, message, and custom fields), which fields are required, and the list of email addresses that receive form submissions. Changes are saved and immediately affect the contact form behaviour on the public site."),
                ("Quick Links",          "Admin-managed shortcut links in My Account sidebar",              "/admin/quick-links",       "GET/POST/PUT/DELETE /api/admin/myaccount-links · /reorder",                                "complete",
                 "Build an admin interface for managing quick-access shortcut links shown in the My Account sidebar. Each link has a label, URL, optional icon, and display order. Admin can add, edit, delete, and drag-drop reorder links. The member sidebar fetches and renders these links from a public API endpoint."),
                ("My Account Nav",       "Control order and visibility of My Account sidebar items",        "/admin/myaccount-nav",     "GET/PUT /api/admin/myaccount-nav · /reorder",                                              "complete",
                 "Build an admin interface for managing the My Account sidebar navigation structure. Each nav item has a label, route path, icon, sort order, and visibility toggle. Admin can reorder items via drag-drop and hide items without deleting them. The member area fetches the nav config and renders only visible items in the configured order."),
                ("Backup & Restore",     "Download full DB backup JSON; restore by file upload",            "/admin/backup",            "GET/POST/DELETE /api/admin/backups · /export-content · /import-content",                   "complete",
                 "Build a database backup and restore system. The export endpoint serialises all database collections to a single JSON file and returns it as a download. The import endpoint accepts a JSON backup file and re-imports all collections, overwriting existing data after a confirmation step. Provide a content-only export that excludes user accounts and sensitive data."),
                ("Image Upload",         "CMS-wide image upload (JPEG/PNG/GIF/WebP/SVG, max 10 MB)",        "—",                        "POST /api/upload",                                                                         "complete",
                 "Build a general-purpose image upload endpoint used across the CMS. Accept JPEG, PNG, GIF, WebP, and SVG files up to 10 MB. Validate MIME type by reading the file header, not just the extension. Reject oversized files with a 400 error. Store the file in an uploads directory with a unique timestamped filename. Return the public-accessible URL of the saved file."),
                ("File Upload",          "CMS-wide document / file upload (PDF, DOCX, XLSX, max 25 MB)",    "—",                        "POST /api/upload-file",                                                                    "complete",
                 "Build a general-purpose document upload endpoint. Accept PDF, DOCX, and XLSX files up to 25 MB. Validate MIME type server-side. Reject unsupported types and oversized files with descriptive error messages. Store files in a dedicated documents directory with unique filenames. Return the public URL."),
                ("Analytics Dashboard",  "Visit counts, member activity, key metrics",                      "/admin/analytics",         "GET /api/admin/analytics",                                                                 "complete",
                 "Build an admin analytics dashboard. Track and display: total registered members, new signups over selectable periods, page visit counts logged by a middleware or tracking pixel, active sessions in the last 24 hours, and top-performing content by view count. Fetch all metrics from a single aggregated admin endpoint."),
                ("Bulk Operations",      "Bulk delete / bulk update across any collection",                  "—",                        "POST /api/admin/bulk-delete · /bulk-update",                                               "complete",
                 "Build generic bulk operation endpoints. Bulk-delete accepts a list of record IDs and a collection name and deletes all matching documents after validating each ID exists. Bulk-update accepts a list of IDs, a collection name, and a partial update payload and applies it to all matching records atomically. Return a count of affected records in the response."),
            ],
        },
        {
            "title": "Documentation System",
            "features": [
                ("Use Case & Flow Diagram", "Interactive SVG diagram of all system actors and flows",                                 "/admin/documentation", "GET /api/docs/flow-diagram",    "complete",
                 "Build an interactive SVG flow diagram served as a standalone HTML page from an API endpoint. The diagram maps all system actors (visitor, member, mentor, admin), registration paths, and module interactions. Nodes are clickable to highlight connected flows. Implement pan and zoom with mouse drag and scroll-wheel. Render entirely in inline SVG with no external dependencies."),
                ("Technical Documentation","Architecture, DB, API, auth, CSS variables, security",                                  "/admin/documentation", "GET /api/docs/technical",       "complete",
                 "Build a comprehensive technical reference document served as a standalone HTML page. Sections cover: system architecture overview, database schema per collection (field names, types, indexes), all API endpoints with HTTP methods and parameters, authentication and session flow, CSS variable naming conventions, and security notes. Include a sticky sidebar for in-page navigation."),
                ("Operator Manual",         "Step-by-step CMS guide for non-technical operators",                                    "/admin/documentation", "GET /api/docs/operator-manual", "complete",
                 "Build a step-by-step CMS operator guide served as a standalone HTML page. Cover every admin section in plain language: what it does, how to use it, common tasks, and tips. Target non-technical users. Organise into sections matching the CMS navigation. Include numbered steps and callout boxes for important notes. Render with a sticky section sidebar."),
                ("User Guide",              "Member guide for all My Account features",                                               "/admin/documentation", "GET /api/docs/user-guide",      "complete",
                 "Build a member-facing user guide for the My Account area, served as a standalone HTML page. Explain each feature in plain language: profile editing, invite codes, QR codes, booking a mentor, e-bank, portfolios, community tree, and notifications. Use numbered steps and screenshots where helpful. Organise with a sticky sidebar matching the My Account navigation."),
                ("Testing Manual",          "Live-generated test accounts + suggested test scenarios",                                "/admin/documentation", "GET /api/docs/testing-manual",  "complete",
                 "Build a live-generated testing manual served as an HTML page. On each page load, query the database for all accounts flagged as test accounts. For each account display: login email, password (plaintext for test accounts), role, member type, level, assigned mentor, and assigned sponsor. Follow the account list with a set of suggested test scenarios covering all major user flows."),
                ("AWS Installation Guide",  "Deploy guide for a fresh Ubuntu server (rendered from INSTALL.md)",                     "/admin/documentation", "GET /api/docs/aws-install",     "complete",
                 "Build an installation guide served as a standalone HTML page, rendered from a Markdown source file at page load. The guide covers: AWS server provisioning, system dependency installation, application deployment steps, Nginx virtual host configuration, SSL certificate setup, database initialisation, environment variable configuration, Stripe setup, and a troubleshooting section."),
                ("Feature Audit",           "Complete inventory of all system features with status and endpoints — this page",       "/admin/documentation", "GET /api/docs/feature-audit",   "complete",
                 "Build a feature audit page served as a standalone HTML document from an API endpoint. Group all system features into labelled sections. Each feature row shows: name, description, frontend URL, backend endpoints, a colour-coded status badge (complete/partial/broken), and a collapsible replication prompt. Include a sticky toolbar with regenerate, export, and print actions. Add a sticky sidebar with section links and a summary stats box."),
            ],
        },
    ]

    STATUS_LABEL = {"complete": "✅ Complete", "partial": "⚠️ Partial", "broken": "❌ Broken"}

    # Build sidebar HTML
    sidebar_items = "".join(
        f'<li><a href="#section-{i+1}">{i+1}. {s["title"]}</a></li>'
        for i, s in enumerate(SECTIONS)
    )

    # Build section blocks HTML
    def _status_badge(status):
        if status == "complete":
            return f'<span class="badge badge-complete">✅ Complete</span>'
        elif status == "partial":
            return f'<span class="badge badge-partial">⚠️ Partial</span>'
        else:
            return f'<span class="badge badge-broken">❌ Broken</span>'

    section_blocks = ""
    total_complete = total_partial = total_broken = 0
    for i, sec in enumerate(SECTIONS):
        rows_html = ""
        for feat in sec["features"]:
            name, desc, url, endpoints, status, prompt = feat
            if status == "complete":   total_complete += 1
            elif status == "partial":  total_partial  += 1
            else:                      total_broken   += 1
            safe_prompt = _html.escape(prompt, quote=True)
            preview_text = _html.escape((prompt[:120] + "…") if len(prompt) > 120 else prompt)
            rows_html += f"""<tr>
              <td class="feat-name">{name}</td>
              <td>{desc}</td>
              <td class="mono">{url}</td>
              <td class="mono endpoints">{endpoints}</td>
              <td class="status-cell">{_status_badge(status)}</td>
              <td class="prompt-cell" data-prompt="{safe_prompt}">
                <div class="prompt-preview">{preview_text}</div>
                <div class="prompt-full"></div>
                <div class="prompt-btns">
                  <button class="btn-expand" onclick="toggleP(this)">View ↓</button>
                  <button class="btn-copy" onclick="copyP(this)">📋 Copy</button>
                  <span class="prompt-toast">Prompt copied ✓</span>
                </div>
              </td>
            </tr>"""
        section_blocks += f"""
<section id="section-{i+1}">
  <h2 class="section-heading"><span class="sec-num">{i+1}</span>{sec['title']}</h2>
  <table>
    <thead><tr>
      <th>Feature</th><th>Description</th>
      <th>URL</th><th>Endpoints</th><th>Status</th>
      <th class="th-prompt">Prompt</th>
    </tr></thead>
    <tbody>{rows_html}</tbody>
  </table>
</section>"""

    total = total_complete + total_partial + total_broken

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Feature Audit — {brand}</title>
<style>
:root {{
  --color-primary:  {C_PRIMARY};
  --color-accent:   {C_ACCENT};
  --color-heading:  {C_HEADING};
  --color-text:     {C_TEXT};
  --color-bg:       {C_BG};
  --color-subtle:   {C_SUBTLE};
  --border-color:   {C_BORDER};
  --color-win:      {C_WIN};
  --color-open:     {C_OPEN};
  --color-loss:     {C_LOSS};
}}
*,*::before,*::after {{ box-sizing:border-box; margin:0; padding:0; }}
body {{ font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; background:var(--color-bg); color:var(--color-text); line-height:1.6; font-size:14px; }}

/* ── Toolbar ── */
.toolbar {{
  position:fixed; top:0; left:0; right:0; z-index:200;
  background:var(--color-primary); color:#fff;
  padding:0 20px; height:52px;
  display:flex; align-items:center; justify-content:space-between;
  box-shadow:0 2px 6px rgba(0,0,0,.25);
}}
.toolbar-title {{ font-weight:700; font-size:15px; display:flex; align-items:center; gap:10px; }}
.toolbar-title .audit-date {{ font-weight:400; font-size:12px; opacity:.65; }}
.toolbar-actions {{ display:flex; gap:8px; }}
.toolbar-actions button,
.toolbar-actions a {{
  background:none; border:1px solid var(--color-accent); color:var(--color-accent);
  padding:5px 14px; border-radius:4px; font-size:12px; font-weight:600;
  cursor:pointer; text-decoration:none; transition:all .15s;
}}
.toolbar-actions button:hover,
.toolbar-actions a:hover {{ background:var(--color-accent); color:#fff; }}

/* ── Layout ── */
.page-wrap {{ display:flex; padding-top:52px; min-height:100vh; }}

/* ── Sidebar ── */
.sidebar {{
  width:230px; flex-shrink:0;
  position:sticky; top:52px; height:calc(100vh - 52px);
  overflow-y:auto; border-right:1px solid var(--border-color);
  background:var(--color-subtle); padding:20px 0;
}}
.sidebar h3 {{ font-size:11px; font-weight:700; text-transform:uppercase;
  letter-spacing:.6px; color:var(--color-accent); padding:0 16px 10px; }}
.sidebar ul {{ list-style:none; }}
.sidebar li a {{
  display:block; padding:6px 16px; font-size:12px; color:var(--color-text);
  text-decoration:none; transition:background .1s, color .1s;
  border-left:3px solid transparent;
}}
.sidebar li a:hover {{ background:rgba(0,0,0,.04); color:var(--color-accent); border-left-color:var(--color-accent); }}
.sidebar .summary-box {{
  margin:16px; padding:12px; border-radius:6px;
  background:var(--color-bg); border:1px solid var(--border-color);
}}
.summary-box .stat {{ display:flex; justify-content:space-between; font-size:12px; margin:4px 0; }}
.summary-box .stat-val {{ font-weight:700; }}
.stat-c {{ color:var(--color-win); }}
.stat-p {{ color:var(--color-open); }}
.stat-b {{ color:var(--color-loss); }}

/* ── Main content ── */
.main {{ flex:1; padding:32px 40px; max-width:1100px; }}
.main-header {{ margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid var(--color-accent); }}
.main-header h1 {{ font-size:26px; font-weight:800; color:var(--color-heading); letter-spacing:-.4px; }}
.main-header p {{ font-size:13px; color:#6b7280; margin-top:6px; }}

section {{ margin-bottom:48px; }}
.section-heading {{
  font-size:17px; font-weight:700; color:var(--color-heading);
  margin-bottom:14px; display:flex; align-items:center; gap:10px;
}}
.sec-num {{
  display:inline-flex; align-items:center; justify-content:center;
  width:26px; height:26px; border-radius:50%; flex-shrink:0;
  background:var(--color-accent); color:#fff; font-size:12px; font-weight:700;
}}

/* ── Table ── */
table {{ width:100%; border-collapse:collapse; font-size:13px; }}
thead tr {{ background:var(--color-primary); color:#fff; }}
th {{ padding:10px 12px; text-align:left; font-weight:600; font-size:12px; }}
td {{ padding:8px 12px; border-bottom:1px solid var(--border-color); vertical-align:top; }}
tr:nth-child(even) td {{ background:var(--color-subtle); }}
tr:hover td {{ background:rgba(13,148,136,.04); }}
.feat-name {{ font-weight:600; color:var(--color-heading); white-space:nowrap; }}
.mono {{ font-family:'Courier New',monospace; font-size:11.5px; color:#4b5563; }}
.endpoints {{ font-size:11px; max-width:260px; }}
.status-cell {{ white-space:nowrap; }}

/* ── Badges ── */
.badge {{ display:inline-flex; align-items:center; gap:4px; padding:3px 9px;
  border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap; }}
.badge-complete {{ background:color-mix(in srgb,var(--color-win) 12%,#fff); color:var(--color-win); border:1px solid color-mix(in srgb,var(--color-win) 30%,#fff); }}
.badge-partial  {{ background:color-mix(in srgb,var(--color-open) 12%,#fff); color:var(--color-open); border:1px solid color-mix(in srgb,var(--color-open) 30%,#fff); }}
.badge-broken   {{ background:color-mix(in srgb,var(--color-loss) 12%,#fff); color:var(--color-loss); border:1px solid color-mix(in srgb,var(--color-loss) 30%,#fff); }}

/* ── Prompt column ── */
th.th-prompt {{ width:280px; min-width:220px; }}
.prompt-cell {{ width:280px; max-width:280px; vertical-align:top; }}
.prompt-preview {{
  font-size:11px; color:#4b5563;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
  overflow:hidden; line-height:1.5; margin-bottom:4px;
}}
.prompt-full {{
  display:none; font-size:11px; font-family:'Courier New',monospace;
  background:var(--color-subtle,#f8fafc);
  border-left:3px solid var(--color-accent);
  padding:8px 10px; white-space:pre-wrap; line-height:1.55;
  margin-bottom:4px; border-radius:0 3px 3px 0;
}}
.prompt-btns {{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; }}
.btn-expand, .btn-copy {{
  font-size:10px; padding:2px 8px; border-radius:3px; cursor:pointer;
  border:1px solid var(--border-color); background:none;
  color:var(--color-accent); transition:background .12s,color .12s;
}}
.btn-expand:hover, .btn-copy:hover {{
  background:var(--color-accent); color:#fff;
}}
.prompt-toast {{ font-size:10px; color:var(--color-win); font-weight:600; display:none; }}

/* ── Print ── */
@media print {{
  .toolbar,.sidebar {{ display:none !important; }}
  .page-wrap {{ display:block; padding-top:0; }}
  .main {{ padding:20px; max-width:100%; }}
  table {{ font-size:11px; }}
  .section-heading {{ page-break-before:always; }}
  section:first-of-type .section-heading {{ page-break-before:avoid; }}
  .prompt-full {{ display:block !important; }}
  .prompt-btns {{ display:none; }}
}}

/* ── Responsive ── */
@media (max-width:860px) {{
  .sidebar {{ display:none; }}
  .main {{ padding:20px; }}
}}
</style>
</head>
<body>

<div class="toolbar" id="toolbar">
  <div class="toolbar-title">
    🗂 Feature Audit — {brand}
    <span class="audit-date">Last updated: {today}</span>
  </div>
  <div class="toolbar-actions">
    <button onclick="window.location.reload()">↺ Regenerate</button>
    <button onclick="exportHTML()">⬇ Export HTML</button>
    <button onclick="exportPrompts()">📄 Export Prompts (.md)</button>
    <button onclick="window.print()">🖨 Print / PDF</button>
    <a href="/admin/documentation">← Back to Docs</a>
  </div>
</div>

<div class="page-wrap">

  <nav class="sidebar" id="sidebar">
    <h3>Sections</h3>
    <ul>{sidebar_items}</ul>
    <div class="summary-box">
      <div class="stat"><span>Complete</span><span class="stat-val stat-c">{total_complete}</span></div>
      <div class="stat"><span>Partial</span><span class="stat-val stat-p">{total_partial}</span></div>
      <div class="stat"><span>Broken</span><span class="stat-val stat-b">{total_broken}</span></div>
      <div class="stat" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border-color)">
        <span><strong>Total</strong></span><span class="stat-val">{total}</span>
      </div>
    </div>
  </nav>

  <main class="main" id="main">
    <div class="main-header">
      <h1>Feature Audit — {brand}</h1>
      <p>Complete inventory of all implemented features. {total} features across {len(SECTIONS)} sections &nbsp;·&nbsp; Audited {today}</p>
    </div>

    {section_blocks}
  </main>

</div>

<script>
/* Smooth scroll for sidebar links */
document.querySelectorAll('.sidebar a[href^="#"]').forEach(a => {{
  a.addEventListener('click', e => {{
    e.preventDefault();
    const el = document.querySelector(a.getAttribute('href'));
    if (el) el.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
  }});
}});

/* Highlight active section in sidebar */
const sectionEls = document.querySelectorAll('section[id]');
const sidebarLinks = document.querySelectorAll('.sidebar a');
const observer = new IntersectionObserver(entries => {{
  entries.forEach(entry => {{
    if (entry.isIntersecting) {{
      sidebarLinks.forEach(a => a.style.borderLeftColor = 'transparent');
      const active = document.querySelector(`.sidebar a[href="#${{entry.target.id}}"]`);
      if (active) active.style.borderLeftColor = 'var(--color-accent)';
    }}
  }});
}}, {{ rootMargin: '-52px 0px -60% 0px', threshold: 0 }});
sectionEls.forEach(el => observer.observe(el));

/* Prompt: toggle expand/collapse */
function toggleP(btn) {{
  const cell = btn.closest('.prompt-cell');
  const preview = cell.querySelector('.prompt-preview');
  const full = cell.querySelector('.prompt-full');
  const isOpen = full.style.display === 'block';
  if (!isOpen) {{
    if (!full.textContent.trim()) full.textContent = cell.dataset.prompt;
    full.style.display = 'block';
    preview.style.display = 'none';
    btn.textContent = 'Hide ↑';
  }} else {{
    full.style.display = 'none';
    preview.style.display = '';
    btn.textContent = 'View ↓';
  }}
}}

/* Prompt: copy to clipboard */
function copyP(btn) {{
  const cell = btn.closest('.prompt-cell');
  const text = cell.dataset.prompt || '';
  if (navigator.clipboard && navigator.clipboard.writeText) {{
    navigator.clipboard.writeText(text).then(() => {{
      const toast = cell.querySelector('.prompt-toast');
      toast.style.display = 'inline';
      setTimeout(() => {{ toast.style.display = 'none'; }}, 2000);
    }});
  }} else {{
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const toast = cell.querySelector('.prompt-toast');
    toast.style.display = 'inline';
    setTimeout(() => {{ toast.style.display = 'none'; }}, 2000);
  }}
}}

/* Export all prompts as Markdown */
function exportPrompts() {{
  const todayStr = new Date().toISOString().split('T')[0];
  let md = '# Feature Prompts — {brand}\\n\\nGenerated: ' + todayStr + '\\n\\n';
  document.querySelectorAll('section[id]').forEach((sec, si) => {{
    const heading = sec.querySelector('.section-heading');
    const secTitle = heading ? heading.innerText.replace(/^\\d+\\s*/, '').trim() : '';
    md += '## ' + (si + 1) + '. ' + secTitle + '\\n\\n';
    sec.querySelectorAll('tbody tr').forEach(row => {{
      const nameCell = row.querySelector('.feat-name');
      const promptCell = row.querySelector('.prompt-cell');
      if (nameCell && promptCell) {{
        const featureName = nameCell.textContent.trim();
        const promptText = promptCell.dataset.prompt || '';
        md += '### ' + featureName + '\\n\\n' + promptText + '\\n\\n---\\n\\n';
      }}
    }});
  }});
  const blob = new Blob([md], {{ type: 'text/markdown;charset=utf-8' }});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'feature-prompts-' + todayStr + '.md';
  a.click();
  URL.revokeObjectURL(a.href);
}}

/* Export HTML */
function exportHTML() {{
  const toolbar = document.getElementById('toolbar');
  const sidebarEl = document.getElementById('sidebar');
  toolbar.style.display = 'none';
  sidebarEl.style.display = 'none';
  const html = '<!DOCTYPE html>' + document.documentElement.outerHTML;
  toolbar.style.display = '';
  sidebarEl.style.display = '';
  const blob = new Blob([html], {{ type: 'text/html;charset=utf-8' }});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'feature-audit-{today.replace(" ", "-")}.html';
  a.click();
  URL.revokeObjectURL(a.href);
}}
</script>
</body>
</html>"""
    return HTMLResponse(content=html)


@router.get("/docs/aws-install/markdown")
async def aws_install_markdown(user: dict = Depends(_doc_guard)):
    """Serves the raw INSTALL.md so operators can download the file."""
    import os
    from fastapi.responses import FileResponse
    md_path = os.path.normpath(os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "INSTALL.md"
    ))
    return FileResponse(md_path, media_type="text/markdown", filename="INSTALL.md")

