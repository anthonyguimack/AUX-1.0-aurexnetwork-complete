import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Save, Loader2 } from 'lucide-react';

import ImageUpload from '../../components/ImageUpload';

export default function AboutManager() {
  const [data, setData] = useState({ label: '', title: '', description: '', phone: '', signature_name: '', signature_title: '', image: '' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { adminAPI.getAbout().then(r => { if (r.data?.title) setData(r.data); }).catch(console.error); }, []);

  const handleSave = async () => {
    setLoading(true);
    try { await adminAPI.updateAbout(data); toast.success('About updated!'); } catch { toast.error('Failed to update'); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="about-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>About Us Manager</h1>
        <button onClick={handleSave} disabled={loading} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50" data-testid="about-save-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>
      <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
        <div><Label>Label</Label><Input value={data.label} onChange={e => setData({...data, label: e.target.value})} className="mt-1" /></div>
        <div><Label>Title</Label><Input value={data.title} onChange={e => setData({...data, title: e.target.value})} className="mt-1" /></div>
        <div><Label>Description</Label><textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} rows={4} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Phone</Label><Input value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="mt-1" /></div>
        </div>
        <div><Label>Image</Label><ImageUpload value={data.image} onChange={v => setData({...data, image: v})} className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Signature Name</Label><Input value={data.signature_name} onChange={e => setData({...data, signature_name: e.target.value})} className="mt-1" /></div>
          <div><Label>Signature Title</Label><Input value={data.signature_title} onChange={e => setData({...data, signature_title: e.target.value})} className="mt-1" /></div>
        </div>
      </div>
    </div>
  );
}
