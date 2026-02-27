import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI, contactAPI, checkoutAPI, blogExternalAPI } from '../lib/api';
import { useSettings } from '../App';
import { toast } from 'sonner';
import {
  ArrowRight, Phone, Briefcase, TrendingUp, BarChart3, Monitor, Star,
  MapPin, BookOpen, Send, ChevronRight, Quote, Shield, Clock, ExternalLink, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const iconMap = { 'briefcase': Briefcase, 'trending-up': TrendingUp, 'bar-chart-3': BarChart3, 'monitor': Monitor };

function HeroSection({ data }) {
  if (!data?.title) return null;
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.background_image || ''})` }} />
      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, var(--color-primary, #1a2332)ee, var(--color-primary, #1a2332)99)` }} />
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-20 w-full">
        <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-4" style={{ color: 'var(--color-accent, #0D9488)' }} data-testid="hero-subtitle">{data.subtitle}</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-2xl" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="hero-title">
          {data.title?.split('\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}<span className={i > 0 ? 'italic' : ''}>{line}</span></React.Fragment>)}
        </h1>
        <p className="text-white/70 mt-6 max-w-xl text-base md:text-lg leading-relaxed" data-testid="hero-description">{data.description}</p>
        <a href={data.button_link || '#contact'} className="inline-flex items-center gap-2 mt-8 bg-white px-8 py-3 rounded-sm font-medium hover:opacity-90 transition-all text-sm" style={{ color: 'var(--color-primary, #1a2332)' }} data-testid="hero-cta-btn">
          {data.button_text || 'Get Started'} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function AboutSection({ data }) {
  if (!data?.title) return null;
  return (
    <section className="py-20 md:py-28 bg-white" id="about" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>{data.label}</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }} data-testid="about-title">{data.title}</h2>
            <p className="mt-6 leading-relaxed" style={{ color: 'var(--color-body-text, #475569)' }}>{data.description}</p>
            <div className="flex items-center gap-6 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }}><Phone className="w-4 h-4 text-white" /></div>
                <div>
                  <p className="text-xs text-slate-400">Call us anytime</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-heading, #1a2332)' }}>{data.phone}</p>
                </div>
              </div>
              {data.signature_name && (
                <div className="border-l border-slate-200 pl-6">
                  <p className="text-lg italic" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>{data.signature_name}</p>
                  <p className="text-xs text-slate-400">{data.signature_title}</p>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <img src={data.image} alt="About" className="rounded-sm w-full object-cover h-[400px]" />
            {data.stats?.length > 0 && (
              <div className="absolute bottom-4 left-4 text-white px-6 py-4 rounded-sm" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-accent, #0D9488)' }}>{data.stats[0].value}</p>
                <p className="text-xs text-white/70">{data.stats[0].label}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ services }) {
  const [tab, setTab] = useState('all');
  const filtered = useMemo(() => tab === 'all' ? services : services.filter(s => s.type === tab), [services, tab]);
  const handleBuy = async (service) => {
    try {
      const res = await checkoutAPI.create(service.id, window.location.origin);
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) { toast.error(err.response?.data?.detail || 'Checkout failed'); }
  };
  if (!services?.length) return null;
  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC]" id="services" data-testid="services-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>OUR LATEST SERVICES</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>Service We Provide</h2>
        </div>
        <div className="flex justify-center gap-3 mb-10">
          {['all', 'service', 'product'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2 rounded-sm text-sm font-medium transition-colors border"
              style={tab === t ? { backgroundColor: 'var(--color-tab-active-bg, #1a2332)', color: 'var(--color-tab-active-text, #fff)', borderColor: 'transparent' } : { backgroundColor: '#fff', color: 'var(--color-body-text, #64748B)', borderColor: '#e2e8f0' }}
              data-testid={`services-tab-${t}`}
            >{t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}</button>
          ))}
        </div>
        <div className="space-y-4">
          {filtered.map(service => {
            const IconComp = iconMap[service.icon] || Briefcase;
            return (
              <div key={service.id} className="bg-white p-6 md:p-8 rounded-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-lg transition-all group" data-testid={`service-card-${service.id}`}>
                <div className="w-14 h-14 rounded-sm bg-[#F8FAFC] flex items-center justify-center border border-slate-100">
                  <IconComp className="w-6 h-6" style={{ color: 'var(--color-icon, #0D9488)' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>{service.title}</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-body-text, #475569)' }}>{service.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold" style={{ color: 'var(--color-heading, #1a2332)' }}>${service.price?.toFixed(2)}</span>
                  <button onClick={() => handleBuy(service)} className="p-3 rounded-sm transition-colors" style={{ backgroundColor: 'var(--color-button-bg, #1a2332)', color: 'var(--color-button-text, #fff)' }} data-testid={`buy-service-${service.id}`}>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NewsSection({ posts }) {
  if (!posts?.length) return null;
  return (
    <section className="py-20 md:py-28 bg-white" data-testid="news-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>LATEST NEWS</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>Company News</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.slice(0, 3).map(post => (
            <Link key={post.id} to={`/news/${post.slug}`} className="group bg-white rounded-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all" data-testid={`news-card-${post.slug}`}>
              <div className="h-48 overflow-hidden"><img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
              <div className="p-6">
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-accent, #0D9488)' }}>{post.category}</span>
                <h3 className="text-lg font-semibold mt-2 group-hover:opacity-80 transition-colors" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>{post.title}</h3>
                <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-body-text, #475569)' }}>{post.summary}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{post.author}</span>
                  <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-link, #0D9488)' }}>Read More <ChevronRight className="w-3 h-3" /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/news" className="inline-flex items-center gap-2 border px-6 py-2.5 rounded-sm text-sm font-medium transition-colors hover:opacity-80" style={{ borderColor: 'var(--color-primary, #1a2332)', color: 'var(--color-primary, #1a2332)' }} data-testid="news-view-all-btn">
            View All News <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ExternalBlogSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    blogExternalAPI.getLatest()
      .then(r => { setPosts(r.data.posts || []); if (r.data.error) setError(r.data.error); })
      .catch(() => setError('Blog unavailable'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC]" data-testid="blog-external-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>INSIGHTS & ARTICLES</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>From Our Blog</h2>
        </div>
        {loading && <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent, #0D9488)' }} /></div>}
        {error && !posts.length && <p className="text-center text-slate-400 text-sm">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, idx) => (
            <a key={idx} href={post.url} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all" data-testid={`blog-ext-card-${idx}`}>
              <div className="h-48 overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold group-hover:opacity-80 transition-colors" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>{post.title}</h3>
                <p className="text-sm mt-2 line-clamp-3" style={{ color: 'var(--color-body-text, #475569)' }}>{post.summary}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-xs font-medium" style={{ color: 'var(--color-link, #0D9488)' }}>
                  Read More <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReadingListSection({ books }) {
  if (!books?.length) return null;
  const featured = books.find(b => b.featured) || books[0];
  return (
    <section className="py-20 md:py-28 bg-white" data-testid="reading-list-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>RECOMMENDED READING</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>Reading List</h2>
        </div>
        {featured && (
          <div className="flex flex-col md:flex-row items-center gap-10 bg-[#F8FAFC] p-8 md:p-12 rounded-sm border border-slate-100">
            <img src={featured.image} alt={featured.title} className="w-40 h-56 object-cover rounded-sm shadow-lg" />
            <div>
              <h3 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>{featured.title}</h3>
              <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-accent, #0D9488)' }}>by {featured.author}</p>
              <p className="mt-4 leading-relaxed" style={{ color: 'var(--color-body-text, #475569)' }}>{featured.description}</p>
              <Link to="/reading-list" className="inline-flex items-center gap-2 mt-6 font-medium text-sm hover:underline" style={{ color: 'var(--color-link, #0D9488)' }}>
                <BookOpen className="w-4 h-4" /> View Full Reading List <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MapSection({ maps, locations }) {
  if (!locations?.length) return null;
  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC]" id="map" data-testid="map-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>OUR PRESENCE</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>Global Reach</h2>
        </div>
        <div className="h-[450px] rounded-sm overflow-hidden border border-slate-200" data-testid="map-container">
          <MapContainer center={[30, 0]} zoom={2} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
            {locations.map(loc => (
              <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                <Popup>
                  <strong>{loc.name}</strong><br />{loc.description}
                  {loc.link && <><br /><a href={loc.link} target="_blank" rel="noreferrer" style={{ color: '#0D9488' }}>More info</a></>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {maps?.length > 0 && (
          <div className="text-center mt-6">
            <Link to={`/map/${maps[0].slug}`} className="inline-flex items-center gap-2 font-medium text-sm hover:underline" style={{ color: 'var(--color-link, #0D9488)' }}>
              <MapPin className="w-4 h-4" /> View Map Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function PortfolioSection({ items }) {
  const [filter, setFilter] = useState('all');
  const allTags = useMemo(() => [...new Set(items.flatMap(i => i.tags || []))], [items]);
  const filtered = useMemo(() => filter === 'all' ? items : items.filter(i => i.tags?.includes(filter)), [items, filter]);
  if (!items?.length) return null;
  return (
    <section className="py-20 md:py-28 bg-white" data-testid="portfolio-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>OUR WORK</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>Featured Projects</h2>
        </div>
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          <button onClick={() => setFilter('all')} className="px-5 py-2 rounded-sm text-sm font-medium transition-colors border" style={filter === 'all' ? { backgroundColor: 'var(--color-tab-active-bg, #1a2332)', color: 'var(--color-tab-active-text, #fff)', borderColor: 'transparent' } : { borderColor: '#e2e8f0' }}>All</button>
          {allTags.map(tag => <button key={tag} onClick={() => setFilter(tag)} className="px-5 py-2 rounded-sm text-sm font-medium capitalize transition-colors border" style={filter === tag ? { backgroundColor: 'var(--color-tab-active-bg, #1a2332)', color: 'var(--color-tab-active-text, #fff)', borderColor: 'transparent' } : { borderColor: '#e2e8f0' }}>{tag}</button>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(item => (
            <div key={item.id} className="relative group rounded-sm overflow-hidden h-[280px]">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{item.title}</h3>
                <p className="text-white/60 text-sm mt-1">{item.tags?.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection({ items }) {
  const [tab, setTab] = useState('all');
  const filtered = useMemo(() => tab === 'all' ? items : items.filter(i => i.category === tab), [items, tab]);
  if (!items?.length) return null;
  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC]" data-testid="gallery-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>PHOTO GALLERY</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>Our Gallery</h2>
        </div>
        <div className="flex justify-center gap-3 mb-10">
          {['all', 'professional', 'personal'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-5 py-2 rounded-sm text-sm font-medium capitalize transition-colors border" style={tab === t ? { backgroundColor: 'var(--color-tab-active-bg, #1a2332)', color: 'var(--color-tab-active-text, #fff)', borderColor: 'transparent' } : { borderColor: '#e2e8f0' }}>{t}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.slice(0, 6).map(item => (
            <div key={item.id} className="relative group rounded-sm overflow-hidden h-[240px]">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors" />
              <div className="absolute bottom-0 left-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-white/70 text-sm">{item.summary}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/gallery" className="inline-flex items-center gap-2 border px-6 py-2.5 rounded-sm text-sm font-medium transition-colors" style={{ borderColor: 'var(--color-primary, #1a2332)', color: 'var(--color-primary, #1a2332)' }}>View Full Gallery <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ items }) {
  if (!items?.length) return null;
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: 'var(--color-primary, #1a2332)' }} data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>TESTIMONIALS</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>What Our Clients Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 backdrop-blur-sm p-8 rounded-sm border border-white/10">
              <Quote className="w-8 h-8 mb-4" style={{ color: 'var(--color-accent, #0D9488)' }} />
              <p className="text-white/80 text-sm leading-relaxed">{item.content}</p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                <div><p className="text-white font-semibold text-sm">{item.name}</p><p className="text-white/50 text-xs">{item.title}</p></div>
                <div className="ml-auto flex gap-0.5">{Array.from({ length: item.rating || 5 }).map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await contactAPI.submit(form); toast.success('Message sent successfully!'); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }
    catch { toast.error('Failed to send message'); }
    finally { setLoading(false); }
  };
  return (
    <section className="py-20 md:py-28 bg-white" id="contact" data-testid="contact-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>BUSINESS CONSULTANCY</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-heading, #1a2332)' }}>We know how to manage business globally</h2>
            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent, #0D9488) 10%, transparent)' }}><Shield className="w-5 h-5" style={{ color: 'var(--color-icon, #0D9488)' }} /></div>
                <div><h4 className="font-semibold" style={{ color: 'var(--color-heading, #1a2332)' }}>Best Business Consulting</h4><p className="text-sm mt-1" style={{ color: 'var(--color-body-text, #475569)' }}>We specialize in helping businesses unlock their full potential.</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent, #0D9488) 10%, transparent)' }}><Clock className="w-5 h-5" style={{ color: 'var(--color-icon, #0D9488)' }} /></div>
                <div><h4 className="font-semibold" style={{ color: 'var(--color-heading, #1a2332)' }}>24/7 Customer Support</h4><p className="text-sm mt-1" style={{ color: 'var(--color-body-text, #475569)' }}>Our dedicated support team is available anytime.</p></div>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[var(--color-accent,#0D9488)]" data-testid="contact-name-input" />
              <input type="email" placeholder="Your Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[var(--color-accent,#0D9488)]" data-testid="contact-email-input" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none" data-testid="contact-phone-input" />
              <input type="text" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none" data-testid="contact-subject-input" />
            </div>
            <textarea placeholder="Your Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none resize-none" data-testid="contact-message-input" />
            <button type="submit" disabled={loading} className="px-8 py-3 rounded-sm font-medium transition-colors flex items-center gap-2 text-sm disabled:opacity-50" style={{ backgroundColor: 'var(--color-button-bg, #1a2332)', color: 'var(--color-button-text, #fff)' }} data-testid="contact-submit-btn">
              <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [hero, setHero] = useState({});
  const [about, setAbout] = useState({});
  const [services, setServices] = useState([]);
  const [posts, setPosts] = useState([]);
  const [books, setBooks] = useState([]);
  const [maps, setMaps] = useState([]);
  const [locations, setLocations] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [sections, setSections] = useState({});
  const [sectionOrder, setSectionOrder] = useState([]);

  useEffect(() => {
    Promise.all([
      publicAPI.getHero(), publicAPI.getAbout(), publicAPI.getServices(),
      publicAPI.getBlog(1, 3), publicAPI.getBooks(), publicAPI.getMaps(),
      publicAPI.getMapLocations(), publicAPI.getGallery(), publicAPI.getPortfolio(),
      publicAPI.getTestimonials(), publicAPI.getSections()
    ]).then(([h, a, s, b, bk, m, l, g, p, t, sec]) => {
      setHero(h.data); setAbout(a.data); setServices(s.data);
      setPosts(b.data.posts || []); setBooks(bk.data); setMaps(m.data);
      setLocations(l.data); setGallery(g.data); setPortfolio(p.data);
      setTestimonials(t.data);
      setSections(sec.data?.sections || sec.data || {});
      setSectionOrder(sec.data?.section_order || ["hero", "about", "services", "news", "blog", "reading_list", "map", "portfolio", "gallery", "testimonials", "contact"]);
    }).catch(console.error);
  }, []);

  const isOn = (key) => !sections[key] || sections[key].enabled !== false;

  const sectionComponents = {
    hero: () => isOn('hero') && <HeroSection data={hero} />,
    about: () => isOn('about') && <AboutSection data={about} />,
    services: () => isOn('services') && <ServicesSection services={services} />,
    news: () => isOn('news') && <NewsSection posts={posts} />,
    blog: () => isOn('blog') && <ExternalBlogSection />,
    reading_list: () => isOn('reading_list') && <ReadingListSection books={books} />,
    map: () => isOn('map') && <MapSection maps={maps} locations={locations} />,
    portfolio: () => isOn('portfolio') && <PortfolioSection items={portfolio} />,
    gallery: () => isOn('gallery') && <GallerySection items={gallery} />,
    testimonials: () => isOn('testimonials') && <TestimonialsSection items={testimonials} />,
    contact: () => isOn('contact') && <ContactSection />,
  };

  return (
    <main data-testid="home-page">
      {sectionOrder.map(key => {
        const render = sectionComponents[key];
        return render ? <React.Fragment key={key}>{render()}</React.Fragment> : null;
      })}
    </main>
  );
}
