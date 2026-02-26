import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Star } from 'lucide-react';

const emptyItem = { name: '', title: '', content: '', image: '', rating: 5 };

export default function TestimonialsManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getTestimonials().then(r => setItems(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) await adminAPI.updateTestimonial(editing.id, editing);
      else await adminAPI.createTestimonial(editing);
      toast.success('Saved!'); setOpen(false); load();
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  return (
    <div data-testid="testimonials-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Testimonials Manager</h1>
        <button onClick={() => { setEditing({...emptyItem}); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Review</button>
      </div>
      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50"><th className="text-left p-3">Photo</th><th className="text-left p-3">Name</th><th className="text-left p-3">Title</th><th className="text-left p-3">Rating</th><th className="text-right p-3">Actions</th></tr></thead>
          <tbody>{items.map(item => (
            <tr key={item.id} className="border-b border-slate-50">
              <td className="p-3"><img src={item.image} alt="" className="w-10 h-10 rounded-full object-cover" /></td>
              <td className="p-3 font-medium">{item.name}</td>
              <td className="p-3 text-slate-500">{item.title}</td>
              <td className="p-3"><div className="flex gap-0.5">{Array.from({length: item.rating || 5}).map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}</div></td>
              <td className="p-3 text-right">
                <button onClick={() => { setEditing({...item}); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-4 h-4" /></button>
                <button onClick={async () => { if (window.confirm('Delete?')) { await adminAPI.deleteTestimonial(item.id); load(); }}} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Testimonial</DialogTitle></DialogHeader>
          {editing && <div className="space-y-4">
            <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="mt-1" /></div>
            <div><Label>Title/Company</Label><Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="mt-1" /></div>
            <div><Label>Review Content</Label><textarea value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} rows={4} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
            <div><Label>Photo URL</Label><Input value={editing.image} onChange={e => setEditing({...editing, image: e.target.value})} className="mt-1" /></div>
            <div><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={editing.rating} onChange={e => setEditing({...editing, rating: parseInt(e.target.value) || 5})} className="mt-1" /></div>
            <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50">Save</button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
