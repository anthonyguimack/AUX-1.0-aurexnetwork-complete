import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, ArrowUp, ArrowDown, Globe, Lock, ExternalLink, FileText, Home, Newspaper, Image, BookOpen, Layout, Square, Columns2, LayoutGrid, Layers, List, SlidersHorizontal, PanelRight, User, CreditCard, Sidebar, Rocket, PanelLeft } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUpload from '../../components/ImageUpload';
import PageBuilder from '../../components/admin/PageBuilder';
import { LAYOUTS, LEGACY_LAYOUTS } from '../../lib/layoutDefinitions';

const LAYOUT_ICONS = {
  '': FileText, full_width: Layout, boxed: Square, split_screen: Columns2,
  grid: LayoutGrid, masonry: Layers, list: List, carousel: SlidersHorizontal,
  two_column: PanelRight, three_column: Columns2, profile: User,
  card_based: CreditCard, hero_banner: Image, sidebar_layout: Sidebar, landing: Rocket,
  layout_1: User, layout_2: LayoutGrid, layout_3: Image, layout_5: FileText,
};

const LEGACY_LAYOUT_META = {
  layout_1: { label: 'About / Bio', desc: 'Image + text + social links' },
  layout_2: { label: 'Services Grid', desc: 'Auto-displays service cards' },
  layout_3: { label: 'Gallery Albums', desc: 'Auto-displays album grid' },
  layout_5: { label: 'Full Content', desc: 'Centered text column' },
};

