import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';

const emptyPost = { title: '', summary: '', content: '', category: '', author: '', image: '', published: true };

export default function BlogManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getBlog().then(r => setItems(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) { await adminAPI.updateBlog(editing.id, editing); }
      else { await adminAPI.createBlog(editing); }
      toast.success('Saved!'); setOpen(false); load();
    } catch { toast.error('Error saving'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await adminAPI.deleteBlog(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
  };

  return (
    <div data-testid="blog-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Blog Manager</h1>
        <button onClick={() => { setEditing({...emptyPost}); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-blog-btn"><Plus className="w-4 h-4" /> New Post</button>
      </div>
      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left p-3 font-medium text-slate-600">Title</th>
            <th className="text-left p-3 font-medium text-slate-600">Category</th>
            <th className="text-left p-3 font-medium text-slate-600">Author</th>
            <th className="text-left p-3 font-medium text-slate-600">Status</th>
            <th className="text-right p-3 font-medium text-slate-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50" data-testid={`blog-row-${item.id}`}>
                <td className="p-3 font-medium text-[#1a2332]">{item.title}</td>
                <td className="p-3 text-slate-500">{item.category}</td>
                <td className="p-3 text-slate-500">{item.author}</td>
                <td className="p-3">{item.published ? <span className="text-xs text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded-sm">Published</span> : <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm">Draft</span>}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing({...item}); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" data-testid="blog-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.id ? 'Edit' : 'New'} Post</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="mt-1" data-testid="blog-title-input" /></div>
              <div><Label>Summary</Label><textarea value={editing.summary} onChange={e => setEditing({...editing, summary: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" data-testid="blog-summary-input" /></div>
              <div><Label>Content (HTML)</Label><textarea value={editing.content} onChange={e => setEditing({...editing, content: e.target.value})} rows={8} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1 font-mono text-xs" data-testid="blog-content-input" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Category</Label><Input value={editing.category} onChange={e => setEditing({...editing, category: e.target.value})} className="mt-1" /></div>
                <div><Label>Author</Label><Input value={editing.author} onChange={e => setEditing({...editing, author: e.target.value})} className="mt-1" /></div>
              </div>
              <div><Label>Image URL</Label><Input value={editing.image} onChange={e => setEditing({...editing, image: e.target.value})} className="mt-1" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editing.published} onChange={e => setEditing({...editing, published: e.target.checked})} id="published" />
                <Label htmlFor="published">Published</Label>
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50" data-testid="blog-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
