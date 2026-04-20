import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Loader2, Plus, Trash2, Edit2, Save, Ticket, Percent, DollarSign, Users, Calendar, ToggleLeft } from 'lucide-react';

const emptyCoupon = {
  code: '',
  discount_type: 'percent',
  discount_value: 10,
  applies_to: 'both',
  usage_mode: 'total',
  usage_limit: 0,
  expires_at: '',
  active: true,
};

const fmtDiscount = (c) => {
  if (!c) return '';
  if (c.discount_type === 'percent') return `${c.discount_value}%`;
  return `$${((c.discount_value || 0) / 100).toFixed(2)}`;
};

export default function AdminCouponsManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminAPI.getCoupons().then(r => setCoupons(r.data || [])).catch(() => toast.error('Failed to load coupons')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => { setEditing({ ...emptyCoupon }); setOpen(true); };
  const openEdit = (c) => {
    let dv = c.discount_value;
    // For flat, UI shows dollars; backend stores cents
    setEditing({ ...c, discount_value: c.discount_type === 'flat' ? dv / 100 : dv, expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '' });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!editing?.code?.trim()) { toast.error('Code is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        code: editing.code.trim().toUpperCase(),
        discount_value: editing.discount_type === 'flat'
          ? Math.max(0, Math.round(parseFloat(editing.discount_value || 0) * 100))
          : Math.max(0, Math.min(100, parseFloat(editing.discount_value || 0))),
        usage_limit: Math.max(0, parseInt(editing.usage_limit || 0)),
        expires_at: editing.expires_at || null,
      };
      if (editing.id) {
        await adminAPI.updateCoupon(editing.id, payload);
        toast.success('Coupon updated');
      } else {
        await adminAPI.createCoupon(payload);
        toast.success('Coupon created');
      }
      setOpen(false); setEditing(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"? This will not revoke past redemptions.`)) return;
    try { await adminAPI.deleteCoupon(id); toast.success('Deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Delete failed'); }
  };

  return (
    <div data-testid="admin-coupons-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: "'Playfair Display', serif" }}>
            <Ticket className="w-6 h-6" style={{ color: 'var(--ad-accent, #0D9488)' }} /> Discount Coupons
          </h1>
          <p className="text-xs text-slate-500 mt-1">Codes can apply to mentorship slots, session bundles, or both — with percentage or flat discounts, expiry, and usage limits.</p>
        </div>
        <button onClick={openNew} className="text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="add-coupon-btn">
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto" style={{ borderColor: 'var(--ad-border, #e2e8f0)' }}>
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">No coupons yet. Create your first one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 font-medium text-xs text-slate-600">Code</th>
                <th className="text-left p-3 font-medium text-xs text-slate-600">Discount</th>
                <th className="text-left p-3 font-medium text-xs text-slate-600">Applies to</th>
                <th className="text-left p-3 font-medium text-xs text-slate-600">Usage</th>
                <th className="text-left p-3 font-medium text-xs text-slate-600">Expires</th>
                <th className="text-left p-3 font-medium text-xs text-slate-600">Status</th>
                <th className="text-right p-3 font-medium text-xs text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-t" style={{ borderColor: 'var(--ad-border, #e2e8f0)' }} data-testid={`coupon-row-${c.id}`}>
                  <td className="p-3 font-mono text-xs font-semibold">{c.code}</td>
                  <td className="p-3 text-xs">
                    <span className="inline-flex items-center gap-1">
                      {c.discount_type === 'percent' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                      {fmtDiscount(c)}
                    </span>
                  </td>
                  <td className="p-3 text-xs capitalize">{c.applies_to}</td>
                  <td className="p-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Users className="w-3 h-3" />
                      {c.usage_limit > 0 ? `${c.usage_count || 0}/${c.usage_limit}` : `${c.usage_count || 0} / ∞`}
                      <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-slate-100">{c.usage_mode === 'per_member' ? 'per member' : 'total'}</span>
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{c.expires_at ? <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {c.expires_at.slice(0, 10)}</span> : '—'}</td>
                  <td className="p-3 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(c)} className="inline-flex p-1.5 hover:bg-slate-100 rounded mr-1" data-testid={`edit-coupon-${c.id}`}><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(c.id, c.code)} className="inline-flex p-1.5 hover:bg-red-50 text-red-500 rounded" data-testid={`delete-coupon-${c.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto" data-testid="coupon-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>{editing?.id ? 'Edit Coupon' : 'New Coupon'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Code *</Label>
                <Input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} className="mt-1 font-mono" placeholder="e.g. SAVE20" data-testid="coupon-code" />
                <p className="text-[10px] text-slate-400 mt-1">Uppercase automatically. Must be unique.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Discount Type *</Label>
                  <div className="flex gap-3 mt-2">
                    {[{ v: 'percent', label: '% Percent', Icon: Percent }, { v: 'flat', label: '$ Flat', Icon: DollarSign }].map(opt => (
                      <label key={opt.v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="radio" name="dtype" value={opt.v} checked={editing.discount_type === opt.v} onChange={() => setEditing({ ...editing, discount_type: opt.v })} data-testid={`coupon-dtype-${opt.v}`} />
                        <opt.Icon className="w-3 h-3" /> {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Discount Value * {editing.discount_type === 'percent' ? '(%)' : '($)'}</Label>
                  <Input type="number" min={0} max={editing.discount_type === 'percent' ? 100 : undefined} step={editing.discount_type === 'percent' ? 1 : 0.01} value={editing.discount_value} onChange={e => setEditing({ ...editing, discount_value: e.target.value })} className="mt-1" data-testid="coupon-value" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Applies To *</Label>
                <div className="flex gap-4 mt-2">
                  {[{ v: 'slots', label: 'Mentorship Slots' }, { v: 'bundles', label: 'Session Bundles' }, { v: 'both', label: 'Both' }].map(opt => (
                    <label key={opt.v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="radio" name="applies" value={opt.v} checked={editing.applies_to === opt.v} onChange={() => setEditing({ ...editing, applies_to: opt.v })} data-testid={`coupon-applies-${opt.v}`} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Usage Mode *</Label>
                  <div className="mt-2 space-y-1.5">
                    {[{ v: 'total', label: 'Total pool (shared)' }, { v: 'per_member', label: 'Per-member' }].map(opt => (
                      <label key={opt.v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="radio" name="umode" value={opt.v} checked={editing.usage_mode === opt.v} onChange={() => setEditing({ ...editing, usage_mode: opt.v })} data-testid={`coupon-umode-${opt.v}`} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Total pool = all redemptions counted together. Per-member = each member can redeem up to limit.</p>
                </div>
                <div>
                  <Label className="text-xs">Usage Limit</Label>
                  <Input type="number" min={0} value={editing.usage_limit} onChange={e => setEditing({ ...editing, usage_limit: e.target.value })} className="mt-1" data-testid="coupon-limit" />
                  <p className="text-[10px] text-slate-400 mt-1">0 = unlimited.</p>
                </div>
              </div>
              <div>
                <Label className="text-xs">Expiration Date (optional)</Label>
                <Input type="date" value={editing.expires_at || ''} onChange={e => setEditing({ ...editing, expires_at: e.target.value })} className="mt-1" data-testid="coupon-expires" />
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
                <input type="checkbox" checked={editing.active !== false} onChange={e => setEditing({ ...editing, active: e.target.checked })} data-testid="coupon-active" />
                <ToggleLeft className="w-3.5 h-3.5" /> Active (members can redeem)
              </label>
              <button onClick={handleSave} disabled={saving} className="w-full py-2 rounded-sm text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="coupon-save-btn">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editing.id ? 'Update' : 'Create'} Coupon
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
