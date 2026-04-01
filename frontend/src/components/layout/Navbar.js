import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { publicAPI } from '../../lib/api';
import { useSettings, useTheme } from '../../App';
import { Menu, X, LogIn, LogOut, Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Search } from 'lucide-react';
import LoginModal from '../LoginModal';
import SearchBar from '../SearchBar';

const socialIconMap = { facebook: Facebook, twitter: Twitter, instagram: Instagram, linkedin: Linkedin, github: Github, youtube: Youtube };

export default function Navbar() {
  const theme = useTheme();
  if (theme === 'modern') return <ModernNavbar />;
  if (theme === 'classic') return <ClassicNavbar />;
  return <DefaultNavbar />;
}

function useNavData() {
  const { user, logout } = useAuth();
  const settings = useSettings();
  const [navPages, setNavPages] = useState([]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const socialLinks = settings.social_links || [];

  useEffect(() => {
    publicAPI.getNavPages().then(r => setNavPages(r.data || [])).catch(() => {});
  }, []);

  const headerPages = navPages.filter(p => p.show_in_header).sort((a, b) => (a.order || 0) - (b.order || 0));
  const baseLinks = [
    { label: 'Home', href: '/' },
    { label: 'News', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Reading List', href: '/reading-list' },
  ];

  const handlePageClick = (page, e) => {
    if (page.login_required && !user) { e.preventDefault(); setLoginOpen(true); }
  };

  const isExternal = (url) => url?.startsWith('http://') || url?.startsWith('https://');
  const isAdmin = location.pathname.startsWith('/admin');

  return { user, logout, settings, socialLinks, headerPages, baseLinks, handlePageClick, isExternal, isAdmin, location, loginOpen, setLoginOpen, searchOpen, setSearchOpen };
}

function NavLinks({ baseLinks, headerPages, isExternal, handlePageClick, location, user }) {
  return (
    <>
      {baseLinks.map(link => (
        <Link key={link.href} to={link.href}
          className="text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: location.pathname === link.href ? 'var(--color-accent, #0D9488)' : 'var(--color-heading-color, #1a2332)' }}
          data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
        >{link.label}</Link>
      ))}
      {headerPages.map(page => {
        if (isExternal(page.url)) {
          return <a key={page.id} href={page.url} target={page.open_in_new_tab ? '_blank' : '_self'} rel="noreferrer" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'var(--color-heading-color, #1a2332)' }}>{page.title}</a>;
        }
        return (
          <Link key={page.id} to={page.url || `/page/${page.id}`} onClick={e => handlePageClick(page, e)}
            className="text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: location.pathname === (page.url || `/page/${page.id}`) ? 'var(--color-accent, #0D9488)' : 'var(--color-heading-color, #1a2332)' }}
          >{page.title} {page.login_required && !user && <span className="text-[10px]">*</span>}</Link>
        );
      })}
    </>
  );
}

