import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useSettings } from '../../App';
import {
  LayoutDashboard, Image, Info, Package, FileText, BookOpen, Map, Images, Briefcase, 
  MessageSquare, Mail, CreditCard, Settings, LogOut, ChevronLeft, Menu, X, FileStack, Users,
  BarChart3, Globe, Layers, UserCheck, Shield, ClipboardCheck, Database, Rocket
} from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Hero', icon: Image, href: '/admin/hero' },
  { label: 'About Us', icon: Info, href: '/admin/about' },
  { label: 'Services', icon: Package, href: '/admin/services' },
  { label: 'Blog', icon: FileText, href: '/admin/blog' },
  { label: 'Reading List', icon: BookOpen, href: '/admin/books' },
  { label: 'Maps', icon: Map, href: '/admin/maps' },
  { label: 'Gallery', icon: Images, href: '/admin/gallery' },
  { label: 'Gallery Albums', icon: Images, href: '/admin/gallery-albums' },
  { label: 'Portfolio', icon: Briefcase, href: '/admin/portfolio' },
  { label: 'Testimonials', icon: MessageSquare, href: '/admin/testimonials' },
  { label: 'Pages', icon: FileStack, href: '/admin/pages' },
  { type: 'divider', label: 'Landing Page' },
  { label: 'Hero', icon: Rocket, href: '/admin/landing-hero', group: 'landing' },
  { label: 'Content', icon: Layers, href: '/admin/landing-content', group: 'landing' },
  { label: 'Subscribers', icon: UserCheck, href: '/admin/landing-subscribers', group: 'landing' },
  { label: 'Contacts', icon: Mail, href: '/admin/landing-contacts', group: 'landing' },
  { type: 'divider', label: 'Membership' },
  { label: 'Members', icon: UserCheck, href: '/admin/members' },
  { label: 'Member Levels', icon: Shield, href: '/admin/member-levels' },
  { label: 'Member Types', icon: Users, href: '/admin/member-types' },
  { label: 'Membership Settings', icon: ClipboardCheck, href: '/admin/membership-settings' },
  { type: 'divider', label: 'System' },
  { label: 'Contacts', icon: Mail, href: '/admin/contacts' },
  { label: 'Contact Section', icon: MessageSquare, href: '/admin/contact-settings' },
  { label: 'Purchases', icon: CreditCard, href: '/admin/purchases' },
  { label: 'Sections', icon: Layers, href: '/admin/section-order' },
  { label: 'SEO', icon: Globe, href: '/admin/seo' },
  { label: 'Backup', icon: Database, href: '/admin/backup' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const settings = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const API = process.env.REACT_APP_BACKEND_URL;
  const logoOff = settings.logo_off;
  const logoSrc = logoOff ? (logoOff.startsWith('/api') ? `${API}${logoOff}` : logoOff) : null;

  const handleLogout = async () => { await logout(); navigate('/'); };

  const v = (name, fallback) => `var(--ad-${name}, ${fallback})`;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: v('page-bg', '#f8fafc') }} data-testid="admin-layout">
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen z-50 transition-all duration-300 flex flex-col
        ${collapsed ? 'w-16' : 'w-60'} 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ backgroundColor: v('sidebar-bg', '#1a2332') }}
        data-testid="admin-sidebar"
      >
        <div className={`flex items-center h-14 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}
          style={{ borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              {logoSrc ? (
                <img src={logoSrc} alt="Admin" className="h-7 w-auto object-contain" data-testid="admin-sidebar-logo-img" />
              ) : (
                <>
                  <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ backgroundColor: v('accent', '#0D9488') }}>
                    <span className="text-white text-xs font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{(settings.brand_name || 'L')[0]}</span>
                  </div>
                  <span className="text-sm font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{settings.brand_name || 'Legacy'} CMS</span>
                </>
              )}
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:block text-white/50 hover:text-white" data-testid="sidebar-collapse-btn">
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {sidebarItems.map((item, idx) => {
            if (item.type === 'divider') {
              if (collapsed) return <div key={idx} className="my-2 mx-3 border-t border-white/10" />;
              return <div key={idx} className="mt-4 mb-1 px-4 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.label}</div>;
            }
            const active = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-sm text-sm transition-colors"
                style={active ? {
                  backgroundColor: v('sidebar-active-bg', '#0D9488'),
                  color: v('sidebar-active-text', '#ffffff')
                } : {
                  color: v('sidebar-text', 'rgba(255,255,255,0.6)')
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = v('sidebar-hover-bg', 'rgba(255,255,255,0.05)'); e.currentTarget.style.color = '#ffffff'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = v('sidebar-text', 'rgba(255,255,255,0.6)'); }}}
                data-testid={`admin-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link to="/" className={`flex items-center gap-3 px-2 py-2 text-white/50 hover:text-white text-sm transition-colors ${collapsed ? 'justify-center' : ''}`} data-testid="admin-back-site">
            <ChevronLeft className="w-4 h-4" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
          <button onClick={handleLogout} className={`flex items-center gap-3 px-2 py-2 text-white/50 hover:text-red-400 text-sm w-full transition-colors ${collapsed ? 'justify-center' : ''}`} data-testid="admin-logout-btn">
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30"
          style={{ backgroundColor: v('navbar-bg', '#ffffff'), borderBottom: `1px solid ${v('navbar-border', '#e2e8f0')}` }}>
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2" style={{ color: v('text-secondary', '#64748b') }} data-testid="admin-mobile-menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm" style={{ color: v('text-secondary', '#64748b') }}>
            Welcome, <span className="font-medium" style={{ color: v('heading', '#1a2332') }}>{user?.name || user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-sm font-medium" style={{ color: v('accent', '#0D9488'), backgroundColor: `${v('accent', '#0D9488')}15` }}>Admin</span>
          </div>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
