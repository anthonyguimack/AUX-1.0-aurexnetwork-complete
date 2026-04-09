import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import RichTextEditor from '../../components/RichTextEditor';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const resolveSrc = (v) => v ? (v.startsWith('/api') ? `${API_URL}${v}` : v) : '';

const defaultSlide = { title: '', subtitle: '', description: '', background: '', video_url: '', button1_text: '', button2_text: '', button3_text: '', order: 0 };

export default function LandingHeroManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...defaultSlide });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminAPI.getLandingHeroSlides().then(r => setSlides(r.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => { setForm({ ...defaultSlide, order: slides.length }); setEditing('new'); };
  const openEdit = (s) => { setForm({ ...s }); setEditing(s.id); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === 'new') {
        await adminAPI.createLandingHeroSlide(form);
        toast.success('Hero slide created');
      } else {
        await adminAPI.updateLandingHeroSlide(editing, form);
        toast.success('Hero slide updated');
      }
      setEditing(null);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slide?')) return;
    await adminAPI.deleteLandingHeroSlide(id);
    toast.success('Deleted');
    load();
  };

  const u = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div data-testid="landing-hero-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}>Landing Page Hero</h1>
        <button onClick={openNew} className="text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 hover:opacity-80" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="add-lp-hero-btn">
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--ad-accent, #0D9488)' }} /></div>
      ) : slides.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-sm p-12 text-center">
          <p className="text-slate-400 text-sm">No landing hero slides yet.</p>
          <button onClick={openNew} className="mt-3 text-sm hover:underline" style={{ color: 'var(--ad-accent, #0D9488)' }}>Create your first slide</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {slides.map(s => (
            <div key={s.id} className="bg-white border border-slate-100 rounded-sm p-4 flex items-center gap-4" data-testid={`lp-hero-slide-${s.id}`}>
              <div className="w-24 h-16 rounded-sm bg-slate-100 overflow-hidden flex-shrink-0">
                {s.background ? <img src={resolveSrc(s.background)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-300" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--ad-heading, #1a2332)' }} dangerouslySetInnerHTML={{ __html: s.title || '<em>No title</em>' }} />
                {s.video_url && <p className="text-xs text-slate-400 mt-0.5 truncate">Video: {s.video_url}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(s)} className="p-2 rounded hover:bg-slate-50" data-testid={`edit-lp-hero-${s.id}`}><Edit2 className="w-4 h-4 text-slate-400" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded hover:bg-red-50" data-testid={`delete-lp-hero-${s.id}`}><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === 'new' ? 'New Hero Slide' : 'Edit Hero Slide'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Title</Label>
              <RichTextEditor value={form.title || ''} onChange={val => u('title', val)} />
            </div>
            <div><Label>Subtitle</Label>
              <RichTextEditor value={form.subtitle || ''} onChange={val => u('subtitle', val)} />
            </div>
            <div><Label>Description</Label>
              <RichTextEditor value={form.description || ''} onChange={val => u('description', val)} />
            </div>
            <div><Label>Background Image</Label>
              <ImageUpload value={form.background || ''} onChange={v => u('background', v)} />
            </div>
            <div><Label>Video URL (YouTube, Vimeo, or embed URL)</Label>
              <Input value={form.video_url || ''} onChange={e => u('video_url', e.target.value)} className="mt-1" placeholder="https://youtube.com/watch?v=..." data-testid="lp-hero-video-url" />
            </div>
            <hr className="border-slate-200" />
            <h3 className="font-semibold text-sm text-slate-600">CTA Buttons</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Button 1 Text</Label><Input value={form.button1_text || ''} onChange={e => u('button1_text', e.target.value)} className="mt-1" placeholder="More Information" data-testid="lp-hero-btn1" /></div>
              <div><Label>Button 2 Text</Label><Input value={form.button2_text || ''} onChange={e => u('button2_text', e.target.value)} className="mt-1" placeholder="Membership Lounge" data-testid="lp-hero-btn2" /></div>
              <div><Label>Button 3 Text</Label><Input value={form.button3_text || ''} onChange={e => u('button3_text', e.target.value)} className="mt-1" placeholder="Add to Waiting List" data-testid="lp-hero-btn3" /></div>
            </div>
            <div><Label>Display Order</Label><Input type="number" value={form.order || 0} onChange={e => u('order', parseInt(e.target.value) || 0)} className="mt-1 w-24" data-testid="lp-hero-order" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-slate-200 rounded-sm text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:opacity-80" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="save-lp-hero-btn">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
