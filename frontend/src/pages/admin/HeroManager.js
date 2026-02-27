import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

export default function HeroManager() {
  const [data, setData] = useState({ subtitle: '', title: '', description: '', button_text: '', button_link: '', background_image: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { adminAPI.getHero().then(r => { if (r.data?.title) setData(r.data); }).catch(console.error); }, []);

  const handleSave = async () => {
    setLoading(true);
    try { await adminAPI.updateHero(data); toast.success('Hero updated!'); } catch { toast.error('Failed to update'); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="hero-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Hero Manager</h1>
        <button onClick={handleSave} disabled={loading} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#0D9488]/80 flex items-center gap-2 disabled:opacity-50" data-testid="hero-save-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
        </button>
      </div>
      <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
        <div>
          <Label>Subtitle</Label>
          <Input value={data.subtitle} onChange={e => setData({ ...data, subtitle: e.target.value })} className="mt-1" data-testid="hero-subtitle-input" />
        </div>
        <div>
          <Label>Title (use \n for line breaks)</Label>
          <Input value={data.title} onChange={e => setData({ ...data, title: e.target.value })} className="mt-1" data-testid="hero-title-input" />
        </div>
        <div>
          <Label>Description</Label>
          <textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" data-testid="hero-desc-input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Button Text</Label><Input value={data.button_text} onChange={e => setData({ ...data, button_text: e.target.value })} className="mt-1" data-testid="hero-btn-text-input" /></div>
          <div><Label>Button Link</Label><Input value={data.button_link} onChange={e => setData({ ...data, button_link: e.target.value })} className="mt-1" data-testid="hero-btn-link-input" /></div>
        </div>
        <div>
          <Label>Background Image</Label>
          <ImageUpload value={data.background_image} onChange={val => setData({ ...data, background_image: val })} className="mt-1" />
        </div>
      </div>
    </div>
  );
}
