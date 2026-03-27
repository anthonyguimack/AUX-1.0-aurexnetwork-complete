import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMember } from '../../lib/memberAuth';
import { memberAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Save, Loader2, ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUpload from '../../components/ImageUpload';

const quillDark = "[&_.ql-toolbar]:!bg-[#0d0f14] [&_.ql-toolbar]:!border-white/10 [&_.ql-container]:!border-white/10 [&_.ql-container]:!bg-[#0d0f14] [&_.ql-editor]:!text-white [&_.ql-editor]:!min-h-[100px] [&_.ql-snow_.ql-stroke]:!stroke-gray-400 [&_.ql-snow_.ql-fill]:!fill-gray-400 [&_.ql-snow_.ql-picker-label]:!text-gray-400 [&_.ql-snow_.ql-picker-options]:!bg-[#13161e]";

const emptyHolding = () => ({
  _key: Math.random().toString(36).substr(2,6),
  sector_id: '', industry_id: '', symbol: '', security: '', sector: '', industry: '', price: 0, shares: 0
});

export default function PortfolioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { member } = useMember();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', cover_image: '', as_of_date: '', cash_balance: 0,
    holdings: [], activities: [],
    shared_mode: 'all', shared_with: [], status: 'active',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      memberAPI.getSectors().then(r => setSectors(r.data)),
      memberAPI.getIndustries().then(r => setIndustries(r.data)),
      memberAPI.getCompanies().then(r => setCompanies(r.data)),
      memberAPI.getMembersList().then(r => setAllMembers(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isEdit) {
      memberAPI.getPortfolio(id).then(r => {
        const p = r.data;
        setForm({
          title: p.title || '', description: p.description || '',
          cover_image: p.cover_image || '',
          as_of_date: p.as_of_date || '',
          cash_balance: p.cash_balance || 0,
          holdings: (p.holdings || []).map(h => ({ ...h, _key: Math.random().toString(36).substr(2,6) })),
          activities: p.activities || [],
          shared_mode: p.shared_mode || (p.shared_with?.length > 0 ? 'select' : 'all'),
          shared_with: p.shared_with || [],
          status: p.status || 'active',
        });
      }).catch(() => { toast.error('Portfolio not found'); navigate('/my-account/portfolios'); });
    }
  }, [id]); // eslint-disable-line

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  // Holdings management
  const addHolding = () => setForm(p => ({ ...p, holdings: [...p.holdings, emptyHolding()] }));
  const removeHolding = (idx) => setForm(p => ({ ...p, holdings: p.holdings.filter((_, i) => i !== idx) }));

  const updateHolding = (idx, field, value) => {
    setForm(prev => {
      const h = [...prev.holdings];
      h[idx] = { ...h[idx], [field]: value };

      // Auto-populate cascade
      if (field === 'sector_id') {
        h[idx].industry_id = '';
        h[idx].symbol = '';
        h[idx].security = ''; h[idx].sector = ''; h[idx].industry = ''; h[idx].price = 0;
        const sector = sectors.find(s => s.id === value);
        if (sector) h[idx].sector = sector.name;
      }
      if (field === 'industry_id') {
        h[idx].symbol = '';
        h[idx].security = ''; h[idx].industry = ''; h[idx].price = 0;
        const ind = industries.find(i => i.id === value);
        if (ind) h[idx].industry = ind.name;
      }
      if (field === 'symbol') {
        const comp = companies.find(c => c.symbol === value);
        if (comp) {
          h[idx].security = comp.security;
          h[idx].price = comp.price;
          h[idx].sector = sectors.find(s => s.id === comp.sector_id)?.name || '';
          h[idx].industry = industries.find(i => i.id === comp.industry_id)?.name || '';
          h[idx].sector_id = comp.sector_id;
          h[idx].industry_id = comp.industry_id;
        }
      }
      return { ...prev, holdings: h };
    });
  };

  const filteredIndustries = (sectorId) => industries.filter(i => i.sector_id === sectorId);
  const filteredCompanies = (industryId) => companies.filter(c => c.industry_id === industryId);

  // Shared members management
  const [memberSearch, setMemberSearch] = useState('');
  const memberSearchResults = useMemo(() => {
    if (!memberSearch || form.shared_mode !== 'select') return [];
    const q = memberSearch.toLowerCase();
    return allMembers.filter(m =>
      !form.shared_with.includes(m.member_id) &&
      (`${m.first_name} ${m.last_name} ${m.membership_id}`.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [memberSearch, allMembers, form.shared_with, form.shared_mode]);

  const addSharedMember = (m) => {
    setForm(p => ({ ...p, shared_with: [...p.shared_with, m.member_id] }));
    setMemberSearch('');
  };
  const removeSharedMember = (memberId) => {
    setForm(p => ({ ...p, shared_with: p.shared_with.filter(id => id !== memberId) }));
  };

  const getMemberName = (memberId) => {
    const m = allMembers.find(m => m.member_id === memberId);
    return m ? `${m.membership_id} - ${m.first_name} ${m.last_name}` : memberId;
  };

  // Activities
  const addActivity = () => setForm(p => ({
    ...p, activities: [...p.activities, { date: new Date().toISOString().split('T')[0], type: 'note', description: '' }]
  }));
  const updateActivity = (idx, field, value) => {
    setForm(p => {
      const acts = [...p.activities]; acts[idx] = { ...acts[idx], [field]: value };
      return { ...p, activities: acts };
    });
  };
  const removeActivity = (idx) => setForm(p => ({ ...p, activities: p.activities.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        holdings: form.holdings.map(({ _key, ...h }) => h),
        cash_balance: parseFloat(form.cash_balance) || 0,
      };
      if (isEdit) { await memberAPI.updatePortfolio(id, payload); toast.success('Updated!'); }
      else { await memberAPI.createPortfolio(payload); toast.success('Created!'); }
      navigate('/my-account/portfolios');
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" /></div>;

  const selectCls = "w-full px-3 py-2 bg-[#0d0f14] border border-white/10 text-white rounded-md text-sm focus:outline-none focus:border-[#c9a84c]/50";
  const inputCls = "bg-[#0d0f14] border-white/10 text-white";

  return (
    <div data-testid="portfolio-form-page">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/my-account/portfolios')} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>{isEdit ? 'Edit' : 'New'} Portfolio</h1>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Portfolio Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-xs text-gray-400">Title *</Label><Input value={form.title} onChange={set('title')} className={`mt-1 ${inputCls}`} data-testid="portfolio-title" /></div>
              <div>
                <Label className="text-xs text-gray-400">As of Date *</Label>
                <input type="date" value={form.as_of_date} onChange={set('as_of_date')}
                  className={`mt-1 ${selectCls} cursor-pointer`}
                  onClick={e => e.target.showPicker && e.target.showPicker()}
                  data-testid="portfolio-date" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Description</Label>
              <div className={quillDark}>
                <RichTextEditor value={form.description} onChange={v => setForm(p => ({...p, description: v}))} placeholder="Portfolio description..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-xs text-gray-400">Cash Balance ($)</Label><Input type="number" step="0.01" value={form.cash_balance} onChange={e => setForm(p => ({...p, cash_balance: e.target.value}))} className={`mt-1 ${inputCls}`} data-testid="portfolio-cash" /></div>
              <div>
                <Label className="text-xs text-gray-400">Status</Label>
                <select value={form.status} onChange={set('status')} className={`mt-1 ${selectCls}`} data-testid="portfolio-status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Cover Image</Label>
              <ImageUpload value={form.cover_image} onChange={v => setForm(p => ({...p, cover_image: v}))} />
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400">Holdings</h2>
            <button onClick={addHolding} className="text-xs text-[#c9a84c] hover:underline flex items-center gap-1" data-testid="add-holding-btn"><Plus className="w-3 h-3" /> Add Holding</button>
          </div>
          {form.holdings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No holdings yet. Click "Add Holding" to start.</p>
          ) : (
            <div className="space-y-4">
              {form.holdings.map((h, idx) => (
                <div key={h._key || idx} className="bg-[#0d0f14] rounded-lg p-4 border border-white/5 relative" data-testid={`holding-${idx}`}>
                  <button onClick={() => removeHolding(idx)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Sector</Label>
                      <select value={h.sector_id} onChange={e => updateHolding(idx, 'sector_id', e.target.value)} className={`mt-1 ${selectCls}`} data-testid={`holding-sector-${idx}`}>
                        <option value="">Select Sector</option>
                        {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Industry</Label>
                      <select value={h.industry_id} onChange={e => updateHolding(idx, 'industry_id', e.target.value)} className={`mt-1 ${selectCls}`} disabled={!h.sector_id} data-testid={`holding-industry-${idx}`}>
                        <option value="">Select Industry</option>
                        {filteredIndustries(h.sector_id).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Symbol</Label>
                      <select value={h.symbol} onChange={e => updateHolding(idx, 'symbol', e.target.value)} className={`mt-1 ${selectCls}`} disabled={!h.industry_id} data-testid={`holding-symbol-${idx}`}>
                        <option value="">Select Symbol</option>
                        {filteredCompanies(h.industry_id).map(c => <option key={c.id} value={c.symbol}>{c.symbol} - {c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div>
                      <Label className="text-xs text-gray-500">Security</Label>
                      <Input value={h.security} readOnly className={`mt-1 ${inputCls} cursor-not-allowed opacity-60`} />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Price ($)</Label>
                      <Input type="number" step="0.01" value={h.price} readOnly className={`mt-1 ${inputCls} cursor-not-allowed opacity-60`} />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Shares *</Label>
                      <Input type="number" value={h.shares} onChange={e => updateHolding(idx, 'shares', parseInt(e.target.value) || 0)} className={`mt-1 ${inputCls}`} data-testid={`holding-shares-${idx}`} />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Value</Label>
                      <Input value={`$${((h.price || 0) * (h.shares || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} readOnly className={`mt-1 ${inputCls} cursor-not-allowed opacity-60 text-[#c9a84c]`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared Members */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Shared Members</h2>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="shared_mode" value="all" checked={form.shared_mode === 'all'}
                onChange={() => setForm(p => ({...p, shared_mode: 'all', shared_with: []}))} className="accent-[#c9a84c]" data-testid="share-all-radio" />
              <span className="text-sm text-gray-300">All Members</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="shared_mode" value="select" checked={form.shared_mode === 'select'}
                onChange={() => setForm(p => ({...p, shared_mode: 'select'}))} className="accent-[#c9a84c]" data-testid="share-select-radio" />
              <span className="text-sm text-gray-300">Select Members</span>
            </label>
          </div>
          {form.shared_mode === 'select' && (
            <div>
              <div className="relative">
                <Input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search members by name or ID..."
                  className={`${inputCls}`} data-testid="share-member-search" />
                {memberSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#0d0f14] border border-white/10 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {memberSearchResults.map(m => (
                      <button key={m.member_id} onClick={() => addSharedMember(m)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#c9a84c]/10 hover:text-white">
                        {m.membership_id} - {m.first_name} {m.last_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.shared_with.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.shared_with.map(mid => (
                    <span key={mid} className="inline-flex items-center gap-1 bg-[#c9a84c]/10 text-[#c9a84c] text-xs px-2 py-1 rounded">
                      {getMemberName(mid)}
                      <button onClick={() => removeSharedMember(mid)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {form.shared_mode === 'all' ? 'This portfolio will be visible to all members.' : `Shared with ${form.shared_with.length} selected member(s).`}
          </p>
        </div>

        {/* Activities */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400">Activities</h2>
            <button onClick={addActivity} className="text-xs text-[#c9a84c] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Activity</button>
          </div>
          {form.activities.map((a, idx) => (
            <div key={idx} className="flex gap-2 mb-3 items-start">
              <input type="date" value={a.date || ''} onChange={e => updateActivity(idx, 'date', e.target.value)}
                className={`${selectCls} w-40`} onClick={e => e.target.showPicker && e.target.showPicker()} />
              <select value={a.type || 'note'} onChange={e => updateActivity(idx, 'type', e.target.value)} className={`${selectCls} w-32`}>
                <option value="buy">Buy</option><option value="sell">Sell</option><option value="dividend">Dividend</option><option value="note">Note</option>
              </select>
              <Input value={a.description || ''} onChange={e => updateActivity(idx, 'description', e.target.value)} placeholder="Description" className={`flex-1 ${inputCls}`} />
              <button onClick={() => removeActivity(idx)} className="p-2 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 bg-[#c9a84c] text-[#0d0f14] font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#b8973f] transition-colors disabled:opacity-50"
          data-testid="portfolio-save-btn">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : `${isEdit ? 'Update' : 'Create'} Portfolio`}
        </button>
      </div>
    </div>
  );
}
