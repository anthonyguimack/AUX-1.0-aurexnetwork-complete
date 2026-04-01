import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { publicAPI } from '../../lib/api';
import { useSettings, useTheme } from '../../App';
import { Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Send, ArrowRight } from 'lucide-react';

const socialIconMap = { facebook: Facebook, twitter: Twitter, instagram: Instagram, linkedin: Linkedin, github: Github, youtube: Youtube };

function useFooterData() {
  const location = useLocation();
  const settings = useSettings();
  const [navPages, setNavPages] = useState([]);
  const socialLinks = settings.social_links || [];

  useEffect(() => {
    publicAPI.getNavPages().then(r => setNavPages(r.data || [])).catch(() => {});
  }, []);

  const footerPages = navPages.filter(p => p.show_in_footer).sort((a, b) => (a.order || 0) - (b.order || 0));
  const isExternal = (url) => url?.startsWith('http://') || url?.startsWith('https://');
  const isAdmin = location.pathname.startsWith('/admin');

  return { settings, socialLinks, footerPages, isExternal, isAdmin };
}

export default function Footer() {
  const theme = useTheme();
  if (theme === 'modern') return <ModernFooter />;
  if (theme === 'classic') return <ClassicFooter />;
  return <DefaultFooter />;
}

function DefaultFooter() {
  const { settings, socialLinks, footerPages, isExternal, isAdmin } = useFooterData();
  if (isAdmin) return null;
  const API = process.env.REACT_APP_BACKEND_URL;
  const logoOff = settings.logo_off;
  const logoSrc = logoOff ? (logoOff.startsWith('/api') ? `${API}${logoOff}` : logoOff) : null;

  return (
    <footer style={{ backgroundColor: 'var(--color-footer-bg, #1a2332)', color: 'var(--color-footer-text, #FFFFFF)' }} data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {logoSrc ? (
                <img src={logoSrc} alt={settings.brand_name || 'Logo'} className="h-10 w-auto object-contain" data-testid="footer-logo-img" />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>{(settings.brand_name || 'L')[0]}</span>
                  </div>
                  <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{settings.brand_name || 'Legacy'}</span>
                </>
              )}
            </div>
            <p className="opacity-60 text-sm leading-relaxed">Strategic consulting for businesses seeking sustainable growth and lasting impact.</p>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Quick Links</h4>
            <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} />
            <ul className="space-y-2">
              {[{ label: 'Home', href: '/' }, { label: 'News & Blog', href: '/news' }, { label: 'Gallery', href: '/gallery' }, { label: 'Reading List', href: '/reading-list' }].map(link => (
                <li key={link.href}><Link to={link.href} className="opacity-60 text-sm hover:opacity-100 transition-opacity flex items-center gap-2"><span style={{ color: 'var(--color-accent, #0D9488)' }}>&rarr;</span> {link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Pages</h4>
            <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} />
            <ul className="space-y-2">
              {footerPages.map(page => (
                <li key={page.id}>
                  {isExternal(page.url) || page.open_in_new_tab ? (
                    <a href={isExternal(page.url) ? page.url : (page.url || '/')} target="_blank" rel="noreferrer" className="opacity-60 text-sm hover:opacity-100 transition-opacity flex items-center gap-2"><span style={{ color: 'var(--color-accent, #0D9488)' }}>&rarr;</span> {page.title}</a>
                  ) : (
                    <Link to={page.url || '/'} className="opacity-60 text-sm hover:opacity-100 transition-opacity flex items-center gap-2"><span style={{ color: 'var(--color-accent, #0D9488)' }}>&rarr;</span> {page.title}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Get Updates</h4>
            <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} />
            <p className="opacity-60 text-sm mb-4">Sign up for our latest news & articles.</p>
            <div className="flex">
              <input type="email" placeholder="Enter Email Address" className="flex-1 bg-white/10 border border-white/20 text-sm px-4 py-2 rounded-sm placeholder:opacity-40 focus:outline-none" data-testid="footer-email-input" />
              <button className="px-3 py-2 rounded-sm ml-1 transition-colors" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} data-testid="footer-subscribe-btn"><Send className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {socialLinks.map(link => {
                const IconComp = socialIconMap[link.icon] || Facebook;
                return <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center hover:opacity-80 transition-all" data-testid={`footer-social-${link.icon}`}><IconComp className="w-4 h-4" /></a>;
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <p className="text-center opacity-40 text-sm">Legacy - Copyright All rights reserved.</p>
      </div>
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
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              {logoSrc ? (
                <img src={logoSrc} alt={settings.brand_name || 'Logo'} className="h-12 w-auto object-contain" data-testid="footer-logo-img" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}>
                    <span className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>{(settings.brand_name || 'L')[0]}</span>
                  </div>
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{settings.brand_name || 'Legacy'}</span>
                </>
              )}
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-6">Strategic consulting for businesses seeking sustainable growth and lasting impact in today's dynamic market.</p>
            <div className="flex items-center gap-3">
              {socialLinks.map(link => {
                const IconComp = socialIconMap[link.icon] || Facebook;
                return <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all" data-testid={`footer-social-${link.icon}`}><IconComp className="w-4 h-4" /></a>;
              })}
            </div>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5">Navigation</h4>
            <ul className="space-y-3">
              {[{ label: 'Home', href: '/' }, { label: 'News', href: '/news' }, { label: 'Gallery', href: '/gallery' }, { label: 'Reading List', href: '/reading-list' }].map(link => (
                <li key={link.href}><Link to={link.href} className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-2"><ArrowRight className="w-3 h-3" /> {link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5">Stay Updated</h4>
            <p className="text-white/50 text-sm mb-4">Get the latest insights delivered to your inbox.</p>
            <div className="flex">
              <input type="email" placeholder="Email address" className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-4 py-3 rounded-l-full placeholder:text-white/30 focus:outline-none focus:border-white/30" data-testid="footer-email-input" />
              <button className="px-5 py-3 rounded-r-full text-white text-sm font-medium" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} data-testid="footer-subscribe-btn">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/5 py-5">
        <p className="text-center text-white/30 text-xs">Legacy Consulting - All rights reserved.</p>
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
      <div className="py-16" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {logoSrc ? (
                  <img src={logoSrc} alt={settings.brand_name || 'Logo'} className="h-9 w-auto object-contain" data-testid="footer-logo-img" />
                ) : (
                  <>
                    <div className="w-9 h-9 border-2 border-white/40 flex items-center justify-center">
                      <span className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{(settings.brand_name || 'L')[0]}</span>
                    </div>
                    <div>
                      <span className="text-white font-bold block leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{settings.brand_name || 'Legacy'}</span>
                      <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--color-accent, #0D9488)' }}>{settings.tagline || 'Consulting'}</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: "'Playfair Display', serif" }}>Trusted advisory services for lasting business success.</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-bold mb-4 pb-2" style={{ fontFamily: "'Playfair Display', serif", borderBottom: '1px solid var(--color-accent, #0D9488)' }}>Site Map</h4>
              <ul className="space-y-2">
                {[{ label: 'Home', href: '/' }, { label: 'News', href: '/news' }, { label: 'Gallery', href: '/gallery' }, { label: 'Reading List', href: '/reading-list' }].map(link => (
                  <li key={link.href}><Link to={link.href} className="text-white/50 text-sm hover:text-white transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-bold mb-4 pb-2" style={{ fontFamily: "'Playfair Display', serif", borderBottom: '1px solid var(--color-accent, #0D9488)' }}>Resources</h4>
              <ul className="space-y-2">
                {footerPages.map(page => (
                  <li key={page.id}>
                    {isExternal(page.url) || page.open_in_new_tab ? (
                      <a href={isExternal(page.url) ? page.url : (page.url || '/')} target="_blank" rel="noreferrer" className="text-white/50 text-sm hover:text-white transition-colors">{page.title}</a>
                    ) : (
                      <Link to={page.url || '/'} className="text-white/50 text-sm hover:text-white transition-colors">{page.title}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-bold mb-4 pb-2" style={{ fontFamily: "'Playfair Display', serif", borderBottom: '1px solid var(--color-accent, #0D9488)' }}>Connect</h4>
              <div className="flex items-center gap-2 mb-4">
                {socialLinks.map(link => {
                  const IconComp = socialIconMap[link.icon] || Facebook;
                  return <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="w-8 h-8 border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-all" data-testid={`footer-social-${link.icon}`}><IconComp className="w-3.5 h-3.5" /></a>;
                })}
              </div>
              <div className="flex">
                <input type="email" placeholder="Your email" className="flex-1 bg-white/5 border border-white/20 text-white text-sm px-3 py-2 placeholder:text-white/30 focus:outline-none" data-testid="footer-email-input" />
                <button className="px-3 py-2 text-white" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} data-testid="footer-subscribe-btn"><Send className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="py-3 text-center" style={{ backgroundColor: '#0f1a27' }}>
        <p className="text-white/30 text-xs" style={{ fontFamily: "'Playfair Display', serif" }}>Legacy Consulting - All rights reserved.</p>
      </div>
    </footer>
  );
}
