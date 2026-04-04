import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Globe, Lock, ExternalLink, FileText, Home, Newspaper, Image, BookOpen } from 'lucide-react';
import { getLayoutLabel } from '../../components/admin/LayoutPreview';
import PageEditorDialog from '../../components/admin/PageEditorDialog';

const emptyPage = { title: '', url: '', show_in_header: false, show_in_footer: false, open_in_new_tab: false, login_required: false, order: 0, summary: '', content: '', page_type: '', layout: '', layout_image: '', zones: {} };

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

  const openEditor = (page) => {
    setEditing({ ...page });
    setOpen(true);
  };

  const tabCls = (t) => `px-4 py-2 text-sm font-medium rounded-t-sm transition-colors ${activeTab === t ? 'bg-white border border-b-0 border-slate-200 text-[#1a2332]' : 'text-slate-400 hover:text-slate-600'}`;

  return (
    <div data-testid="pages-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Pages Manager</h1>
        <button onClick={() => openEditor({ ...emptyPage, order: items.length })} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-page-btn">
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
                      {item.layout && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{getLayoutLabel(item.layout)}</span>}
                      {item.zones && Object.values(item.zones).some(z => z?.length > 0) && <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-600">Builder</span>}
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
                      <button onClick={() => openEditor({ ...item })} className="p-1.5 text-slate-400 hover:text-[#0D9488] transition-colors" data-testid={`edit-page-${item.id}`}><Edit2 className="w-4 h-4" /></button>
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
      <PageEditorDialog
        editing={editing}
        setEditing={setEditing}
        open={open}
        setOpen={setOpen}
        onSave={handleSave}
        loading={loading}
      />
    </div>
  );
}
