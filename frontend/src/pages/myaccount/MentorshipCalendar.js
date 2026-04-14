import React, { useState, useEffect } from 'react';
import { memberAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';

const v = (name, fb) => `var(--ma-${name}, ${fb})`;
const SESSION_TYPES = ['One-on-One', 'Group'];
const SLOT_STATUSES = ['active', 'inactive'];

const slotColor = (slot) => {
  if (slot.status === 'inactive') return '#6b7280';
  if (slot.status === 'cancelled') return '#6b7280';
  const booked = slot.booked_count || 0;
  const max = slot.max_students || 1;
  if (slot.waitlist_count > 0) return '#38bdf8';
  if (booked >= max) return '#ef4444';
  if (booked > 0) return '#eab308';
  return '#22c55e';
};

export default function MentorshipCalendar() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewSlot, setViewSlot] = useState(null);

  const load = () => {
    setLoading(true);
    memberAPI.getMentorSlots().then(r => { setSlots(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async () => {
    if (!editing.date || !editing.start_time || !editing.end_time) { toast.error('Date and times required'); return; }
    setSaving(true);
    try {
      if (editing.id) await memberAPI.updateMentorSlot(editing.id, editing);
      else await memberAPI.createMentorSlot(editing);
      toast.success('Saved!'); setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot and all bookings?')) return;
    try { await memberAPI.deleteMentorSlot(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
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
    return slots.filter(s => s.date === dateStr);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: v('accent', '#c9a84c') }} /></div>;

  return (
    <div data-testid="mentorship-calendar-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: v('text-primary', '#fff'), fontFamily: "'DM Serif Display', serif" }}>My Calendar</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0d0f14') }} data-testid="add-slot-btn">
          <Plus className="w-4 h-4" /> Add Slot
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[{ c: '#22c55e', l: 'Available' }, { c: '#eab308', l: 'Partially Booked' }, { c: '#ef4444', l: 'Fully Booked' }, { c: '#38bdf8', l: 'Waiting List' }, { c: '#6b7280', l: 'Inactive' }].map(lg => (
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
                  {daySlots.map(s => (
                    <div key={s.id} className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer"
                      onClick={() => setViewSlot(s)}
                      style={{ backgroundColor: slotColor(s) + '20', color: slotColor(s), borderLeft: `2px solid ${slotColor(s)}` }}
                      data-testid={`slot-${s.id}`}>
                      {s.start_time}-{s.end_time}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Slot Details */}
      {viewSlot && (
        <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: v('card-bg', '#13161e'), borderColor: v('card-border', 'rgba(255,255,255,0.05)') }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: v('text-primary', '#fff') }}>
              {viewSlot.date} &middot; {viewSlot.start_time} - {viewSlot.end_time}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => { setEditing({ ...viewSlot }); setOpen(true); }} className="p-1.5 rounded" style={{ color: v('accent', '#c9a84c') }}><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => { handleDelete(viewSlot.id); setViewSlot(null); }} className="p-1.5 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="text-xs space-y-1" style={{ color: v('text-secondary', '#9ca3af') }}>
            <p>Type: {viewSlot.session_type} &middot; Max: {viewSlot.max_students} &middot; Booked: {viewSlot.booked_count || 0} &middot; Waitlist: {viewSlot.waitlist_count || 0}</p>
            <p>Status: <span style={{ color: slotColor(viewSlot) }}>{viewSlot.status}</span></p>
          </div>
        </div>
      )}

      {/* Add/Edit Slot Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="sm:max-w-[500px]" style={{ backgroundColor: v('card-bg', '#13161e'), color: v('text-primary', '#fff'), borderColor: v('card-border', 'rgba(255,255,255,0.1)') }}>
          <DialogHeader><DialogTitle style={{ fontFamily: "'DM Serif Display', serif", color: v('text-primary', '#fff') }}>{editing?.id ? 'Edit' : 'New'} Slot</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Date *</Label>
              <Input type="date" value={editing?.date || ''} onChange={e => setEditing(p => ({ ...(p || {}), date: e.target.value }))} className="mt-1" style={{ backgroundColor: v('input-bg', '#0d0f14'), borderColor: v('input-border', 'rgba(255,255,255,0.1)'), color: v('text-primary', '#fff') }} data-testid="slot-date" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Start *</Label>
                <Input type="time" value={editing?.start_time || ''} onChange={e => setEditing(p => ({ ...(p || {}), start_time: e.target.value }))} className="mt-1" style={{ backgroundColor: v('input-bg', '#0d0f14'), borderColor: v('input-border', 'rgba(255,255,255,0.1)'), color: v('text-primary', '#fff') }} data-testid="slot-start" /></div>
              <div><Label className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>End *</Label>
                <Input type="time" value={editing?.end_time || ''} onChange={e => setEditing(p => ({ ...(p || {}), end_time: e.target.value }))} className="mt-1" style={{ backgroundColor: v('input-bg', '#0d0f14'), borderColor: v('input-border', 'rgba(255,255,255,0.1)'), color: v('text-primary', '#fff') }} data-testid="slot-end" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Type *</Label>
                <select value={editing?.session_type || 'One-on-One'} onChange={e => setEditing(p => ({ ...(p || {}), session_type: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded text-sm" style={{ backgroundColor: v('input-bg', '#0d0f14'), borderColor: v('input-border', 'rgba(255,255,255,0.1)'), color: v('text-primary', '#fff'), border: '1px solid', appearance: 'auto' }} data-testid="slot-type">
                  {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><Label className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Max Students *</Label>
                <Input type="number" value={editing?.max_students || 1} onChange={e => setEditing(p => ({ ...(p || {}), max_students: parseInt(e.target.value) || 1 }))} className="mt-1" style={{ backgroundColor: v('input-bg', '#0d0f14'), borderColor: v('input-border', 'rgba(255,255,255,0.1)'), color: v('text-primary', '#fff') }} data-testid="slot-max" /></div>
            </div>
            <div><Label className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Status</Label>
              <select value={editing?.status || 'active'} onChange={e => setEditing(p => ({ ...(p || {}), status: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded text-sm" style={{ backgroundColor: v('input-bg', '#0d0f14'), borderColor: v('input-border', 'rgba(255,255,255,0.1)'), color: v('text-primary', '#fff'), border: '1px solid', appearance: 'auto' }}>
                {SLOT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select></div>
            <div><Label className="text-xs" style={{ color: v('text-secondary', '#9ca3af') }}>Description</Label>
              <textarea value={editing?.description || ''} onChange={e => setEditing(p => ({ ...(p || {}), description: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 rounded text-sm resize-none" style={{ backgroundColor: v('input-bg', '#0d0f14'), borderColor: v('input-border', 'rgba(255,255,255,0.1)'), color: v('text-primary', '#fff'), border: '1px solid' }} /></div>
            <button onClick={handleSave} disabled={saving} className="w-full py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: v('button-bg', '#c9a84c'), color: v('button-text', '#0d0f14') }} data-testid="slot-save-btn">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} {editing?.id ? 'Update' : 'Create'} Slot
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
