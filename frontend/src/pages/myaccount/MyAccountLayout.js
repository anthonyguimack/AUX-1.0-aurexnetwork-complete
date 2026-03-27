import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useMember } from '../../lib/memberAuth';
import { publicAPI, memberAPI } from '../../lib/api';
import {
  User, Key, Users, Briefcase, LogOut, Menu, X, ChevronRight, Home, Award, UserCheck, Loader2
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { id: 'membership-profile', label: 'Membership Profile', icon: User, href: '/my-account/membership-profile' },
  { id: 'mentorship-profile', label: 'Mentorship Profile', icon: Award, href: '/my-account/mentorship-profile' },
  { id: 'my-sponsor', label: 'My Sponsor', icon: UserCheck, href: '/my-account/my-sponsor' },
  { id: 'invite-code', label: 'Invite Code', icon: Key, href: '/my-account/invite-code' },
  { id: 'my-community', label: 'My Community', icon: Users, href: '/my-account/my-community' },
  { id: 'portfolios', label: 'Portfolios', icon: Briefcase, href: '/my-account/portfolios' },
];

// Map route paths to permission IDs
const ROUTE_TO_PERM = {
  '/my-account/membership-profile': 'membership-profile',
  '/my-account/mentorship-profile': 'mentorship-profile',
  '/my-account/my-sponsor': 'my-sponsor',
  '/my-account/invite-code': 'invite-code',
  '/my-account/my-community': 'my-community',
  '/my-account/portfolios': 'portfolios',
};

export default function MyAccountLayout() {
  const { member, logout } = useMember();
  const location = useLocation();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [levelPerms, setLevelPerms] = useState(null); // null = loading

  useEffect(() => {
    publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  // Fetch member's level permissions
  useEffect(() => {
    if (member) {
      if (member.role === 'admin') {
        setLevelPerms(ALL_NAV_ITEMS.map(i => i.id));
      } else if (member.level_id) {
        memberAPI.getMyLevel().then(r => {
          if (r.data && r.data.permissions && r.data.permissions.length > 0) {
            setLevelPerms(r.data.permissions);
          } else {
            setLevelPerms(ALL_NAV_ITEMS.map(i => i.id));
          }
        }).catch(() => setLevelPerms(ALL_NAV_ITEMS.map(i => i.id)));
      } else {
        setLevelPerms(ALL_NAV_ITEMS.map(i => i.id));
      }
    }
  }, [member]);

  // Route protection: redirect if user doesn't have permission for current route
  useEffect(() => {
    if (levelPerms === null || !member) return; // still loading
    const path = location.pathname;
    // Find which permission this route requires
    let requiredPerm = null;
    for (const [route, perm] of Object.entries(ROUTE_TO_PERM)) {
      if (path === route || path.startsWith(route + '/')) {
        requiredPerm = perm;
        break;
      }
    }
    if (requiredPerm && !levelPerms.includes(requiredPerm)) {
      // Redirect to the first permitted section
      const firstAllowed = ALL_NAV_ITEMS.find(i => levelPerms.includes(i.id));
      if (firstAllowed) {
        navigate(firstAllowed.href, { replace: true });
      }
    }
  }, [levelPerms, location.pathname, member, navigate]);

  const handleLogout = () => { logout(); navigate('/my-account/login'); };
  const brandName = settings.brand_name || 'Legacy';

  // Filter nav items based on level permissions
  const navItems = levelPerms !== null
    ? ALL_NAV_ITEMS.filter(item => levelPerms.includes(item.id))
    : []; // Empty while loading — prevents flash

  // Show loading while permissions are being fetched
  const permissionsLoading = levelPerms === null;

  return (
    <div className="min-h-screen flex" style={{ background: '#0d0f14', fontFamily: "'DM Sans', sans-serif" }} data-testid="myaccount-layout">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#13161e] border-r border-white/5 transition-transform lg:translate-x-0 lg:static lg:flex lg:flex-col ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2" data-testid="myaccount-brand">
            <div className="w-8 h-8 bg-[#c9a84c] rounded flex items-center justify-center">
              <span className="text-[#0d0f14] font-bold text-sm" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {brandName[0]}
              </span>
            </div>
            <span className="text-white font-semibold text-sm">{brandName}</span>
          </Link>
          {member && (
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/40 flex items-center justify-center">
                {member.avatar ? <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" /> :
                  <span className="text-[#c9a84c] font-bold text-sm">{(member.first_name?.[0] || '').toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{member.first_name} {member.last_name}</p>
                <p className="text-[#c9a84c] text-xs">{member.membership_id}</p>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#c9a84c] animate-spin" />
            </div>
          ) : (
            navItems.map(item => {
              const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} to={item.href} onClick={() => setSideOpen(false)}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${active ? 'text-[#c9a84c] bg-[#c9a84c]/10 border-r-2 border-[#c9a84c]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  data-testid={`myaccount-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })
          )}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded">
            <Home className="w-4 h-4" /><span>Back to Website</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded" data-testid="myaccount-logout-btn">
            <LogOut className="w-4 h-4" /><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 bg-[#13161e] border-b border-white/5 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button onClick={() => setSideOpen(!sideOpen)} className="lg:hidden text-gray-400 hover:text-white mr-4">
            {sideOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center text-xs text-gray-500">
            <span>My Account</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-gray-300">{ALL_NAV_ITEMS.find(i => location.pathname.startsWith(i.href))?.label || 'Dashboard'}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sideOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSideOpen(false)} />}
    </div>
  );
}
