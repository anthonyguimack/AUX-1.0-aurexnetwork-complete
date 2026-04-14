import React, { useState, useEffect } from 'react';
import { memberAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';

const v = (name, fb) => `var(--ma-${name}, ${fb})`;

const statusStyle = {
  booked: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Upcoming' },
  completed: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Completed' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Cancelled' },
  waitlist: { bg: 'rgba(56,189,248,0.15)', color: '#38bdf8', label: 'Waiting List' },
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    memberAPI.getMyBookings().then(r => { setBookings(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCancel = async (slotId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try { await memberAPI.cancelMentorBooking(slotId); toast.success('Cancelled'); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: v('accent', '#c9a84c') }} /></div>;

  return (
    <div data-testid="my-bookings-page">
      <h1 className="text-2xl font-bold mb-6" style={{ color: v('text-primary', '#fff'), fontFamily: "'DM Serif Display', serif" }}>My Reservations</h1>

      <div className="rounded-lg border overflow-x-auto" style={{ backgroundColor: v('card-bg', '#13161e'), borderColor: v('card-border', 'rgba(255,255,255,0.05)') }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${v('card-border', 'rgba(255,255,255,0.05)')}` }}>
              <th className="text-left p-3 font-medium text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Date</th>
              <th className="text-left p-3 font-medium text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Time</th>
              <th className="text-left p-3 font-medium text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Mentor</th>
              <th className="text-left p-3 font-medium text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Type</th>
              <th className="text-left p-3 font-medium text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Status</th>
              <th className="text-right p-3 font-medium text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => {
              const st = statusStyle[b.status] || statusStyle.booked;
              return (
                <tr key={b.id} style={{ borderBottom: `1px solid ${v('card-border', 'rgba(255,255,255,0.05)')}` }} data-testid={`booking-row-${b.id}`}>
                  <td className="p-3 text-xs" style={{ color: v('text-primary', '#fff') }}>{b.date || '-'}</td>
                  <td className="p-3 text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>{b.start_time} - {b.end_time}</td>
                  <td className="p-3 text-xs" style={{ color: v('text-primary', '#fff') }}>{b.mentor_name || '-'}</td>
                  <td className="p-3 text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>{b.session_type || '-'}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span></td>
                  <td className="p-3 text-right">
                    {(b.status === 'booked' || b.status === 'waitlist') && (
                      <button onClick={() => handleCancel(b.slot_id)} className="text-xs px-3 py-1 rounded border font-medium" style={{ borderColor: v('card-border', 'rgba(255,255,255,0.1)'), color: v('text-secondary', '#9ca3af') }} data-testid={`cancel-booking-${b.id}`}>Cancel</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <div className="p-12 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-3" style={{ color: v('text-muted', '#6b7280') }} />
            <p className="text-sm" style={{ color: v('text-muted', '#6b7280') }}>No reservations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
