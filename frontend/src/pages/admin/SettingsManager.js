import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Save, Loader2, Globe, Palette, Mail, Shield, Type } from 'lucide-react';

export default function SettingsManager() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { adminAPI.getSettings().then(r => setSettings(r.data || {})).catch(console.error); }, []);

  const save = async () => {
    setLoading(true);
    try { await adminAPI.updateSettings(settings); toast.success('Settings saved!'); }
    catch { toast.error('Error saving'); }
    finally { setLoading(false); }
  };

  const updateSection = (key, field, value) => {
    setSettings(prev => ({ ...prev, sections: { ...prev.sections, [key]: { ...prev.sections?.[key], [field]: value } } }));
  };

  const updateSocial = (key, value) => {
    setSettings(prev => ({ ...prev, social_media: { ...prev.social_media, [key]: value } }));
  };

  const updatePageAccess = (key, value) => {
    setSettings(prev => ({ ...prev, page_access: { ...prev.page_access, [key]: value } }));
  };

  return (
    <div data-testid="settings-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Settings</h1>
        <button onClick={save} disabled={loading} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50" data-testid="settings-save-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
        </button>
      </div>
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general"><Globe className="w-3 h-3 mr-1" />General</TabsTrigger>
          <TabsTrigger value="sections"><Shield className="w-3 h-3 mr-1" />Sections</TabsTrigger>
          <TabsTrigger value="access"><Shield className="w-3 h-3 mr-1" />Page Access</TabsTrigger>
          <TabsTrigger value="social"><Globe className="w-3 h-3 mr-1" />Social</TabsTrigger>
          <TabsTrigger value="email"><Mail className="w-3 h-3 mr-1" />Email</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-3 h-3 mr-1" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Brand Name</Label><Input value={settings.brand_name || ''} onChange={e => setSettings({...settings, brand_name: e.target.value})} className="mt-1" /></div>
              <div><Label>Tagline</Label><Input value={settings.tagline || ''} onChange={e => setSettings({...settings, tagline: e.target.value})} className="mt-1" /></div>
            </div>
            <div><Label>Meta Title</Label><Input value={settings.meta_title || ''} onChange={e => setSettings({...settings, meta_title: e.target.value})} className="mt-1" /></div>
            <div><Label>Meta Description</Label><textarea value={settings.meta_description || ''} onChange={e => setSettings({...settings, meta_description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Logo URL</Label><Input value={settings.logo_url || ''} onChange={e => setSettings({...settings, logo_url: e.target.value})} className="mt-1" /></div>
              <div><Label>Favicon URL</Label><Input value={settings.favicon_url || ''} onChange={e => setSettings({...settings, favicon_url: e.target.value})} className="mt-1" /></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <div className="bg-white rounded-sm border border-slate-100 p-6">
            <p className="text-sm text-slate-500 mb-4">Enable or disable homepage sections and customize their titles.</p>
            <div className="space-y-4">
              {Object.entries(settings.sections || {}).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-sm border border-slate-100">
                  <div className="flex items-center gap-4">
                    <Switch checked={val?.enabled !== false} onCheckedChange={(checked) => updateSection(key, 'enabled', checked)} data-testid={`section-toggle-${key}`} />
                    <div>
                      <Input value={val?.title || key} onChange={e => updateSection(key, 'title', e.target.value)} className="h-8 text-sm w-48" />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{key.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="access">
          <div className="bg-white rounded-sm border border-slate-100 p-6">
            <p className="text-sm text-slate-500 mb-4">Control which pages require login to access.</p>
            <div className="space-y-3">
              {Object.entries(settings.page_access || {}).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-sm border border-slate-100">
                  <span className="text-sm font-medium capitalize">{key.replace('_', ' ')} Page</span>
                  <select value={val || 'public'} onChange={e => updatePageAccess(key, e.target.value)} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-sm text-sm" data-testid={`access-${key}`}>
                    <option value="public">Public</option>
                    <option value="protected">Login Required</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            {['facebook', 'twitter', 'instagram', 'linkedin'].map(key => (
              <div key={key}><Label className="capitalize">{key}</Label><Input value={settings.social_media?.[key] || ''} onChange={e => updateSocial(key, e.target.value)} className="mt-1" /></div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <div className="bg-amber-50 text-amber-700 text-sm p-3 rounded-sm">SMTP is simulated. Configure real SMTP settings when ready for production.</div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>SMTP Host</Label><Input value={settings.smtp_host || ''} onChange={e => setSettings({...settings, smtp_host: e.target.value})} className="mt-1" placeholder="smtp.gmail.com" /></div>
              <div><Label>SMTP Port</Label><Input type="number" value={settings.smtp_port || 587} onChange={e => setSettings({...settings, smtp_port: parseInt(e.target.value)})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>SMTP User</Label><Input value={settings.smtp_user || ''} onChange={e => setSettings({...settings, smtp_user: e.target.value})} className="mt-1" /></div>
              <div><Label>SMTP Password</Label><Input type="password" value={settings.smtp_password || ''} onChange={e => setSettings({...settings, smtp_password: e.target.value})} className="mt-1" /></div>
            </div>
            <div><Label>Admin Email</Label><Input value={settings.admin_email || ''} onChange={e => setSettings({...settings, admin_email: e.target.value})} className="mt-1" /></div>
          </div>
        </TabsContent>

        <TabsContent value="appearance">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={settings.primary_color || '#1a2332'} onChange={e => setSettings({...settings, primary_color: e.target.value})} className="w-10 h-10 rounded-sm cursor-pointer" />
                  <Input value={settings.primary_color || '#1a2332'} onChange={e => setSettings({...settings, primary_color: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Accent Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={settings.accent_color || '#0D9488'} onChange={e => setSettings({...settings, accent_color: e.target.value})} className="w-10 h-10 rounded-sm cursor-pointer" />
                  <Input value={settings.accent_color || '#0D9488'} onChange={e => setSettings({...settings, accent_color: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
