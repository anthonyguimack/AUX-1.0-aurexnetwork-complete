import React, { useState, useEffect } from 'react';
import { enrollmentAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Save, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email' },
  { value: 'password', label: 'Password' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'date', label: 'Date Picker (mm/dd/yyyy)' },
  { value: 'datetime', label: 'Date & Time (mm/dd/yyyy HH:mm:ss)' },
  { value: 'select', label: 'Select Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'rating_table', label: 'Rating Table' },
  { value: 'legal_checkbox', label: 'Legal Agreement Checkbox' },
  { value: 'signature_text', label: 'Signature Text' },
  { value: 'signature_date', label: 'Signature Date' },
  { value: 'country', label: 'Country Selector' },
  { value: 'state', label: 'State Selector' },
  { value: 'city', label: 'City Selector' },
];

const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'user', label: 'User' },
  { value: 'mail', label: 'Mail' },
  { value: 'lock', label: 'Lock' },
  { value: 'phone', label: 'Phone' },
  { value: 'map-pin', label: 'Map Pin' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'book', label: 'Book' },
  { value: 'pen', label: 'Pen' },
  { value: 'hash', label: 'Hash' },
  { value: 'dollar-sign', label: 'Dollar Sign' },
  { value: 'gift', label: 'Gift' },
  { value: 'shield', label: 'Shield' },
  { value: 'globe', label: 'Globe' },
  { value: 'home', label: 'Home' },
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'flag', label: 'Flag' },
  { value: 'file-text', label: 'File Text' },
  { value: 'award', label: 'Award' },
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'trending-up', label: 'Trending Up' },
  { value: 'bar-chart', label: 'Bar Chart' },
  { value: 'clipboard', label: 'Clipboard' },
  { value: 'target', label: 'Target' },
  { value: 'info', label: 'Info' },
  { value: 'check-circle', label: 'Check Circle' },
  { value: 'alert-circle', label: 'Alert Circle' },
];

const inputCls = "w-full border rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]";
const STEP_NAMES = { 1: 'Step 1 - Invitation CODE', 2: 'Step 2 - Clarity Statement and Interview', 3: 'Step 3 - Application Enrollment' };

