import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../../lib/api';

const API = process.env.REACT_APP_BACKEND_URL;
const resolveSrc = (v) => v ? (v.startsWith('/api') ? `${API}${v}` : v) : null;

function RichTextBlock({ config }) {
  if (!config.content) return null;
  return (
    <div className="rich-text-content prose max-w-none"
      style={{ color: 'var(--color-body-text, #475569)' }}
      dangerouslySetInnerHTML={{ __html: config.content }} />
  );
}

function ImageBlock({ config }) {
  const src = resolveSrc(config.src);
  if (!src) return null;
  const img = (
    <figure>
      <img src={src} alt={config.alt || ''} className="w-full rounded-lg" data-testid="block-image" />
      {config.caption && <figcaption className="text-sm text-slate-400 mt-2 text-center">{config.caption}</figcaption>}
    </figure>
  );
  if (config.link) return <a href={config.link} target="_blank" rel="noreferrer">{img}</a>;
  return img;
}

function VideoBlock({ config }) {
  if (!config.url) return null;
  let embedUrl = config.url;
  const ytMatch = config.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = config.url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return (
    <div className="aspect-video rounded-lg overflow-hidden" data-testid="block-video">
      <iframe src={embedUrl} className="w-full h-full" allow="autoplay; fullscreen" frameBorder="0" title="Video" />
    </div>
  );
}

function ServiceListBlock() {
  const [services, setServices] = useState([]);
  useEffect(() => { publicAPI.getServices().then(r => setServices(r.data || [])).catch(() => {}); }, []);
  if (!services.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="block-service-list">
      {services.map(s => (
        <div key={s.id} className="bg-white rounded-lg border border-slate-100 p-5 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-heading, #1a2332)' }}>{s.title}</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--color-body-text, #475569)' }}>{s.short_description || s.description}</p>
          {s.price > 0 && <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-accent, #0D9488)' }}>${Number(s.price).toFixed(2)}</p>}
          <Link to={`/service/${s.id}`} className="text-sm font-medium hover:opacity-80" style={{ color: 'var(--color-accent, #0D9488)' }}>Learn more &rarr;</Link>
        </div>
      ))}
    </div>
  );
}

function GalleryBlock() {
  const [albums, setAlbums] = useState([]);
  useEffect(() => { publicAPI.getGalleryAlbums().then(r => setAlbums(r.data || [])).catch(() => {}); }, []);
  if (!albums.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="block-gallery">
      {albums.map(a => (
        <Link key={a.id} to={`/gallery/${a.id}`} className="group">
          <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
            {a.cover_image ? <img src={resolveSrc(a.cover_image)} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">No cover</div>}
          </div>
          <h3 className="mt-2 font-medium text-sm" style={{ color: 'var(--color-heading, #1a2332)' }}>{a.title}</h3>
        </Link>
      ))}
    </div>
  );
}

function ProfileCardBlock({ config }) {
  const src = resolveSrc(config.image);
  return (
    <div className="bg-white rounded-lg border border-slate-100 p-6 text-center max-w-sm mx-auto" data-testid="block-profile-card">
      {src && <img src={src} alt={config.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />}
      {config.name && <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-heading, #1a2332)' }}>{config.name}</h3>}
      {config.title && <p className="text-sm mb-3" style={{ color: 'var(--color-accent, #0D9488)' }}>{config.title}</p>}
      {config.bio && <p className="text-sm" style={{ color: 'var(--color-body-text, #475569)' }}>{config.bio}</p>}
    </div>
  );
}

function ButtonBlock({ config }) {
  const isPrimary = config.style === 'primary';
  const style = isPrimary
    ? { backgroundColor: 'var(--color-button-bg, #1a2332)', color: 'var(--color-button-text, #fff)' }
    : { border: '2px solid var(--color-button-bg, #1a2332)', color: 'var(--color-button-bg, #1a2332)' };
  const cls = `inline-block px-6 py-3 rounded-sm font-medium text-sm transition-opacity hover:opacity-80 ${isPrimary ? '' : 'bg-transparent'}`;
  if (config.open_in_new_tab) {
    return <a href={config.url} target="_blank" rel="noreferrer" className={cls} style={style} data-testid="block-button">{config.text || 'Click Here'}</a>;
  }
  return <Link to={config.url || '#'} className={cls} style={style} data-testid="block-button">{config.text || 'Click Here'}</Link>;
}

function SeparatorBlock({ config }) {
  if (config.style === 'dots') return <div className="flex justify-center gap-2 py-4">{[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent, #0D9488)' }} />)}</div>;
  if (config.style === 'space') return <div className="py-8" />;
  return <hr className="border-slate-200 my-6" />;
}

function CustomHtmlBlock({ config }) {
  if (!config.html) return null;
  return <div dangerouslySetInnerHTML={{ __html: config.html }} data-testid="block-custom-html" />;
}

export default function BlockRenderer({ block }) {
  if (!block || !block.type) return null;
  const config = block.config || {};
  switch (block.type) {
    case 'rich_text': return <RichTextBlock config={config} />;
    case 'image': return <ImageBlock config={config} />;
    case 'video': return <VideoBlock config={config} />;
    case 'service_list': return <ServiceListBlock />;
    case 'gallery': return <GalleryBlock />;
    case 'profile_card': return <ProfileCardBlock config={config} />;
    case 'button': return <ButtonBlock config={config} />;
    case 'separator': return <SeparatorBlock config={config} />;
    case 'custom_html': return <CustomHtmlBlock config={config} />;
    default: return null;
  }
}
