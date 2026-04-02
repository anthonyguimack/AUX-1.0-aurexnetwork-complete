import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowRight, Send } from 'lucide-react';
import { useSettings } from '../../App';
import { publicAPI } from '../../lib/api';

const socialIconMap = { facebook: Facebook, twitter: Twitter, instagram: Instagram, linkedin: Linkedin, youtube: Youtube };

function useFooterData() {
  const settings = useSettings();
  const [footerPages, setFooterPages] = React.useState([]);
  const socialLinks = settings.social_links || [];

  React.useEffect(() => {
    publicAPI.getNavPages().then(r => {
      const all = r.data || [];
      setFooterPages(all.filter(p => p.show_in_footer));
    }).catch(() => {});
  }, []);

  const isExternal = (url) => url && (url.startsWith('http://') || url.startsWith('https://'));
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  return { settings, socialLinks, footerPages, isExternal, isAdmin };
}

// Shared 3-column footer structure for all themes
function SharedFooterContent({ settings, socialLinks, footerPages, isExternal, logoSrc, theme }) {
  const baseLinks = [
    { label: 'Home', href: '/' },
    { label: 'News', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Reading List', href: '/reading-list' },
  ];

  const isClassic = theme === 'classic';
  const fontFamily = isClassic ? "'Playfair Display', serif" : undefined;

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Logo + Description + Social */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {logoSrc ? (
                <img src={logoSrc} alt={settings.brand_name || 'Logo'} className="h-10 w-auto object-contain" data-testid="footer-logo-img" />
              ) : (
                <>
                  <div className="w-9 h-9 flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent, #0D9488)', borderRadius: isClassic ? 0 : '0.25rem' }}>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: fontFamily || 'Playfair Display, serif' }}>{(settings.brand_name || 'L')[0]}</span>
                  </div>
                  <span className="text-lg font-bold" style={{ fontFamily: fontFamily || 'Playfair Display, serif' }}>{settings.brand_name || 'Legacy'}</span>
                </>
              )}
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6" style={fontFamily ? { fontFamily } : {}}>
              {settings.footer_description || 'Strategic consulting for businesses seeking sustainable growth and lasting impact.'}
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map(link => {
                const IconComp = socialIconMap[link.icon] || Facebook;
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer"
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-all"
                    data-testid={`footer-social-${link.icon}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Navigation (base links + all footer pages) */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5" style={fontFamily ? { fontFamily } : {}}>Navigation</h4>
            <ul className="space-y-2.5">
              {baseLinks.map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 flex-shrink-0" /> {link.label}
                  </Link>
                </li>
              ))}
              {footerPages.map(page => (
                <li key={page.id}>
                  {isExternal(page.url) || page.open_in_new_tab ? (
                    <a href={isExternal(page.url) ? page.url : (page.url || '/')} target="_blank" rel="noreferrer" className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 flex-shrink-0" /> {page.title}
                    </a>
                  ) : (
                    <Link to={page.url || `/page/${page.id}`} className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 flex-shrink-0" /> {page.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Stay Updated */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5" style={fontFamily ? { fontFamily } : {}}>Stay Updated</h4>
            <p className="text-white/50 text-sm mb-4">Get the latest insights delivered to your inbox.</p>
            <div className="flex">
              <input type="email" placeholder="Email address"
                className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-4 py-3 rounded-l-md placeholder:text-white/30 focus:outline-none focus:border-white/30"
                data-testid="footer-email-input" />
              <button className="px-5 py-3 rounded-r-md text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}
                data-testid="footer-subscribe-btn">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <p className="text-center text-white/30 text-xs" style={fontFamily ? { fontFamily } : {}}>
          {settings.footer_copyright || 'Legacy Consulting - All rights reserved.'}
        </p>
      </div>
    </>
  );
}

function DefaultFooter() {
  const { settings, socialLinks, footerPages, isExternal, isAdmin } = useFooterData();
  if (isAdmin) return null;
  const API = process.env.REACT_APP_BACKEND_URL;
  const logoOff = settings.logo_off;
  const logoSrc = logoOff ? (logoOff.startsWith('/api') ? `${API}${logoOff}` : logoOff) : null;

  return (
    <footer style={{ backgroundColor: 'var(--color-footer-bg, #1a2332)', color: 'var(--color-footer-text, #FFFFFF)' }} data-testid="site-footer">
      <SharedFooterContent settings={settings} socialLinks={socialLinks} footerPages={footerPages} isExternal={isExternal} logoSrc={logoSrc} theme="default" />
    </footer>
  );
}

function ModernFooter() {
  const { settings, socialLinks, footerPages, isExternal, isAdmin } = useFooterData();
  if (isAdmin) return null;
  const API = process.env.REACT_APP_BACKEND_URL;
  const logoOff = settings.logo_off;
  const logoSrc = logoOff ? (logoOff.startsWith('/api') ? `${API}${logoOff}` : logoOff) : null;

  return (
    <footer className="relative overflow-hidden" data-testid="site-footer">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }} />
      <div className="relative">
        <SharedFooterContent settings={settings} socialLinks={socialLinks} footerPages={footerPages} isExternal={isExternal} logoSrc={logoSrc} theme="modern" />
      </div>
    </footer>
  );
}

function ClassicFooter() {
  const { settings, socialLinks, footerPages, isExternal, isAdmin } = useFooterData();
  if (isAdmin) return null;
  const API = process.env.REACT_APP_BACKEND_URL;
  const logoOff = settings.logo_off;
  const logoSrc = logoOff ? (logoOff.startsWith('/api') ? `${API}${logoOff}` : logoOff) : null;

  return (
    <footer data-testid="site-footer">
      <div style={{ backgroundColor: 'var(--color-primary, #1a2332)' }}>
        <SharedFooterContent settings={settings} socialLinks={socialLinks} footerPages={footerPages} isExternal={isExternal} logoSrc={logoSrc} theme="classic" />
      </div>
    </footer>
  );
}

export default function Footer() {
  const settings = useSettings();
  const theme = settings.active_theme || 'default';
  if (theme === 'modern') return <ModernFooter />;
  if (theme === 'classic') return <ClassicFooter />;
  return <DefaultFooter />;
}
