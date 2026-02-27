import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { publicAPI } from '../../lib/api';
import { useSettings } from '../../App';
import { Menu, X, LogIn, LogOut, Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Search } from 'lucide-react';
import LoginModal from '../LoginModal';
import SearchBar from '../SearchBar';

const socialIconMap = { facebook: Facebook, twitter: Twitter, instagram: Instagram, linkedin: Linkedin, github: Github, youtube: Youtube };

export default function Navbar() {
  const { user, logout } = useAuth();
  const settings = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [navPages, setNavPages] = useState([]);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const socialLinks = settings.social_links || [];

  useEffect(() => {
    publicAPI.getNavPages().then(r => setNavPages(r.data || [])).catch(() => {});
  }, []);

  if (isAdmin) return null;

  const headerPages = navPages.filter(p => p.show_in_header).sort((a, b) => (a.order || 0) - (b.order || 0));

  const baseLinks = [
    { label: 'Home', href: '/' },
    { label: 'News', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Reading List', href: '/reading-list' },
  ];

  const handlePageClick = (page, e) => {
    if (page.login_required && !user) {
      e.preventDefault();
      setLoginOpen(true);
    }
  };

  const isExternal = (url) => url?.startsWith('http://') || url?.startsWith('https://');

  return (
    <>
      {/* Top bar - Social media links only */}
      <div className="text-white/70 text-xs py-2" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }} data-testid="top-bar">
        <div className="max-w-7xl mx-auto px-6 flex justify-end items-center gap-3">
          {socialLinks.map(link => {
            const IconComp = socialIconMap[link.icon] || Facebook;
            return (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" data-testid={`social-${link.icon}`} title={link.platform}>
                <IconComp className="w-3.5 h-3.5" />
              </a>
            );
          })}
        </div>
      </div>

      <header className="bg-white border-b border-slate-100 sticky top-0 z-50" data-testid="main-navbar">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-logo">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }}>
              <span className="text-white font-bold text-sm" style={{fontFamily: 'Playfair Display, serif'}}>L</span>
            </div>
            <span className="text-xl font-bold" style={{fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)'}}>Legacy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {baseLinks.map(link => (
              <Link key={link.href} to={link.href}
                className={`text-sm font-medium transition-colors hover:opacity-70 ${location.pathname === link.href ? '' : ''}`}
                style={{ color: location.pathname === link.href ? 'var(--color-accent, #0D9488)' : 'var(--color-heading, #1a2332)' }}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
              >{link.label}</Link>
            ))}
            {headerPages.map(page => {
              if (isExternal(page.url)) {
                return (
                  <a key={page.id} href={page.url} target={page.open_in_new_tab ? '_blank' : '_self'} rel="noreferrer"
                    className="text-sm font-medium transition-colors hover:opacity-70"
                    style={{ color: 'var(--color-heading, #1a2332)' }}
                    onClick={(e) => handlePageClick(page, e)}
                  >{page.title}</a>
                );
              }
              return (
                <Link key={page.id} to={page.url?.startsWith('#') ? `/${page.url}` : page.url || '/'}
                  className="text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: location.pathname === page.url ? 'var(--color-accent, #0D9488)' : 'var(--color-heading, #1a2332)' }}
                  onClick={(e) => handlePageClick(page, e)}
                >{page.title}</Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium transition-colors" style={{ color: 'var(--color-accent, #0D9488)' }} data-testid="nav-admin-link">Admin Panel</Link>
                )}
                <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors" data-testid="nav-logout-btn">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <button onClick={() => setLoginOpen(true)}
                className="hidden md:flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-button-bg, #1a2332)', color: 'var(--color-button-text, #fff)' }}
                data-testid="nav-login-btn"
              ><LogIn className="w-4 h-4" /> Login</button>
            )}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-toggle">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 py-4 px-6" data-testid="mobile-menu">
            {baseLinks.map(link => (
              <Link key={link.href} to={link.href} className="block py-2 text-sm font-medium" style={{ color: 'var(--color-heading, #1a2332)' }} onClick={() => setMobileOpen(false)}>{link.label}</Link>
            ))}
            {headerPages.map(page => (
              <Link key={page.id} to={page.url || '/'} className="block py-2 text-sm font-medium" style={{ color: 'var(--color-heading, #1a2332)' }} onClick={(e) => { handlePageClick(page, e); setMobileOpen(false); }}>{page.title}</Link>
            ))}
            {user ? (
              <>
                {user.role === 'admin' && <Link to="/admin" className="block py-2 text-sm font-medium" style={{ color: 'var(--color-accent, #0D9488)' }} onClick={() => setMobileOpen(false)}>Admin Panel</Link>}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block py-2 text-sm text-slate-500">Logout</button>
              </>
            ) : (
              <button onClick={() => { setLoginOpen(true); setMobileOpen(false); }} className="mt-2 w-full px-5 py-2 rounded-sm text-sm font-medium" style={{ backgroundColor: 'var(--color-button-bg, #1a2332)', color: 'var(--color-button-text, #fff)' }}>Login</button>
            )}
          </div>
        )}
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