function DefaultNavbar() {
  const { user, logout, settings, socialLinks, headerPages, baseLinks, handlePageClick, isExternal, isAdmin, location, loginOpen, setLoginOpen, searchOpen, setSearchOpen } = useNavData();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isAdmin) return null;

  return (
    <>
      <div className="text-white/70 text-xs py-2" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }} data-testid="top-bar">
        <div className="max-w-7xl mx-auto px-6 flex justify-end items-center gap-3">
          {socialLinks.map(link => {
            const IconComp = socialIconMap[link.icon] || Facebook;
            return <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" data-testid={`social-${link.icon}`} title={link.platform}><IconComp className="w-3.5 h-3.5" /></a>;
          })}
        </div>
      </div>
      <header className="sticky top-0 z-50" style={{ backgroundColor: 'var(--color-navbar-bg, #ffffff)', borderBottom: '1px solid #e2e8f0' }} data-testid="main-navbar">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-logo">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading-color, #1a2332)' }}>Legacy</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks {...{ baseLinks, headerPages, isExternal, handlePageClick, location, user }} />
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:opacity-70" style={{ color: 'var(--color-heading-color, #1a2332)' }} data-testid="search-toggle"><Search className="w-4 h-4" /></button>
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' && <Link to="/admin" className="text-xs font-medium px-3 py-1.5 rounded-sm" style={{ backgroundColor: 'var(--color-accent, #0D9488)', color: '#fff' }}>Admin</Link>}
                <button onClick={logout} className="text-sm flex items-center gap-1 hover:opacity-70" style={{ color: 'var(--color-heading-color, #1a2332)' }}><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="text-sm font-medium px-4 py-2 rounded-sm flex items-center gap-1.5" style={{ backgroundColor: 'var(--color-button-bg, #1a2332)', color: 'var(--color-button-text, #ffffff)' }} data-testid="login-btn"><LogIn className="w-3.5 h-3.5" /> Login</button>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" style={{ color: 'var(--color-heading-color, #1a2332)' }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {searchOpen && <div className="max-w-7xl mx-auto px-6 pb-3"><SearchBar onClose={() => setSearchOpen(false)} /></div>}
        {mobileOpen && (
          <div className="md:hidden border-t px-6 py-4 space-y-3 bg-white">
            {baseLinks.map(link => <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium" style={{ color: 'var(--color-heading-color, #1a2332)' }}>{link.label}</Link>)}
            {headerPages.map(page => <Link key={page.id} to={page.url || `/page/${page.id}`} onClick={() => setMobileOpen(false)} className="block text-sm font-medium" style={{ color: 'var(--color-heading-color, #1a2332)' }}>{page.title}</Link>)}
          </div>
        )}
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

function ModernNavbar() {
  const { user, logout, socialLinks, headerPages, baseLinks, handlePageClick, isExternal, isAdmin, location, loginOpen, setLoginOpen, searchOpen, setSearchOpen } = useNavData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isAdmin) return null;

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}
        style={{ backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none' }}
        data-testid="main-navbar">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-logo">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}>
              <span className="text-white font-bold text-base" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: scrolled ? 'var(--color-heading-color, #1a2332)' : '#ffffff' }}>Legacy</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {baseLinks.map(link => (
              <Link key={link.href} to={link.href}
                className="text-sm font-medium tracking-wide uppercase transition-colors hover:opacity-70"
                style={{ color: location.pathname === link.href ? 'var(--color-accent, #0D9488)' : (scrolled ? 'var(--color-heading-color, #1a2332)' : '#ffffff'), letterSpacing: '0.1em' }}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
              >{link.label}</Link>
            ))}
            {headerPages.map(page => {
              const href = isExternal(page.url) ? page.url : (page.url || `/page/${page.id}`);
              const isExt = isExternal(page.url);
              const Comp = isExt ? 'a' : Link;
              const props = isExt ? { href, target: page.open_in_new_tab ? '_blank' : '_self', rel: 'noreferrer' } : { to: href, onClick: e => handlePageClick(page, e) };
              return <Comp key={page.id} {...props} className="text-sm font-medium tracking-wide uppercase transition-colors hover:opacity-70" style={{ color: scrolled ? 'var(--color-heading-color, #1a2332)' : '#ffffff', letterSpacing: '0.1em' }}>{page.title}</Comp>;
            })}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' && <Link to="/admin" className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent, #0D9488)', color: '#fff' }}>Admin</Link>}
                <button onClick={logout} className="p-2 hover:opacity-70" style={{ color: scrolled ? 'var(--color-heading-color, #1a2332)' : '#ffffff' }}><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="text-sm font-medium px-5 py-2.5 rounded-full flex items-center gap-2 transition-colors" style={{ backgroundColor: 'var(--color-accent, #0D9488)', color: '#ffffff' }} data-testid="login-btn"><LogIn className="w-3.5 h-3.5" /> Login</button>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" style={{ color: scrolled ? 'var(--color-heading-color, #1a2332)' : '#ffffff' }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden px-6 py-4 space-y-3 bg-white shadow-lg">
            {baseLinks.map(link => <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium" style={{ color: 'var(--color-heading-color, #1a2332)' }}>{link.label}</Link>)}
          </div>
        )}
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

