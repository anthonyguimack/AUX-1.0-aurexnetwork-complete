import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, ArrowUp, ArrowDown, Globe, Lock, ExternalLink, FileText, Home, Newspaper, Image, BookOpen } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUpload from '../../components/ImageUpload';

const LAYOUT_OPTIONS = [
  { value: '', label: 'Default', desc: 'Standard page layout', icon: '📄' },
  { value: 'layout_1', label: 'About / Bio', desc: 'Two-column: image left, text right + social links', icon: '👤' },
  { value: 'layout_2', label: 'Services Grid', desc: 'Card grid linked to service details', icon: '🔧' },
  { value: 'layout_3', label: 'Gallery Albums', desc: 'Album grid with cover images', icon: '🖼' },
  { value: 'layout_5', label: 'Full Content', desc: 'Single centered text column', icon: '📝' },
];

const emptyPage = { title: '', url: '', show_in_header: false, show_in_footer: false, open_in_new_tab: false, login_required: false, order: 0, summary: '', content: '', page_type: '', layout: '', layout_image: '' };

const SYSTEM_PAGES = [
  { id: '_sys_home', title: 'Home', url: '/', icon: Home, system: true, description: 'Main homepage' },
  { id: '_sys_news', title: 'News', url: '/news', icon: Newspaper, system: true, description: 'Blog & news listing' },
  { id: '_sys_gallery', title: 'Gallery', url: '/gallery', icon: Image, system: true, description: 'Photo gallery' },
  { id: '_sys_reading', title: 'Reading List', url: '/reading-list', icon: BookOpen, system: true, description: 'Book recommendations' },
];

function StatusBadge({ active, label }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${active ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-slate-100 text-slate-400'}`}>
      {label}
    </span>
  );
}

