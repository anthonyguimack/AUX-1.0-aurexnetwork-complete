import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Trash2, Bell } from 'lucide-react';

export default function LandingSubscribersManager() {
  const [items, setItems] = useState([]);

  const load = () => adminAPI.getLandingSubscribers().then(r => setItems(r.data || [])).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscriber?')) return;
    await adminAPI.deleteLandingSubscriber(id);
    toast.success('Deleted');
    load();
  };

  return (
    <div data-testid="landing-subscribers-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}>Landing Page Subscribers</h1>
        <span className="text-sm px-3 py-1 rounded-sm" style={{ backgroundColor: 'var(--ad-accent, #0D9488)', color: '#fff' }}>{items.length} subscribers</span>
      </div>
      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ backgroundColor: 'var(--ad-table-header-bg, #f8fafc)' }}>
              <th className="text-left p-3">First Name</th>
              <th className="text-left p-3">Last Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Date</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-50" data-testid={`subscriber-row-${item.id}`}>
                <td className="p-3 font-medium flex items-center gap-2"><Bell className="w-3 h-3" style={{ color: 'var(--ad-accent, #0D9488)' }} />{item.first_name || '—'}</td>
                <td className="p-3 text-slate-500">{item.last_name || '—'}</td>
                <td className="p-3 text-slate-600">{item.email}</td>
                <td className="p-3 text-slate-400 text-xs">{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500" data-testid={`delete-subscriber-${item.id}`}><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No subscribers yet</div>}
      </div>
    </div>
  );
}
