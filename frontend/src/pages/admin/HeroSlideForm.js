import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, publicAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUpload from '../../components/ImageUpload';
import HeroCanvasEditor from '../../components/HeroCanvasEditor';

const effectOptions = ['top', 'right', 'bottom', 'left'];

const defaultSlide = {
  date_start: '', date_end: '',
  title: '', subtitle: '', description: '',
  button_text: '', button_url: '', window_open: 'same',
  slide_type: 'photo', video_embed: '', photo: '',
  background: '',
  title_effect: 'top', subtitle_effect: 'right', description_effect: 'bottom',
  button_effect: 'left', media_effect: 'right',
  title_x: 100, title_y: 50,
  subtitle_x: 100, subtitle_y: 80,
  description_x: 100, description_y: 120,
  button_x: 100, button_y: 180,
  media_x: 400, media_y: 50,
  transition: 'fade', slot_amount: 8, master_speed: 700,
  delay: 9400, speed_per_layer: 400,
  title_start: 1500, subtitle_start: 2000, description_start: 2500,
  button_start: 3000, media_start: 1000,
  assigned_pages: [],
};

const quillCls = "[&_.ql-toolbar]:!bg-slate-50 [&_.ql-toolbar]:!border-slate-200 [&_.ql-container]:!border-slate-200 [&_.ql-editor]:!min-h-[80px]";

