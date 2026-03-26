import React, { useState, useEffect } from 'react';
import { useMember } from '../../lib/memberAuth';
import { memberAPI, publicAPI } from '../../lib/api';
import { User, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import CommunityTree from '../../components/TreeNode';

function filterNodes(nodes, q, field) {
  if (!q) return nodes;
  const lq = q.toLowerCase();
  return nodes.reduce((acc, node) => {
    let val = '';
    if (field === 'membership_number') val = node.membership_id || '';
    else if (field === 'first_name') val = node.first_name || '';
    else val = node.last_name || '';
    const match = val.toLowerCase().includes(lq);
    const kids = filterNodes(node.children || [], q, field);
    if (match || kids.length > 0) acc.push({ ...node, children: kids });
    return acc;
  }, []);
}

export default function MyCommunity() {
  const { member } = useMember();
  const [data, setData] = useState({ tree: [], total_invites: 0, used_invites: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('membership_number');
  const [selected, setSelected] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    memberAPI.getCommunity().then(r => setData(r.data)).catch(console.error);
    publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const defaultAvatar = settings.membership_default_avatar || '';
  const displayTree = filterNodes(data.tree, search, filter);

  return (
    <div data-testid="my-community-page">
      <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>My Community</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-[#13161e] border border-white/5 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Sponsored Members</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-[#0d0f14] rounded">
                <span className="text-xs text-gray-400">Membership Invitation</span>
                <span className="text-lg font-bold text-[#c9a84c]" data-testid="total-invites">{data.total_invites}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#0d0f14] rounded">
                <span className="text-xs text-gray-400">Invited Members</span>
                <span className="text-lg font-bold text-white" data-testid="used-invites">{data.used_invites}</span>
              </div>
            </div>
          </div>
          <div className="bg-[#13161e] border border-white/5 rounded-lg p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#c9a84c]/10 border-2 border-[#c9a84c]/30 flex items-center justify-center overflow-hidden">
              {(member?.avatar || defaultAvatar) ? (
                <img src={member?.avatar || defaultAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-[#c9a84c]/50" />
              )}
            </div>
            <p className="mt-2 text-white text-sm font-medium">{member?.first_name} {member?.last_name}</p>
            <p className="text-[#c9a84c] text-xs">{member?.membership_id}</p>
          </div>
        </div>
        <div className="lg:col-span-2 bg-[#13161e] border border-white/5 rounded-lg">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Members Info</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#0d0f14] border border-white/10 rounded overflow-hidden flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-500 ml-3" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="flex-1 px-3 py-2 bg-transparent text-white text-sm focus:outline-none" data-testid="community-search" />
                {search && <button onClick={() => setSearch('')} className="p-2 text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>}
              </div>
              {['membership_number', 'first_name', 'last_name'].map(f => (
                <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="communityFilter" value={f} checked={filter === f} onChange={e => setFilter(e.target.value)} className="accent-[#c9a84c]" />
                  <span className="text-xs text-gray-400 capitalize">{f.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto">
            {displayTree.length > 0 ? (
              <CommunityTree tree={displayTree} onSelect={setSelected} />
            ) : <p className="text-center text-gray-500 text-sm py-8">No members in your community yet</p>}
          </div>
        </div>
      </div>
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#13161e] border-white/10 text-white" data-testid="member-profile-modal">
          <DialogHeader><DialogTitle className="text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Member Profile</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center">
                  <span className="text-[#c9a84c] font-bold">{(selected.first_name || '?')[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-medium text-white">{selected.first_name} {selected.last_name}</p>
                  <p className="text-[#c9a84c] text-xs">{selected.membership_id}</p>
                </div>
              </div>
              {selected.email && <div><span className="text-xs text-gray-500">Email:</span><p className="text-sm text-white">{selected.email}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
