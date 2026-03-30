import React, { useState, useEffect } from 'react';
import { adminAPI, geoAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

const emptyMember = {
  first_name: '', last_name: '', email: '', password: '', role: 'member',
  gender: '', phone: '', date_of_birth: '', address: '', country: '', state: '', city: '', zip_code: '',
  google_account: '', social_links: [], avatar: '',
  sponsor_membership_number: null, mentor_membership_number: null,
  level_id: null,
  membership_ranking: '', membership_status: 'Free', active_date: '', expiration_date: '',
  membership_fee: '', member_type_id: '',
};

export default function MembersManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('personal');
  const [levels, setLevels] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const load = () => {
    adminAPI.getMembers().then(r => setItems(r.data)).catch(console.error);
    adminAPI.getLevels().then(r => setLevels(r.data)).catch(console.error);
    adminAPI.getMemberTypes().then(r => setMemberTypes(r.data || [])).catch(console.error);
    adminAPI.getMentors().then(r => setMentors(r.data || [])).catch(console.error);
    geoAPI.getCountries().then(r => setCountries(r.data)).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  // Load states when country changes
  useEffect(() => {
    if (editing?.country) {
      const c = countries.find(c => c.name === editing.country);
      if (c) geoAPI.getStates(c.id).then(r => setStates(r.data)).catch(() => {});
      else setStates([]);
    } else { setStates([]); }
  }, [editing?.country, countries]);

  useEffect(() => {
    if (editing?.state) {
      const s = states.find(s => s.name === editing.state);
      if (s) geoAPI.getCities(s.id).then(r => setCities(r.data)).catch(() => {});
      else setCities([]);
    } else { setCities([]); }
  }, [editing?.state, states]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...editing };
      payload.username = payload.email;
      if (editing.member_id) await adminAPI.updateMember(editing.member_id, payload);
      else await adminAPI.createMember(payload);
      toast.success('Saved!'); setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    try { await adminAPI.deleteMember(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
  };

  const selectCls = "w-full px-3 py-2 border border-slate-200 rounded-sm text-sm mt-1";

  return (
    <div data-testid="members-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Members Manager</h1>
        <button onClick={() => { setEditing({...emptyMember}); setTab('personal'); setOpen(true); }}
          className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-member-btn">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50">
            <th className="text-left p-3 font-medium text-slate-600">AUX</th>
            <th className="text-left p-3 font-medium text-slate-600">Name</th>
            <th className="text-left p-3 font-medium text-slate-600">Email</th>
            <th className="text-left p-3 font-medium text-slate-600">Member Type</th>
            <th className="text-left p-3 font-medium text-slate-600">Level</th>
            <th className="text-left p-3 font-medium text-slate-600">Sponsor</th>
            <th className="text-right p-3 font-medium text-slate-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => {
              const lvl = levels.find(l => l.id === item.level_id);
              return (
                <tr key={item.member_id} className="border-b border-slate-50 hover:bg-slate-50/50" data-testid={`member-row-${item.membership_number}`}>
                  <td className="p-3 font-mono text-[#0D9488]">{item.membership_id}</td>
                  <td className="p-3 font-medium text-[#1a2332]">{item.first_name} {item.last_name}</td>
                  <td className="p-3 text-slate-500">{item.email}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${item.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>{item.role === 'admin' ? 'Admin' : 'Member'}</span></td>
                  <td className="p-3 text-slate-500 text-xs">{lvl?.name || '-'}</td>
                  <td className="p-3 text-slate-500 text-xs">{item.sponsor_membership_number ? `AUX-${item.sponsor_membership_number}` : '-'}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { setEditing({...item}); setTab('personal'); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.member_id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No members yet</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto" data-testid="member-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>{editing?.member_id ? 'Edit' : 'New'} Member</DialogTitle></DialogHeader>
          {editing && (
            <div>
              <div className="flex gap-1 mb-4 bg-slate-100 rounded p-1">
                {['personal', 'membership'].map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`flex-1 px-3 py-1.5 rounded text-sm font-medium capitalize ${tab === t ? 'bg-white shadow text-[#1a2332]' : 'text-slate-500'}`}>{t} Info</button>
                ))}
              </div>

              {tab === 'personal' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">First Name</Label><Input value={editing.first_name} onChange={e => setEditing({...editing, first_name: e.target.value})} className="mt-1" /></div>
                    <div><Label className="text-xs">Last Name</Label><Input value={editing.last_name} onChange={e => setEditing({...editing, last_name: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Email *</Label><Input type="email" value={editing.email} onChange={e => setEditing({...editing, email: e.target.value})} className="mt-1" data-testid="member-email-input" /></div>
                    <div><Label className="text-xs">Member Type</Label>
                      <select value={editing.role || 'member'} onChange={e => setEditing({...editing, role: e.target.value})} className={selectCls} data-testid="member-type-select">
                        <option value="member">Member</option><option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  {!editing.member_id && <div><Label className="text-xs">Password *</Label><Input type="password" value={editing.password || ''} onChange={e => setEditing({...editing, password: e.target.value})} className="mt-1" /></div>}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Gender</Label><select value={editing.gender || ''} onChange={e => setEditing({...editing, gender: e.target.value})} className={selectCls}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div><Label className="text-xs">Phone</Label><Input value={editing.phone || ''} onChange={e => setEditing({...editing, phone: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={editing.date_of_birth || ''} onChange={e => setEditing({...editing, date_of_birth: e.target.value})} className="mt-1" /></div>
                  <div><Label className="text-xs">Address</Label><Input value={editing.address || ''} onChange={e => setEditing({...editing, address: e.target.value})} className="mt-1" /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Country</Label>
                      <select value={editing.country || ''} onChange={e => setEditing({...editing, country: e.target.value, state: '', city: ''})} className={selectCls} data-testid="member-country-select">
                        <option value="">Select</option>
                        {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">State</Label>
                      <select value={editing.state || ''} onChange={e => setEditing({...editing, state: e.target.value, city: ''})} className={selectCls} disabled={!editing.country} data-testid="member-state-select">
                        <option value="">Select</option>
                        {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">City</Label>
                      <select value={editing.city || ''} onChange={e => setEditing({...editing, city: e.target.value})} className={selectCls} disabled={!editing.state} data-testid="member-city-select">
                        <option value="">Select</option>
                        {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><Label className="text-xs">ZIP Code</Label><Input value={editing.zip_code || ''} onChange={e => setEditing({...editing, zip_code: e.target.value})} className="mt-1" /></div>
                  <div><Label className="text-xs">Avatar</Label>
                    <ImageUpload value={editing.avatar || ''} onChange={v => setEditing({...editing, avatar: v})} />
                  </div>
                </div>
              )}

              {tab === 'membership' && (
                <div className="space-y-3">
                  {editing.member_id && <div className="p-3 bg-slate-50 rounded"><p className="text-xs text-slate-500">Membership ID</p><p className="text-lg font-bold text-[#0D9488]">{editing.membership_id}</p></div>}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Member Level</Label>
                      <select value={editing.level_id || ''} onChange={e => setEditing({...editing, level_id: e.target.value || null})} className={selectCls} data-testid="member-level-select">
                        <option value="">No Level</option>
                        {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                    <div><Label className="text-xs">Membership Ranking</Label>
                      <Input value={editing.membership_ranking || ''} onChange={e => setEditing({...editing, membership_ranking: e.target.value})} className="mt-1" data-testid="membership-ranking-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded"><Label className="text-xs font-medium mb-2 block">Membership Status</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="membership_status" checked={editing.membership_status === 'Free'} onChange={() => setEditing({...editing, membership_status: 'Free'})} className="accent-[#0D9488]" /><span className="text-sm">Free</span></label>
                        <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="membership_status" checked={editing.membership_status === 'Professional'} onChange={() => setEditing({...editing, membership_status: 'Professional'})} className="accent-[#0D9488]" /><span className="text-sm">Professional</span></label>
                      </div>
                    </div>
                    <div><Label className="text-xs">Membership Fee</Label>
                      <Input type="number" step="0.01" value={editing.membership_fee || ''} onChange={e => setEditing({...editing, membership_fee: e.target.value})} className="mt-1" placeholder="0.00" data-testid="membership-fee-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Active Date</Label>
                      <Input type="date" value={editing.active_date || ''} onChange={e => setEditing({...editing, active_date: e.target.value})} className="mt-1" data-testid="active-date-input" />
                    </div>
                    <div><Label className="text-xs">Expiration Date</Label>
                      <Input type="date" value={editing.expiration_date || ''} onChange={e => setEditing({...editing, expiration_date: e.target.value})} className="mt-1" data-testid="expiration-date-input" />
                    </div>
                  </div>
                  <div><Label className="text-xs">Member Type</Label>
                    <select value={editing.member_type_id || ''} onChange={e => setEditing({...editing, member_type_id: e.target.value || ''})} className={selectCls} data-testid="member-type-id-select">
                      <option value="">Select Type</option>
                      {memberTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {memberTypes.length === 0 && <p className="text-xs text-amber-500 mt-1">No types. Create one in Member Types.</p>}
                    {editing.member_type_id && (() => {
                      const mt = memberTypes.find(t => t.id === editing.member_type_id);
                      if (!mt) return null;
                      const perms = ['corporate','is_mentor','portfolio_development','application_reviewer','opportunities_development','opportunities_reviewer','project_development','project_reviewer','project_management','content_operator'].filter(k => mt[k]);
                      const pageCount = (mt.allowed_pages || []).length;
                      if (!perms.length && !pageCount) return null;
                      return (
                        <div className="mt-2 p-3 bg-[#0D9488]/5 border border-[#0D9488]/20 rounded-sm">
                          <p className="text-xs font-medium text-[#0D9488] mb-1">Inherited from type "{mt.name}":</p>
                          {perms.length > 0 && <div className="flex flex-wrap gap-1 mb-1">{perms.map(p => <span key={p} className="px-1.5 py-0.5 bg-[#0D9488]/10 text-[#0D9488] text-xs rounded">{p.replace(/_/g, ' ')}</span>)}</div>}
                          {pageCount > 0 && <p className="text-xs text-slate-500">{pageCount} page(s) access granted</p>}
                        </div>
                      );
                    })()}
                  </div>
                  <div><Label className="text-xs">Sponsor</Label>
                    <select value={editing.sponsor_membership_number || ''} onChange={e => setEditing({...editing, sponsor_membership_number: e.target.value ? parseInt(e.target.value) : null})} className={selectCls} data-testid="sponsor-select">
                      <option value="">No Sponsor</option>
                      {items.filter(m => m.member_id !== editing.member_id).map(m => <option key={m.member_id} value={m.membership_number}>{m.membership_id} - {m.first_name} {m.last_name}</option>)}
                    </select>
                  </div>
                  <div><Label className="text-xs">Mentor</Label>
                    <select value={editing.mentor_membership_number || ''} onChange={e => setEditing({...editing, mentor_membership_number: e.target.value ? parseInt(e.target.value) : null})} className={selectCls} data-testid="mentor-select">
                      <option value="">No Mentor</option>
                      {mentors.filter(m => m.member_id !== editing.member_id).map(m => <option key={m.member_id} value={m.membership_number}>{m.membership_id} - {m.first_name} {m.last_name}</option>)}
                    </select>
                    {mentors.length === 0 && <p className="text-xs text-amber-500 mt-1">No mentors. Create a Member Type with Mentor permission enabled and assign it to members.</p>}
                  </div>
                  {editing.member_id && <div><Label className="text-xs">New Password (leave blank to keep)</Label><Input type="password" value={editing.password || ''} onChange={e => setEditing({...editing, password: e.target.value})} className="mt-1" /></div>}
                </div>
              )}

              <button onClick={handleSave} disabled={loading} className="w-full mt-4 bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50" data-testid="member-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
