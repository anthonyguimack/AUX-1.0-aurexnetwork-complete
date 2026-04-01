import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

import ImageUpload from '../../components/ImageUpload';

const emptyBook = { title: '', author: '', description: '', image: '', amazon_link: '', other_links: [], featured: false };

export default function BooksManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getBooks().then(r => setItems(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) { await adminAPI.updateBook(editing.id, editing); }
      else { await adminAPI.createBook(editing); }
      toast.success('Saved!'); setOpen(false); load();
    } catch { toast.error('Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await adminAPI.deleteBook(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
  };

  return (
    <div data-testid="books-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Reading List Manager</h1>
        <button onClick={() => { setEditing({...emptyBook}); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-book-btn"><Plus className="w-4 h-4" /> Add Book</button>
      </div>
      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left p-3 font-medium text-slate-600">Cover</th>
            <th className="text-left p-3 font-medium text-slate-600">Title</th>
            <th className="text-left p-3 font-medium text-slate-600">Author</th>
            <th className="text-left p-3 font-medium text-slate-600">Featured</th>
            <th className="text-right p-3 font-medium text-slate-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-3"><img src={item.image} alt="" className="w-10 h-14 object-cover rounded-sm" /></td>
                <td className="p-3 font-medium text-[#1a2332]">{item.title}</td>
                <td className="p-3 text-slate-500">{item.author}</td>
                <td className="p-3">{item.featured ? <span className="text-xs text-[#0D9488]">Yes</span> : <span className="text-xs text-slate-400">No</span>}</td>
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
        <DialogContent className="sm:max-w-[500px]" data-testid="book-dialog">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Book</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="mt-1" /></div>
              <div><Label>Author</Label><Input value={editing.author} onChange={e => setEditing({...editing, author: e.target.value})} className="mt-1" /></div>
              <div><Label>Description</Label><textarea value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
              <div><Label>Synopsis</Label><textarea value={editing.synopsis || ''} onChange={e => setEditing({...editing, synopsis: e.target.value})} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" placeholder="What is the book about?" /></div>
              <div><Label>Who Is It For?</Label><textarea value={editing.who_is_it_for || ''} onChange={e => setEditing({...editing, who_is_it_for: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
              <div><Label>About the Author</Label><textarea value={editing.about_author || ''} onChange={e => setEditing({...editing, about_author: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
              <div><Label>Cover Image</Label><ImageUpload value={editing.image} onChange={v => setEditing({...editing, image: v})} className="mt-1" /></div>
              <div><Label>Amazon Link</Label><Input value={editing.amazon_link} onChange={e => setEditing({...editing, amazon_link: e.target.value})} className="mt-1" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editing.featured} onChange={e => setEditing({...editing, featured: e.target.checked})} id="featured" />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50" data-testid="book-save-btn">Save</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
