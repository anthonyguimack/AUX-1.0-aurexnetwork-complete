import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, Save } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

/**
 * Shared bundle editor dialog.
 * Props: open, onOpenChange, editing, setEditing, onSave, saving, theme ('admin' | 'mentor-dark')
 */
export default function BundleEditorDialog({ open, onOpenChange, editing, setEditing, onSave, saving, theme = 'admin' }) {
  const dark = theme === 'mentor-dark';
  const v = (name, fb) => `var(--ma-${name}, ${fb})`;
  const inputCls = dark
    ? 'w-full mt-1 px-3 py-2 rounded text-sm'
    : 'w-full mt-1 px-3 py-2 border border-slate-200 rounded-sm text-sm';
  const inputStyle = dark
    ? { backgroundColor: v('input-bg', '#0d0f14'), borderColor: v('input-border', 'rgba(255,255,255,0.1)'), color: v('text-primary', '#fff'), border: '1px solid' }
    : undefined;
  const btnBg = dark ? v('button-bg', '#c9a84c') : 'var(--ad-button-bg, #0D9488)';
  const btnText = dark ? v('button-text', '#0d0f14') : '#fff';

  const savings = editing && editing.single_session_value_cents > 0 && editing.session_count > 0
    ? Math.max(0, (editing.session_count * editing.single_session_value_cents) - (editing.price_cents || 0))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto" style={dark ? { backgroundColor: v('card-bg', '#13161e'), color: v('text-primary', '#fff'), border: `1px solid ${v('input-border', 'rgba(255,255,255,0.1)')}` } : undefined} data-testid="bundle-dialog">
        <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.id ? 'Edit' : 'New'} Bundle</DialogTitle></DialogHeader>
        {editing && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="mt-1" placeholder="e.g. 5-Session Starter" data-testid="bundle-name" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Sessions *</Label>
                <Input type="number" min={1} value={editing.session_count || 1} onChange={e => setEditing({ ...editing, session_count: Math.max(1, parseInt(e.target.value) || 1) })} className="mt-1" data-testid="bundle-count" />
              </div>
              <div>
                <Label className="text-xs">Bundle price ($) *</Label>
                <Input type="number" min={0} step="0.01" value={((editing.price_cents || 0) / 100).toFixed(2)} onChange={e => setEditing({ ...editing, price_cents: Math.max(0, Math.round(parseFloat(e.target.value || '0') * 100)) })} className="mt-1" data-testid="bundle-price" />
              </div>
              <div>
                <Label className="text-xs">Single ses. value ($)</Label>
                <Input type="number" min={0} step="0.01" value={((editing.single_session_value_cents || 0) / 100).toFixed(2)} onChange={e => setEditing({ ...editing, single_session_value_cents: Math.max(0, Math.round(parseFloat(e.target.value || '0') * 100)) })} className="mt-1" data-testid="bundle-single-value" />
              </div>
            </div>
            {savings > 0 && (
              <p className="text-[11px]" style={{ color: dark ? v('accent', '#c9a84c') : '#0D9488' }}>
                Shown to members as: <strong>Save ${(savings / 100).toFixed(2)}</strong> vs buying {editing.session_count} single sessions.
              </p>
            )}
            <div>
              <Label className="text-xs">Banner image URL</Label>
              <Input value={editing.banner_url || ''} onChange={e => setEditing({ ...editing, banner_url: e.target.value })} className="mt-1" placeholder="https://…/banner.jpg" style={inputStyle} data-testid="bundle-banner-url" />
              <p className="text-[10px] mt-1" style={{ color: dark ? v('text-muted', '#6b7280') : '#64748b' }}>Shown at the top of the bundle card (matches AUX Calendar list view).</p>
            </div>
            <div>
              <Label className="text-xs">Summary (short)</Label>
              <Input value={editing.summary || ''} onChange={e => setEditing({ ...editing, summary: e.target.value })} className="mt-1" placeholder="Displayed on the bundle card with a Read more link." style={inputStyle} data-testid="bundle-summary" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <div className={`mt-1 ${dark ? 'ma-quill-dark' : ''}`} data-testid="bundle-description-editor">
                <RichTextEditor value={editing.description || ''} onChange={val => setEditing({ ...editing, description: val })} placeholder="What members get…" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" checked={editing.active !== false} onChange={e => setEditing({ ...editing, active: e.target.checked })} id="bundle-active" data-testid="bundle-active" />
              <Label htmlFor="bundle-active" className="text-xs cursor-pointer">Active (visible to members)</Label>
            </div>
            <button onClick={onSave} disabled={saving} className={`w-full py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${inputCls ? '' : ''}`} style={{ backgroundColor: btnBg, color: btnText }} data-testid="bundle-save-btn">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editing.id ? 'Update' : 'Create'} Bundle
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
