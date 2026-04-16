import React, { useState, useEffect, useMemo } from 'react';
import { useMember } from '../../lib/memberAuth';
import { memberAPI, publicAPI } from '../../lib/api';
import { toast } from 'sonner';
import { User, Loader2, ChevronLeft, ChevronRight, Calendar, Clock, Users, List, Grid3X3, Video, Download, Paperclip, ExternalLink, Map } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const v = (name, fb) => `var(--ma-${name}, ${fb})`;
const API = process.env.REACT_APP_BACKEND_URL;
const todayStr = () => new Date().toISOString().split('T')[0];
const nowTimeStr = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return `${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}/${dt.getFullYear()}`;
};

const slotColor = (slot) => {
  const isPast = slot.date < todayStr() || (slot.date === todayStr() && slot.start_time < nowTimeStr());
  if (isPast) return '#6b7280';
  if (slot.status !== 'active') return '#6b7280';
  const booked = slot.booked_count || 0;
  const max = slot.max_students || 1;
  if (slot.waitlist_count > 0) return '#38bdf8';
  if (booked >= max) return '#ef4444';
  if (booked > 0) return '#eab308';
  return '#22c55e';
};

const isSlotPast = (slot) => slot.date < todayStr() || (slot.date === todayStr() && slot.start_time < nowTimeStr());

