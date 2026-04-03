import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, DollarSign } from 'lucide-react';

import ImageUpload from '../../components/ImageUpload';
import RichTextEditor from '../../components/RichTextEditor';

const emptyService = { title: '', description: '', short_description: '', full_content: '', icon: 'briefcase', image: '', price: 0, currency: 'usd', type: 'service' };

export default function ServicesManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getServices().then(r => setItems(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) { await adminAPI.updateService(editing.id, editing); }
      else { await adminAPI.createService(editing); }
      toast.success('Saved!'); setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try { await adminAPI.deleteService(id); toast.success('Deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Cannot delete'); }
  };

  return (
    <div data-testid="services-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Services & Products</h1>
        <button onClick={() => { setEditing({...emptyService}); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-service-btn">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>
      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left p-3 font-medium text-slate-600">Title</th>
            <th className="text-left p-3 font-medium text-slate-600">Type</th>
            <th className="text-left p-3 font-medium text-slate-600">Price</th>
            <th className="text-right p-3 font-medium text-slate-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50" data-testid={`service-row-${item.id}`}>
                <td className="p-3 font-medium text-[#1a2332]">{item.title}</td>
                <td className="p-3"><span className="text-xs uppercase bg-slate-100 px-2 py-0.5 rounded-sm">{item.type}</span></td>
                <td className="p-3 flex items-center gap-1"><DollarSign className="w-3 h-3 text-[#0D9488]" />{item.price?.toFixed(2)}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing({...item}); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]" data-testid={`edit-service-${item.id}`}><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500" data-testid={`delete-service-${item.id}`}><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="service-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.id ? 'Edit' : 'New'} Service</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="mt-1" data-testid="service-title-input" /></div>
              <div><Label>Short Description <span className="text-xs text-slate-400 font-normal">(Card view)</span></Label><RichTextEditor value={editing.short_description || editing.description || ''} onChange={v => setEditing({...editing, short_description: v})} /></div>
              <div><Label>Full Content <span className="text-xs text-slate-400 font-normal">(Detail page)</span></Label><RichTextEditor value={editing.full_content || ''} onChange={v => setEditing({...editing, full_content: v})} placeholder="Full service description..." /></div>
              <div><Label>Image</Label><ImageUpload value={editing.image || ''} onChange={v => setEditing({...editing, image: v})} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Price ($)</Label><Input type="number" step="0.01" value={editing.price} onChange={e => setEditing({...editing, price: parseFloat(e.target.value) || 0})} className="mt-1" data-testid="service-price-input" /></div>
                <div>
                  <Label>Type</Label>
                  <select value={editing.type} onChange={e => setEditing({...editing, type: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" data-testid="service-type-select">
                    <option value="service">Service</option><option value="product">Product</option>
                  </select>
                </div>
                <div><Label>Icon</Label><Input value={editing.icon} onChange={e => setEditing({...editing, icon: e.target.value})} className="mt-1" placeholder="briefcase" /></div>
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50" data-testid="service-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
