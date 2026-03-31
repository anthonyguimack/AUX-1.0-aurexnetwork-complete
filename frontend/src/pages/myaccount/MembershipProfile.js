import React, { useState, useEffect } from 'react';
import { useMember } from '../../lib/memberAuth';
import { memberAPI, publicAPI, geoAPI } from '../../lib/api';
import { toast } from 'sonner';
import { User, Save, Loader2, Edit3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import RichTextEditor from '../../components/RichTextEditor';
import MemberImageUpload from '../../components/MemberImageUpload';

const quillDark = "[&_.ql-toolbar]:!bg-[#0d0f14] [&_.ql-toolbar]:!border-white/10 [&_.ql-container]:!border-white/10 [&_.ql-container]:!bg-[#0d0f14] [&_.ql-editor]:!text-white [&_.ql-editor]:!min-h-[150px] [&_.ql-snow_.ql-stroke]:!stroke-gray-400 [&_.ql-snow_.ql-fill]:!fill-gray-400 [&_.ql-snow_.ql-picker-label]:!text-gray-400 [&_.ql-snow_.ql-picker-options]:!bg-[#13161e]";

const fmtDate = (d) => {
  if (!d) return '-';
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return d;
};

export default function MembershipProfile() {
  const { member, refresh } = useMember();
  const [tab, setTab] = useState('general');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [bioOpen, setBioOpen] = useState(false);
  const [bioForm, setBioForm] = useState({ summary: '', biography: '' });
  const [activities, setActivities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {});
    geoAPI.getCountries().then(r => setCountries(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (member) {
      setForm({
        first_name: member.first_name || '', last_name: member.last_name || '',
        email: member.email || '', phone: member.phone || '', gender: member.gender || '',
        date_of_birth: member.date_of_birth || '',
        address: member.address || '', country: member.country || '',
        state: member.state || '', city: member.city || '', zip_code: member.zip_code || '',
        google_account: member.google_account || '', avatar: member.avatar || '',
      });
      setBioForm({ summary: member.summary || '', biography: member.biography || '' });
      const acts = [];
      if (member.created_at) acts.push({ action: 'Account created', date: member.created_at });
      if (member.updated_at) acts.push({ action: 'Profile updated', date: member.updated_at });
      setActivities(acts.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  }, [member]);

  useEffect(() => {
    if (form.country) {
      const c = countries.find(c => c.name === form.country);
      if (c) geoAPI.getStates(c.id).then(r => setStates(r.data)).catch(() => {});
      else setStates([]);
    } else { setStates([]); }
  }, [form.country, countries]);

  useEffect(() => {
    if (form.state) {
      const s = states.find(s => s.name === form.state);
      if (s) geoAPI.getCities(s.id).then(r => setCities(r.data)).catch(() => {});
      else setCities([]);
    } else { setCities([]); }
  }, [form.state, states]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await memberAPI.updateProfile(form);
      toast.success('Profile updated!');
      setEditing(false);
      refresh();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error saving'); }
    finally { setLoading(false); }
  };

  const handleBioSave = async () => {
    setLoading(true);
    try {
      await memberAPI.updateBiography(bioForm);
      toast.success('Biography updated!');
      setBioOpen(false);
      refresh();
    } catch { toast.error('Error saving'); }
    finally { setLoading(false); }
  };

  const platformSocials = (settings.social_links || []).map(s => s.platform || s.icon);
  const memberSocials = form.social_links || member?.social_links || [];
  const updateSocial = (platform, url) => {
    const links = [...memberSocials];
    const idx = links.findIndex(l => l.platform === platform);
    if (idx >= 0) links[idx] = { ...links[idx], url };
    else links.push({ platform, url });
    setForm(prev => ({ ...prev, social_links: links }));
  };
  const getSocialUrl = (platform) => memberSocials.find(l => l.platform === platform)?.url || '';
  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const defaultAvatar = settings.membership_default_avatar || '';
  const tabs = [
    { id: 'general', label: 'General Info' },
    { id: 'social', label: 'Social Links' },
    { id: 'activities', label: 'Activities' },
  ];

  const selectCls = "w-full mt-1 px-3 py-2 bg-[#0d0f14] border border-white/10 text-white rounded-md text-sm focus:outline-none focus:border-[#c9a84c]/50";

  return (
    <div data-testid="membership-profile-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Membership Profile</h1>
        <button onClick={() => setBioOpen(true)}
          className="px-4 py-2 bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30 rounded text-sm font-medium flex items-center gap-2 hover:bg-[#c9a84c]/30 transition-colors"
          data-testid="update-biography-btn">
          <Edit3 className="w-4 h-4" /> Update Biography
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-6 flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-[#c9a84c]/10 border-2 border-[#c9a84c]/30 flex items-center justify-center overflow-hidden">
            {(form.avatar || defaultAvatar) ?
              <img src={(form.avatar || defaultAvatar).startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${form.avatar || defaultAvatar}` : (form.avatar || defaultAvatar)} alt="" className="w-full h-full object-cover" /> :
              <User className="w-10 h-10 text-[#c9a84c]/50" />}
          </div>
          <p className="mt-3 text-white font-medium text-sm">{member?.first_name} {member?.last_name}</p>
          <p className="text-[#c9a84c] text-xs">{member?.membership_id}</p>
          <p className="text-gray-500 text-xs mt-1">{member?.email}</p>
          {member?.is_mentor && <span className="mt-2 text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded">Mentor</span>}
          {member?._member_type?.permissions?.is_mentor && <span className="mt-2 text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded">Mentor</span>}
        </div>

        <div className="lg:col-span-2 bg-[#13161e] border border-white/5 rounded-lg">
          <div className="border-b border-white/5 p-4">
            <div className="flex gap-4">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`text-sm font-medium pb-2 px-1 transition-colors ${tab === t.id ? 'text-[#c9a84c] border-b-2 border-[#c9a84c]' : 'text-gray-500 hover:text-gray-300'}`}
                  data-testid={`profile-tab-${t.id}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            {tab === 'general' && (
              <div>
                <div className="flex justify-end mb-4">
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="text-sm text-[#c9a84c] hover:underline flex items-center gap-1" data-testid="edit-profile-btn">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-300 px-3 py-1">Cancel</button>
                      <button onClick={handleSave} disabled={loading} className="text-sm bg-[#c9a84c] text-[#0d0f14] px-4 py-1.5 rounded font-medium flex items-center gap-1 disabled:opacity-50" data-testid="save-profile-btn">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                      </button>
                    </div>
                  )}
                </div>
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs text-gray-400">First Name</Label><Input value={form.first_name} onChange={set('first_name')} className="mt-1 bg-[#0d0f14] border-white/10 text-white" /></div>
                      <div><Label className="text-xs text-gray-400">Last Name</Label><Input value={form.last_name} onChange={set('last_name')} className="mt-1 bg-[#0d0f14] border-white/10 text-white" /></div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Email</Label>
                      <Input value={form.email} onChange={set('email')} className="mt-1 bg-[#0d0f14] border-white/10 text-white" data-testid="profile-email-input" />
                      <p className="text-[10px] text-gray-500 mt-1">Changing your email will also update your login username.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs text-gray-400">Phone</Label><Input value={form.phone} onChange={set('phone')} className="mt-1 bg-[#0d0f14] border-white/10 text-white" /></div>
                      <div><Label className="text-xs text-gray-400">Gender</Label>
                        <select value={form.gender} onChange={set('gender')} className={selectCls}>
                          <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div><Label className="text-xs text-gray-400">Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className="mt-1 bg-[#0d0f14] border-white/10 text-white" /></div>
                    <div><Label className="text-xs text-gray-400">Address</Label><Input value={form.address} onChange={set('address')} className="mt-1 bg-[#0d0f14] border-white/10 text-white" /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-gray-400">Country</Label>
                        <select value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value, state: '', city: ''}))} className={selectCls} data-testid="profile-country-select">
                          <option value="">Select</option>
                          {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">State</Label>
                        <select value={form.state} onChange={e => setForm(p => ({...p, state: e.target.value, city: ''}))} className={selectCls} disabled={!form.country} data-testid="profile-state-select">
                          <option value="">Select</option>
                          {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">City</Label>
                        <select value={form.city} onChange={set('city')} className={selectCls} disabled={!form.state} data-testid="profile-city-select">
                          <option value="">Select</option>
                          {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><Label className="text-xs text-gray-400">ZIP Code</Label><Input value={form.zip_code} onChange={set('zip_code')} className="mt-1 bg-[#0d0f14] border-white/10 text-white" /></div>
                    <div><Label className="text-xs text-gray-400">Passport ID#</Label><Input value={form.passport_id || ''} onChange={set('passport_id')} className="mt-1 bg-[#0d0f14] border-white/10 text-white" data-testid="profile-passport-input" /></div>
                    <div>
                      <Label className="text-xs text-gray-400">Avatar</Label>
                      <div className="mt-1">
                        <MemberImageUpload value={form.avatar} onChange={v => setForm(p => ({...p, avatar: v}))} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Name', value: `${member?.first_name || ''} ${member?.last_name || ''}`.trim() },
                      { label: 'Membership Number', value: member?.membership_id || '-' },
                      { label: 'Email', value: member?.email || '-' },
                      { label: 'Phone', value: member?.phone || '-' },
                      { label: 'Gender', value: member?.gender || '-' },
                      { label: 'Date of Birth', value: fmtDate(member?.date_of_birth) },
                      { label: 'Address', value: member?.address || '-' },
                      { label: 'Country', value: member?.country || '-' },
                      { label: 'State', value: member?.state || '-' },
                      { label: 'City', value: member?.city || '-' },
                      { label: 'ZIP Code', value: member?.zip_code || '-' },
                      { label: 'Passport ID#', value: member?.passport_id || '-' },
                      { label: 'Google Account', value: member?.google_account || '-' },
                    ].map(f => (
                      <div key={f.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span className="text-xs text-gray-500 w-40 flex-shrink-0">{f.label}</span>
                        <span className="text-sm text-white">{f.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'social' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 mb-4">Enter your social network profiles.</p>
                {platformSocials.length > 0 ? platformSocials.map(platform => (
                  <div key={platform} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-28 capitalize flex-shrink-0">{platform}</span>
                    <Input value={getSocialUrl(platform)} onChange={e => updateSocial(platform, e.target.value)}
                      placeholder={`Enter your ${platform} URL`}
                      className="bg-[#0d0f14] border-white/10 text-white flex-1"
                      data-testid={`social-${platform}`} />
                  </div>
                )) : <p className="text-sm text-gray-500">No social platforms configured by the administrator.</p>}
                {platformSocials.length > 0 && (
                  <button onClick={handleSave} disabled={loading}
                    className="mt-4 px-4 py-2 bg-[#c9a84c] text-[#0d0f14] rounded text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                    data-testid="save-socials-btn">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Social Links
                  </button>
                )}
              </div>
            )}

            {tab === 'activities' && (
              <div>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#0d0f14] rounded border border-white/5">
                        <span className="text-sm text-white">{a.action}</span>
                        <span className="text-xs text-gray-500">{fmtDate(a.date)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No activity recorded yet.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={bioOpen} onOpenChange={setBioOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-[#13161e] border-white/10" data-testid="biography-modal">
          <DialogHeader><DialogTitle className="text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Update Biography</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Summary</Label>
              <div className={quillDark}>
                <RichTextEditor value={bioForm.summary} onChange={v => setBioForm(p => ({...p, summary: v}))} placeholder="Write your summary..." />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Biography</Label>
              <div className={quillDark}>
                <RichTextEditor value={bioForm.biography} onChange={v => setBioForm(p => ({...p, biography: v}))} placeholder="Write your biography..." />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setBioOpen(false)} className="flex-1 py-2 border border-white/10 text-gray-400 rounded text-sm hover:bg-white/5">Cancel</button>
              <button onClick={handleBioSave} disabled={loading}
                className="flex-1 py-2 bg-[#c9a84c] text-[#0d0f14] rounded text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="save-biography-btn">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