export default function HeroSlideForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState({ ...defaultSlide });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sitePages, setSitePages] = useState([]);

  useEffect(() => {
    publicAPI.getSitePages().then(r => setSitePages(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      adminAPI.getHeroSlide(id).then(r => {
        setForm({ ...defaultSlide, ...r.data });
      }).catch(() => { toast.error('Slide not found'); navigate('/admin/hero'); })
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));
  const setNum = (field) => (e) => setForm(p => ({ ...p, [field]: parseInt(e.target.value) || 0 }));

  const handleCanvasChange = useCallback((layerId, x, y) => {
    setForm(p => ({ ...p, [`${layerId}_x`]: x, [`${layerId}_y`]: y }));
  }, []);

  const handleSave = async () => {
    if (!form.title.trim() && !form.subtitle.trim()) { toast.error('Title or Subtitle is required'); return; }
    setSaving(true);
    try {
      if (isEdit) { await adminAPI.updateHeroSlide(id, form); toast.success('Slide updated!'); }
      else { await adminAPI.createHeroSlide(form); toast.success('Slide created!'); }
      navigate('/admin/hero');
    } catch (e) { toast.error(e.response?.data?.detail || 'Error saving'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[#0D9488] animate-spin" /></div>;

  const sectionCls = "bg-white border border-slate-100 rounded-sm p-5 mb-5";
  const sectionTitle = "text-sm font-semibold text-[#1a2332] mb-4 pb-2 border-b border-slate-100";
  const selectCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[#0D9488]/50";

  const canvasCoords = {
    title_x: form.title_x, title_y: form.title_y,
    subtitle_x: form.subtitle_x, subtitle_y: form.subtitle_y,
    description_x: form.description_x, description_y: form.description_y,
    button_x: form.button_x, button_y: form.button_y,
    media_x: form.media_x, media_y: form.media_y,
  };

  return (
    <div data-testid="hero-slide-form">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/hero')} className="text-slate-400 hover:text-[#1a2332]"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>{isEdit ? 'Edit' : 'Add'} Hero Slide</h1>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-[#0D9488] text-white px-5 py-2 rounded-sm text-sm font-medium hover:bg-[#0D9488]/80 flex items-center gap-2 disabled:opacity-50"
          data-testid="save-slide-btn">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isEdit ? 'Update' : 'Create'} Slide
        </button>
      </div>

      {/* Timer */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Timer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">Date Start</Label>
            <input type="datetime-local" value={form.date_start} onChange={set('date_start')} className={`mt-1 ${selectCls}`} data-testid="slide-date-start" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Date End</Label>
            <input type="datetime-local" value={form.date_end} onChange={set('date_end')} className={`mt-1 ${selectCls}`} data-testid="slide-date-end" />
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Text Content</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500 mb-2 block">Title</Label>
            <div className={quillCls}><RichTextEditor value={form.title} onChange={v => setForm(p => ({...p, title: v}))} placeholder="Slide title..." /></div>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-2 block">Subtitle</Label>
            <div className={quillCls}><RichTextEditor value={form.subtitle} onChange={v => setForm(p => ({...p, subtitle: v}))} placeholder="Slide subtitle..." /></div>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-2 block">Description</Label>
            <div className={quillCls}><RichTextEditor value={form.description} onChange={v => setForm(p => ({...p, description: v}))} placeholder="Slide description..." /></div>
          </div>
        </div>
      </div>

      {/* Links and Navigation */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Links and Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-slate-500">Text Button URL</Label>
            <Input value={form.button_text} onChange={set('button_text')} className="mt-1" placeholder="e.g. Learn More" data-testid="slide-btn-text" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">URL</Label>
            <Input value={form.button_url} onChange={set('button_url')} className="mt-1" placeholder="https://..." data-testid="slide-btn-url" />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Window Open</Label>
            <select value={form.window_open} onChange={set('window_open')} className={`mt-1 ${selectCls}`} data-testid="slide-window-open">
              <option value="same">Same window</option>
              <option value="new">New window</option>
            </select>
          </div>
        </div>
      </div>

      {/* Slide Type */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Slide Type</h2>
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="slide_type" value="photo" checked={form.slide_type === 'photo'}
              onChange={() => setForm(p => ({...p, slide_type: 'photo'}))} className="accent-[#0D9488]" data-testid="slide-type-photo" />
            <span className="text-sm text-slate-600">Photo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="slide_type" value="video" checked={form.slide_type === 'video'}
              onChange={() => setForm(p => ({...p, slide_type: 'video'}))} className="accent-[#0D9488]" data-testid="slide-type-video" />
            <span className="text-sm text-slate-600">Video</span>
          </label>
        </div>
        {form.slide_type === 'video' ? (
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Video (paste iframe / YouTube embed code)</Label>
            <textarea value={form.video_embed} onChange={set('video_embed')} rows={4}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm font-mono"
              placeholder='<iframe src="https://youtube.com/embed/..." ...></iframe>'
              data-testid="slide-video-embed" />
          </div>
        ) : (
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Photo</Label>
            <ImageUpload value={form.photo} onChange={v => setForm(p => ({...p, photo: v}))} className="mt-1" />
          </div>
        )}
      </div>

      {/* Background */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Background</h2>
        <Label className="text-xs text-slate-500 mb-1 block">Background Image</Label>
        <ImageUpload value={form.background} onChange={v => setForm(p => ({...p, background: v}))} className="mt-1" />
      </div>

      {/* Layer Animation Effects */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Layer Animation Effects</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { field: 'title_effect', label: 'Title Effect' },
            { field: 'subtitle_effect', label: 'Subtitle Effect' },
            { field: 'description_effect', label: 'Description Effect' },
            { field: 'button_effect', label: 'Button URL Effect' },
            { field: 'media_effect', label: 'Video or Photo Effect' },
          ].map(e => (
            <div key={e.field}>
              <Label className="text-xs text-slate-500">{e.label}</Label>
              <select value={form[e.field]} onChange={set(e.field)} className={`mt-1 ${selectCls}`} data-testid={`slide-${e.field}`}>
                {effectOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* X/Y Positioning — Visual Drag-and-Drop Canvas */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Layer Positioning</h2>
        <p className="text-xs text-slate-400 mb-4">Drag each layer to position it on the slide canvas (700 x 300). Coordinates are saved automatically.</p>
        <HeroCanvasEditor coords={canvasCoords} onChange={handleCanvasChange} backgroundImage={form.background} />
      </div>

      {/* Page Assignment */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Page Assignment</h2>
        <p className="text-xs text-slate-400 mb-4">Select which pages this slide should appear on. If none selected, the slide won't display on any page.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sitePages.map(pg => {
            const checked = (form.assigned_pages || []).includes(pg.id);
            return (
              <label key={pg.id} className={`flex items-center gap-2.5 p-2.5 rounded-sm border cursor-pointer transition-colors ${checked ? 'bg-[#0D9488]/5 border-[#0D9488]/30' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                data-testid={`page-assign-${pg.id}`}>
                <Checkbox checked={checked} onCheckedChange={(v) => {
                  setForm(p => {
                    const cur = p.assigned_pages || [];
                    return { ...p, assigned_pages: v ? [...cur, pg.id] : cur.filter(x => x !== pg.id) };
                  });
                }} />
                <div>
                  <span className="text-sm font-medium text-[#1a2332]">{pg.title}</span>
                  <span className="block text-xs text-slate-400 font-mono">{pg.url}</span>
                </div>
              </label>
            );
          })}
        </div>
        {sitePages.length === 0 && <p className="text-xs text-slate-400">Loading pages...</p>}
      </div>

      {/* Revolution Slider Parameters */}
      <div className={sectionCls}>
        <h2 className={sectionTitle}>Revolution Slider Parameters</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div><Label className="text-xs text-slate-500">Transition</Label><Input value={form.transition} onChange={set('transition')} className="mt-1" data-testid="slide-transition" /></div>
          <div><Label className="text-xs text-slate-500">Slot Amount</Label><Input type="number" value={form.slot_amount} onChange={setNum('slot_amount')} className="mt-1" data-testid="slide-slot-amount" /></div>
          <div><Label className="text-xs text-slate-500">Master Speed (ms)</Label><Input type="number" value={form.master_speed} onChange={setNum('master_speed')} className="mt-1" data-testid="slide-master-speed" /></div>
          <div><Label className="text-xs text-slate-500">Delay (ms)</Label><Input type="number" value={form.delay} onChange={setNum('delay')} className="mt-1" data-testid="slide-delay" /></div>
          <div><Label className="text-xs text-slate-500">Speed/Layer (ms)</Label><Input type="number" value={form.speed_per_layer} onChange={setNum('speed_per_layer')} className="mt-1" data-testid="slide-speed-layer" /></div>
        </div>
        <h3 className="text-xs font-medium text-slate-500 mb-3">Data Start per Layer (ms)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div><Label className="text-xs text-slate-500">Title Start</Label><Input type="number" value={form.title_start} onChange={setNum('title_start')} className="mt-1" data-testid="slide-title-start" /></div>
          <div><Label className="text-xs text-slate-500">Subtitle Start</Label><Input type="number" value={form.subtitle_start} onChange={setNum('subtitle_start')} className="mt-1" data-testid="slide-subtitle-start" /></div>
          <div><Label className="text-xs text-slate-500">Description Start</Label><Input type="number" value={form.description_start} onChange={setNum('description_start')} className="mt-1" data-testid="slide-description-start" /></div>
          <div><Label className="text-xs text-slate-500">Button Start</Label><Input type="number" value={form.button_start} onChange={setNum('button_start')} className="mt-1" data-testid="slide-button-start" /></div>
          <div><Label className="text-xs text-slate-500">Video/Photo Start</Label><Input type="number" value={form.media_start} onChange={setNum('media_start')} className="mt-1" data-testid="slide-media-start" /></div>
        </div>
      </div>

      {/* Bottom Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-[#0D9488] text-white font-semibold rounded-sm flex items-center justify-center gap-2 hover:bg-[#0D9488]/80 disabled:opacity-50"
        data-testid="save-slide-btn-bottom">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : `${isEdit ? 'Update' : 'Create'} Slide`}
      </button>
    </div>
  );
}
