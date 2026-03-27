import React, { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, Users } from 'lucide-react';

const emptyMember = {
  first_name: '', last_name: '', email: '', password: '',
  role: 'member',
  gender: '', phone: '', date_of_birth: '', address: '', country: '',
  state: '', zip_code: '', google_account: '', social_links: [],
  sponsor_membership_number: null, mentor_membership_number: null,
  is_mentor: false, portfolio_development: false
};

export default function MembersManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('personal');

  const load = () => adminAPI.getMembers().then(r => setItems(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const mentors = useMemo(() => items.filter(m => m.is_mentor), [items]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...editing };
      // username = email (they are the same)
      payload.username = payload.email;
      if (editing.member_id) {
        await adminAPI.updateMember(editing.member_id, payload);
      } else {
        await adminAPI.createMember(payload);
      }
      toast.success('Saved!'); setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    try { await adminAPI.deleteMember(id); toast.success('Deleted'); load(); } catch { toast.error('Error'); }
  };

  const addSocialLink = () => {
    setEditing(p => ({...p, social_links: [...(p.social_links || []), { platform: '', url: '' }]}));
  };
  const updateSocialLink = (idx, field, value) => {
    setEditing(p => {
      const links = [...(p.social_links || [])];
      links[idx] = { ...links[idx], [field]: value };
      return { ...p, social_links: links };
    });
  };
  const removeSocialLink = (idx) => {
    setEditing(p => ({...p, social_links: (p.social_links || []).filter((_, i) => i !== idx)}));
  };

  return (
    <div data-testid="members-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Members Manager</h1>
        <button onClick={() => { setEditing({...emptyMember}); setTab('personal'); setOpen(true); }}
          className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2" data-testid="add-member-btn">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50">
            <th className="text-left p-3 font-medium text-slate-600">AUX</th>
            <th className="text-left p-3 font-medium text-slate-600">Name</th>
            <th className="text-left p-3 font-medium text-slate-600">Email</th>
            <th className="text-left p-3 font-medium text-slate-600">Member Type</th>
            <th className="text-left p-3 font-medium text-slate-600">Sponsor</th>
            <th className="text-left p-3 font-medium text-slate-600">Mentor</th>
            <th className="text-right p-3 font-medium text-slate-600">Actions</th>
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.member_id} className="border-b border-slate-50 hover:bg-slate-50/50" data-testid={`member-row-${item.membership_number}`}>
                <td className="p-3 font-mono text-[#0D9488]">{item.membership_id}</td>
                <td className="p-3 font-medium text-[#1a2332]">{item.first_name} {item.last_name}</td>
                <td className="p-3 text-slate-500">{item.email}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>
                    {item.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{item.sponsor_membership_number ? `AUX-${item.sponsor_membership_number}` : '-'}</td>
                <td className="p-3 text-slate-500">{item.mentor_membership_number ? `AUX-${item.mentor_membership_number}` : '-'}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing({...item}); setTab('personal'); setOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.member_id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
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
                {['personal', 'membership', 'social'].map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`flex-1 px-3 py-1.5 rounded text-sm font-medium capitalize ${tab === t ? 'bg-white shadow text-[#1a2332]' : 'text-slate-500'}`}>{t === 'social' ? 'Social Links' : t + ' Info'}</button>
                ))}
              </div>

              {/* Personal Tab */}
              {tab === 'personal' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">First Name</Label><Input value={editing.first_name} onChange={e => setEditing({...editing, first_name: e.target.value})} className="mt-1" /></div>
                    <div><Label className="text-xs">Last Name</Label><Input value={editing.last_name} onChange={e => setEditing({...editing, last_name: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Email *</Label><Input type="email" value={editing.email} onChange={e => setEditing({...editing, email: e.target.value})} className="mt-1" data-testid="member-email-input" /></div>
                    <div>
                      <Label className="text-xs">Member Type</Label>
                      <select value={editing.role || 'member'} onChange={e => setEditing({...editing, role: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm mt-1" data-testid="member-type-select">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  {!editing.member_id && <div><Label className="text-xs">Password *</Label><Input type="password" value={editing.password || ''} onChange={e => setEditing({...editing, password: e.target.value})} className="mt-1" placeholder="min 8 characters" /></div>}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Gender</Label><select value={editing.gender || ''} onChange={e => setEditing({...editing, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm mt-1"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div><Label className="text-xs">Phone</Label><Input value={editing.phone || ''} onChange={e => setEditing({...editing, phone: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={editing.date_of_birth || ''} onChange={e => setEditing({...editing, date_of_birth: e.target.value})} className="mt-1" /></div>
                  <div><Label className="text-xs">Address</Label><Input value={editing.address || ''} onChange={e => setEditing({...editing, address: e.target.value})} className="mt-1" /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Country</Label><Input value={editing.country || ''} onChange={e => setEditing({...editing, country: e.target.value})} className="mt-1" /></div>
                    <div><Label className="text-xs">State</Label><Input value={editing.state || ''} onChange={e => setEditing({...editing, state: e.target.value})} className="mt-1" /></div>
                    <div><Label className="text-xs">ZIP Code</Label><Input value={editing.zip_code || ''} onChange={e => setEditing({...editing, zip_code: e.target.value})} className="mt-1" /></div>
                  </div>
                  <div><Label className="text-xs">Google Account</Label><Input value={editing.google_account || ''} onChange={e => setEditing({...editing, google_account: e.target.value})} className="mt-1" /></div>
                </div>
              )}

              {/* Membership Tab */}
              {tab === 'membership' && (
                <div className="space-y-3">
                  {editing.member_id && (
                    <div className="p-3 bg-slate-50 rounded">
                      <p className="text-xs text-slate-500">Membership ID</p>
                      <p className="text-lg font-bold text-[#0D9488]">{editing.membership_id}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Sponsor</Label>
                    <select value={editing.sponsor_membership_number || ''}
                      onChange={e => setEditing({...editing, sponsor_membership_number: e.target.value ? parseInt(e.target.value) : null})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm mt-1" data-testid="sponsor-select">
                      <option value="">No Sponsor</option>
                      {items.filter(m => m.member_id !== editing.member_id).map(m => (
                        <option key={m.member_id} value={m.membership_number}>
                          {m.membership_id} - {m.first_name} {m.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Mentor</Label>
                    <select value={editing.mentor_membership_number || ''}
                      onChange={e => setEditing({...editing, mentor_membership_number: e.target.value ? parseInt(e.target.value) : null})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm mt-1" data-testid="mentor-select">
                      <option value="">No Mentor</option>
                      {mentors.filter(m => m.member_id !== editing.member_id).map(m => (
                        <option key={m.member_id} value={m.membership_number}>
                          {m.membership_id} - {m.first_name} {m.last_name}
                        </option>
                      ))}
                    </select>
                    {mentors.length === 0 && <p className="text-xs text-amber-500 mt-1">No mentors available. Mark a member as Mentor first.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-slate-50 rounded">
                      <Label className="text-xs font-medium mb-2 block">Mentor</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="is_mentor" checked={editing.is_mentor === true} onChange={() => setEditing({...editing, is_mentor: true})} className="accent-[#0D9488]" data-testid="is-mentor-yes" />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="is_mentor" checked={!editing.is_mentor} onChange={() => setEditing({...editing, is_mentor: false})} className="accent-[#0D9488]" data-testid="is-mentor-no" />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded">
                      <Label className="text-xs font-medium mb-2 block">Portfolio Development</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="portfolio_dev" checked={editing.portfolio_development === true} onChange={() => setEditing({...editing, portfolio_development: true})} className="accent-[#0D9488]" data-testid="portfolio-dev-yes" />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="portfolio_dev" checked={!editing.portfolio_development} onChange={() => setEditing({...editing, portfolio_development: false})} className="accent-[#0D9488]" data-testid="portfolio-dev-no" />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  {editing.member_id && (
                    <div><Label className="text-xs">New Password (leave blank to keep current)</Label>
                    <Input type="password" value={editing.password || ''} onChange={e => setEditing({...editing, password: e.target.value})} className="mt-1" /></div>
                  )}
                </div>
              )}

              {/* Social Links Tab */}
              {tab === 'social' && (
                <div className="space-y-3">
                  {(editing.social_links || []).map((link, idx) => (
                    <div key={idx} className="flex items-end gap-2">
                      <div className="flex-1"><Label className="text-xs">Platform</Label>
                        <select value={link.platform} onChange={e => updateSocialLink(idx, 'platform', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm mt-1">
                          <option value="">Select</option><option value="facebook">Facebook</option><option value="twitter">Twitter</option><option value="instagram">Instagram</option><option value="linkedin">LinkedIn</option><option value="website">Website</option>
                        </select>
                      </div>
                      <div className="flex-1"><Label className="text-xs">URL</Label><Input value={link.url} onChange={e => updateSocialLink(idx, 'url', e.target.value)} className="mt-1" /></div>
                      <button onClick={() => removeSocialLink(idx)} className="p-2 text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={addSocialLink} className="text-sm text-[#0D9488] hover:underline">+ Add Social Link</button>
                </div>
              )}

              <button onClick={handleSave} disabled={loading}
                className="w-full mt-4 bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="member-save-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
