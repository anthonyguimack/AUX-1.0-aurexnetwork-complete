import React, { useState, useEffect, useMemo } from 'react';
import { publicAPI } from '../lib/api';
import { Dialog, DialogContent } from '../components/ui/dialog';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    publicAPI.getGallery().then(r => setItems(r.data)).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    return items.filter(i => i.category === tab);
  }, [items, tab]);

  return (
    <div data-testid="gallery-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="flex justify-center gap-3 mb-10">
          {['all', 'professional', 'personal'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-6 py-2.5 rounded-sm text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-[#1a2332] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0D9488]'}`} data-testid={`gallery-page-tab-${t}`}>{t}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(item => (
            <div key={item.id} className="relative group cursor-pointer rounded-sm overflow-hidden h-[300px]" onClick={() => setSelected(item)} data-testid={`gallery-page-item-${item.id}`}>
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-[#1a2332]/0 group-hover:bg-[#1a2332]/50 transition-all" />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a2332]/80 to-transparent">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{item.title}</h3>
                <p className="text-white/70 text-sm">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden" data-testid="gallery-detail-modal">
          {selected && (
            <div>
              <img src={selected.image} alt={selected.title} className="w-full h-[400px] object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>{selected.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{selected.summary}</p>
                <span className="inline-block mt-3 text-xs uppercase tracking-wider text-[#0D9488] font-semibold bg-[#0D9488]/10 px-3 py-1 rounded-sm">{selected.category}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
