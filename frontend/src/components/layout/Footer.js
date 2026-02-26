import React from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';

export default function Footer() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#1a2332] text-white" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#0D9488] rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm" style={{fontFamily: 'Playfair Display, serif'}}>L</span>
              </div>
              <span className="text-xl font-bold" style={{fontFamily: 'Playfair Display, serif'}}>Legacy</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Strategic consulting for businesses seeking sustainable growth and lasting impact. We deliver innovative solutions tailored to your unique challenges.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold mb-4" style={{fontFamily: 'Playfair Display, serif'}}>Quick Links</h4>
            <div className="w-8 h-0.5 bg-[#0D9488] mb-4"></div>
            <ul className="space-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'News & Blog', href: '/news' },
                { label: 'Gallery', href: '/gallery' },
                { label: 'Reading List', href: '/reading-list' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-white/60 text-sm hover:text-[#0D9488] transition-colors flex items-center gap-2">
                    <span className="text-[#0D9488]">&rarr;</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages */}
          <div>
            <h4 className="text-base font-semibold mb-4" style={{fontFamily: 'Playfair Display, serif'}}>Pages</h4>
            <div className="w-8 h-0.5 bg-[#0D9488] mb-4"></div>
            <ul className="space-y-2">
              {[
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-white/60 text-sm hover:text-[#0D9488] transition-colors flex items-center gap-2">
                    <span className="text-[#0D9488]">&rarr;</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Updates */}
          <div>
            <h4 className="text-base font-semibold mb-4" style={{fontFamily: 'Playfair Display, serif'}}>Get Updates</h4>
            <div className="w-8 h-0.5 bg-[#0D9488] mb-4"></div>
            <p className="text-white/60 text-sm mb-4">Sign up for our latest news & articles. We won't spam you.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter Email Address"
                className="flex-1 bg-white/10 border border-white/20 text-white text-sm px-4 py-2 rounded-sm placeholder:text-white/40 focus:outline-none focus:border-[#0D9488]"
                data-testid="footer-email-input"
              />
              <button className="bg-[#0D9488] px-3 py-2 rounded-sm ml-1 hover:bg-[#0D9488]/80 transition-colors" data-testid="footer-subscribe-btn">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white/40 text-xs mt-2">Note: We do not publish your email</p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center hover:bg-[#0D9488] transition-colors" data-testid="social-facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center hover:bg-[#0D9488] transition-colors" data-testid="social-twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center hover:bg-[#0D9488] transition-colors" data-testid="social-instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center hover:bg-[#0D9488] transition-colors" data-testid="social-linkedin">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <p className="text-center text-white/40 text-sm">Legacy - Copyright All rights reserved.</p>
      </div>
    </footer>
  );
}
