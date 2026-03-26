import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { memberAPI } from '../../lib/api';
import { Plus, Eye, Edit2, Briefcase } from 'lucide-react';

export default function PortfolioList() {
  const [data, setData] = useState({ own: [], shared: [] });
  const [tab, setTab] = useState('own');
  const navigate = useNavigate();

  useEffect(() => { memberAPI.getPortfolios().then(r => setData(r.data)).catch(console.error); }, []);

  const items = tab === 'own' ? data.own : data.shared;

  const calcTotal = (p) => {
    const holdingsVal = (p.holdings || []).reduce((sum, h) => sum + (h.price || 0) * (h.shares || 0), 0);
    return holdingsVal + (p.cash_balance || 0);
  };

  return (
    <div data-testid="portfolio-list-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>My Account</h1>
          <p className="text-gray-500 text-sm">Portfolio List</p>
        </div>
        <button onClick={() => navigate('/my-account/portfolios/new')}
          className="px-4 py-2 bg-[#c9a84c] text-[#0d0f14] rounded text-sm font-semibold flex items-center gap-2 hover:bg-[#d4b85d]"
          data-testid="add-portfolio-btn">
          <Plus className="w-4 h-4" /> Add new portfolio
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#13161e] rounded-lg p-1 w-fit">
        {[['own', 'My Portfolios'], ['shared', 'Shared Portfolios']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${tab === key ? 'bg-[#c9a84c] text-[#0d0f14]' : 'text-gray-400 hover:text-white'}`}
            data-testid={`tab-${key}`}>{label}</button>
        ))}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No portfolios yet</p>
          {tab === 'own' && <button onClick={() => navigate('/my-account/portfolios/new')} className="mt-3 text-[#c9a84c] text-sm hover:underline">Create your first portfolio</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(p => (
            <div key={p.id} className="bg-[#13161e] border border-white/5 rounded-lg overflow-hidden group hover:border-[#c9a84c]/30 transition-colors" data-testid={`portfolio-card-${p.id}`}>
              {p.cover_image && <div className="h-32 overflow-hidden"><img src={p.cover_image?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${p.cover_image}` : p.cover_image} alt="" className="w-full h-full object-cover" /></div>}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                    {p.status || 'Active'}
                  </span>
                  <span className="text-xs text-gray-500">{p.as_of_date}</span>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{p.title}</h3>
                <p className="text-gray-500 text-xs mb-1">Member: {p.owner_name || p.owner_membership_id}</p>
                <p className="text-gray-400 text-xs line-clamp-2 mb-3">{p.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[#c9a84c] font-bold text-sm">${calcTotal(p).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  <div className="flex gap-1">
                    <Link to={`/my-account/portfolios/${p.id}`} className="p-1.5 text-gray-400 hover:text-[#c9a84c]"><Eye className="w-4 h-4" /></Link>
                    {tab === 'own' && <Link to={`/my-account/portfolios/${p.id}/edit`} className="p-1.5 text-gray-400 hover:text-[#c9a84c]"><Edit2 className="w-4 h-4" /></Link>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
