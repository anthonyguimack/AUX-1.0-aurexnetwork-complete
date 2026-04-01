import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useMember } from '../../lib/memberAuth';
import { publicAPI, memberAPI } from '../../lib/api';
import {
  User, Key, Users, Briefcase, LogOut, Menu, X, ChevronRight, Home, Award, UserCheck, Loader2, Wallet
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { id: 'membership-profile', label: 'Membership Profile', icon: User, href: '/my-account/membership-profile' },
  { id: 'mentorship-profile', label: 'Mentorship Profile', icon: Award, href: '/my-account/mentorship-profile' },
  { id: 'my-sponsor', label: 'My Sponsor', icon: UserCheck, href: '/my-account/my-sponsor' },
  { id: 'ebank', label: 'My Ebank', icon: Wallet, href: '/my-account/ebank' },
  { id: 'invite-code', label: 'Invite Code', icon: Key, href: '/my-account/invite-code' },
  { id: 'my-community', label: 'My Community', icon: Users, href: '/my-account/my-community' },
  { id: 'portfolios', label: 'Portfolios', icon: Briefcase, href: '/my-account/portfolios' },
];

const ROUTE_TO_PERM = {
  '/my-account/membership-profile': 'membership-profile',
  '/my-account/mentorship-profile': 'mentorship-profile',
  '/my-account/my-sponsor': 'my-sponsor',
  '/my-account/ebank': 'ebank',
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
  const [levelPerms, setLevelPerms] = useState(null);

  useEffect(() => {
    publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

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

  const isRouteAllowed = (() => {
    if (levelPerms === null) return null;
    const path = location.pathname;
    let requiredPerm = null;
    for (const [route, perm] of Object.entries(ROUTE_TO_PERM)) {
      if (path === route || path.startsWith(route + '/')) {
        requiredPerm = perm;
        break;
      }
    }
    if (requiredPerm && !levelPerms.includes(requiredPerm)) return false;
    return true;
  })();

  useEffect(() => {
    if (isRouteAllowed === false) {
      const firstAllowed = ALL_NAV_ITEMS.find(i => levelPerms.includes(i.id));
      if (firstAllowed) navigate(firstAllowed.href, { replace: true });
    }
  }, [isRouteAllowed, levelPerms, navigate]);

  const handleLogout = () => { logout(); navigate('/my-account/login'); };
  const brandName = settings.brand_name || 'Legacy';
  const navItems = levelPerms !== null ? ALL_NAV_ITEMS.filter(item => levelPerms.includes(item.id)) : [];
  const permissionsLoading = levelPerms === null;

  // CSS variable shortcuts
  const v = (name, fallback) => `var(--ma-${name}, ${fallback})`;

  return (
    <div className="min-h-screen flex" style={{ background: v('page-bg', '#0d0f14'), fontFamily: "'DM Sans', sans-serif" }} data-testid="myaccount-layout">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform lg:translate-x-0 lg:static lg:flex lg:flex-col ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: v('sidebar-bg', '#13161e'), borderRight: `1px solid ${v('card-border', 'rgba(255,255,255,0.05)')}` }}>
        <div className="p-5" style={{ borderBottom: `1px solid ${v('card-border', 'rgba(255,255,255,0.05)')}` }}>
          <Link to="/" className="flex items-center gap-2" data-testid="myaccount-brand">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: v('accent', '#c9a84c') }}>
              <span className="font-bold text-sm" style={{ color: v('button-text', '#0d0f14'), fontFamily: "'DM Serif Display', serif" }}>
                {brandName[0]}
              </span>
            </div>
            <span className="font-semibold text-sm" style={{ color: v('text-primary', '#ffffff') }}>{brandName}</span>
          </Link>
          {member && (
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: v('avatar-bg', 'rgba(201,168,76,0.1)'), border: `1px solid ${v('avatar-border', 'rgba(201,168,76,0.4)')}` }}>
                {member.avatar ? <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" /> :
                  <span className="font-bold text-sm" style={{ color: v('accent', '#c9a84c') }}>{(member.first_name?.[0] || '').toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: v('text-primary', '#ffffff') }}>{member.first_name} {member.last_name}</p>
                <p className="text-xs" style={{ color: v('accent', '#c9a84c') }}>{member.membership_id}</p>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: v('accent', '#c9a84c') }} />
            </div>
          ) : (
            navItems.map(item => {
              const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} to={item.href} onClick={() => setSideOpen(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors"
                  style={active ? {
                    color: v('sidebar-active-text', '#c9a84c'),
                    backgroundColor: v('sidebar-active-bg', 'rgba(201,168,76,0.1)'),
                    borderRight: `2px solid ${v('sidebar-active-border', '#c9a84c')}`
                  } : {
                    color: v('sidebar-text', '#9ca3af'),
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = v('text-primary', '#ffffff'); }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = v('sidebar-text', '#9ca3af'); }}
                  data-testid={`myaccount-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })
          )}
        </nav>
        <div className="p-4" style={{ borderTop: `1px solid ${v('card-border', 'rgba(255,255,255,0.05)')}` }}>
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors" style={{ color: v('sidebar-text', '#9ca3af') }}>
            <Home className="w-4 h-4" /><span>Back to Website</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded" data-testid="myaccount-logout-btn">
            <LogOut className="w-4 h-4" /><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 flex items-center px-4 lg:px-6 sticky top-0 z-30"
          style={{ backgroundColor: v('header-bg', '#13161e'), borderBottom: `1px solid ${v('card-border', 'rgba(255,255,255,0.05)')}` }}>
          <button onClick={() => setSideOpen(!sideOpen)} className="lg:hidden mr-4" style={{ color: v('sidebar-text', '#9ca3af') }}>
            {sideOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center text-xs" style={{ color: v('text-muted', '#6b7280') }}>
            <span>My Account</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span style={{ color: v('text-secondary', '#9ca3af') }}>{ALL_NAV_ITEMS.find(i => location.pathname.startsWith(i.href))?.label || 'Dashboard'}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          {isRouteAllowed === false || isRouteAllowed === null ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: v('accent', '#c9a84c') }} />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {sideOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSideOpen(false)} />}
    </div>
  );
}
