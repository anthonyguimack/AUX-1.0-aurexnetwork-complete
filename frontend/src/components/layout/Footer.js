import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { publicAPI } from '../../lib/api';
import { useSettings } from '../../App';
import { Facebook, Twitter, Instagram, Linkedin, Github, Youtube, Send } from 'lucide-react';

const socialIconMap = { facebook: Facebook, twitter: Twitter, instagram: Instagram, linkedin: Linkedin, github: Github, youtube: Youtube };

export default function Footer() {
  const location = useLocation();
  const settings = useSettings();
  const [navPages, setNavPages] = useState([]);
  const socialLinks = settings.social_links || [];

  useEffect(() => {
    publicAPI.getNavPages().then(r => setNavPages(r.data || [])).catch(() => {});
  }, []);

  if (location.pathname.startsWith('/admin')) return null;

  const footerPages = navPages.filter(p => p.show_in_footer).sort((a, b) => (a.order || 0) - (b.order || 0));
  const isExternal = (url) => url?.startsWith('http://') || url?.startsWith('https://');

  return (
    <footer style={{ backgroundColor: 'var(--color-footer-bg, #1a2332)', color: 'var(--color-footer-text, #FFFFFF)' }} data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}>
                <span className="text-white font-bold text-sm" style={{fontFamily: 'Playfair Display, serif'}}>L</span>
              </div>
              <span className="text-xl font-bold" style={{fontFamily: 'Playfair Display, serif'}}>Legacy</span>
            </div>
            <p className="opacity-60 text-sm leading-relaxed">Strategic consulting for businesses seeking sustainable growth and lasting impact.</p>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-4" style={{fontFamily: 'Playfair Display, serif'}}>Quick Links</h4>
            <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}></div>
            <ul className="space-y-2">
              {[{ label: 'Home', href: '/' }, { label: 'News & Blog', href: '/news' }, { label: 'Gallery', href: '/gallery' }, { label: 'Reading List', href: '/reading-list' }].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="opacity-60 text-sm hover:opacity-100 transition-opacity flex items-center gap-2">
                    <span style={{ color: 'var(--color-accent, #0D9488)' }}>&rarr;</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-4" style={{fontFamily: 'Playfair Display, serif'}}>Pages</h4>
            <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}></div>
            <ul className="space-y-2">
              {footerPages.map(page => (
                <li key={page.id}>
                  {isExternal(page.url) ? (
                    <a href={page.url} target={page.open_in_new_tab ? '_blank' : '_self'} rel="noreferrer" className="opacity-60 text-sm hover:opacity-100 transition-opacity flex items-center gap-2">
                      <span style={{ color: 'var(--color-accent, #0D9488)' }}>&rarr;</span> {page.title}
                    </a>
                  ) : (
                    <Link to={page.url || '/'} className="opacity-60 text-sm hover:opacity-100 transition-opacity flex items-center gap-2">
                      <span style={{ color: 'var(--color-accent, #0D9488)' }}>&rarr;</span> {page.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-4" style={{fontFamily: 'Playfair Display, serif'}}>Get Updates</h4>
            <div className="w-8 h-0.5 mb-4" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}></div>
            <p className="opacity-60 text-sm mb-4">Sign up for our latest news & articles.</p>
            <div className="flex">
              <input type="email" placeholder="Enter Email Address" className="flex-1 bg-white/10 border border-white/20 text-sm px-4 py-2 rounded-sm placeholder:opacity-40 focus:outline-none" data-testid="footer-email-input" />
              <button className="px-3 py-2 rounded-sm ml-1 transition-colors" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} data-testid="footer-subscribe-btn"><Send className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {socialLinks.map(link => {
                const IconComp = socialIconMap[link.icon] || Facebook;
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center hover:opacity-80 transition-all" style={{ '--tw-bg-opacity': 1 }} data-testid={`footer-social-${link.icon}`}>
                    <IconComp className="w-4 h-4" />
                  </a>
                );
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
