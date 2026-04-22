import React, { useEffect, useState, useRef } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { AUREX_SECTIONS } from '../../lib/aurexSchemas';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Loader2, Save, Plus, Edit2, Trash2, Upload, Eye, EyeOff, Sparkles, X } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

function FieldInput({ field, value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const r = await adminAPI.uploadImage(f);
      const url = r.data?.url?.startsWith('/api') ? `${API}${r.data.url}` : r.data?.url;
      onChange(url);
      toast.success('Uploaded');
    } catch (err) { toast.error('Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  if (field.type === 'textarea') {
    return <textarea value={value || ''} onChange={e => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-sm text-sm min-h-[70px]" placeholder={field.placeholder} data-testid={`field-${field.key}`} />;
  }
  if (field.type === 'number') {
    return <Input type="number" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} className="mt-1" placeholder={field.placeholder} data-testid={`field-${field.key}`} />;
  }
  if (field.type === 'bool') {
    return <div className="mt-1"><Switch checked={!!value} onCheckedChange={onChange} data-testid={`field-${field.key}`} /></div>;
  }
  if (field.type === 'select') {
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-sm text-sm bg-white" data-testid={`field-${field.key}`}>
        <option value="">—</option>
        {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (field.type === 'image') {
    return (
      <div className="flex gap-2 mt-1 items-start">
        <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || 'https://… or upload →'} data-testid={`field-${field.key}`} />
        <input type="file" ref={fileRef} accept="image/*" onChange={handleUpload} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 rounded-sm text-xs font-medium bg-slate-100 hover:bg-slate-200 flex items-center gap-1 disabled:opacity-50 whitespace-nowrap">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
        </button>
        {value && (<img src={value} alt="" className="w-10 h-10 object-cover rounded border border-slate-200" />)}
      </div>
    );
  }
  // text, url, icon
  return <Input type={field.type === 'url' ? 'url' : 'text'} value={value || ''} onChange={e => onChange(e.target.value)} className="mt-1" placeholder={field.placeholder} data-testid={`field-${field.key}`} />;
}

function SectionEditor({ sectionKey }) {
  const schema = AUREX_SECTIONS[sectionKey];
  const [config, setConfig] = useState({});
  const [items, setItems] = useState([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const loadAll = async () => {
    try {
      const c = await adminAPI.getAurexConfig(sectionKey);
      setConfig(c.data || {});
      if (schema.itemFields) {
        const it = await adminAPI.getAurexItems(sectionKey);
        setItems(it.data || []);
      }
    } catch (err) { toast.error(`Failed to load ${schema.label}`); }
  };
  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [sectionKey]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try { await adminAPI.saveAurexConfig(sectionKey, config); toast.success('Saved'); }
    catch (err) { toast.error(err.response?.data?.detail || 'Save failed'); }
    finally { setSavingConfig(false); }
  };

  const handleSaveItem = async () => {
    setSavingItem(true);
    try {
      if (editing?.id) await adminAPI.updateAurexItem(sectionKey, editing.id, editing);
      else await adminAPI.createAurexItem(sectionKey, editing);
      setOpen(false); setEditing(null); await loadAll();
      toast.success('Saved');
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed'); }
    finally { setSavingItem(false); }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete "${label}"?`)) return;
    try { await adminAPI.deleteAurexItem(sectionKey, id); toast.success('Deleted'); await loadAll(); }
    catch (err) { toast.error('Delete failed'); }
  };

  const toggleVisible = async (item) => {
    try { await adminAPI.updateAurexItem(sectionKey, item.id, { ...item, visible: !(item.visible !== false) }); await loadAll(); }
    catch (err) { toast.error('Update failed'); }
  };

  return (
    <div data-testid={`aurex-editor-${sectionKey}`}>
      <div className="mb-4">
        <p className="text-xs text-slate-500">{schema.description}</p>
      </div>
      {/* Config card */}
      <div className="rounded-lg border bg-white p-5 mb-6" style={{ borderColor: 'var(--ad-border, #e2e8f0)' }} data-testid={`config-form-${sectionKey}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ad-heading, #1a2332)' }}>Section configuration</h3>
          <button onClick={handleSaveConfig} disabled={savingConfig} className="text-white px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 disabled:opacity-50" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid={`save-config-${sectionKey}`}>
            {savingConfig ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save config
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {schema.configFields.map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : ''}>
              <Label className="text-xs">{f.label}</Label>
              <FieldInput field={f} value={config[f.key]} onChange={(v) => setConfig({ ...config, [f.key]: v })} />
            </div>
          ))}
        </div>
      </div>

      {/* Items CRUD */}
      {schema.itemFields && (
        <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: 'var(--ad-border, #e2e8f0)' }}>
          <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--ad-border, #e2e8f0)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--ad-heading, #1a2332)' }}>Items ({items.length})</h3>
            <button onClick={() => { setEditing({ visible: true }); setOpen(true); }} className="text-white px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid={`add-item-${sectionKey}`}>
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {items.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">No items yet. Click "Add" to create one.</div>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--ad-border, #e2e8f0)' }}>
              {items.map(item => (
                <li key={item.id} className="p-3 flex items-center gap-3" data-testid={`item-row-${item.id}`}>
                  <span className="text-[10px] text-slate-400 font-mono w-6">#{item.order + 1}</span>
                  {(item.photo_url || item.logo_url || item.icon) && (
                    <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {(item.photo_url || item.logo_url)
                        ? <img src={item.photo_url || item.logo_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[10px] text-slate-500">{item.icon}</span>}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ad-heading, #1a2332)' }}>{schema.itemPreview(item)}</p>
                    {item.description && <p className="text-xs text-slate-400 truncate">{item.description}</p>}
                    {item.badge && <span className="inline-block text-[10px] mt-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{item.badge}</span>}
                  </div>
                  <button onClick={() => toggleVisible(item)} className="p-1.5 hover:bg-slate-100 rounded" data-testid={`toggle-${item.id}`}>
                    {item.visible !== false ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                  </button>
                  <button onClick={() => { setEditing({ ...item }); setOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded" data-testid={`edit-${item.id}`}><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(item.id, schema.itemPreview(item))} className="p-1.5 hover:bg-red-50 text-red-500 rounded" data-testid={`delete-${item.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Item editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>{editing?.id ? 'Edit' : 'New'} — {schema.label}</DialogTitle></DialogHeader>
          {editing && schema.itemFields && (
            <div className="space-y-3">
              {schema.itemFields.map(f => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}{f.required && <span className="text-rose-500"> *</span>}</Label>
                  <FieldInput field={f} value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                </div>
              ))}
              <label className="flex items-center gap-2 text-xs pt-2 border-t" style={{ borderColor: 'var(--ad-border, #e2e8f0)' }}>
                <Switch checked={editing.visible !== false} onCheckedChange={(v) => setEditing({ ...editing, visible: v })} />
                Visible on website
              </label>
              <button onClick={handleSaveItem} disabled={savingItem} className="w-full py-2 rounded-sm text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="aurex-item-save-btn">
                {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editing.id ? 'Update' : 'Create'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AurexSectionsManager() {
  const [active, setActive] = useState('aurex_audience');

  return (
    <div data-testid="aurex-sections-manager">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: "'Playfair Display', serif" }}>
          <Sparkles className="w-5 h-5 text-amber-500" /> Aurex Sections
        </h1>
        <p className="text-sm text-slate-500 mt-1">Content management for the 7 new one-page sections. Only visible when the Aurex theme is active on the website.</p>
      </div>

      {/* Section tab rail */}
      <div className="flex gap-2 mb-6 flex-wrap" data-testid="aurex-tabs">
        {Object.entries(AUREX_SECTIONS).map(([key, schema]) => {
          const Icon = schema.icon;
          const isActive = active === key;
          return (
            <button key={key} onClick={() => setActive(key)} className={`px-4 py-2 rounded-sm text-xs font-medium flex items-center gap-2 transition-colors ${isActive ? 'text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`} style={isActive ? { backgroundColor: 'var(--ad-button-bg, #0D9488)' } : {}} data-testid={`aurex-tab-${key}`}>
              <Icon className="w-3.5 h-3.5" /> {schema.label}
            </button>
          );
        })}
      </div>

      <SectionEditor sectionKey={active} />
    </div>
  );
}
