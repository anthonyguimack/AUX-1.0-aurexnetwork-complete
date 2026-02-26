import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Mail, MailOpen, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

export default function ContactsManager() {
  const [items, setItems] = useState([]);
  const [viewing, setViewing] = useState(null);

  const load = () => adminAPI.getContacts().then(r => setItems(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const markRead = async (item) => {
    await adminAPI.updateContact(item.id, { ...item, read: true });
    setViewing({ ...item, read: true });
    load();
  };

  return (
    <div data-testid="contacts-manager">
      <h1 className="text-2xl font-bold text-[#1a2332] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Contact Submissions</h1>
      <div className="bg-white rounded-sm border border-slate-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50">
            <th className="text-left p-3">Status</th><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Subject</th><th className="text-left p-3">Date</th><th className="text-right p-3">Actions</th>
          </tr></thead>
          <tbody>{items.map(item => (
            <tr key={item.id} className={`border-b border-slate-50 ${!item.read ? 'bg-blue-50/30' : ''}`}>
              <td className="p-3">{item.read ? <MailOpen className="w-4 h-4 text-slate-400" /> : <Mail className="w-4 h-4 text-[#0D9488]" />}</td>
              <td className="p-3 font-medium">{item.name}</td>
              <td className="p-3 text-slate-500">{item.email}</td>
              <td className="p-3 text-slate-500">{item.subject}</td>
              <td className="p-3 text-slate-400 text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
              <td className="p-3 text-right">
                <button onClick={() => { setViewing(item); if (!item.read) markRead(item); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Eye className="w-4 h-4" /></button>
                <button onClick={async () => { if (window.confirm('Delete?')) { await adminAPI.deleteContact(item.id); load(); }}} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {items.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No contact submissions yet</div>}
      </div>
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent><DialogHeader><DialogTitle>Contact Message</DialogTitle></DialogHeader>
          {viewing && <div className="space-y-3">
            <div><span className="text-xs text-slate-400">From:</span><p className="font-medium">{viewing.name} ({viewing.email})</p></div>
            {viewing.phone && <div><span className="text-xs text-slate-400">Phone:</span><p>{viewing.phone}</p></div>}
            <div><span className="text-xs text-slate-400">Subject:</span><p className="font-medium">{viewing.subject}</p></div>
            <div><span className="text-xs text-slate-400">Message:</span><p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{viewing.message}</p></div>
            <div><span className="text-xs text-slate-400">Date:</span><p className="text-sm">{new Date(viewing.created_at).toLocaleString()}</p></div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
