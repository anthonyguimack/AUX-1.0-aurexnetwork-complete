import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

const emptyType = { name: '', description: '', order: 0 };

export default function MemberTypesManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getMemberTypes().then(r => setItems(r.data || [])).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) await adminAPI.updateMemberType(editing.id, editing);
      else await adminAPI.createMemberType(editing);
      toast.success('Saved!'); setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member type?')) return;
    try { await adminAPI.deleteMemberType(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
  };

  return (
    <div data-testid="member-types-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Member Types</h1>
        <button onClick={() => { setEditing({ ...emptyType, order: items.length }); setOpen(true); }}
          className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-member-type-btn">
          <Plus className="w-4 h-4" /> Add Type
        </button>
      </div>

      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm" data-testid="member-types-table">
          <thead><tr className="border-b bg-slate-50">
            <th className="text-left p-3 font-medium text-slate-500 w-16">Order</th>
            <th className="text-left p-3 font-medium text-slate-500">Name</th>
            <th className="text-left p-3 font-medium text-slate-500 hidden md:table-cell">Description</th>
            <th className="text-right p-3 font-medium text-slate-500 w-24">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50" data-testid={`member-type-row-${item.id}`}>
                <td className="p-3 text-xs text-slate-400">{item.order}</td>
                <td className="p-3 font-medium text-[#1a2332]">{item.name}</td>
                <td className="p-3 text-slate-500 text-xs hidden md:table-cell">{item.description || '-'}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing({ ...item }); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]" data-testid={`edit-type-${item.id}`}><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500" data-testid={`delete-type-${item.id}`}><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No member types yet. Add one to get started.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]" data-testid="member-type-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.id ? 'Edit' : 'New'} Member Type</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-slate-500">Name *</Label>
                <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="mt-1" data-testid="member-type-name-input" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Description</Label>
                <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Order</Label>
                <Input type="number" value={editing.order || 0} onChange={e => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })} className="mt-1 w-24" />
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50" data-testid="member-type-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
