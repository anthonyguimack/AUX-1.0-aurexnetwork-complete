import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

const emptyItem = { title: '', summary: '', image: '', category: 'professional', link: '' };

export default function GalleryManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getGallery().then(r => setItems(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) await adminAPI.updateGallery(editing.id, editing);
      else await adminAPI.createGallery(editing);
      toast.success('Saved!'); setOpen(false); load();
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await adminAPI.deleteGallery(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
  };

  return (
    <div data-testid="gallery-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Gallery Manager</h1>
        <button onClick={() => { setEditing({...emptyItem}); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Photo</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-sm border border-slate-100 overflow-hidden group">
            <div className="h-40 overflow-hidden"><img src={item.image} alt={item.title} className="w-full h-full object-cover" /></div>
            <div className="p-3">
              <h4 className="text-sm font-semibold text-[#1a2332]">{item.title}</h4>
              <p className="text-xs text-slate-400 capitalize">{item.category}</p>
              <div className="flex gap-1 mt-2">
                <button onClick={() => { setEditing({...item}); setOpen(true); }} className="p-1 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-3 h-3" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Photo</DialogTitle></DialogHeader>
          {editing && <div className="space-y-4">
            <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="mt-1" /></div>
            <div><Label>Summary</Label><textarea value={editing.summary} onChange={e => setEditing({...editing, summary: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
            <div><Label>Image URL</Label><Input value={editing.image} onChange={e => setEditing({...editing, image: e.target.value})} className="mt-1" /></div>
            <div><Label>Category</Label>
              <select value={editing.category} onChange={e => setEditing({...editing, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1">
                <option value="professional">Professional</option><option value="personal">Personal</option>
              </select>
            </div>
            <div><Label>Link (optional)</Label><Input value={editing.link || ''} onChange={e => setEditing({...editing, link: e.target.value})} className="mt-1" /></div>
            <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50">Save</button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