export default function PagesManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('custom');

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

  const tabCls = (t) => `px-4 py-2 text-sm font-medium rounded-t-sm transition-colors ${activeTab === t ? 'bg-white border border-b-0 border-slate-200 text-[#1a2332]' : 'text-slate-400 hover:text-slate-600'}`;

  return (
    <div data-testid="pages-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Pages Manager</h1>
        <button onClick={() => { setEditing({ ...emptyPage, order: items.length }); setOpen(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-page-btn">
          <Plus className="w-4 h-4" /> Add Page
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-0" data-testid="pages-tabs">
        <button onClick={() => setActiveTab('custom')} className={tabCls('custom')} data-testid="tab-custom">
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />Custom Pages ({items.length})
        </button>
        <button onClick={() => setActiveTab('system')} className={tabCls('system')} data-testid="tab-system">
          <Globe className="w-3.5 h-3.5 inline mr-1.5" />System Pages ({SYSTEM_PAGES.length})
        </button>
      </div>

      {/* Custom Pages Tab */}
      {activeTab === 'custom' && (
        <div className="bg-white rounded-sm rounded-tl-none border border-slate-200">
          <table className="w-full text-sm" data-testid="custom-pages-table">
            <thead><tr className="border-b bg-slate-50/80">
              <th className="text-left p-3 font-medium text-slate-500 w-16">Order</th>
              <th className="text-left p-3 font-medium text-slate-500">Page</th>
              <th className="text-left p-3 font-medium text-slate-500 hidden md:table-cell">URL</th>
              <th className="text-center p-3 font-medium text-slate-500 w-20">Visibility</th>
              <th className="text-center p-3 font-medium text-slate-500 w-20">Access</th>
              <th className="text-right p-3 font-medium text-slate-500 w-24">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 group" data-testid={`page-row-${item.id}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveOrder(item, -1)} className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" disabled={idx === 0}><ArrowUp className="w-3 h-3" /></button>
                      <span className="text-xs text-slate-400 w-5 text-center">{item.order}</span>
                      <button onClick={() => moveOrder(item, 1)} className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" disabled={idx === items.length - 1}><ArrowDown className="w-3 h-3" /></button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-[#1a2332]">{item.title}</div>
                    <div className="flex gap-1 mt-0.5">
                      {item.page_type && <span className="text-xs text-slate-400">type: {item.page_type}</span>}
                      {item.layout && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{LAYOUT_OPTIONS.find(l => l.value === item.layout)?.label || item.layout}</span>}
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="text-slate-500 text-xs font-mono bg-slate-50 px-2 py-0.5 rounded">{item.url}</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {item.show_in_header && <StatusBadge active label="Header" />}
                      {item.show_in_footer && <StatusBadge active label="Footer" />}
                      {!item.show_in_header && !item.show_in_footer && <StatusBadge active={false} label="Hidden" />}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {item.login_required && <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-50 text-amber-600"><Lock className="w-3 h-3" />Login</span>}
                      {item.open_in_new_tab && <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-sm text-xs font-medium bg-blue-50 text-blue-500"><ExternalLink className="w-3 h-3" />New Tab</span>}
                      {!item.login_required && !item.open_in_new_tab && <span className="text-xs text-slate-300">Public</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing({ ...item }); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488] transition-colors" data-testid={`edit-page-${item.id}`}><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" data-testid={`delete-page-${item.id}`}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="p-12 text-center text-slate-400 text-sm">No custom pages yet. Click "Add Page" to create one.</div>}
        </div>
      )}

      {/* System Pages Tab */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-sm rounded-tl-none border border-slate-200">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <p className="text-xs text-slate-500">System pages are built-in and cannot be deleted. They are always accessible at their fixed URLs.</p>
          </div>
          <div className="divide-y divide-slate-50">
            {SYSTEM_PAGES.map(sp => {
              const IconComp = sp.icon;
              return (
                <div key={sp.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors" data-testid={`system-page-${sp.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-sm bg-[#1a2332]/5 flex items-center justify-center">
                      <IconComp className="w-4 h-4 text-[#1a2332]/60" />
                    </div>
                    <div>
                      <div className="font-medium text-[#1a2332] text-sm">{sp.title}</div>
                      <div className="text-xs text-slate-400">{sp.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{sp.url}</span>
                    <span className="text-xs text-[#0D9488] font-medium">Active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto" data-testid="page-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.id ? 'Edit' : 'New'} Page</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Title</Label>
                  <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="mt-1" data-testid="page-title-input" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">URL</Label>
                  <Input value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })} className="mt-1" placeholder="/terms, https://..." data-testid="page-url-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Page Type (optional)</Label>
                  <Input value={editing.page_type || ''} onChange={e => setEditing({ ...editing, page_type: e.target.value })} className="mt-1" placeholder="terms, privacy..." />
                  <p className="text-xs text-slate-400 mt-0.5">Links this page to a system template (Terms, Privacy).</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Display Order</Label>
                  <Input type="number" value={editing.order || 0} onChange={e => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })} className="mt-1 w-24" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Summary</Label>
                <textarea value={editing.summary || ''} onChange={e => setEditing({ ...editing, summary: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Content</Label>
                <div className="mt-1"><RichTextEditor value={editing.content || ''} onChange={val => setEditing({ ...editing, content: val })} /></div>
              </div>

              {/* Layout Selector */}
              <div>
                <Label className="text-xs text-slate-500 mb-2 block">Page Layout</Label>
                <div className="grid grid-cols-3 gap-2" data-testid="layout-selector">
                  {LAYOUT_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setEditing({ ...editing, layout: opt.value })}
                      className={`p-3 rounded-sm border-2 text-left transition-all ${editing.layout === opt.value ? 'border-[#0D9488] bg-[#0D9488]/5' : 'border-slate-200 hover:border-slate-300'}`}
                      data-testid={`layout-option-${opt.value || 'default'}`}>
                      <span className="text-lg block mb-1">{opt.icon}</span>
                      <span className="text-xs font-medium text-[#1a2332] block">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 block leading-tight">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout 1 specific: Image */}
              {editing.layout === 'layout_1' && (
                <div>
                  <Label className="text-xs text-slate-500">Layout Image (About/Bio)</Label>
                  <ImageUpload value={editing.layout_image || ''} onChange={v => setEditing({ ...editing, layout_image: v })} />
                </div>
              )}

              {/* Toggle Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <Switch checked={editing.show_in_header} onCheckedChange={v => setEditing({ ...editing, show_in_header: v })} data-testid="page-header-toggle" />
                  <Label className="text-sm">Show in Header</Label>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <Switch checked={editing.show_in_footer} onCheckedChange={v => setEditing({ ...editing, show_in_footer: v })} data-testid="page-footer-toggle" />
                  <Label className="text-sm">Show in Footer</Label>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <Switch checked={editing.open_in_new_tab} onCheckedChange={v => setEditing({ ...editing, open_in_new_tab: v })} data-testid="page-newtab-toggle" />
                  <div>
                    <Label className="text-sm">Open in New Tab</Label>
                    <p className="text-xs text-slate-400">Link opens in a new browser tab</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-sm border border-slate-100">
                  <Switch checked={editing.login_required} onCheckedChange={v => setEditing({ ...editing, login_required: v })} data-testid="page-login-toggle" />
                  <div>
                    <Label className="text-sm">Login Required</Label>
                    <p className="text-xs text-slate-400">Restricts access to logged-in users</p>
                  </div>
                </div>
              </div>

              <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#0D9488]/80 transition-colors" data-testid="page-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Page
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
