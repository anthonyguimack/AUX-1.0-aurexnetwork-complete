import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberAPI } from '../../lib/api';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['#c9a84c', '#0D9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444'];

export default function PortfolioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);

  useEffect(() => {
    memberAPI.getPortfolio(id).then(r => setP(r.data)).catch(() => navigate('/my-account/portfolios'));
  }, [id, navigate]);

  if (!p) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full" /></div>;

  const holdings = p.holdings || [];
  const totalHoldings = holdings.reduce((s, h) => s + (h.price * h.shares), 0);
  const totalValue = totalHoldings + (p.cash_balance || 0);
  const cashPct = totalValue > 0 ? ((p.cash_balance || 0) / totalValue * 100) : 0;
  const stockPct = 100 - cashPct;

  // Holdings with calculated values
  const holdingsData = holdings.map(h => ({
    ...h,
    currentValue: h.price * h.shares,
    portfolioPct: totalValue > 0 ? (h.price * h.shares / totalValue * 100) : 0
  }));

  // Sector breakdown
  const sectorMap = {};
  holdingsData.forEach(h => {
    const s = h.sector || 'Other';
    sectorMap[s] = (sectorMap[s] || 0) + h.currentValue;
  });
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({
    name, value, pct: totalValue > 0 ? (value / totalValue * 100).toFixed(1) : 0
  }));

  // Industry breakdown
  const indMap = {};
  holdingsData.forEach(h => {
    const ind = h.industry || h.sector || 'Other';
    indMap[ind] = (indMap[ind] || 0) + h.currentValue;
  });
  const industryData = Object.entries(indMap).map(([name, value]) => ({
    name, value, pct: totalValue > 0 ? (value / totalValue * 100).toFixed(1) : 0
  }));

  return (
    <div data-testid="portfolio-detail-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/my-account/portfolios')} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>{p.title}</h1>
            <p className="text-gray-500 text-sm">As of {p.as_of_date}</p>
          </div>
        </div>
        <button onClick={() => navigate(`/my-account/portfolios/${id}/edit`)}
          className="px-4 py-2 bg-[#c9a84c] text-[#0d0f14] rounded text-sm font-semibold flex items-center gap-2"
          data-testid="edit-portfolio-btn">
          <Edit2 className="w-4 h-4" /> Edit
        </button>
      </div>

      {/* Holdings Table */}
      <div className="bg-[#13161e] border border-white/5 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5 text-gray-400 text-xs">
              <th className="text-left p-3">Symbol</th><th className="text-left p-3">Name</th>
              <th className="text-right p-3">Shares</th><th className="text-right p-3">Price</th>
              <th className="text-right p-3">Current Value</th><th className="text-right p-3">Portfolio %</th>
            </tr></thead>
            <tbody>
              {holdingsData.map((h, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="p-3 text-[#c9a84c] font-mono">{h.symbol}</td>
                  <td className="p-3 text-white">{h.name}</td>
                  <td className="p-3 text-right text-gray-300">{h.shares}</td>
                  <td className="p-3 text-right text-gray-300">${h.price.toFixed(2)}</td>
                  <td className="p-3 text-right text-white font-medium">${h.currentValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  <td className="p-3 text-right text-[#c9a84c]">{h.portfolioPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portfolio Balance */}
      <div className="bg-[#c9a84c] rounded-lg p-5 mb-6 text-center" data-testid="portfolio-balance">
        <p className="text-[#0d0f14] text-sm font-medium">PORTFOLIO BALANCE</p>
        <p className="text-[#0d0f14] text-3xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex justify-center gap-8 mt-2 text-xs text-[#0d0f14]/70">
          <span>Cash: {cashPct.toFixed(1)}%</span>
          <span>Stocks: {stockPct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Holdings Pie */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5" data-testid="holdings-chart">
          <h3 className="text-sm font-semibold text-white mb-3">Current Stock Holdings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={holdingsData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="currentValue" nameKey="symbol">
              {holdingsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip formatter={v => `$${v.toFixed(2)}`} contentStyle={{ background: '#13161e', border: '1px solid rgba(255,255,255,0.1)' }} labelStyle={{ color: '#c9a84c' }} /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {holdingsData.map((h, i) => <span key={i} className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{h.symbol}</span>)}
          </div>
        </div>

        {/* Sector Pie */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-5" data-testid="sector-chart">
          <h3 className="text-sm font-semibold text-white mb-3">Sector</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
              {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip formatter={v => `$${v.toFixed(2)}`} contentStyle={{ background: '#13161e', border: '1px solid rgba(255,255,255,0.1)' }} /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {sectorData.map((s, i) => <span key={i} className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.name} ({s.pct}%)</span>)}
          </div>
        </div>
      </div>

      {/* Activities */}
      {p.activities?.length > 0 && (
        <div className="bg-[#13161e] border border-white/5 rounded-lg overflow-hidden" data-testid="activities-table">
          <h3 className="text-sm font-semibold text-white p-4 border-b border-white/5">Activities</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5 text-gray-400 text-xs">
              <th className="text-left p-3">Date</th><th className="text-left p-3">Type</th>
              <th className="text-left p-3">Symbol</th><th className="text-right p-3">Shares</th>
              <th className="text-right p-3">Price</th><th className="text-left p-3">Notes</th>
            </tr></thead>
            <tbody>{p.activities.map((a, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="p-3 text-gray-400">{a.date}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${a.type === 'buy' ? 'bg-green-500/10 text-green-400' : a.type === 'sell' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{a.type}</span></td>
                <td className="p-3 text-[#c9a84c] font-mono">{a.symbol}</td>
                <td className="p-3 text-right text-gray-300">{a.shares}</td>
                <td className="p-3 text-right text-gray-300">${a.price?.toFixed(2)}</td>
                <td className="p-3 text-gray-400">{a.notes}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
