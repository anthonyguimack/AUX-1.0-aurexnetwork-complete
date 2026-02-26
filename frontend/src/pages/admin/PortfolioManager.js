import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const emptyItem = { title: '', description: '', image: '', tags: [], link: '' };

export default function PortfolioManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getPortfolio().then(r => setItems(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) await adminAPI.updatePortfolio(editing.id, editing);
      else await adminAPI.createPortfolio(editing);
      toast.success('Saved!'); setOpen(false); load();
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  return (
    <div data-testid="portfolio-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Portfolio Manager</h1>
        <button onClick={() => { setEditing({...emptyItem}); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Project</button>
      </div>
      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50"><th className="text-left p-3">Image</th><th className="text-left p-3">Title</th><th className="text-left p-3">Tags</th><th className="text-right p-3">Actions</th></tr></thead>
          <tbody>{items.map(item => (
            <tr key={item.id} className="border-b border-slate-50">
              <td className="p-3"><img src={item.image} alt="" className="w-16 h-10 object-cover rounded-sm" /></td>
              <td className="p-3 font-medium">{item.title}</td>
              <td className="p-3 text-slate-500">{item.tags?.join(', ')}</td>
              <td className="p-3 text-right">
                <button onClick={() => { setEditing({...item}); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-4 h-4" /></button>
                <button onClick={async () => { if (window.confirm('Delete?')) { await adminAPI.deletePortfolio(item.id); load(); }}} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Project</DialogTitle></DialogHeader>
          {editing && <div className="space-y-4">
            <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="mt-1" /></div>
            <div><Label>Description</Label><textarea value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
            <div><Label>Image URL</Label><Input value={editing.image} onChange={e => setEditing({...editing, image: e.target.value})} className="mt-1" /></div>
            <div><Label>Tags (comma separated)</Label><Input value={(editing.tags || []).join(', ')} onChange={e => setEditing({...editing, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} className="mt-1" /></div>
            <div><Label>Link</Label><Input value={editing.link || ''} onChange={e => setEditing({...editing, link: e.target.value})} className="mt-1" /></div>
            <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50">Save</button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
