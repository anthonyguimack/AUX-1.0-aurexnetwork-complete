/**
 * Aurex One-page theme — public-site section components.
 *
 * All sections accept `{ config, items, bg, font, contrast }` props where:
 *   bg       — hex from section_configs (overrides schema suggestion)
 *   font     — font-family CSS string
 *   contrast — 'dark' or 'light' (text color scheme)
 *
 * Design notes match the Aurex spec: monochromatic palette, generous spacing,
 * subtle borders (not shadows), auto-alternating process steps, grayscale→color
 * partner/client hovers.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X as XIcon, Linkedin, Twitter, Globe, Calendar, ArrowRight, ArrowUpRight, Quote, Phone, Send, Loader2, Star, Clock, BookOpen, ExternalLink } from 'lucide-react';
import * as lucide from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { AUREX_FONTS, AUREX_PALETTE, aurexContrastFor } from '../lib/themeColors';
import { getTileUrl, getTileAttribution } from '../lib/mapConfig';
import { contactAPI, blogExternalAPI, checkoutAPI } from '../lib/api';
import { useSettings } from '../App';

const API = process.env.REACT_APP_BACKEND_URL;
const resolveImg = (src) => (src && src.startsWith('/api') ? `${API}${src}` : src);

// ─── Scroll-reveal wrapper (IntersectionObserver) ────────────────────────

export function Reveal({ children, delay = 0, className = '', as: Tag = 'div', once = true, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Graceful fallback for very old browsers: show immediately
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisible(true);
          if (once) obs.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [once]);
  return (
    <Tag ref={ref} className={`aurex-reveal ${visible ? 'aurex-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}


// ─── Shared helpers ──────────────────────────────────────────────────────

function fontFor(key, contrast) {
  const f = AUREX_FONTS.find(x => x.key === key);
  if (f) return f.css;
  // Spec defaults: Inter for light bg, Sora for dark bg
  return contrast === 'dark' ? "'Inter', sans-serif" : "'Sora', sans-serif";
}

function sectionStyle({ bg, font, contrast }) {
  return {
    backgroundColor: bg || '#FFFFFF',
    color: contrast === 'light' ? '#FFFFFF' : '#111827',
    fontFamily: font || fontFor(null, contrast),
  };
}

function SectionShell({ bg, font, contrast, className = '', children, ...rest }) {
  return (
    <section className={`aurex-section px-6 sm:px-10 md:px-16 lg:px-24 py-16 md:py-24 ${className}`} style={sectionStyle({ bg, font, contrast })} {...rest}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

function SectionHeader({ title, subtitle, contrast, centered = true }) {
  if (!title && !subtitle) return null;
  return (
    <Reveal className={`${centered ? 'text-center' : ''} mb-12 md:mb-16`}>
      {title && <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>}
      {subtitle && <p className={`mt-4 max-w-2xl ${centered ? 'mx-auto' : ''} ${contrast === 'light' ? 'text-gray-300' : 'text-gray-600'}`}>{subtitle}</p>}
    </Reveal>
  );
}

function LucideIcon({ name, className = 'w-8 h-8' }) {
  if (!name) return null;
  // Normalize input (e.g. "briefcase" → "Briefcase")
  const key = name.charAt(0).toUpperCase() + name.slice(1);
  const Comp = lucide[key] || lucide[name];
  return Comp ? <Comp className={className} /> : null;
}

// ─── 1. Aurex is for you (target audience) ───────────────────────────────

export function AurexAudience({ config = {}, items = [], bg, font, contrast }) {
  const c = { bg: bg || '#FFFFFF', font, contrast: contrast || aurexContrastFor(bg || '#FFFFFF') };
  const cols = Math.min(items.length, 3);
  return (
    <SectionShell {...c} data-testid="aurex-section-audience">
      <SectionHeader title={config.title} subtitle={config.subtitle} contrast={c.contrast} />
      <div className={`grid gap-8 ${cols === 1 ? 'grid-cols-1 max-w-md mx-auto' : cols === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {items.map((i, idx) => (
          <Reveal as="article" delay={idx * 100} key={i.id} className="border rounded-xl p-8" style={{ borderColor: c.contrast === 'light' ? 'rgba(255,255,255,.15)' : '#E5E7EB' }} data-testid={`audience-card-${i.id}`}>
            <LucideIcon name={i.icon} className="w-9 h-9 mb-5" />
            <h3 className="text-xl font-semibold mb-2">{i.title}</h3>
            {i.description && <p className={`text-sm leading-relaxed ${c.contrast === 'light' ? 'text-gray-300' : 'text-gray-600'}`}>{i.description}</p>}
          </Reveal>
        ))}
      </div>
      {config.cta_text && config.cta_url && (
        <div className="text-center mt-12">
          <a href={config.cta_url} className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium transition-all hover:shadow-lg" style={{ backgroundColor: c.contrast === 'light' ? '#FFFFFF' : '#111827', color: c.contrast === 'light' ? '#111827' : '#FFFFFF' }} data-testid="audience-cta">
            {config.cta_text} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </SectionShell>
  );
}

// ─── 2. Our Process (vertical timeline, alternating) ─────────────────────

export function AurexProcess({ config = {}, items = [], bg, font, contrast }) {
  const c = { bg: bg || '#1F2937', font, contrast: contrast || aurexContrastFor(bg || '#1F2937') };
  return (
    <SectionShell {...c} data-testid="aurex-section-process">
      <SectionHeader title={config.title} subtitle={config.subtitle} contrast={c.contrast} />
      <div className="relative max-w-3xl mx-auto">
        {/* Center vertical line */}
        <div className="absolute left-8 md:left-1/2 top-2 bottom-2 w-px md:-translate-x-px" style={{ backgroundColor: c.contrast === 'light' ? 'rgba(255,255,255,.2)' : 'rgba(17,24,39,.15)' }} />
        {items.map((step, idx) => {
          const isLeft = idx % 2 === 0;
          return (
            <Reveal delay={idx * 120} key={step.id} className={`relative flex items-start gap-6 mb-12 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`} data-testid={`process-step-${step.id}`}>
              {/* Node */}
              <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: c.contrast === 'light' ? '#FFFFFF' : '#111827', color: c.contrast === 'light' ? '#111827' : '#FFFFFF', boxShadow: `0 0 0 4px ${c.bg}` }}>
                {step.step_number || (idx + 1)}
              </div>
              <div className={`pl-20 md:pl-0 md:w-1/2 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                <h3 className="text-lg md:text-xl font-semibold mb-2">{step.title}</h3>
                {step.description && <p className={`text-sm leading-relaxed ${c.contrast === 'light' ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>}
              </div>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}

// ─── 3. Pricing ──────────────────────────────────────────────────────────

function parseFeatures(raw) {
  return String(raw || '').split(/\r?\n/).filter(Boolean).map(l => ({
    included: !l.startsWith('✗') && !l.toLowerCase().startsWith('x '),
    text: l.replace(/^✗\s*/, '').replace(/^x\s+/i, '').trim(),
  }));
}

export function AurexPricing({ config = {}, items = [], bg, font, contrast }) {
  const c = { bg: bg || '#F4F6F8', font, contrast: contrast || aurexContrastFor(bg || '#F4F6F8') };
  const [annual, setAnnual] = useState(false);
  return (
    <SectionShell {...c} data-testid="aurex-section-pricing">
      <SectionHeader title={config.title} subtitle={config.subtitle} contrast={c.contrast} />
      {config.show_toggle && (
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full p-1 border" style={{ borderColor: c.contrast === 'light' ? 'rgba(255,255,255,.2)' : '#E5E7EB' }}>
            {['Monthly', 'Annual'].map((lbl, i) => (
              <button key={lbl} onClick={() => setAnnual(i === 1)} className={`px-5 py-1.5 rounded-full text-xs font-medium transition-colors ${annual === (i === 1) ? 'text-white' : ''}`} style={annual === (i === 1) ? { backgroundColor: '#111827' } : {}}>{lbl}</button>
            ))}
          </div>
        </div>
      )}
      <div className={`grid gap-6 ${items.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : items.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {items.map((plan, idx) => {
          const price = annual ? plan.price_annual || plan.price : plan.price;
          const features = parseFeatures(plan.features);
          const featured = !!plan.is_featured;
          return (
            <Reveal as="article" delay={idx * 100} key={plan.id} className={`rounded-2xl p-8 flex flex-col border transition-all ${featured ? 'scale-[1.03] lg:scale-[1.05] shadow-xl' : ''}`} style={{ borderColor: featured ? '#111827' : (c.contrast === 'light' ? 'rgba(255,255,255,.15)' : '#E5E7EB'), backgroundColor: featured && c.contrast === 'dark' ? '#FFFFFF' : undefined, color: featured && c.contrast === 'dark' ? '#111827' : undefined, borderWidth: featured ? 2 : 1 }} data-testid={`plan-card-${plan.id}`}>
              {plan.badge && (
                <span className="inline-block self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4" style={{ backgroundColor: '#111827', color: '#FFFFFF' }}>{plan.badge}</span>
              )}
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.currency || '$'}{price}</span>
                {plan.period && <span className="text-sm text-gray-500 ml-1">{plan.period}</span>}
              </div>
              <ul className="flex-1 space-y-3 mb-8">
                {features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${!f.included ? 'line-through opacity-50' : ''}`}>
                    {f.included ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              {plan.cta_text && (
                <a href={plan.cta_url || '#'} className={`w-full text-center py-2.5 rounded-full text-sm font-medium transition-colors`} style={{ backgroundColor: featured ? '#111827' : 'transparent', color: featured ? '#FFFFFF' : 'inherit', border: featured ? 'none' : '1px solid currentColor' }}>{plan.cta_text}</a>
              )}
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}

// ─── 4. Our Team ─────────────────────────────────────────────────────────

export function AurexTeam({ config = {}, items = [], bg, font, contrast }) {
  const c = { bg: bg || '#FFFFFF', font, contrast: contrast || aurexContrastFor(bg || '#FFFFFF') };
  const limit = config.max_visible ? Number(config.max_visible) : items.length;
  const visible = items.slice(0, limit);
  return (
    <SectionShell {...c} data-testid="aurex-section-team">
      <SectionHeader title={config.title} subtitle={config.subtitle} contrast={c.contrast} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {visible.map((m, idx) => (
          <Reveal as="article" delay={idx * 100} key={m.id} className="group relative overflow-hidden rounded-xl" data-testid={`team-card-${m.id}`}>
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {m.photo_url ? <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">{m.name?.[0]}</div>}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-end p-5 opacity-0 group-hover:opacity-100" style={{ transitionDuration: '300ms' }}>
                <div className="text-white">
                  {m.bio && <p className="text-xs leading-relaxed mb-2">{m.bio}</p>}
                  <div className="flex gap-2">
                    {m.linkedin_url && <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="p-1.5 bg-white/15 rounded hover:bg-white/30" aria-label="LinkedIn"><Linkedin className="w-3.5 h-3.5" /></a>}
                    {m.twitter_url && <a href={m.twitter_url} target="_blank" rel="noreferrer" className="p-1.5 bg-white/15 rounded hover:bg-white/30" aria-label="Twitter"><Twitter className="w-3.5 h-3.5" /></a>}
                    {m.other_url && <a href={m.other_url} target="_blank" rel="noreferrer" className="p-1.5 bg-white/15 rounded hover:bg-white/30" aria-label="Website"><Globe className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <h3 className="font-semibold text-base">{m.name}</h3>
              {m.role && <p className={`text-sm ${c.contrast === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>{m.role}</p>}
            </div>
          </Reveal>
        ))}
      </div>
      {config.show_view_all && config.view_all_url && (
        <div className="text-center mt-12">
          <a href={config.view_all_url} className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70">{config.view_all_text || 'View full team'} <ArrowRight className="w-4 h-4" /></a>
        </div>
      )}
    </SectionShell>
  );
}

// ─── 5. Events (from AUX Calendar) ───────────────────────────────────────

export function AurexEvents({ config = {}, items = [], bg, font, contrast }) {
  const c = { bg: bg || '#FFFFFF', font, contrast: contrast || aurexContrastFor(bg || '#FFFFFF') };
  return (
    <SectionShell {...c} data-testid="aurex-section-events">
      <SectionHeader title={config.title} subtitle={config.subtitle} contrast={c.contrast} />
      {items.length === 0 ? (
        <p className="text-center text-sm" style={{ color: c.contrast === 'light' ? 'rgba(255,255,255,.6)' : '#6b7280' }}>{config.empty_message || 'No upcoming events.'}</p>
      ) : (
        <ul className="divide-y max-w-4xl mx-auto" style={{ borderColor: c.contrast === 'light' ? 'rgba(255,255,255,.1)' : '#E5E7EB' }}>
          {items.map((e, idx) => {
            const d = new Date(`${e.date}T${e.start_time || '00:00'}`);
            const day = String(d.getDate()).padStart(2, '0');
            const month = d.toLocaleDateString(undefined, { month: 'short' });
            return (
              <Reveal as="li" delay={idx * 80} key={e.id} className="py-6 flex items-center gap-6 flex-wrap md:flex-nowrap" data-testid={`event-row-${e.id}`}>
                <div className="text-center shrink-0">
                  <div className="text-4xl md:text-5xl font-bold leading-none">{day}</div>
                  <div className={`text-[10px] uppercase tracking-wider mt-1 ${c.contrast === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>{month}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base md:text-lg truncate">{e.title}</h3>
                  <p className={`text-sm truncate ${c.contrast === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {e.start_time}{e.end_time ? ` – ${e.end_time}` : ''}{e.location ? ` · ${e.location}` : ''}
                  </p>
                </div>
                <Link to={`/my-account/event/${e.id}`} className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium transition-colors" style={{ backgroundColor: c.contrast === 'light' ? '#FFFFFF' : '#111827', color: c.contrast === 'light' ? '#111827' : '#FFFFFF' }}>View <ArrowRight className="w-3 h-3" /></Link>
              </Reveal>
            );
          })}
        </ul>
      )}
      {config.view_all_url && items.length > 0 && (
        <div className="text-center mt-10">
          <a href={config.view_all_url} className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70">{config.view_all_text || 'View all events'} <ArrowRight className="w-4 h-4" /></a>
        </div>
      )}
    </SectionShell>
  );
}

// ─── 6. Partners (dark strip, grayscale→color) ───────────────────────────

function LogoRow({ items, autoscroll, scrollSpeed, contrast, className = '' }) {
  const list = autoscroll ? [...items, ...items] : items;
  return (
    <div className={`${autoscroll ? 'overflow-hidden' : ''} ${className}`}>
      <div className={autoscroll ? 'flex gap-10 items-center' : 'flex flex-wrap gap-8 items-center justify-center'} style={autoscroll ? { animation: `aurex-scroll ${scrollSpeed || 30}s linear infinite` } : undefined}>
        {list.map((p, i) => {
          const target = p.link_target === 'internal' ? '_self' : (p.link_target || '_blank');
          const Wrap = p.link_url ? 'a' : 'div';
          return (
            <Wrap key={`${p.id}-${i}`} href={p.link_url || undefined} target={p.link_url ? target : undefined} rel={p.link_url && target === '_blank' ? 'noreferrer' : undefined} className="shrink-0 block group" data-testid={`logo-${p.id}`}>
              {p.logo_url ? (
                <img src={p.logo_url} alt={p.name} className="h-10 md:h-12 w-auto object-contain transition-all duration-300" style={{ filter: 'grayscale(100%) brightness(1.4)' }} onMouseEnter={e => (e.currentTarget.style.filter = 'grayscale(0%) brightness(1)')} onMouseLeave={e => (e.currentTarget.style.filter = 'grayscale(100%) brightness(1.4)')} />
              ) : (
                <span className={`text-sm font-medium ${contrast === 'light' ? 'text-white/50' : 'text-gray-400'} group-hover:text-inherit`}>{p.name}</span>
              )}
            </Wrap>
          );
        })}
      </div>
    </div>
  );
}

export function AurexPartners({ config = {}, items = [], bg, font, contrast }) {
  const c = { bg: bg || '#111827', font, contrast: contrast || aurexContrastFor(bg || '#111827') };
  return (
    <SectionShell {...c} className="!py-12 md:!py-16" data-testid="aurex-section-partners">
      {config.title && <h2 className="text-center text-xl md:text-2xl font-semibold mb-8">{config.title}</h2>}
      <LogoRow items={items} autoscroll={config.autoscroll} scrollSpeed={config.scroll_speed} contrast={c.contrast} />
    </SectionShell>
  );
}

// ─── 7. Our Clients (light bg, gallery style) ────────────────────────────

export function AurexClients({ config = {}, items = [], bg, font, contrast }) {
  const c = { bg: bg || '#F4F6F8', font, contrast: contrast || aurexContrastFor(bg || '#F4F6F8') };
  return (
    <SectionShell {...c} data-testid="aurex-section-clients">
      <SectionHeader title={config.title} subtitle={config.subtitle} contrast={c.contrast} />
      <LogoRow items={items} autoscroll={config.autoscroll} scrollSpeed={30} contrast={c.contrast} className="py-8" />
    </SectionShell>
  );
}

// ─── Data hook: fetch all Aurex sections in parallel ─────────────────────

const SECTIONS_ITEMIZED = ['aurex_audience', 'aurex_process', 'aurex_pricing', 'aurex_team', 'aurex_partners', 'aurex_clients'];

export function useAurexSections() {
  const [data, setData] = useState({});
  useEffect(() => {
    const keys = [...SECTIONS_ITEMIZED, 'aurex_events'];
    Promise.all(keys.map(k => fetch(`${API}/api/public/aurex/${k}`).then(r => r.ok ? r.json() : { config: {}, items: [] }).catch(() => ({ config: {}, items: [] }))))
      .then(results => {
        const map = {};
        keys.forEach((k, i) => { map[k] = results[i]; });
        setData(map);
      });
  }, []);
  return data;
}

// ═════════════════════════════════════════════════════════════════════════
//   Aurex "Mono" variants of the 9 existing sections.
//   Applied on HomePage.js when active_theme === 'aurex'. All follow the
//   monochrome palette (whites/grays/darks), subtle 1px borders (no heavy
//   shadows), sans-serif typography, and scroll-reveal.
// ═════════════════════════════════════════════════════════════════════════

const monoShell = 'aurex-section px-6 sm:px-10 md:px-16 lg:px-24 py-20 md:py-28';
const monoText = { color: '#111827', fontFamily: "'Inter', sans-serif" };

// About
export function AurexAboutMono({ data }) {
  if (!data?.title) return null;
  const img = resolveImg(data.image);
  return (
    <section className={`${monoShell} bg-white`} style={monoText} id="about" data-testid="about-section">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          {data.label && <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-4">{data.label}</p>}
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6" data-testid="about-title">{data.title}</h2>
          <div className="w-12 h-px bg-gray-900 mb-6" />
          <p className="text-gray-600 leading-relaxed">{data.description}</p>
          <div className="flex items-center gap-6 mt-8 flex-wrap">
            {data.phone && <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center"><Phone className="w-4 h-4" /></div><div><p className="text-[11px] uppercase tracking-wider text-gray-400">Call us</p><p className="text-sm font-semibold">{data.phone}</p></div></div>}
            {data.signature_name && <div className="border-l border-gray-200 pl-6"><p className="font-semibold">{data.signature_name}</p><p className="text-xs text-gray-500">{data.signature_title}</p></div>}
          </div>
        </Reveal>
        {img && <Reveal delay={120}><img src={img} alt="" className="w-full rounded-xl border border-gray-200 object-cover aspect-[4/3]" /></Reveal>}
      </div>
    </section>
  );
}

// Services
const monoIconMap = { 'briefcase': lucide.Briefcase, 'trending-up': lucide.TrendingUp, 'bar-chart-3': lucide.BarChart3, 'monitor': lucide.Monitor };
export function AurexServicesMono({ services }) {
  if (!services?.length) return null;
  const clean = (html) => (html || '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
  const handleCheckout = async (s) => {
    if (!s.stripe_price_id) { toast.info('No pricing configured'); return; }
    try { const r = await checkoutAPI.create({ price_id: s.stripe_price_id, service_name: s.title, amount: s.price }); if (r.data.url) window.location.href = r.data.url; } catch { toast.error('Checkout error'); }
  };
  return (
    <section className={`${monoShell} bg-[#F9FAFB]`} style={monoText} id="services" data-testid="services-section">
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-3">What we offer</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="services-title">Our Services</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, idx) => {
            const Icon = monoIconMap[s.icon] || lucide.Briefcase;
            return (
              <Reveal delay={idx * 80} key={s.id} className="bg-white border border-gray-200 rounded-xl p-8 hover:border-gray-900 transition-colors group">
                <Icon className="w-7 h-7 mb-5 text-gray-900" />
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <div className="text-sm text-gray-600 leading-relaxed mb-4 rich-text-content" dangerouslySetInnerHTML={{ __html: clean(s.short_description || s.description || '') }} />
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                  {s.external_url ? (
                    <a href={s.external_url} target={s.open_in_new_tab ? '_blank' : '_self'} rel="noreferrer" className="text-xs font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all" data-testid={`service-link-${s.id}`}>Read more <ArrowRight className="w-3.5 h-3.5" /></a>
                  ) : (
                    <Link to={`/service/${s.id}`} className="text-xs font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all" data-testid={`service-link-${s.id}`}>Read more <ArrowRight className="w-3.5 h-3.5" /></Link>
                  )}
                  {s.price > 0 && (
                    <button onClick={() => handleCheckout(s)} className="text-xs font-medium px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-black transition-colors">${s.price}</button>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// News
export function AurexNewsMono({ posts }) {
  if (!posts?.length) return null;
  return (
    <section className={`${monoShell} bg-white`} style={monoText} id="news" data-testid="news-section">
      <div className="max-w-7xl mx-auto">
        <Reveal className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-3">Latest News</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="news-title">From our desk</h2>
          </div>
          <Link to="/news" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all" data-testid="news-view-all">View all <ArrowRight className="w-4 h-4" /></Link>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((p, idx) => (
            <Reveal as={Link} delay={idx * 80} to={`/news/${p.slug || p.id}`} key={p.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:border-gray-900 transition-colors block">
              {p.image && <div className="aspect-[16/10] overflow-hidden bg-gray-50"><img src={resolveImg(p.image)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ filter: 'grayscale(10%)' }} /></div>}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3"><Clock className="w-3 h-3 text-gray-400" /><span className="text-[11px] uppercase tracking-wider text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span></div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{p.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{p.excerpt || (p.content || '').replace(/<[^>]*>/g, '').slice(0, 120)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// External Blog
export function AurexBlogMono() {
  const settings = useSettings();
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    if (settings.blog_api_url) blogExternalAPI.getLatest().then(r => setPosts(r.data?.posts || [])).catch(() => {});
  }, [settings.blog_api_url]);
  if (!posts.length) return null;
  return (
    <section className={`${monoShell} bg-[#F9FAFB]`} style={monoText} id="blog" data-testid="blog-section">
      <div className="max-w-7xl mx-auto">
        <Reveal className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-3">Blog</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="blog-title">Writing</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((p, i) => (
            <Reveal as="a" href={p.url || p.link} target="_blank" rel="noreferrer" delay={i * 80} key={i} className="group border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-gray-900 transition-colors block">
              {p.image && <div className="aspect-[16/10] overflow-hidden"><img src={p.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ filter: 'grayscale(10%)' }} /></div>}
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-1 line-clamp-2">{p.title} <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-40" /></h3>
                <p className="text-sm text-gray-600 line-clamp-2">{p.summary || p.excerpt}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// Reading List
export function AurexReadingMono({ books }) {
  if (!books?.length) return null;
  return (
    <section className={`${monoShell} bg-white`} style={monoText} id="reading-list" data-testid="reading-section">
      <div className="max-w-7xl mx-auto">
        <Reveal className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-3">Reading</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="reading-title">Reading List</h2>
          </div>
          <Link to="/reading-list" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight className="w-4 h-4" /></Link>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.slice(0, 5).map((b, idx) => {
            const cover = b.image || b.cover_image;
            const src = resolveImg(cover);
            return (
              <Reveal as={Link} to="/reading-list" delay={idx * 60} key={b.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:border-gray-900 transition-colors block bg-white">
                {src ? <div className="aspect-[2/3] overflow-hidden bg-gray-50"><img src={src} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                     : <div className="aspect-[2/3] flex items-center justify-center bg-gray-900"><BookOpen className="w-8 h-8 text-white/60" /></div>}
                <div className="p-3">
                  <p className="text-sm font-semibold truncate">{b.title}</p>
                  <p className="text-xs text-gray-500 truncate">{b.author}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Map
export function AurexMapMono({ maps, locations, title, mapsLang }) {
  const all = [...(maps || []).filter(m => m.lat && m.lng), ...(locations || []).filter(l => l.lat && l.lng)];
  if (!all.length) return null;
  const center = [all[0].lat, all[0].lng];
  const lang = mapsLang || 'local';
  return (
    <section className={`${monoShell} bg-[#F4F6F8]`} style={monoText} id="locations" data-testid="map-section">
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-3">Presence</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="map-title">{title || 'Our Locations'}</h2>
        </Reveal>
        <Reveal className="rounded-xl overflow-hidden border border-gray-200 h-[420px]">
          <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer url={getTileUrl(lang)} attribution={getTileAttribution(lang)} />
            <MarkerClusterGroup>
              {all.map((loc, i) => (<Marker key={i} position={[loc.lat, loc.lng]}><Popup><strong>{loc.title || loc.name}</strong>{loc.description && <p>{loc.description}</p>}{loc.link && <a href={loc.link} target={loc.open_in_new_tab ? '_blank' : '_self'} rel="noreferrer" className="text-blue-500 underline">Visit</a>}</Popup></Marker>))}
            </MarkerClusterGroup>
          </MapContainer>
        </Reveal>
      </div>
    </section>
  );
}

// Portfolio
export function AurexPortfolioMono({ items }) {
  if (!items?.length) return null;
  return (
    <section className={`${monoShell} bg-white`} style={monoText} id="portfolio" data-testid="portfolio-section">
      <div className="max-w-7xl mx-auto">
        <Reveal className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-3">Our work</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="portfolio-title">Featured Projects</h2>
          </div>
          <Link to="/featured-projects" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all" data-testid="portfolio-view-all">View all <ArrowRight className="w-4 h-4" /></Link>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.slice(0, 4).map((p, idx) => (
            <Reveal delay={idx * 100} key={p.id} className="group relative rounded-xl overflow-hidden border border-gray-200">
              {p.image && <img src={resolveImg(p.image)} alt="" className="w-full h-80 object-cover transition-all duration-500 group-hover:scale-105" style={{ filter: 'grayscale(30%)' }} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-7 opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-white/70 mb-1">{p.category}</p>
                  <h3 className="text-xl font-semibold text-white">{p.title}</h3>
                </div>
                {p.link && <a href={p.link} target={p.open_in_new_tab ? '_blank' : '_self'} rel="noreferrer" className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/30 flex-shrink-0 backdrop-blur-sm"><ArrowUpRight className="w-4 h-4" /></a>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// Gallery
export function AurexGalleryMono({ items }) {
  if (!items?.length) return null;
  return (
    <section className={`${monoShell} bg-[#F9FAFB]`} style={monoText} id="gallery" data-testid="gallery-section">
      <div className="max-w-7xl mx-auto">
        <Reveal className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-3">Moments</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="gallery-title">Gallery</h2>
          </div>
          <Link to="/gallery" className="text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight className="w-4 h-4" /></Link>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.slice(0, 6).map((img, idx) => (
            <Reveal delay={idx * 60} key={img.id} className="group overflow-hidden rounded-xl border border-gray-200">
              <img src={resolveImg(img.image)} alt={img.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-all duration-500" style={{ filter: 'grayscale(40%)' }} onMouseEnter={e => (e.currentTarget.style.filter = 'grayscale(0%)')} onMouseLeave={e => (e.currentTarget.style.filter = 'grayscale(40%)')} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials
export function AurexTestimonialsMono({ items }) {
  if (!items?.length) return null;
  return (
    <section className={`${monoShell} bg-white`} style={monoText} id="testimonials" data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-500 mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="testimonials-title">What clients say</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.slice(0, 3).map((t, idx) => (
            <Reveal delay={idx * 100} key={t.id} className="border border-gray-200 rounded-xl p-8 relative bg-white">
              <Quote className="w-7 h-7 mb-5 text-gray-300" />
              <p className="text-sm leading-relaxed text-gray-700 mb-6">{t.content}</p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                {t.avatar && <img src={resolveImg(t.avatar)} alt="" className="w-10 h-10 rounded-full object-cover" style={{ filter: 'grayscale(100%)' }} />}
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role || t.company}</p>
                </div>
                <div className="ml-auto flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3" style={{ color: s <= (t.rating || 5) ? '#111827' : '#E5E7EB', fill: s <= (t.rating || 5) ? '#111827' : 'none' }} />)}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact
export function AurexContactMono({ contactSettings }) {
  const cs = contactSettings || {};
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try { await contactAPI.submit(form); toast.success('Message sent!'); setForm({ name: '', email: '', message: '' }); } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };
  return (
    <section className={`${monoShell} bg-[#111827]`} style={{ color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }} id="contact" data-testid="contact-section">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-400 mb-4">{cs.title || 'Contact'}</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5" data-testid="contact-title">{cs.subtitle || "Let's work together"}</h2>
          <div className="w-12 h-px bg-white/40 mb-6" />
          <p className="text-gray-300 leading-relaxed">{cs.description || 'Have a project in mind? Let us know and we\'ll be in touch.'}</p>
        </Reveal>
        <Reveal delay={120} as="form" onSubmit={submit} className="space-y-4">
          <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required placeholder="Your name" className="w-full px-5 py-3.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors" />
          <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required placeholder="Your email" className="w-full px-5 py-3.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors" />
          <textarea value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} required placeholder="Your message" rows={5} className="w-full px-5 py-3.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors resize-none" />
          <button type="submit" disabled={sending} className="w-full py-3.5 rounded-full bg-white text-gray-900 font-medium text-sm inline-flex items-center justify-center gap-2 hover:bg-gray-100 disabled:opacity-50 transition-colors" data-testid="contact-submit">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send message</button>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Hero (Aurex monochrome) ─────────────────────────────────────────────
// Supports CMS slides + countdown + single-column typography-forward layout.
// Falls back to the optional photo — rendered in grayscale — as a side column.

function countdownParts(target) {
  if (!target) return null;
  const t = new Date(target).getTime();
  const diff = t - Date.now();
  if (isNaN(t) || diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

function CountdownMono({ target, light = false }) {
  const [parts, setParts] = useState(() => countdownParts(target));
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setParts(countdownParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!parts) return null;
  const units = [['Days', parts.days], ['Hours', parts.hours], ['Min', parts.mins], ['Sec', parts.secs]];
  return (
    <div className="flex gap-6 md:gap-10 my-8" data-testid="hero-countdown">
      {units.map(([lbl, n]) => (
        <div key={lbl}>
          <div className={`text-4xl md:text-6xl font-bold tabular-nums leading-none ${light ? 'text-gray-900' : ''}`}>{String(n).padStart(2, '0')}</div>
          <div className={`text-[10px] uppercase tracking-[0.25em] mt-2 ${light ? 'text-gray-600' : 'text-white/50'}`}>{lbl}</div>
        </div>
      ))}
    </div>
  );
}

const stripHtml = (h) => (h || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

export function AurexHeroMono({ slides, data }) {
  const allSlides = (slides && slides.length > 0 ? slides : (data?.title ? [data] : []));
  const [idx, setIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    if (allSlides.length <= 1) return;
    const delay = allSlides[idx]?.delay || 9400;
    const t = setTimeout(() => setIdx(i => (i + 1) % allSlides.length), delay);
    return () => clearTimeout(t);
  }, [idx, allSlides]);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (allSlides.length === 0) return null;
  const s = allSlides[idx];
  const bg = s.background || s.background_image || '';

  // Collect up to 3 CTAs into a single array
  const ctas = [
    { text: s.button_text,   url: s.button_url   || s.button_link, target: s.window_open === 'new' ? '_blank' : '_self' },
    { text: s.button_2_text, url: s.button_2_url, target: s.button_2_window_open === 'new' ? '_blank' : '_self' },
    { text: s.button_3_text, url: s.button_3_url, target: s.button_3_window_open === 'new' ? '_blank' : '_self' },
  ].filter(c => c.text);

  // Parallax: image translates 0 → +80px as user scrolls 0 → 600px
  const parallax = Math.min(scrollY * 0.25, 120);

  return (
    <section className="aurex-section relative overflow-hidden bg-white" data-testid="hero-section" style={{ fontFamily: "'Inter', sans-serif" }}>
      {bg && (
        <>
          <div className="absolute inset-0 bg-cover bg-center will-change-transform" style={{ backgroundImage: `url(${bg})`, transform: `translate3d(0, ${parallax}px, 0) scale(1.08)` }} />
          {/* Soft light overlay that fades from bright-left to transparent-right to keep text legible without killing the photo */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0.05) 85%)' }} />
        </>
      )}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-24 py-24 md:py-36 min-h-[620px] md:min-h-[760px] flex items-end">
        <div className="w-full max-w-3xl">
          {s.subtitle && (
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-700 mb-5" data-testid="hero-subtitle" dangerouslySetInnerHTML={{ __html: stripHtml(s.subtitle) }} />
            </Reveal>
          )}
          {s.title && (
            <Reveal delay={100}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight text-gray-900 mb-8" data-testid="hero-title">
                {typeof s.title === 'string' && s.title.includes('<') ? <span dangerouslySetInnerHTML={{ __html: s.title }} /> : s.title?.split('\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}<span className={i > 0 ? 'italic font-light text-gray-700' : ''}>{line}</span></React.Fragment>)}
              </h1>
            </Reveal>
          )}
          {s.countdown_to && <Reveal delay={200}><CountdownMono target={s.countdown_to} light /></Reveal>}
          {s.description && (
            <Reveal delay={250}>
              <div className="text-base md:text-lg text-gray-700 max-w-xl leading-relaxed rich-text-content mb-10" data-testid="hero-description" dangerouslySetInnerHTML={{ __html: s.description }} />
            </Reveal>
          )}
          {ctas.length > 0 && (
            <Reveal delay={300}>
              <div className="flex flex-wrap items-center gap-3" data-testid="hero-cta-row">
                {ctas.map((c, i) => {
                  const primary = i === 0;
                  return (
                    <a
                      key={i}
                      href={c.url || '#'}
                      target={c.target}
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all hover:gap-3 ${primary ? 'bg-white text-gray-900 border border-gray-900 hover:bg-gray-900 hover:text-white' : 'bg-transparent text-gray-900 border-2 border-gray-900/80 hover:bg-gray-900 hover:text-white'}`}
                      data-testid={`hero-cta-btn-${i}`}
                    >
                      {c.text} {primary && <ArrowRight className="w-4 h-4" />}
                    </a>
                  );
                })}
              </div>
            </Reveal>
          )}
        </div>
      </div>
      {allSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {allSlides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`h-[2px] transition-all ${i === idx ? 'w-10 bg-gray-900' : 'w-6 bg-gray-900/30 hover:bg-gray-900/60'}`} aria-label={`Slide ${i + 1}`} data-testid={`hero-dot-${i}`} />
          ))}
        </div>
      )}
    </section>
  );
}

// CSS keyframe + reveal styles (injected once)
if (typeof document !== 'undefined' && !document.getElementById('aurex-keyframes')) {
  const style = document.createElement('style');
  style.id = 'aurex-keyframes';
  style.textContent = `
    @keyframes aurex-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .aurex-reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s ease-out, transform .7s ease-out; will-change: opacity, transform; }
    .aurex-reveal.aurex-in { opacity: 1; transform: translateY(0); }
    @media (prefers-reduced-motion: reduce) {
      .aurex-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
    }
    /* Let each Aurex section control its own typography (override global h1-h4 Playfair rule) */
    .aurex-section h1, .aurex-section h2, .aurex-section h3, .aurex-section h4 { font-family: inherit; }
  `;
  document.head.appendChild(style);
}
