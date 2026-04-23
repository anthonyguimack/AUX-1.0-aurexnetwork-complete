import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, ArrowUp, ArrowDown, Quote } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import LocalizedField from '../../components/admin/LocalizedField';
import { adminText } from '../../lib/i18n';

const API = process.env.REACT_APP_BACKEND_URL;
const resolveSrc = (v) => v ? (v.startsWith('/api') ? `${API}${v}` : v) : null;

const emptyItem = { name: '', title: '', content: '', image: '', order: 0 };

export default function TestimonialsManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getTestimonials().then(r => {
    const data = (r.data || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    setItems(data);
  }).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) await adminAPI.updateTestimonial(editing.id, editing);
      else await adminAPI.createTestimonial(editing);
      toast.success('Saved'); setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await adminAPI.deleteTestimonial(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
  };

  const moveOrder = async (item, direction) => {
    const newOrder = (item.order || 0) + direction;
    await adminAPI.updateTestimonial(item.id, { ...item, order: newOrder });
    load();
  };

  return (
    <div data-testid="testimonials-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Legends & Testimonials</h1>
        <button onClick={() => { setEditing({ ...emptyItem, order: items.length }); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-testimonial-btn">
          <Plus className="w-4 h-4" /> Add Legend
        </button>
      </div>

      <div className="bg-white rounded-sm border border-slate-200">
        <div className="grid gap-3 p-4">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors" data-testid={`testimonial-row-${item.id}`}>
              <div className="flex flex-col items-center gap-0.5">
                <button onClick={() => moveOrder(item, -1)} disabled={idx === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                <span className="text-xs text-slate-400">{item.order || 0}</span>
                <button onClick={() => moveOrder(item, 1)} disabled={idx === items.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              {item.image && (
                <img src={resolveSrc(item.image)} alt={adminText(item.name)} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
              )}
              {!item.image && (
                <div className="w-12 h-12 rounded-full bg-[#1a2332]/10 flex items-center justify-center">
                  <Quote className="w-5 h-5 text-[#1a2332]/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#1a2332]">{adminText(item.name)}</p>
                <p className="text-xs text-slate-500">{adminText(item.title)}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{adminText(item.content)?.substring(0, 80)}...</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing({ ...item }); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]" data-testid={`edit-testimonial-${item.id}`}><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500" data-testid={`delete-testimonial-${item.id}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-12 text-center text-slate-400 text-sm">No legends or testimonials yet.</div>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto" data-testid="testimonial-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.id ? 'Edit' : 'New'} Legend / Testimonial</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-slate-500">Author Photo</Label>
                <ImageUpload value={editing.image || ''} onChange={v => setEditing({ ...editing, image: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Author Name</Label>
                  <LocalizedField value={editing.name} onChange={v => setEditing({ ...editing, name: v })} render={({ value, onChange }) => (
                    <Input value={value || ''} onChange={e => onChange(e.target.value)} className="mt-1" data-testid="testimonial-name-input" />
                  )} />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Title / Role</Label>
                  <LocalizedField value={editing.title} onChange={v => setEditing({ ...editing, title: v })} render={({ value, onChange }) => (
                    <Input value={value || ''} onChange={e => onChange(e.target.value)} className="mt-1" data-testid="testimonial-title-input" />
                  )} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Quote / Testimonial</Label>
                <LocalizedField value={editing.content} onChange={v => setEditing({ ...editing, content: v })} render={({ value, onChange }) => (
                  <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" placeholder="Their words..." data-testid="testimonial-content-input" />
                )} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Display Order</Label>
                <Input type="number" value={editing.order || 0} onChange={e => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })} className="mt-1 w-24" />
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50" data-testid="testimonial-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