function ClassicNavbar() {
  const { user, logout, socialLinks, headerPages, baseLinks, handlePageClick, isExternal, isAdmin, location, loginOpen, setLoginOpen } = useNavData();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isAdmin) return null;

  return (
    <>
      {/* Accent top line */}
      <div className="h-1" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} />
      {/* Top info bar */}
      <div className="py-2 text-xs" style={{ backgroundColor: '#faf9f6', borderBottom: '1px solid #e8e4de' }}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {socialLinks.map(link => {
              const IconComp = socialIconMap[link.icon] || Facebook;
              return <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-colors" style={{ color: 'var(--color-primary, #1a2332)' }}><IconComp className="w-3.5 h-3.5" /></a>;
            })}
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'admin' && <Link to="/admin" className="font-medium" style={{ color: 'var(--color-accent, #0D9488)' }}>Admin Panel</Link>}
                <button onClick={logout} className="flex items-center gap-1 hover:opacity-70" style={{ color: 'var(--color-primary, #1a2332)' }}><LogOut className="w-3 h-3" /> Logout</button>
              </div>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="font-medium flex items-center gap-1" style={{ color: 'var(--color-primary, #1a2332)' }} data-testid="login-btn"><LogIn className="w-3 h-3" /> Login</button>
            )}
          </div>
        </div>
      </div>
      {/* Main header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#faf9f6', borderBottom: '2px solid var(--color-primary, #1a2332)' }} data-testid="main-navbar">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-logo">
            <div className="w-9 h-9 rounded-none flex items-center justify-center border-2" style={{ borderColor: 'var(--color-primary, #1a2332)', backgroundColor: 'var(--color-primary, #1a2332)' }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>L</span>
            </div>
            <div>
              <span className="text-lg font-bold block leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--color-heading-color, #1a2332)' }}>Legacy</span>
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent, #0D9488)' }}>Consulting</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {baseLinks.map(link => (
              <Link key={link.href} to={link.href}
                className="text-sm font-medium px-4 py-2 transition-colors"
                style={{
                  color: location.pathname === link.href ? 'var(--color-accent, #0D9488)' : 'var(--color-heading-color, #1a2332)',
                  borderBottom: location.pathname === link.href ? '2px solid var(--color-accent, #0D9488)' : '2px solid transparent',
                  fontFamily: "'Playfair Display', serif"
                }}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
              >{link.label}</Link>
            ))}
            {headerPages.map(page => {
              const href = isExternal(page.url) ? page.url : (page.url || `/page/${page.id}`);
              const isExt = isExternal(page.url);
              const Comp = isExt ? 'a' : Link;
              const props = isExt ? { href, target: page.open_in_new_tab ? '_blank' : '_self', rel: 'noreferrer' } : { to: href, onClick: e => handlePageClick(page, e) };
              return <Comp key={page.id} {...props} className="text-sm font-medium px-4 py-2 transition-colors" style={{ color: 'var(--color-heading-color, #1a2332)', fontFamily: "'Playfair Display', serif", borderBottom: '2px solid transparent' }}>{page.title}</Comp>;
            })}
          </nav>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" style={{ color: 'var(--color-heading-color, #1a2332)' }}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden px-6 py-4 space-y-3" style={{ backgroundColor: '#faf9f6', borderTop: '1px solid #e8e4de' }}>
            {baseLinks.map(link => <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-1" style={{ color: 'var(--color-heading-color, #1a2332)', fontFamily: "'Playfair Display', serif" }}>{link.label}</Link>)}
          </div>
        )}
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
