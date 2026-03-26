import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { memberAPI } from '../../lib/api';
import { toast } from 'sonner';
import ImageUpload from '../../components/ImageUpload';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, Trash2, Save, Loader2, ArrowLeft } from 'lucide-react';

const emptyHolding = { symbol: '', name: '', sector: '', industry: '', shares: 0, price: 0 };
const emptyActivity = { date: '', type: 'buy', symbol: '', shares: 0, price: 0, notes: '' };

export default function PortfolioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', cover_image: '', as_of_date: new Date().toISOString().split('T')[0],
    cash_balance: 0, holdings: [{ ...emptyHolding }], activities: [], status: 'active'
  });

  useEffect(() => {
    if (isEdit) {
      memberAPI.getPortfolio(id).then(r => {
        const d = r.data;
        setForm({
          title: d.title || '', description: d.description || '', cover_image: d.cover_image || '',
          as_of_date: d.as_of_date || '', cash_balance: d.cash_balance || 0,
          holdings: d.holdings?.length ? d.holdings : [{ ...emptyHolding }],
          activities: d.activities || [], status: d.status || 'active'
        });
      }).catch(() => { toast.error('Portfolio not found'); navigate('/my-account/portfolios'); });
    }
  }, [id, isEdit, navigate]);

  const updateHolding = (idx, field, value) => {
    setForm(p => {
      const h = [...p.holdings];
      h[idx] = { ...h[idx], [field]: field === 'shares' || field === 'price' ? parseFloat(value) || 0 : value };
      return { ...p, holdings: h };
    });
  };

  const addHolding = () => setForm(p => ({ ...p, holdings: [...p.holdings, { ...emptyHolding }] }));
  const removeHolding = (idx) => setForm(p => ({ ...p, holdings: p.holdings.filter((_, i) => i !== idx) }));

  const updateActivity = (idx, field, value) => {
    setForm(p => {
      const a = [...p.activities];
      a[idx] = { ...a[idx], [field]: field === 'shares' || field === 'price' ? parseFloat(value) || 0 : value };
      return { ...p, activities: a };
    });
  };

  const addActivity = () => setForm(p => ({ ...p, activities: [...p.activities, { ...emptyActivity, date: new Date().toISOString().split('T')[0] }] }));
  const removeActivity = (idx) => setForm(p => ({ ...p, activities: p.activities.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setLoading(true);
    try {
      if (isEdit) await memberAPI.updatePortfolio(id, form);
      else await memberAPI.createPortfolio(form);
      toast.success(isEdit ? 'Updated!' : 'Created!');
      navigate('/my-account/portfolios');
    } catch (e) { toast.error(e.response?.data?.detail || 'Error saving'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this portfolio?')) return;
    try { await memberAPI.deletePortfolio(id); toast.success('Deleted'); navigate('/my-account/portfolios'); }
    catch { toast.error('Error deleting'); }
  };

  return (
    <div data-testid="portfolio-form-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/my-account/portfolios')} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>{isEdit ? 'Edit' : 'Add'} Portfolio</h1>
        </div>
        <div className="flex gap-2">
          {isEdit && <button onClick={handleDelete} className="px-4 py-2 border border-red-500/30 text-red-400 rounded text-sm hover:bg-red-500/10">Delete</button>}
          <button onClick={handleSave} disabled={loading}
            className="px-4 py-2 bg-[#c9a84c] text-[#0d0f14] rounded text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            data-testid="save-portfolio-btn">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-gray-400 text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className="bg-[#0d0f14] border-white/10 text-white mt-1" data-testid="portfolio-title-input" /></div>
            <div><Label className="text-gray-400 text-xs">As of Date</Label><Input type="date" value={form.as_of_date} onChange={e => setForm(p => ({...p, as_of_date: e.target.value}))} className="bg-[#0d0f14] border-white/10 text-white mt-1" /></div>
          </div>
          <div><Label className="text-gray-400 text-xs">Description</Label><textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} className="w-full px-3 py-2 bg-[#0d0f14] border border-white/10 rounded text-white text-sm mt-1 focus:outline-none" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-gray-400 text-xs">Cover Image</Label><ImageUpload value={form.cover_image} onChange={val => setForm(p => ({...p, cover_image: val}))} className="mt-1" /></div>
            <div className="space-y-3">
              <div><Label className="text-gray-400 text-xs">Cash Balance ($)</Label><Input type="number" step="0.01" value={form.cash_balance} onChange={e => setForm(p => ({...p, cash_balance: parseFloat(e.target.value) || 0}))} className="bg-[#0d0f14] border-white/10 text-white mt-1" /></div>
              <div><Label className="text-gray-400 text-xs">Status</Label>
                <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className="w-full px-3 py-2 bg-[#0d0f14] border border-white/10 rounded text-white text-sm mt-1">
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Holdings</h3>
            <button onClick={addHolding} className="text-xs text-[#c9a84c] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
          </div>
          <div className="space-y-3">
            {form.holdings.map((h, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 items-end" data-testid={`holding-row-${i}`}>
                <div><label className="text-xs text-gray-500">Symbol</label><input value={h.symbol} onChange={e => updateHolding(i, 'symbol', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <div><label className="text-xs text-gray-500">Name</label><input value={h.name} onChange={e => updateHolding(i, 'name', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <div><label className="text-xs text-gray-500">Sector</label><input value={h.sector} onChange={e => updateHolding(i, 'sector', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <div><label className="text-xs text-gray-500">Shares</label><input type="number" value={h.shares} onChange={e => updateHolding(i, 'shares', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <div><label className="text-xs text-gray-500">Price ($)</label><input type="number" step="0.01" value={h.price} onChange={e => updateHolding(i, 'price', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <button onClick={() => removeHolding(i)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Activities</h3>
            <button onClick={addActivity} className="text-xs text-[#c9a84c] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
          </div>
          <div className="space-y-3">
            {form.activities.map((a, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 items-end" data-testid={`activity-row-${i}`}>
                <div><label className="text-xs text-gray-500">Date</label><input type="date" value={a.date} onChange={e => updateActivity(i, 'date', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <div><label className="text-xs text-gray-500">Type</label><select value={a.type} onChange={e => updateActivity(i, 'type', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs"><option value="buy">Buy</option><option value="sell">Sell</option><option value="dividend">Dividend</option></select></div>
                <div><label className="text-xs text-gray-500">Symbol</label><input value={a.symbol} onChange={e => updateActivity(i, 'symbol', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <div><label className="text-xs text-gray-500">Shares</label><input type="number" value={a.shares} onChange={e => updateActivity(i, 'shares', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <div><label className="text-xs text-gray-500">Price ($)</label><input type="number" step="0.01" value={a.price} onChange={e => updateActivity(i, 'price', e.target.value)} className="w-full px-2 py-1.5 bg-[#0d0f14] border border-white/10 rounded text-white text-xs" /></div>
                <button onClick={() => removeActivity(i)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {form.activities.length === 0 && <p className="text-gray-500 text-xs text-center py-3">No activities yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