function SlotCard({ slot, onBook, onCancel }) {
  const isPast = isSlotPast(slot);
  const booked = slot.booked_count || 0;
  const max = slot.max_students || 1;
  const isFull = booked >= max;
  const color = slotColor(slot);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: v('card-bg', '#13161e'), borderColor: v('card-border', 'rgba(255,255,255,0.05)'), borderLeft: `3px solid ${color}`, opacity: isPast ? 0.6 : 1 }} data-testid={`slot-card-${slot.id}`}>
      <div className="p-4">
        {slot.title && <p className="text-xs font-semibold mb-1" style={{ color: v('text-primary', '#fff') }}>{slot.title}</p>}
        <div className="space-y-1 text-xs mb-2" style={{ color: v('text-secondary', '#9ca3af') }}>
          <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{slot.date} &middot; {slot.start_time} - {slot.end_time}</div>
          <div className="flex items-center gap-1.5"><Users className="w-3 h-3" />{Math.max(0, max - booked)} / {max} spots &middot; {slot.session_type}</div>
          {slot.virtual_link && slot.my_status === 'booked' && <a href={slot.virtual_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:opacity-80" style={{ color: v('accent', '#c9a84c') }}><Video className="w-3 h-3" /> Virtual Link <ExternalLink className="w-2.5 h-2.5" /></a>}
        </div>
        {slot.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: v('text-muted', '#6b7280') }}>{slot.description}</p>}
        {(slot.attachments || []).length > 0 && (
          <div className="mb-2 space-y-1">
            {slot.attachments.map((att, idx) => (
              <a key={idx} href={`${API}${att.url}`} target="_blank" rel="noopener noreferrer" download={att.name} className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] hover:opacity-80" style={{ backgroundColor: v('input-bg', '#0d0f14'), color: v('text-secondary', '#9ca3af') }}>
                <Paperclip className="w-3 h-3" style={{ color: v('accent', '#c9a84c') }} /><span className="truncate flex-1">{att.name}</span><Download className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}
        {!isPast && (
          <div className="flex items-center gap-2 flex-wrap">
            {slot.my_status === 'booked' ? (
              <>
                <span className="text-xs px-3 py-1.5 rounded font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>Booked</span>
                <button onClick={() => onCancel(slot.id)} className="text-xs px-3 py-1.5 rounded border font-medium" style={{ borderColor: v('card-border', 'rgba(255,255,255,0.1)'), color: v('text-secondary', '#9ca3af') }}>Cancel</button>
              </>
            ) : slot.my_status === 'waitlist' ? (
              <>
                <span className="text-xs px-3 py-1.5 rounded font-medium bg-blue-500/15 text-blue-400">Waiting List</span>
                {!isFull && <button onClick={() => onBook(slot)} className="text-xs px-3 py-1.5 rounded font-medium" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0d0f14') }}>Book this slot</button>}
                <button onClick={() => onCancel(slot.id)} className="text-xs px-3 py-1.5 rounded border font-medium" style={{ borderColor: v('card-border', 'rgba(255,255,255,0.1)'), color: v('text-secondary', '#9ca3af') }}>Cancel</button>
              </>
            ) : isFull ? (
              <button onClick={() => onBook(slot)} className="text-xs px-3 py-1.5 rounded font-medium bg-blue-500/15 text-blue-400">Waiting List</button>
            ) : (
              <button onClick={() => onBook(slot)} className="text-xs px-4 py-1.5 rounded font-medium" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0d0f14') }}>Book this slot</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MentorshipProfile() {
  const { member } = useMember();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  // Calendar state
  const [calData, setCalData] = useState({ slots: [], mentor: null });
  const [calLoading, setCalLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calView, setCalView] = useState('month');
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookDialog, setBookDialog] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    Promise.all([
      memberAPI.getMentor().then(r => setMentor(r.data)).catch(() => setMentor(null)),
      publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const loadCalendar = () => {
    setCalLoading(true);
    memberAPI.getMentorCalendar().then(r => {
      if (r.data?.slots) setCalData(r.data);
      else setCalData({ slots: r.data || [], mentor: null });
      setCalLoading(false);
    }).catch(() => setCalLoading(false));
  };
  useEffect(() => { if (mentor) loadCalendar(); }, [mentor]); // eslint-disable-line

  const handleBook = async (slot) => {
    const booked = slot.booked_count || 0;
    const max = slot.max_students || 1;
    setBookDialog({ ...slot, _isWaitlist: booked >= max && slot.my_status !== 'waitlist' });
  };

  const confirmBook = async (slotId) => {
    setBooking(true);
    try {
      const r = await memberAPI.bookMentorSlot(slotId);
      toast.success(r.data.status === 'booked' ? 'Booking confirmed!' : 'Added to waiting list');
      setBookDialog(null); loadCalendar();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setBooking(false); }
  };

  const handleCancelBooking = async (slotId) => {
    try { await memberAPI.cancelMentorBooking(slotId); toast.success('Cancelled'); loadCalendar(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const defaultAvatar = settings.membership_default_avatar || '';

  // Calendar helpers (must be before early returns for hooks rule)
  const year = currentDate.getFullYear();
  const mo = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const calDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDay, daysInMonth]);
  const getSlotsForDay = (day) => {
    if (!day) return [];
    const ds = `${year}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return calData.slots.filter(s => s.date === ds);
  };
  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    const ds = `${year}-${String(mo+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
    return calData.slots.filter(s => s.date === ds);
  }, [selectedDay, calData.slots, year, mo]);

  if (loading) {
    return <div className="flex items-center justify-center py-20" data-testid="mentorship-profile-page"><Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" /></div>;
  }

  if (!mentor) {
    return (
      <div data-testid="mentorship-profile-page">
        <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Mentorship Profile</h1>
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#c9a84c]/10 border-2 border-[#c9a84c]/20 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#c9a84c]/40" />
          </div>
          <p className="text-gray-400 text-sm">No mentor has been assigned to your account yet.</p>
        </div>
      </div>
    );
  }

  const mentorAvatar = mentor.avatar || defaultAvatar;
  const fields = [
    { label: 'Name', value: `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() },
    { label: 'Membership Number', value: mentor.membership_id || '-' },
    { label: 'Email', value: mentor.email || '-' },
    { label: 'Phone Number', value: mentor.phone || '-' },
    { label: 'Address', value: mentor.address || '-' },
    { label: 'Country', value: mentor.country || '-' },
    { label: 'State', value: mentor.state || '-' },
    { label: 'City', value: mentor.city || '-' },
    { label: 'ZIP Code', value: mentor.zip_code || '-' },
    { label: 'Date of Birth', value: formatDate(mentor.date_of_birth) },
    { label: 'Google Account', value: mentor.google_account || '-' },
  ];

  return (
    <div data-testid="mentorship-profile-page">
      <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Mentorship Profile</h1>

      {/* Mentor Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Your Mentor</h3>
          <div className="w-32 h-32 rounded-full bg-[#c9a84c]/10 border-2 border-[#c9a84c]/30 flex items-center justify-center overflow-hidden" data-testid="mentor-avatar">
            {mentorAvatar ? <img src={mentorAvatar} alt={`${mentor.first_name} ${mentor.last_name}`} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-[#c9a84c]/50" />}
          </div>
          <p className="mt-3 text-white font-medium" data-testid="mentor-name">{mentor.first_name} {mentor.last_name}</p>
          <p className="text-[#c9a84c] text-xs mt-1" data-testid="mentor-membership-id">{mentor.membership_id}</p>
        </div>
        <div className="lg:col-span-2 bg-[#13161e] border border-white/5 rounded-lg">
          <div className="border-b border-white/5 p-4">
            <span className="text-sm font-medium text-[#c9a84c] border-b-2 border-[#c9a84c] pb-2 px-1">General Info</span>
          </div>
          <div className="p-5 space-y-4">
            {fields.map(f => (
              <div key={f.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4" data-testid={`mentor-field-${f.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <span className="text-xs text-gray-500 w-40 flex-shrink-0">{f.label}</span>
                <span className="text-sm text-white">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Calendar</h2>
        <div className="flex items-center gap-1 rounded p-0.5" style={{ backgroundColor: v('card-bg', '#13161e') }}>
          {[{ key: 'month', icon: Grid3X3, label: 'Month' }, { key: 'list', icon: List, label: 'List' }].map(vw => (
            <button key={vw.key} onClick={() => { setCalView(vw.key); setSelectedDay(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={calView === vw.key ? { backgroundColor: v('accent', '#c9a84c'), color: v('button-text', '#0d0f14') } : { color: v('text-secondary', '#9ca3af') }}
              data-testid={`mentor-view-${vw.key}`}>
              <vw.icon className="w-3 h-3" /> {vw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[{ c: '#22c55e', l: 'Available' }, { c: '#eab308', l: 'Few Slots' }, { c: '#ef4444', l: 'Full' }, { c: '#38bdf8', l: 'Waiting List' }, { c: '#6b7280', l: 'Past' }].map(lg => (
          <div key={lg.l} className="flex items-center gap-1.5 text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lg.c }} /> {lg.l}
          </div>
        ))}
      </div>

      {calLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: v('accent', '#c9a84c') }} /></div> : (
        <>
          {calView === 'month' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentDate(new Date(year, mo-1, 1))} className="p-2 rounded" style={{ color: v('text-secondary', '#9ca3af') }}><ChevronLeft className="w-5 h-5" /></button>
                <h2 className="text-lg font-semibold" style={{ color: v('text-primary', '#fff') }}>{monthLabel}</h2>
                <button onClick={() => setCurrentDate(new Date(year, mo+1, 1))} className="p-2 rounded" style={{ color: v('text-secondary', '#9ca3af') }}><ChevronRight className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden" style={{ backgroundColor: v('card-border', 'rgba(255,255,255,0.05)') }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="p-2 text-center text-xs font-medium" style={{ backgroundColor: v('card-bg', '#13161e'), color: v('text-secondary', '#9ca3af') }}>{d}</div>
                ))}
                {calDays.map((day, i) => {
                  const ds = getSlotsForDay(day);
                  return (
                    <div key={i} className="min-h-[80px] p-1.5 cursor-pointer" onClick={() => day && setSelectedDay(day)} style={{ backgroundColor: day ? v('card-bg', '#13161e') : 'transparent' }}>
                      {day && (
                        <>
                          <span className="text-xs font-medium" style={{ color: v('text-primary', '#fff') }}>{day}</span>
                          {ds.map(s => (
                            <div key={s.id} className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] truncate" style={{ backgroundColor: slotColor(s) + '20', color: slotColor(s), borderLeft: `2px solid ${slotColor(s)}` }}>
                              {s.title || `${s.start_time}-${s.end_time}`} {s.my_status === 'booked' && '(Booked)'}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedDay && daySlots.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {daySlots.map(s => <SlotCard key={s.id} slot={s} onBook={handleBook} onCancel={handleCancelBooking} />)}
                </div>
              )}
            </>
          )}

          {calView === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calData.slots.length === 0 ? <p className="text-sm col-span-3 text-center py-12" style={{ color: v('text-muted', '#6b7280') }}>No available slots</p> :
                calData.slots.map(s => <SlotCard key={s.id} slot={s} onBook={handleBook} onCancel={handleCancelBooking} />)}
            </div>
          )}
        </>
      )}

      {/* Booking Dialog */}
      <Dialog open={!!bookDialog} onOpenChange={() => setBookDialog(null)}>
        <DialogContent style={{ backgroundColor: v('card-bg', '#13161e'), color: v('text-primary', '#fff'), borderColor: v('card-border', 'rgba(255,255,255,0.1)') }}>
          <DialogHeader><DialogTitle style={{ fontFamily: "'DM Serif Display', serif", color: v('text-primary', '#fff') }}>{bookDialog?._isWaitlist ? 'Join Waiting List' : 'Confirm Booking'}</DialogTitle></DialogHeader>
          {bookDialog && (
            <div className="space-y-3">
              {calData.mentor && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4" style={{ color: v('accent', '#c9a84c') }} /> <span>Mentor: {calData.mentor.name}</span></div>}
              {bookDialog.title && <p className="text-sm font-semibold" style={{ color: v('text-primary', '#fff') }}>{bookDialog.title}</p>}
              <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" style={{ color: v('accent', '#c9a84c') }} /> <span>Date: {bookDialog.date}</span></div>
              <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4" style={{ color: v('accent', '#c9a84c') }} /> <span>Time: {bookDialog.start_time} — {bookDialog.end_time}</span></div>
              {bookDialog.description && <div className="text-xs p-2 rounded" style={{ backgroundColor: v('input-bg', '#0d0f14'), color: v('text-secondary', '#9ca3af') }}>{bookDialog.description}</div>}
              <div className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Remaining: {Math.max(0, (bookDialog.max_students || 1) - (bookDialog.booked_count || 0))} / {bookDialog.max_students || 1}</div>
              {bookDialog._isWaitlist && <p className="text-xs text-blue-400">This slot is full. You'll be added to the waiting list.</p>}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setBookDialog(null)} className="flex-1 py-2 rounded text-sm font-medium border" style={{ borderColor: v('card-border', 'rgba(255,255,255,0.1)'), color: v('text-secondary', '#9ca3af') }}>Cancel</button>
                <button onClick={() => confirmBook(bookDialog.id)} disabled={booking} className="flex-1 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: bookDialog._isWaitlist ? '#2563eb' : v('button-bg', '#c9a84c'), color: bookDialog._isWaitlist ? '#fff' : v('button-text', '#0d0f14') }} data-testid="confirm-booking-btn">
                  {booking && <Loader2 className="w-3 h-3 animate-spin" />} {bookDialog._isWaitlist ? 'Join Waiting List' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
