import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, Tag, Settings2 } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

const emptyItem = { title: '', summary: '', image: '', category: '', link: '', open_in_new_tab: false };
const emptyCategory = { name: '', slug: '', order: 0 };

export default function GalleryManager() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  const load = () => {
    adminAPI.getGallery().then(r => setItems(r.data)).catch(console.error);
    adminAPI.getGalleryCategories().then(r => setCategories(r.data || [])).catch(() => {});
  };
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

  const handleBulkDelete = async () => {
    if (!selected.length || !window.confirm(`Delete ${selected.length} items?`)) return;
    try { await adminAPI.bulkDelete('gallery', selected); toast.success(`${selected.length} deleted`); setSelected([]); load(); }
    catch { toast.error('Error'); }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Category CRUD
  const handleSaveCategory = async () => {
    setCatLoading(true);
    try {
      const slug = editCat.slug || editCat.name.toLowerCase().replace(/\s+/g, '_');
      const data = { ...editCat, slug };
      if (editCat.id) await adminAPI.updateGalleryCategory(editCat.id, data);
      else await adminAPI.createGalleryCategory(data);
      toast.success('Category saved!'); setEditCat(null); load();
    } catch { toast.error('Error'); } finally { setCatLoading(false); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await adminAPI.deleteGalleryCategory(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
  };

  return (
    <div data-testid="gallery-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Gallery Manager</h1>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-500 text-white px-3 py-2 rounded-sm text-sm font-medium flex items-center gap-1" data-testid="bulk-delete-gallery-btn">
              <Trash2 className="w-3 h-3" /> Delete ({selected.length})
            </button>
          )}
          <button onClick={() => setCatOpen(true)} className="border border-slate-200 text-slate-600 px-3 py-2 rounded-sm text-sm font-medium flex items-center gap-1 hover:border-[#0D9488] transition-colors" data-testid="manage-categories-btn">
            <Settings2 className="w-3.5 h-3.5" /> Categories
          </button>
          <button onClick={() => { setEditing({...emptyItem}); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-photo-btn"><Plus className="w-4 h-4" /> Add Photo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-sm border border-slate-100 overflow-hidden group relative">
            <div className="absolute top-2 left-2 z-10"><Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="bg-white" /></div>
            <div className="h-40 overflow-hidden"><img src={item.image?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${item.image}` : item.image} alt={item.title} className="w-full h-full object-cover" /></div>
            <div className="p-3">
              <h4 className="text-sm font-semibold text-[#1a2332]">{item.title}</h4>
              <p className="text-xs text-slate-400 capitalize">{item.category}</p>
              {item.link && <p className="text-xs text-blue-500 truncate mt-0.5">{item.link}</p>}
              <div className="flex gap-1 mt-2">
                <button onClick={() => { setEditing({...item}); setOpen(true); }} className="p-1 text-slate-400 hover:text-[#0D9488]" data-testid={`edit-gallery-${item.id}`}><Edit2 className="w-3 h-3" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-500" data-testid={`delete-gallery-${item.id}`}><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="gallery-edit-dialog"><DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Photo</DialogTitle></DialogHeader>
          {editing && <div className="space-y-4">
            <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="mt-1" data-testid="gallery-title-input" /></div>
            <div><Label>Summary</Label><textarea value={editing.summary} onChange={e => setEditing({...editing, summary: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" data-testid="gallery-summary-input" /></div>
            <div><Label>Image</Label><ImageUpload value={editing.image} onChange={val => setEditing({...editing, image: val})} className="mt-1" /></div>
            <div><Label>Category</Label>
              <select value={editing.category} onChange={e => setEditing({...editing, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" data-testid="gallery-category-select">
                <option value="">-- Select category --</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div><Label>Link (optional)</Label><Input value={editing.link || ''} onChange={e => setEditing({...editing, link: e.target.value})} className="mt-1" placeholder="https://..." data-testid="gallery-link-input" /></div>
            {editing.link && (
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-sm border border-slate-100">
                <Switch checked={editing.open_in_new_tab || false} onCheckedChange={v => setEditing({...editing, open_in_new_tab: v})} data-testid="gallery-newtab-toggle" />
                <Label className="text-sm">Open link in new tab</Label>
              </div>
            )}
            <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2" data-testid="gallery-save-btn">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </button>
          </div>}
        </DialogContent>
      </Dialog>

      {/* Categories Manager Dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="categories-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Gallery Categories</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Existing categories */}
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-2 bg-slate-50 rounded-sm border border-slate-100 px-3 py-2" data-testid={`category-row-${c.id}`}>
                  <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 flex-1 capitalize">{c.name}</span>
                  <span className="text-xs text-slate-400">Order: {c.order || 0}</span>
                  <button onClick={() => setEditCat({...c})} className="p-1 text-slate-400 hover:text-[#0D9488]" data-testid={`edit-cat-${c.id}`}><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => handleDeleteCategory(c.id)} className="p-1 text-slate-400 hover:text-red-500" data-testid={`delete-cat-${c.id}`}><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No categories yet. Add one below.</p>}
            </div>

            {/* Add/Edit category form */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{editCat?.id ? 'Edit' : 'Add'} Category</p>
              <div className="flex gap-2">
                <Input placeholder="Category name" value={editCat?.name || ''} onChange={e => setEditCat(prev => ({...(prev || emptyCategory), name: e.target.value}))} className="flex-1" data-testid="category-name-input" />
                <Input type="number" placeholder="Order" value={editCat?.order || 0} onChange={e => setEditCat(prev => ({...(prev || emptyCategory), order: parseInt(e.target.value) || 0}))} className="w-20" data-testid="category-order-input" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveCategory} disabled={catLoading || !editCat?.name} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium disabled:opacity-50 flex items-center gap-1" data-testid="save-category-btn">
                  {catLoading && <Loader2 className="w-3 h-3 animate-spin" />} {editCat?.id ? 'Update' : 'Add'}
                </button>
                {editCat?.id && <button onClick={() => setEditCat({...emptyCategory})} className="px-4 py-2 rounded-sm text-sm text-slate-500 border border-slate-200">Cancel</button>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