export default function EnrollmentFieldsManager() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = list view, object = editing

  const load = () => {
    setLoading(true);
    enrollmentAPI.adminGetFields().then(r => { setFields(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleVisibility = async (field) => {
    try {
      await enrollmentAPI.adminToggleVisibility(field.id, !field.visible);
      setFields(prev => prev.map(f => f.id === field.id ? { ...f, visible: !f.visible } : f));
      toast.success(`Field ${field.visible ? 'hidden' : 'shown'}`);
    } catch { toast.error('Failed to update visibility'); }
  };

  const deleteField = async (field) => {
    if (!window.confirm(`Delete "${field.label}" permanently?`)) return;
    try {
      await enrollmentAPI.adminDeleteField(field.id);
      setFields(prev => prev.filter(f => f.id !== field.id));
      toast.success('Field deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (field) => setEditing({ ...field, _options_text: (field.options || []).join('\n') });
  const openNew = () => setEditing({ id: null, step: 1, field_key: '', label: '', field_type: 'text', placeholder: '', tooltip: '', required: false, visible: true, options: [], icon: '', _options_text: '' });

  const saveField = async () => {
    if (!editing.label || !editing.field_key) { toast.error('Label and Field Key are required'); return; }
    const data = { ...editing, options: editing._options_text ? editing._options_text.split('\n').map(s => s.trim()).filter(Boolean) : [] };
    delete data._options_text;
    try {
      if (editing.id) {
        await enrollmentAPI.adminUpdateField(editing.id, data);
        toast.success('Field updated');
      } else {
        await enrollmentAPI.adminCreateField(data);
        toast.success('Field created');
      }
      setEditing(null);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Save failed'); }
  };

  if (editing) {
    return (
      <div data-testid="enrollment-field-editor">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditing(null)} className="p-1.5 rounded hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}>{editing.id ? 'Edit Field' : 'Add Field'}</h1>
        </div>
        <div className="bg-white rounded border p-6 space-y-5 max-w-2xl" style={{ borderColor: 'var(--ad-card-border, #e2e8f0)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500">Step*</Label>
              <select value={editing.step} onChange={e => setEditing(p => ({ ...p, step: parseInt(e.target.value) }))} className={inputCls} data-testid="ef-step">
                {Object.entries(STEP_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Field Type*</Label>
              <select value={editing.field_type} onChange={e => setEditing(p => ({ ...p, field_type: e.target.value }))} className={inputCls} data-testid="ef-type">
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500">Field Key* (unique identifier)</Label>
              <Input value={editing.field_key} onChange={e => setEditing(p => ({ ...p, field_key: e.target.value.replace(/\s/g, '_').toLowerCase() }))} placeholder="e.g. phone_number" data-testid="ef-key" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Label*</Label>
              <Input value={editing.label} onChange={e => setEditing(p => ({ ...p, label: e.target.value }))} placeholder="Display label" data-testid="ef-label" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500">Placeholder</Label>
              <Input value={editing.placeholder} onChange={e => setEditing(p => ({ ...p, placeholder: e.target.value }))} placeholder="If empty, won't appear" data-testid="ef-placeholder" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Tooltip / Help Text</Label>
              <Input value={editing.tooltip} onChange={e => setEditing(p => ({ ...p, tooltip: e.target.value }))} placeholder="Guidance for the user" data-testid="ef-tooltip" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Icon</Label>
            <select value={editing.icon || ''} onChange={e => setEditing(p => ({ ...p, icon: e.target.value }))} className={inputCls} data-testid="ef-icon">
              {ICON_OPTIONS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
            </select>
          </div>
          {['select', 'radio', 'checkbox', 'rating_table', 'legal_checkbox'].includes(editing.field_type) && (
            <div>
              <Label className="text-xs text-slate-500">Options (one per line)</Label>
              <textarea value={editing._options_text} onChange={e => setEditing(p => ({ ...p, _options_text: e.target.value }))} rows={5} className={inputCls} placeholder="Option 1&#10;Option 2&#10;Option 3" data-testid="ef-options" />
            </div>
          )}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={editing.required} onChange={e => setEditing(p => ({ ...p, required: e.target.checked }))} className="accent-[#0D9488]" data-testid="ef-required" />
              Required field
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={editing.visible} onChange={e => setEditing(p => ({ ...p, visible: e.target.checked }))} className="accent-[#0D9488]" data-testid="ef-visible" />
              Visible on form
            </label>
          </div>
          {editing.field_type === 'number' || editing.field_type === 'text' || true ? (
            <div>
              <Label className="text-xs text-slate-500">Display Order</Label>
              <Input type="number" value={editing.order || ''} onChange={e => setEditing(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} data-testid="ef-order" />
            </div>
          ) : null}
          <div className="flex gap-3 pt-2">
            <button onClick={saveField} className="px-5 py-2 rounded text-sm font-medium text-white flex items-center gap-2" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="ef-save">
              <Save className="w-4 h-4" /> {editing.id ? 'Update Field' : 'Create Field'}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2 rounded text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  const grouped = {};
  fields.forEach(f => {
    if (!grouped[f.step]) grouped[f.step] = [];
    grouped[f.step].push(f);
  });

  const moveField = async (step, index, direction) => {
    const stepFields = grouped[step] || [];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stepFields.length) return;
    const newOrder = [...stepFields];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    const orderedIds = newOrder.map(f => f.id);
    try {
      await enrollmentAPI.adminReorderFields(orderedIds);
      load();
    } catch { toast.error('Failed to reorder'); }
  };

  return (
    <div data-testid="enrollment-fields-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}>Enrollment Form Fields</h1>
        <button onClick={openNew} className="text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="ef-add-btn">
          <Plus className="w-4 h-4" /> Add Field
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-6">
          {[1, 2, 3].map(step => (
            <div key={step} className="bg-white rounded border" style={{ borderColor: 'var(--ad-card-border, #e2e8f0)' }}>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--ad-card-border, #e2e8f0)', backgroundColor: 'var(--ad-table-header-bg, #f8fafc)' }}>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--ad-heading, #1a2332)' }}>{STEP_NAMES[step]}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--ad-badge-bg, #0D9488)', color: 'var(--ad-badge-text, #fff)' }}>{(grouped[step] || []).length} fields</span>
              </div>
              <div>
                {(grouped[step] || []).map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0 hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--ad-table-border, #e2e8f0)' }} data-testid={`ef-row-${f.field_key}`}>
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveField(step, idx, -1)} disabled={idx === 0} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-20" data-testid={`ef-up-${f.field_key}`}><ChevronUp className="w-3.5 h-3.5 text-slate-400" /></button>
                      <button onClick={() => moveField(step, idx, 1)} disabled={idx === (grouped[step] || []).length - 1} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-20" data-testid={`ef-down-${f.field_key}`}><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: f.visible ? 'var(--ad-heading, #1a2332)' : '#9ca3af' }}>{f.label}</p>
                      <p className="text-xs text-slate-400">{f.field_key} &middot; {f.field_type}{f.required ? ' \u00b7 required' : ''}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleVisibility(f)} className={`p-1.5 rounded hover:bg-slate-100 ${f.visible ? 'text-slate-500' : 'text-slate-300'}`} title={f.visible ? 'Hide field' : 'Show field'} data-testid={`ef-vis-${f.field_key}`}>
                        {f.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Edit" data-testid={`ef-edit-${f.field_key}`}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteField(f)} className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600" title="Delete" data-testid={`ef-del-${f.field_key}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!grouped[step] || grouped[step].length === 0) && (
                  <p className="px-5 py-4 text-sm text-slate-400">No fields in this step.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
