import React, { useState, useEffect } from 'react';
import { memberAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Loader2, ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';

const v = (name, fb) => `var(--ma-${name}, ${fb})`;

const slotColor = (slot) => {
  if (slot.status === 'inactive' || slot.status === 'cancelled') return '#6b7280';
  const booked = slot.booked_count || 0;
  const max = slot.max_students || 1;
  if (slot.waitlist_count > 0) return '#38bdf8';
  if (booked >= max) return '#ef4444';
  if (booked > 0) return '#eab308';
  return '#22c55e';
};

export default function MentorCalendarView() {
  const [data, setData] = useState({ slots: [], mentor: null });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookDialog, setBookDialog] = useState(null);
  const [booking, setBooking] = useState(false);

  const load = () => {
    setLoading(true);
    memberAPI.getMentorCalendar().then(r => {
      if (r.data?.slots) setData(r.data);
      else setData({ slots: r.data || [], mentor: null });
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const handleBook = async (slotId) => {
    setBooking(true);
    try {
      const r = await memberAPI.bookMentorSlot(slotId);
      toast.success(r.data.status === 'booked' ? 'Booking confirmed!' : 'Added to waiting list');
      setBookDialog(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setBooking(false); }
  };

  const handleCancelBooking = async (slotId) => {
    try { await memberAPI.cancelMentorBooking(slotId); toast.success('Booking cancelled'); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getSlotsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data.slots.filter(s => s.date === dateStr);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: v('accent', '#c9a84c') }} /></div>;

  if (!data.mentor && data.slots.length === 0) {
    return (
      <div data-testid="mentor-calendar-empty">
        <h1 className="text-2xl font-bold mb-4" style={{ color: v('text-primary', '#fff'), fontFamily: "'DM Serif Display', serif" }}>Mentor Calendar</h1>
        <p className="text-sm" style={{ color: v('text-muted', '#6b7280') }}>You don't have a mentor assigned yet, or your mentor hasn't set up their calendar.</p>
      </div>
    );
  }

  return (
    <div data-testid="mentor-calendar-view">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: v('text-primary', '#fff'), fontFamily: "'DM Serif Display', serif" }}>Mentor Calendar</h1>
          {data.mentor && <p className="text-xs mt-1" style={{ color: v('text-secondary', '#9ca3af') }}>Mentor: {data.mentor.name} ({data.mentor.membership_id})</p>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[{ c: '#22c55e', l: 'Available' }, { c: '#eab308', l: 'Few Slots' }, { c: '#ef4444', l: 'Full' }, { c: '#38bdf8', l: 'Waiting List' }, { c: '#6b7280', l: 'Cancelled' }].map(lg => (
          <div key={lg.l} className="flex items-center gap-1.5 text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lg.c }} /> {lg.l}
          </div>
        ))}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded" style={{ color: v('text-secondary', '#9ca3af') }}><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-semibold" style={{ color: v('text-primary', '#fff') }}>{monthLabel}</h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded" style={{ color: v('text-secondary', '#9ca3af') }}><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden" style={{ backgroundColor: v('card-border', 'rgba(255,255,255,0.05)') }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="p-2 text-center text-xs font-medium" style={{ backgroundColor: v('card-bg', '#13161e'), color: v('text-secondary', '#9ca3af') }}>{d}</div>
        ))}
        {days.map((day, i) => {
          const daySlots = getSlotsForDay(day);
          return (
            <div key={i} className="min-h-[80px] p-1.5" style={{ backgroundColor: day ? v('card-bg', '#13161e') : 'transparent' }}>
              {day && (
                <>
                  <span className="text-xs font-medium" style={{ color: v('text-primary', '#fff') }}>{day}</span>
                  {daySlots.map(s => {
                    const color = slotColor(s);
                    const booked = s.booked_count || 0;
                    const max = s.max_students || 1;
                    const isFull = booked >= max;
                    return (
                      <div key={s.id} className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                        onClick={() => s.status === 'active' && setBookDialog(s)}
                        style={{ backgroundColor: color + '20', color: color, borderLeft: `2px solid ${color}` }}
                        data-testid={`mentor-slot-${s.id}`}>
                        {s.start_time}-{s.end_time}
                        {s.my_status === 'booked' && ' (Booked)'}
                        {s.my_status === 'waitlist' && ' (Waitlist)'}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Book Confirmation Dialog */}
      <Dialog open={!!bookDialog} onOpenChange={() => setBookDialog(null)}>
        <DialogContent style={{ backgroundColor: v('card-bg', '#13161e'), color: v('text-primary', '#fff'), borderColor: v('card-border', 'rgba(255,255,255,0.1)') }}>
          <DialogHeader><DialogTitle style={{ fontFamily: "'DM Serif Display', serif", color: v('text-primary', '#fff') }}>Confirm Booking</DialogTitle></DialogHeader>
          {bookDialog && (
            <div className="space-y-3">
              {data.mentor && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4" style={{ color: v('accent', '#c9a84c') }} /> <span>Mentor: {data.mentor.name}</span></div>}
              <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" style={{ color: v('accent', '#c9a84c') }} /> <span>Date: {bookDialog.date}</span></div>
              <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4" style={{ color: v('accent', '#c9a84c') }} /> <span>Time: {bookDialog.start_time} — {bookDialog.end_time}</span></div>
              {bookDialog.description && <div className="text-xs p-2 rounded" style={{ backgroundColor: v('input-bg', '#0d0f14'), color: v('text-secondary', '#9ca3af') }}>{bookDialog.description}</div>}
              <div className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>
                Remaining Slots: {Math.max(0, (bookDialog.max_students || 1) - (bookDialog.booked_count || 0))} / {bookDialog.max_students || 1}
              </div>
              {bookDialog.my_status === 'booked' ? (
                <div className="flex gap-2 pt-2">
                  <span className="flex-1 text-center py-2 rounded text-sm font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>Already Booked</span>
                  <button onClick={() => { handleCancelBooking(bookDialog.id); setBookDialog(null); }} className="flex-1 py-2 rounded text-sm font-medium border" style={{ borderColor: v('card-border', 'rgba(255,255,255,0.1)'), color: v('text-secondary', '#9ca3af') }}>Cancel Booking</button>
                </div>
              ) : bookDialog.my_status === 'waitlist' ? (
                <div className="flex gap-2 pt-2">
                  <span className="flex-1 text-center py-2 rounded text-sm font-medium bg-blue-500/15 text-blue-400">On Waiting List</span>
                  <button onClick={() => { handleCancelBooking(bookDialog.id); setBookDialog(null); }} className="flex-1 py-2 rounded text-sm font-medium border" style={{ borderColor: v('card-border', 'rgba(255,255,255,0.1)'), color: v('text-secondary', '#9ca3af') }}>Cancel</button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setBookDialog(null)} className="flex-1 py-2 rounded text-sm font-medium border" style={{ borderColor: v('card-border', 'rgba(255,255,255,0.1)'), color: v('text-secondary', '#9ca3af') }}>Cancel</button>
                  <button onClick={() => handleBook(bookDialog.id)} disabled={booking} className="flex-1 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0d0f14') }} data-testid="confirm-booking-btn">
                    {booking && <Loader2 className="w-3 h-3 animate-spin" />} Confirm Booking
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
