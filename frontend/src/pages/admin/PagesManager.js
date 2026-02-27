import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUpload from '../../components/ImageUpload';

const emptyPage = { title: '', url: '', show_in_header: false, show_in_footer: false, open_in_new_tab: false, login_required: false, order: 0, banner_image: '', summary: '', content: '', page_type: '' };

export default function PagesManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => adminAPI.getNavPages().then(r => setItems((r.data || []).sort((a, b) => (a.order || 0) - (b.order || 0)))).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing.id) await adminAPI.updateNavPage(editing.id, editing);
      else await adminAPI.createNavPage(editing);
      toast.success('Saved!'); setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this page?')) return;
    try { await adminAPI.deleteNavPage(id); toast.success('Deleted'); load(); }
    catch { toast.error('Error'); }
  };

  const moveOrder = async (item, direction) => {
    const newOrder = (item.order || 0) + direction;
    await adminAPI.updateNavPage(item.id, { ...item, order: newOrder });
    load();
  };

  return (
    <div data-testid="pages-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Pages Manager</h1>
        <button onClick={() => { setEditing({...emptyPage, order: items.length}); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-page-btn"><Plus className="w-4 h-4" /> Add Page</button>
      </div>
      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50">
            <th className="text-left p-3 font-medium text-slate-600 w-8">Order</th>
            <th className="text-left p-3 font-medium text-slate-600">Title</th>
            <th className="text-left p-3 font-medium text-slate-600">URL</th>
            <th className="text-center p-3 font-medium text-slate-600">Header</th>
            <th className="text-center p-3 font-medium text-slate-600">Footer</th>
            <th className="text-center p-3 font-medium text-slate-600">New Tab</th>
            <th className="text-center p-3 font-medium text-slate-600">Login Req.</th>
            <th className="text-right p-3 font-medium text-slate-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50" data-testid={`page-row-${item.id}`}>
                <td className="p-3 text-center">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveOrder(item, -1)} className="text-slate-300 hover:text-slate-600" disabled={idx === 0}><ArrowUp className="w-3 h-3" /></button>
                    <span className="text-xs text-slate-400">{item.order}</span>
                    <button onClick={() => moveOrder(item, 1)} className="text-slate-300 hover:text-slate-600" disabled={idx === items.length - 1}><ArrowDown className="w-3 h-3" /></button>
                  </div>
                </td>
                <td className="p-3 font-medium text-[#1a2332]">{item.title}</td>
                <td className="p-3 text-slate-500 text-xs font-mono">{item.url}</td>
                <td className="p-3 text-center">{item.show_in_header ? <span className="text-xs text-[#0D9488] font-medium">Yes</span> : <span className="text-xs text-slate-300">No</span>}</td>
                <td className="p-3 text-center">{item.show_in_footer ? <span className="text-xs text-[#0D9488] font-medium">Yes</span> : <span className="text-xs text-slate-300">No</span>}</td>
                <td className="p-3 text-center">{item.open_in_new_tab ? <span className="text-xs text-amber-500">Yes</span> : <span className="text-xs text-slate-300">No</span>}</td>
                <td className="p-3 text-center">{item.login_required ? <span className="text-xs text-red-500">Yes</span> : <span className="text-xs text-slate-300">No</span>}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing({...item}); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No pages yet. Add your first page.</div>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto" data-testid="page-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.id ? 'Edit' : 'New'} Page</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} className="mt-1" data-testid="page-title-input" /></div>
              <div>
                <Label>URL</Label>
                <Input value={editing.url} onChange={e => setEditing({...editing, url: e.target.value})} className="mt-1" placeholder="/terms, #contact, https://google.com" data-testid="page-url-input" />
                <p className="text-xs text-slate-400 mt-1">Internal path (/terms), anchor (#contact), or external URL (https://...)</p>
              </div>
              <div><Label>Page Type (optional, e.g. "terms", "privacy")</Label><Input value={editing.page_type || ''} onChange={e => setEditing({...editing, page_type: e.target.value})} className="mt-1" placeholder="terms, privacy, etc." /></div>
              <div><Label>Banner Image URL</Label><Input value={editing.banner_image || ''} onChange={e => setEditing({...editing, banner_image: e.target.value})} className="mt-1" /></div>
              <div><Label>Summary</Label><textarea value={editing.summary || ''} onChange={e => setEditing({...editing, summary: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
              <div><Label>Content (HTML)</Label><textarea value={editing.content || ''} onChange={e => setEditing({...editing, content: e.target.value})} rows={5} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1 font-mono text-xs" /></div>
              <div><Label>Display Order</Label><Input type="number" value={editing.order || 0} onChange={e => setEditing({...editing, order: parseInt(e.target.value) || 0})} className="mt-1 w-24" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-sm">
                  <Switch checked={editing.show_in_header} onCheckedChange={v => setEditing({...editing, show_in_header: v})} data-testid="page-header-toggle" />
                  <Label className="text-sm">Show in Header</Label>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-sm">
                  <Switch checked={editing.show_in_footer} onCheckedChange={v => setEditing({...editing, show_in_footer: v})} data-testid="page-footer-toggle" />
                  <Label className="text-sm">Show in Footer</Label>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-sm">
                  <Switch checked={editing.open_in_new_tab} onCheckedChange={v => setEditing({...editing, open_in_new_tab: v})} />
                  <Label className="text-sm">Open in New Tab</Label>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-sm">
                  <Switch checked={editing.login_required} onCheckedChange={v => setEditing({...editing, login_required: v})} data-testid="page-login-toggle" />
                  <Label className="text-sm">Login Required</Label>
                </div>
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50" data-testid="page-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Page
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
