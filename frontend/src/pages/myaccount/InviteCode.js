import React, { useState, useEffect } from 'react';
import { useMember } from '../../lib/memberAuth';
import { memberAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Key, Send, Loader2, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export default function InviteCode() {
  const { member } = useMember();
  const [codes, setCodes] = useState([]);
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendCode, setSendCode] = useState(null);
  const [sendForm, setSendForm] = useState({ first_name: '', last_name: '', email: '', phone: '', gender: '' });
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(null);

  const loadCodes = () => memberAPI.listCodes().then(r => setCodes(r.data)).catch(console.error);
  useEffect(() => { loadCodes(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await memberAPI.generateCodes(count);
      toast.success(`${count} code(s) generated!`);
      loadCodes();
    } catch { toast.error('Error generating codes'); }
    finally { setGenerating(false); }
  };

  const handleSend = async () => {
    if (!sendForm.email) { toast.error('Email is required'); return; }
    setSending(true);
    try {
      await memberAPI.sendInvite(sendCode.id, sendForm);
      toast.success('Invitation sent!');
      setSendOpen(false);
      setSendForm({ first_name: '', last_name: '', email: '', phone: '', gender: '' });
      loadCodes();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error sending'); }
    finally { setSending(false); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div data-testid="invite-code-page">
      <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>Invite Code</h1>
      <p className="text-gray-500 text-sm mb-6">Your Membership ID: <span className="text-[#c9a84c] font-semibold">{member?.membership_id}</span></p>

      {/* Generate Section */}
      <div className="bg-[#13161e] border border-white/5 rounded-lg p-5 mb-6">
        <div className="flex items-end gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Number of codes</label>
            <input type="number" value={count} onChange={e => setCount(Math.max(1, Math.min(50, +e.target.value)))} min={1} max={50}
              className="w-24 px-3 py-2 bg-[#0d0f14] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[#c9a84c]"
              data-testid="invite-count-input" />
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="px-5 py-2 bg-[#c9a84c] text-[#0d0f14] rounded text-sm font-semibold hover:bg-[#d4b85d] disabled:opacity-50 flex items-center gap-2"
            data-testid="generate-codes-btn">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Generate Unique Key
          </button>
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-[#13161e] border border-white/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 text-xs">
                <th className="text-left p-3">N&deg;</th>
                <th className="text-left p-3">Membership ID</th>
                <th className="text-left p-3">Key Unique</th>
                <th className="text-left p-3">Date Create</th>
                <th className="text-left p-3">Date Use</th>
                <th className="text-left p-3">Member Used</th>
                <th className="text-left p-3">Genre</th>
                <th className="text-left p-3">Send</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code, i) => (
                <tr key={code.id} className="border-b border-white/5 hover:bg-white/[0.02]" data-testid={`invite-row-${i}`}>
                  <td className="p-3 text-gray-400">{i + 1}</td>
                  <td className="p-3 text-white">{code.owner_membership_id}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[#c9a84c] font-mono text-xs">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="p-1 text-gray-500 hover:text-[#c9a84c]">
                        {copied === code.code ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-gray-400 text-xs">{new Date(code.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-gray-400 text-xs">{code.used_at ? new Date(code.used_at).toLocaleDateString() : '-'}</td>
                  <td className="p-3 text-white text-xs">{code.used_by_membership_id || '-'}</td>
                  <td className="p-3 text-gray-400 text-xs">{code.invitee_gender || '-'}</td>
                  <td className="p-3">
                    {code.status === 'available' && (
                      <button onClick={() => { setSendCode(code); setSendOpen(true); }}
                        className="p-1.5 bg-[#c9a84c]/10 text-[#c9a84c] rounded hover:bg-[#c9a84c]/20"
                        data-testid={`send-invite-btn-${i}`}>
                        <Send className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${code.status === 'available' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {code.status === 'available' ? 'Available' : 'Used'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {codes.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No invite codes generated yet</div>}
        </div>
      </div>

      {/* Send Invitation Modal */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="bg-[#13161e] border-white/10 text-white" data-testid="send-invite-dialog">
          <DialogHeader>
            <DialogTitle className="text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Send Invitation</DialogTitle>
          </DialogHeader>
          {sendCode && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Code: <span className="text-[#c9a84c]">{sendCode.code}</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-gray-400 text-xs">First Name</Label>
                  <Input value={sendForm.first_name} onChange={e => setSendForm(p => ({...p, first_name: e.target.value}))} className="bg-[#0d0f14] border-white/10 text-white mt-1" /></div>
                <div><Label className="text-gray-400 text-xs">Last Name</Label>
                  <Input value={sendForm.last_name} onChange={e => setSendForm(p => ({...p, last_name: e.target.value}))} className="bg-[#0d0f14] border-white/10 text-white mt-1" /></div>
              </div>
              <div><Label className="text-gray-400 text-xs">Email *</Label>
                <Input type="email" value={sendForm.email} onChange={e => setSendForm(p => ({...p, email: e.target.value}))} className="bg-[#0d0f14] border-white/10 text-white mt-1" data-testid="invite-email-input" /></div>
              <div><Label className="text-gray-400 text-xs">Phone</Label>
                <Input value={sendForm.phone} onChange={e => setSendForm(p => ({...p, phone: e.target.value}))} className="bg-[#0d0f14] border-white/10 text-white mt-1" /></div>
              <div><Label className="text-gray-400 text-xs">Gender</Label>
                <select value={sendForm.gender} onChange={e => setSendForm(p => ({...p, gender: e.target.value}))}
                  className="w-full px-3 py-2 bg-[#0d0f14] border border-white/10 rounded text-white text-sm mt-1">
                  <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option>
                </select></div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setSendOpen(false)} className="flex-1 py-2 border border-white/10 text-gray-400 rounded text-sm hover:bg-white/5">Cancel</button>
                <button onClick={handleSend} disabled={sending} className="flex-1 py-2 bg-[#c9a84c] text-[#0d0f14] rounded text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2" data-testid="send-invite-submit">
                  {sending && <Loader2 className="w-3 h-3 animate-spin" />} Send
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
