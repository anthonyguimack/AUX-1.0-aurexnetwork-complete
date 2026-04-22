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
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X as XIcon, Linkedin, Twitter, Globe, Calendar, ArrowRight } from 'lucide-react';
import * as lucide from 'lucide-react';
import { AUREX_FONTS, AUREX_PALETTE, aurexContrastFor } from '../lib/themeColors';

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
    <section className={`px-6 sm:px-10 md:px-16 lg:px-24 py-16 md:py-24 ${className}`} style={sectionStyle({ bg, font, contrast })} {...rest}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

function SectionHeader({ title, subtitle, contrast, centered = true }) {
  if (!title && !subtitle) return null;
  return (
    <div className={`${centered ? 'text-center' : ''} mb-12 md:mb-16`}>
      {title && <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>}
      {subtitle && <p className={`mt-4 max-w-2xl ${centered ? 'mx-auto' : ''} ${contrast === 'light' ? 'text-gray-300' : 'text-gray-600'}`}>{subtitle}</p>}
    </div>
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
        {items.map(i => (
          <article key={i.id} className="border rounded-xl p-8" style={{ borderColor: c.contrast === 'light' ? 'rgba(255,255,255,.15)' : '#E5E7EB' }} data-testid={`audience-card-${i.id}`}>
            <LucideIcon name={i.icon} className="w-9 h-9 mb-5" />
            <h3 className="text-xl font-semibold mb-2">{i.title}</h3>
            {i.description && <p className={`text-sm leading-relaxed ${c.contrast === 'light' ? 'text-gray-300' : 'text-gray-600'}`}>{i.description}</p>}
          </article>
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
            <div key={step.id} className={`relative flex items-start gap-6 mb-12 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`} data-testid={`process-step-${step.id}`}>
              {/* Node */}
              <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-4" style={{ backgroundColor: c.contrast === 'light' ? '#FFFFFF' : '#111827', color: c.contrast === 'light' ? '#111827' : '#FFFFFF', ringColor: c.bg }}>
                {step.step_number || (idx + 1)}
              </div>
              <div className={`pl-20 md:pl-0 md:w-1/2 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                <h3 className="text-lg md:text-xl font-semibold mb-2">{step.title}</h3>
                {step.description && <p className={`text-sm leading-relaxed ${c.contrast === 'light' ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>}
              </div>
            </div>
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
        {items.map(plan => {
          const price = annual ? plan.price_annual || plan.price : plan.price;
          const features = parseFeatures(plan.features);
          const featured = !!plan.is_featured;
          return (
            <article key={plan.id} className={`rounded-2xl p-8 flex flex-col border transition-all ${featured ? 'scale-[1.03] lg:scale-[1.05] shadow-xl' : ''}`} style={{ borderColor: featured ? '#111827' : (c.contrast === 'light' ? 'rgba(255,255,255,.15)' : '#E5E7EB'), backgroundColor: featured && c.contrast === 'dark' ? '#FFFFFF' : undefined, color: featured && c.contrast === 'dark' ? '#111827' : undefined, borderWidth: featured ? 2 : 1 }} data-testid={`plan-card-${plan.id}`}>
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
            </article>
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
        {visible.map(m => (
          <article key={m.id} className="group relative overflow-hidden rounded-xl" data-testid={`team-card-${m.id}`}>
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
          </article>
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
          {items.map(e => {
            const d = new Date(`${e.date}T${e.start_time || '00:00'}`);
            const day = String(d.getDate()).padStart(2, '0');
            const month = d.toLocaleDateString(undefined, { month: 'short' });
            return (
              <li key={e.id} className="py-6 flex items-center gap-6 flex-wrap md:flex-nowrap" data-testid={`event-row-${e.id}`}>
                <div className="text-center shrink-0">
                  <div className="text-4xl md:text-5xl font-bold leading-none">{day}</div>
                  <div className={`text-[10px] uppercase tracking-wider mt-1 ${c.contrast === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>{month}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base md:text-lg">{e.title}</h3>
                  <p className={`text-sm ${c.contrast === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {e.start_time}{e.end_time ? ` – ${e.end_time}` : ''}{e.location ? ` · ${e.location}` : ''}
                  </p>
                </div>
                <Link to={`/my-account/event/${e.id}`} className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium transition-colors" style={{ backgroundColor: c.contrast === 'light' ? '#FFFFFF' : '#111827', color: c.contrast === 'light' ? '#111827' : '#FFFFFF' }}>View <ArrowRight className="w-3 h-3" /></Link>
              </li>
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
    const API = process.env.REACT_APP_BACKEND_URL;
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

// CSS keyframe (injected once)
if (typeof document !== 'undefined' && !document.getElementById('aurex-keyframes')) {
  const style = document.createElement('style');
  style.id = 'aurex-keyframes';
  style.textContent = `@keyframes aurex-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`;
  document.head.appendChild(style);
}
