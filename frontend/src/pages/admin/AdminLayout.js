import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import {
  LayoutDashboard, Image, Info, Package, FileText, BookOpen, Map, Images, Briefcase, 
  MessageSquare, Mail, CreditCard, Settings, LogOut, ChevronLeft, Menu, X, FileStack, Users,
  BarChart3, Globe, Layers, UserCheck, Shield
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
  { label: 'Portfolio', icon: Briefcase, href: '/admin/portfolio' },
  { label: 'Testimonials', icon: MessageSquare, href: '/admin/testimonials' },
  { label: 'Pages', icon: FileStack, href: '/admin/pages' },
  { label: 'Members', icon: UserCheck, href: '/admin/members' },
  { label: 'Member Levels', icon: Shield, href: '/admin/member-levels' },
  { label: 'Member Types', icon: Users, href: '/admin/member-types' },
  { label: 'Contacts', icon: Mail, href: '/admin/contacts' },
  { label: 'Purchases', icon: CreditCard, href: '/admin/purchases' },
  { label: 'Sections', icon: Layers, href: '/admin/section-order' },
  { label: 'SEO', icon: Globe, href: '/admin/seo' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" data-testid="admin-layout">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen bg-[#1a2332] text-white z-50 transition-all duration-300 flex flex-col
        ${collapsed ? 'w-16' : 'w-60'} 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        data-testid="admin-sidebar"
      >
        <div className={`flex items-center h-14 px-4 border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#0D9488] rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
              </div>
              <span className="text-sm font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Legacy CMS</span>
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
          {sidebarItems.map(item => {
            const active = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-sm text-sm transition-colors ${active ? 'bg-[#0D9488] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                data-testid={`admin-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
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
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-slate-500" data-testid="admin-mobile-menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-slate-500">
            Welcome, <span className="font-medium text-[#1a2332]">{user?.name || user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#0D9488] bg-[#0D9488]/10 px-2 py-1 rounded-sm font-medium">Admin</span>
          </div>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
