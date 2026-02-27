import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus, Edit2, Trash2, Loader2, MapPin } from 'lucide-react';

export default function MapsManager() {
  const [maps, setMaps] = useState([]);
  const [locations, setLocations] = useState([]);
  const [editMap, setEditMap] = useState(null);
  const [editLoc, setEditLoc] = useState(null);
  const [openMap, setOpenMap] = useState(false);
  const [openLoc, setOpenLoc] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMaps = () => adminAPI.getMaps().then(r => setMaps(r.data)).catch(console.error);
  const loadLocs = () => adminAPI.getMapLocations().then(r => setLocations(r.data)).catch(console.error);
  useEffect(() => { loadMaps(); loadLocs(); }, []);

  const saveMap = async () => {
    setLoading(true);
    try {
      if (editMap.id) await adminAPI.updateMap(editMap.id, editMap);
      else await adminAPI.createMap(editMap);
      toast.success('Saved!'); setOpenMap(false); loadMaps();
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  const saveLoc = async () => {
    setLoading(true);
    try {
      if (editLoc.id) await adminAPI.updateMapLocation(editLoc.id, editLoc);
      else await adminAPI.createMapLocation(editLoc);
      toast.success('Saved!'); setOpenLoc(false); loadLocs();
    } catch { toast.error('Error'); } finally { setLoading(false); }
  };

  return (
    <div data-testid="maps-manager">
      <h1 className="text-2xl font-bold text-[#1a2332] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Maps Manager</h1>
      <Tabs defaultValue="maps">
        <TabsList className="mb-4"><TabsTrigger value="maps">Map Pages</TabsTrigger><TabsTrigger value="locations">Locations</TabsTrigger></TabsList>
        <TabsContent value="maps">
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditMap({ title: '', description: '', cover_image: '', tags: [], published: true }); setOpenMap(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> New Map</button>
          </div>
          <div className="bg-white rounded-sm border border-slate-100">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-slate-50"><th className="text-left p-3">Title</th><th className="text-left p-3">Status</th><th className="text-right p-3">Actions</th></tr></thead>
              <tbody>{maps.map(m => (
                <tr key={m.id} className="border-b border-slate-50">
                  <td className="p-3 font-medium">{m.title}</td>
                  <td className="p-3">{m.published ? <span className="text-xs text-[#0D9488]">Published</span> : <span className="text-xs text-slate-400">Draft</span>}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { setEditMap({...m}); setOpenMap(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => { if (window.confirm('Delete?')) { await adminAPI.deleteMap(m.id); loadMaps(); }}} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="locations">
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditLoc({ name: '', lat: 0, lng: 0, description: '', category: 'office' }); setOpenLoc(true); }} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> New Location</button>
          </div>
          <div className="bg-white rounded-sm border border-slate-100">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-slate-50"><th className="text-left p-3">Name</th><th className="text-left p-3">Lat</th><th className="text-left p-3">Lng</th><th className="text-left p-3">Category</th><th className="text-right p-3">Actions</th></tr></thead>
              <tbody>{locations.map(l => (
                <tr key={l.id} className="border-b border-slate-50">
                  <td className="p-3 font-medium flex items-center gap-2"><MapPin className="w-3 h-3 text-[#0D9488]" />{l.name}</td>
                  <td className="p-3 text-slate-500">{l.lat}</td><td className="p-3 text-slate-500">{l.lng}</td>
                  <td className="p-3 text-slate-500">{l.category}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { setEditLoc({...l}); setOpenLoc(true); }} className="p-1.5 text-slate-400 hover:text-[#0D9488]"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => { if (window.confirm('Delete?')) { await adminAPI.deleteMapLocation(l.id); loadLocs(); }}} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
      {/* Map Dialog */}
      <Dialog open={openMap} onOpenChange={setOpenMap}>
        <DialogContent className="sm:max-w-[500px]"><DialogHeader><DialogTitle>{editMap?.id ? 'Edit' : 'New'} Map</DialogTitle></DialogHeader>
          {editMap && <div className="space-y-4">
            <div><Label>Title</Label><Input value={editMap.title} onChange={e => setEditMap({...editMap, title: e.target.value})} className="mt-1" /></div>
            <div><Label>Description (HTML)</Label><textarea value={editMap.description} onChange={e => setEditMap({...editMap, description: e.target.value})} rows={4} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
            <div><Label>Cover Image URL</Label><Input value={editMap.cover_image} onChange={e => setEditMap({...editMap, cover_image: e.target.value})} className="mt-1" /></div>
            <div><Label>Tags (comma separated)</Label><Input value={(editMap.tags || []).join(', ')} onChange={e => setEditMap({...editMap, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} className="mt-1" /></div>
            <button onClick={saveMap} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50">Save</button>
          </div>}
        </DialogContent>
      </Dialog>
      {/* Location Dialog */}
      <Dialog open={openLoc} onOpenChange={setOpenLoc}>
        <DialogContent className="sm:max-w-[500px]"><DialogHeader><DialogTitle>{editLoc?.id ? 'Edit' : 'New'} Location</DialogTitle></DialogHeader>
          {editLoc && <div className="space-y-4">
            <div><Label>Name</Label><Input value={editLoc.name} onChange={e => setEditLoc({...editLoc, name: e.target.value})} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Latitude</Label><Input type="number" step="any" value={editLoc.lat} onChange={e => setEditLoc({...editLoc, lat: parseFloat(e.target.value) || 0})} className="mt-1" /></div>
              <div><Label>Longitude</Label><Input type="number" step="any" value={editLoc.lng} onChange={e => setEditLoc({...editLoc, lng: parseFloat(e.target.value) || 0})} className="mt-1" /></div>
            </div>
            <div><Label>Description</Label><textarea value={editLoc.description} onChange={e => setEditLoc({...editLoc, description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
            <div><Label>Category</Label><Input value={editLoc.category} onChange={e => setEditLoc({...editLoc, category: e.target.value})} className="mt-1" /></div>
            <div><Label>Link (optional URL)</Label><Input value={editLoc.link || ''} onChange={e => setEditLoc({...editLoc, link: e.target.value})} className="mt-1" placeholder="https://..." /></div>
            <button onClick={saveLoc} disabled={loading} className="w-full bg-[#0D9488] text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50">Save</button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
