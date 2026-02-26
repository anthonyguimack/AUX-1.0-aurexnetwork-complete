import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Menu, X, ChevronDown, LogIn, LogOut, User } from 'lucide-react';
import LoginModal from '../LoginModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'News', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Reading List', href: '/reading-list' },
  ];

  return (
    <>
      <div className="bg-[#1a2332] text-white/70 text-xs py-2 hidden md:block" data-testid="top-bar">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>contact@legacyconsulting.com</span>
            <span>|</span>
            <span>Working: 9:00am - 6:00pm</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/news" className="hover:text-white transition-colors">Company News</Link>
            <Link to="/terms" className="hover:text-white transition-colors">FAQ</Link>
            <Link to="#contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50" data-testid="main-navbar">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-logo">
            <div className="w-8 h-8 bg-[#1a2332] rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{fontFamily: 'Playfair Display, serif'}}>L</span>
            </div>
            <span className="text-xl font-bold text-[#1a2332]" style={{fontFamily: 'Playfair Display, serif'}}>Legacy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#0D9488] ${
                  location.pathname === link.href ? 'text-[#0D9488]' : 'text-[#1a2332]'
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-[#0D9488] hover:text-[#0D9488]/80 transition-colors"
                    data-testid="nav-admin-link"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#1a2332] transition-colors"
                  data-testid="nav-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="hidden md:flex items-center gap-2 bg-[#1a2332] text-white px-5 py-2 rounded-sm text-sm font-medium hover:bg-[#0D9488] transition-colors"
                data-testid="nav-login-btn"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 py-4 px-6" data-testid="mobile-menu">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="block py-2 text-sm font-medium text-[#1a2332] hover:text-[#0D9488]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block py-2 text-sm font-medium text-[#0D9488]" onClick={() => setMobileOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block py-2 text-sm text-slate-500">
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                className="mt-2 w-full bg-[#1a2332] text-white px-5 py-2 rounded-sm text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>
        )}
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