function LayoutPreview({ layoutKey }) {
  const z1 = "bg-[#0D9488]/25", z2 = "bg-blue-200/60", z3 = "bg-amber-200/60", z4 = "bg-purple-200/60";
  const previews = {
    '': <div className="w-full h-full flex flex-col gap-[2px] p-1"><div className={`h-1.5 w-3/4 ${z1} rounded-[1px]`}/><div className={`flex-1 ${z1} rounded-[1px]`}/></div>,
    full_width: <div className={`w-full h-full ${z1} rounded-[1px]`}/>,
    boxed: <div className="w-full h-full flex justify-center items-center"><div className={`w-3/4 h-4/5 ${z1} rounded-[1px]`}/></div>,
    split_screen: <div className="w-full h-full flex gap-[2px]"><div className={`w-1/2 ${z1} rounded-[1px]`}/><div className={`w-1/2 ${z2} rounded-[1px]`}/></div>,
    grid: <div className="w-full h-full grid grid-cols-2 gap-[2px]"><div className={`${z1} rounded-[1px]`}/><div className={`${z2} rounded-[1px]`}/><div className={`${z3} rounded-[1px]`}/><div className={`${z4} rounded-[1px]`}/></div>,
    masonry: <div className="w-full h-full flex gap-[2px]"><div className="w-1/3 flex flex-col gap-[2px]"><div className={`h-3/5 ${z1} rounded-[1px]`}/><div className={`h-2/5 ${z2} rounded-[1px]`}/></div><div className="w-1/3 flex flex-col gap-[2px]"><div className={`h-2/5 ${z2} rounded-[1px]`}/><div className={`h-3/5 ${z1} rounded-[1px]`}/></div><div className="w-1/3 flex flex-col gap-[2px]"><div className={`h-1/2 ${z1} rounded-[1px]`}/><div className={`h-1/2 ${z2} rounded-[1px]`}/></div></div>,
    list: <div className="w-full h-full flex flex-col gap-[2px]"><div className={`h-1/3 ${z1} rounded-[1px]`}/><div className={`h-1/3 ${z1} rounded-[1px]`}/><div className={`h-1/3 ${z1} rounded-[1px]`}/></div>,
    carousel: <div className="w-full h-full flex items-center gap-[2px]"><div className={`w-1/3 h-4/5 ${z1} rounded-[1px]`}/><div className={`w-1/3 h-4/5 ${z1} rounded-[1px]`}/><div className={`w-1/3 h-4/5 ${z1} rounded-[1px]`}/></div>,
    two_column: <div className="w-full h-full flex gap-[2px]"><div className={`w-2/3 ${z1} rounded-[1px]`}/><div className={`w-1/3 ${z2} rounded-[1px]`}/></div>,
    three_column: <div className="w-full h-full flex gap-[2px]"><div className={`w-1/3 ${z1} rounded-[1px]`}/><div className={`w-1/3 ${z2} rounded-[1px]`}/><div className={`w-1/3 ${z3} rounded-[1px]`}/></div>,
    profile: <div className="w-full h-full flex gap-[2px]"><div className={`w-1/4 ${z2} rounded-[1px]`}/><div className={`w-3/4 ${z1} rounded-[1px]`}/></div>,
    card_based: <div className="w-full h-full grid grid-cols-3 gap-[2px]">{[1,2,3,4,5,6].map(i=><div key={i} className={`${z1} rounded-[1px]`}/>)}</div>,
    hero_banner: <div className="w-full h-full flex flex-col gap-[2px]"><div className={`h-2/5 ${z2} rounded-[1px]`}/><div className={`h-3/5 ${z1} rounded-[1px]`}/></div>,
    sidebar_layout: <div className="w-full h-full flex gap-[2px]"><div className={`w-1/4 ${z2} rounded-[1px]`}/><div className={`w-3/4 ${z1} rounded-[1px]`}/></div>,
    landing: <div className="w-full h-full flex flex-col gap-[2px]"><div className={`h-1/3 ${z2} rounded-[1px]`}/><div className={`h-1/3 ${z1} rounded-[1px]`}/><div className={`h-1/3 ${z3} rounded-[1px]`}/></div>,
    layout_1: <div className="w-full h-full flex gap-[2px]"><div className={`w-2/5 ${z2} rounded-[1px]`}/><div className={`w-3/5 ${z1} rounded-[1px]`}/></div>,
    layout_2: <div className="w-full h-full grid grid-cols-2 gap-[2px]">{[1,2,3,4].map(i=><div key={i} className={`${z1} rounded-[1px]`}/>)}</div>,
    layout_3: <div className="w-full h-full grid grid-cols-3 gap-[2px]">{[1,2,3].map(i=><div key={i} className={`${z1} rounded-[1px]`}/>)}</div>,
    layout_5: <div className="w-full h-full flex justify-center"><div className={`w-3/4 h-full ${z1} rounded-[1px]`}/></div>,
  };
  return <div className="w-full h-10 bg-slate-100 rounded overflow-hidden">{previews[layoutKey] || <div className={`w-full h-full ${z1}`}/>}</div>;
}

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
  const [editorTab, setEditorTab] = useState('settings');

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
    setEditorTab('settings');
    setOpen(true);
  };

  const isBuilderLayout = (layout) => layout && LAYOUTS[layout];
  const isLegacyLayout = (layout) => LEGACY_LAYOUTS.includes(layout);
  const getLayoutLabel = (layout) => {
    if (!layout) return 'Default';
    if (LAYOUTS[layout]) return LAYOUTS[layout].label;
    if (LEGACY_LAYOUT_META[layout]) return LEGACY_LAYOUT_META[layout].label;
    return layout;
  };

  const tabCls = (t) => `px-4 py-2 text-sm font-medium rounded-t-sm transition-colors ${activeTab === t ? 'bg-white border border-b-0 border-slate-200 text-[#1a2332]' : 'text-slate-400 hover:text-slate-600'}`;
  const edTabCls = (t) => `px-4 py-2 text-sm font-medium transition-colors ${editorTab === t ? 'text-[#0D9488] border-b-2 border-[#0D9488]' : 'text-slate-400 hover:text-slate-600'}`;

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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" data-testid="page-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.id ? 'Edit' : 'New'} Page</DialogTitle></DialogHeader>
          {editing && (
            <div>
              {/* Editor Tabs */}
              <div className="flex border-b border-slate-200 mb-4" data-testid="editor-tabs">
                <button onClick={() => setEditorTab('settings')} className={edTabCls('settings')} data-testid="editor-tab-settings">Settings</button>
                <button onClick={() => setEditorTab('content')} className={edTabCls('content')} data-testid="editor-tab-content">Content & Layout</button>
              </div>

              {/* Settings Tab */}
              {editorTab === 'settings' && (
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
                      <p className="text-xs text-slate-400 mt-0.5">Links to a system template.</p>
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
                </div>
              )}

              {/* Content & Layout Tab */}
              {editorTab === 'content' && (
                <div className="space-y-6">
                  {/* Layout Selector */}
                  <div>
                    <Label className="text-xs text-slate-500 mb-3 block">Page Layout</Label>

                    {/* Builder Layouts */}
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Visual Builder Layouts</p>
                    <div className="grid grid-cols-5 gap-2 mb-4" data-testid="layout-selector-builder">
                      {Object.entries(LAYOUTS).map(([key, def]) => {
                        const Icon = LAYOUT_ICONS[key] || Layout;
                        return (
                          <button key={key} type="button"
                            onClick={() => setEditing({ ...editing, layout: key })}
                            className={`p-2.5 rounded-sm border-2 text-left transition-all ${editing.layout === key ? 'border-[#0D9488] bg-[#0D9488]/5' : 'border-slate-200 hover:border-slate-300'}`}
                            data-testid={`layout-option-${key}`}>
                            <LayoutPreview layoutKey={key} />
                            <span className="text-[11px] font-medium text-[#1a2332] block mt-1.5 leading-tight">{def.label}</span>
                            <span className="text-[9px] text-slate-400 block leading-tight">{def.desc}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Default + Legacy Layouts */}
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Simple & Preset Layouts</p>
                    <div className="grid grid-cols-5 gap-2" data-testid="layout-selector-legacy">
                      <button type="button"
                        onClick={() => setEditing({ ...editing, layout: '' })}
                        className={`p-2.5 rounded-sm border-2 text-left transition-all ${!editing.layout ? 'border-[#0D9488] bg-[#0D9488]/5' : 'border-slate-200 hover:border-slate-300'}`}
                        data-testid="layout-option-default">
                        <LayoutPreview layoutKey="" />
                        <span className="text-[11px] font-medium text-[#1a2332] block mt-1.5">Default</span>
                        <span className="text-[9px] text-slate-400 block leading-tight">Basic content page</span>
                      </button>
                      {Object.entries(LEGACY_LAYOUT_META).map(([key, meta]) => {
                        const Icon = LAYOUT_ICONS[key] || FileText;
                        return (
                          <button key={key} type="button"
                            onClick={() => setEditing({ ...editing, layout: key })}
                            className={`p-2.5 rounded-sm border-2 text-left transition-all ${editing.layout === key ? 'border-[#0D9488] bg-[#0D9488]/5' : 'border-slate-200 hover:border-slate-300'}`}
                            data-testid={`layout-option-${key}`}>
                            <LayoutPreview layoutKey={key} />
                            <span className="text-[11px] font-medium text-[#1a2332] block mt-1.5">{meta.label}</span>
                            <span className="text-[9px] text-slate-400 block leading-tight">{meta.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Content Area — conditional on layout type */}
                  {isBuilderLayout(editing.layout) && (
                    <div>
                      <Label className="text-xs text-slate-500 mb-2 block">Content Blocks</Label>
                      <PageBuilder
                        zones={editing.zones || {}}
                        layout={editing.layout}
                        onChange={zones => setEditing({ ...editing, zones })}
                      />
                    </div>
                  )}

                  {isLegacyLayout(editing.layout) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-2 font-medium">Preset Layout: {LEGACY_LAYOUT_META[editing.layout]?.label}</p>
                      <p className="text-xs text-slate-400">This layout auto-populates content. You can still set a page title and summary above.</p>
                      {editing.layout === 'layout_1' && (
                        <div className="mt-3">
                          <Label className="text-xs text-slate-500">Layout Image</Label>
                          <ImageUpload value={editing.layout_image || ''} onChange={v => setEditing({ ...editing, layout_image: v })} />
                        </div>
                      )}
                      <div className="mt-3">
                        <Label className="text-xs text-slate-500">Additional Content (optional)</Label>
                        <div className="mt-1"><RichTextEditor value={editing.content || ''} onChange={val => setEditing({ ...editing, content: val })} /></div>
                      </div>
                    </div>
                  )}

                  {!editing.layout && (
                    <div>
                      <Label className="text-xs text-slate-500">Page Content</Label>
                      <div className="mt-1"><RichTextEditor value={editing.content || ''} onChange={val => setEditing({ ...editing, content: val })} /></div>
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              <button onClick={handleSave} disabled={loading} className="w-full bg-[#0D9488] text-white py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#0D9488]/80 transition-colors mt-6" data-testid="page-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Page
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
