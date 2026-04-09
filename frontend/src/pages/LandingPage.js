import React, { useState, useEffect, useCallback, useRef } from 'react';
import { landingAPI } from '../lib/api';
import { useSettings } from '../App';
import { X } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const resolveSrc = (v) => v ? (v.startsWith('/api') ? `${API}${v}` : v) : null;
const v = (name, fallback) => `var(--lp-${name}, ${fallback})`;

function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function RevealSection({ children, className = '', style = {}, delay = 0, direction = 'up', ...props }) {
  const [ref, visible] = useScrollReveal(0.1);
  const transform = direction === 'up' ? 'translateY(40px)' : direction === 'left' ? 'translateX(-40px)' : direction === 'right' ? 'translateX(40px)' : 'translateY(40px)';
  return (
    <div ref={ref} className={className} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? 'translate(0)' : transform, transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s` }} {...props}>
      {children}
    </div>
  );
}

function useCountdown(targetDate) {
  const calc = useCallback(() => {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  }, [targetDate]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

function CountdownBox({ value, label }) {
  return (
    <div className="flex flex-col items-center" data-testid={`countdown-${label}`}>
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex items-center justify-center text-3xl sm:text-4xl font-bold" style={{ backgroundColor: v('countdown-bg', 'rgba(255,255,255,0.05)'), color: v('countdown-number', '#c9a84c'), border: `1px solid ${v('border', 'rgba(201,168,76,0.3)')}` }}>
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: v('countdown-label', '#a0a0b0') }}>{label}</span>
    </div>
  );
}

function CookieBanner({ message }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('lp_cookie_consent')) setVisible(true);
  }, []);
  const accept = () => { localStorage.setItem('lp_cookie_consent', 'accepted'); setVisible(false); };
  const decline = () => { localStorage.setItem('lp_cookie_consent', 'declined'); setVisible(false); };
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4" data-testid="cookie-banner">
      <div className="max-w-4xl mx-auto rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4" style={{ backgroundColor: v('cookie-bg', '#13161e'), border: `1px solid ${v('border', 'rgba(201,168,76,0.3)')}` }}>
        <p className="text-sm flex-1" style={{ color: v('cookie-text', '#a0a0b0') }}>{message || 'We use cookies and analytics to improve your browsing experience. By continuing, you agree to our use of cookies.'}</p>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={accept} className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0a0a12') }} data-testid="cookie-accept">Accept all cookies</button>
          <button onClick={decline} className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80 border" style={{ borderColor: v('border', 'rgba(201,168,76,0.3)'), color: v('secondary-text', '#a0a0b0') }} data-testid="cookie-decline">Decline</button>
        </div>
      </div>
    </div>
  );
}

function NotifyModal({ open, onClose, content }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await landingAPI.subscribe(form);
      setSuccess(true);
      setForm({ first_name: '', last_name: '', email: '' });
    } catch { }
    finally { setSubmitting(false); }
  };

  const inputStyle = { backgroundColor: v('input-bg', 'rgba(255,255,255,0.05)'), border: `1px solid ${v('input-border', 'rgba(201,168,76,0.3)')}`, color: v('input-text', '#f5f5f5') };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" data-testid="notify-modal">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg p-6 sm:p-8" style={{ backgroundColor: v('modal-bg', '#13161e'), border: `1px solid ${v('modal-border', 'rgba(201,168,76,0.3)')}` }}>
        <button onClick={onClose} className="absolute top-4 right-4 transition-colors hover:opacity-80" style={{ color: v('secondary-text', '#a0a0b0') }} data-testid="notify-close"><X className="w-5 h-5" /></button>
        <h2 className="text-2xl font-bold mb-2" style={{ color: v('heading', '#f5f5f5'), fontFamily: 'Playfair Display, serif' }}>{content.notify_title || 'Notify Me!'}</h2>
        <p className="text-sm mb-6" style={{ color: v('secondary-text', '#a0a0b0') }}>{content.notify_text || 'Signing up to our newsletter gives you exclusive access to our Grand Opening!'}</p>
        {success ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">&#10003;</div>
            <p className="font-semibold" style={{ color: v('accent', '#c9a84c') }}>You're on the list!</p>
            <p className="text-sm mt-1" style={{ color: v('secondary-text', '#a0a0b0') }}>We'll notify you when we launch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First Name" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm placeholder:opacity-50" style={inputStyle} data-testid="notify-first-name" />
              <input placeholder="Last Name" required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm placeholder:opacity-50" style={inputStyle} data-testid="notify-last-name" />
            </div>
            <input type="email" placeholder="Email Address" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded text-sm placeholder:opacity-50" style={inputStyle} data-testid="notify-email" />
            <button type="submit" disabled={submitting} className="w-full py-2.5 rounded text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0a0a12') }} data-testid="notify-submit">{submitting ? 'Sending...' : (content.notify_btn_text || 'Get notified')}</button>
          </form>
        )}
        <div className="mt-4 text-center">
          <a href="/my-account" className="text-xs hover:underline" style={{ color: v('accent', '#c9a84c') }} data-testid="notify-membership-link">Membership Lounge</a>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const settings = useSettings();
  const [content, setContent] = useState({});
  const [showNotify, setShowNotify] = useState(false);
  const [contactForm, setContactForm] = useState({ first_name: '', last_name: '', email: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const launchDate = settings.landing_page_launch_date;
  const countdown = useCountdown(launchDate);

  useEffect(() => {
    landingAPI.getContent().then(r => setContent(r.data || {})).catch(() => {});
  }, []);

  const logoSrc = resolveSrc(settings.landing_page_logo);
  const bgImage = resolveSrc(settings.landing_page_bg_image);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContact = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    try {
      await landingAPI.submitContact(contactForm);
      setContactSuccess(true);
      setContactForm({ first_name: '', last_name: '', email: '', message: '' });
    } catch { }
    finally { setContactSubmitting(false); }
  };

  const inputStyle = { backgroundColor: v('input-bg', 'rgba(255,255,255,0.05)'), border: `1px solid ${v('input-border', 'rgba(201,168,76,0.3)')}`, color: v('input-text', '#f5f5f5') };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: v('bg-base', '#0a0a12') }} data-testid="landing-page">
      {/* Background layers */}
      {bgImage && (
        <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} data-testid="lp-bg-image" />
      )}
      <div className="fixed inset-0 z-[1]" style={{ background: `linear-gradient(to bottom, ${v('overlay-start', 'rgba(0,0,0,0.75)')}, ${v('overlay-end', 'rgba(5,5,15,0.88)')})` }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto" data-testid="lp-header">
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" className="h-10 sm:h-12 w-auto object-contain" data-testid="lp-logo" />
          ) : (
            <div className="text-xl font-bold" style={{ color: v('accent', '#c9a84c'), fontFamily: 'Playfair Display, serif' }}>{settings.brand_name || 'Coming Soon'}</div>
          )}
        </header>

        {/* Hero Section */}
        <section className="px-6 py-16 sm:py-24 text-center max-w-4xl mx-auto" id="hero" data-testid="lp-hero">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 animate-fadeIn" style={{ color: v('heading', '#f5f5f5'), fontFamily: 'Playfair Display, serif' }} data-testid="lp-hero-title">
            {content.hero_title || 'Launching in:'}
          </h1>

          {/* Countdown */}
          <div className="flex justify-center gap-4 sm:gap-6 mb-8" data-testid="lp-countdown">
            <CountdownBox value={countdown.days} label="Days" />
            <CountdownBox value={countdown.hours} label="Hours" />
            <CountdownBox value={countdown.minutes} label="Minutes" />
            <CountdownBox value={countdown.seconds} label="Seconds" />
          </div>

          {content.hero_subtitle && (
            <p className="text-base sm:text-lg max-w-2xl mx-auto mb-4 leading-relaxed animate-fadeIn" style={{ color: v('body-text', '#f5f5f5'), animationDelay: '0.2s' }} data-testid="lp-hero-subtitle">{content.hero_subtitle}</p>
          )}
          {content.hero_positioning && (
            <p className="text-sm max-w-xl mx-auto mb-8 animate-fadeIn" style={{ color: v('secondary-text', '#a0a0b0'), animationDelay: '0.4s' }} data-testid="lp-hero-positioning">{content.hero_positioning}</p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fadeIn" style={{ animationDelay: '0.6s' }} data-testid="lp-cta-buttons">
            <button onClick={() => scrollTo('description')} className="px-6 py-3 rounded text-sm font-semibold transition-all hover:opacity-80 min-w-[180px]" style={{ border: `1px solid ${v('button-outline-border', '#c9a84c')}`, color: v('button-outline-text', '#c9a84c'), backgroundColor: 'transparent' }} data-testid="lp-btn-info">
              {content.btn1_text || 'More Information'}
            </button>
            <a href="/my-account" className="px-6 py-3 rounded text-sm font-semibold transition-all hover:opacity-80 min-w-[180px] text-center" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0a0a12') }} data-testid="lp-btn-membership">
              {content.btn2_text || 'Membership Lounge'}
            </a>
            <button onClick={() => setShowNotify(true)} className="px-6 py-3 rounded text-sm font-semibold transition-all hover:opacity-80 min-w-[180px]" style={{ border: `1px solid ${v('button-outline-border', '#c9a84c')}`, color: v('button-outline-text', '#c9a84c'), backgroundColor: 'transparent' }} data-testid="lp-btn-notify">
              {content.btn3_text || 'Notify Me!'}
            </button>
          </div>
        </section>

        {/* Divider */}
        <RevealSection className="max-w-6xl mx-auto px-6"><div className="border-t" style={{ borderColor: v('border', 'rgba(201,168,76,0.3)') }} /></RevealSection>

        {/* Description Section */}
        <section className="px-6 py-16 sm:py-20 max-w-4xl mx-auto" id="description" data-testid="lp-description">
          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4" style={{ color: v('heading', '#f5f5f5'), fontFamily: 'Playfair Display, serif' }} data-testid="lp-desc-title">
              {content.desc_title || 'Get in touch with us!'}
            </h2>
          </RevealSection>
          {content.desc_subtitle && (
            <RevealSection delay={0.1}>
              <p className="text-center text-sm mb-8" style={{ color: v('accent', '#c9a84c') }}>{content.desc_subtitle}</p>
            </RevealSection>
          )}
          {content.desc_body && (
            <RevealSection delay={0.2}>
              <div className="prose max-w-none text-center leading-relaxed rich-text-content" style={{ color: v('body-text', '#f5f5f5') }} dangerouslySetInnerHTML={{ __html: content.desc_body }} data-testid="lp-desc-body" />
            </RevealSection>
          )}
          {(content.desc_cta_text || !content.desc_body) && (
            <RevealSection delay={0.3}>
              <div className="text-center mt-8">
                <button onClick={() => scrollTo('contact')} className="px-8 py-3 rounded text-sm font-semibold transition-all hover:opacity-80" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0a0a12') }} data-testid="lp-desc-cta">
                  {content.desc_cta_text || 'Request Access'}
                </button>
              </div>
            </RevealSection>
          )}
        </section>

        {/* Divider */}
        <RevealSection className="max-w-6xl mx-auto px-6"><div className="border-t" style={{ borderColor: v('border', 'rgba(201,168,76,0.3)') }} /></RevealSection>

        {/* Contact Form */}
        <section className="px-6 py-16 sm:py-20 max-w-2xl mx-auto" id="contact" data-testid="lp-contact-section">
          <RevealSection>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8" style={{ color: v('heading', '#f5f5f5'), fontFamily: 'Playfair Display, serif' }}>
              {content.contact_title || 'Contact Us'}
            </h2>
          </RevealSection>
          <RevealSection delay={0.15}>
          {contactSuccess ? (
            <div className="text-center py-8" data-testid="lp-contact-success">
              <div className="text-4xl mb-3">&#10003;</div>
              <p className="text-lg font-semibold" style={{ color: v('accent', '#c9a84c') }}>Message sent!</p>
              <p className="text-sm mt-2" style={{ color: v('secondary-text', '#a0a0b0') }}>We'll get back to you soon.</p>
              <button onClick={() => setContactSuccess(false)} className="mt-4 text-sm hover:underline" style={{ color: v('accent', '#c9a84c') }}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input placeholder="First Name" required value={contactForm.first_name} onChange={e => setContactForm({ ...contactForm, first_name: e.target.value })} className="w-full px-4 py-3 rounded text-sm placeholder:opacity-50" style={inputStyle} data-testid="lp-contact-first-name" />
                <input placeholder="Last Name" required value={contactForm.last_name} onChange={e => setContactForm({ ...contactForm, last_name: e.target.value })} className="w-full px-4 py-3 rounded text-sm placeholder:opacity-50" style={inputStyle} data-testid="lp-contact-last-name" />
              </div>
              <input type="email" placeholder="Email Address" required value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className="w-full px-4 py-3 rounded text-sm placeholder:opacity-50" style={inputStyle} data-testid="lp-contact-email" />
              <textarea placeholder="Your message..." required rows={4} value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} className="w-full px-4 py-3 rounded text-sm placeholder:opacity-50 resize-none" style={inputStyle} data-testid="lp-contact-message" />
              <button type="submit" disabled={contactSubmitting} className="w-full py-3 rounded text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0a0a12') }} data-testid="lp-contact-submit">
                {contactSubmitting ? 'Sending...' : (content.contact_btn_text || 'Send my Message')}
              </button>
            </form>
          )}
          </RevealSection>
        </section>

        {/* Footer */}
        <RevealSection>
          <footer className="py-6 text-center" style={{ backgroundColor: v('footer-bg', 'rgba(0,0,0,0.3)') }} data-testid="lp-footer">
            <p className="text-sm" style={{ color: v('footer-text', '#a0a0b0') }}>{content.footer_text || '\u00A9 Coming Soon'}</p>
          </footer>
        </RevealSection>
      </div>

      {/* Notify Modal */}
      <NotifyModal open={showNotify} onClose={() => setShowNotify(false)} content={content} />

      {/* Cookie Banner */}
      <CookieBanner message={content.cookie_message} />

      {/* Animations CSS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out both; }
      `}</style>
    </div>
  );
}
