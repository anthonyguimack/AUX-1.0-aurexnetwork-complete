import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Save, Loader2, Globe, Palette, Mail, Shield, Plug, Rss, Plus, Trash2, Send, Wifi } from 'lucide-react';

export default function SettingsManager() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

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

  const updateColor = (key, value) => {
    setSettings(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const updateSocialLink = (index, field, value) => {
    setSettings(prev => {
      const links = [...(prev.social_links || [])];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, social_links: links };
    });
  };

  const addSocialLink = () => {
    setSettings(prev => ({
      ...prev,
      social_links: [...(prev.social_links || []), { id: Date.now().toString(), platform: '', url: '', icon: 'globe' }]
    }));
  };

  const removeSocialLink = (index) => {
    setSettings(prev => ({
      ...prev,
      social_links: (prev.social_links || []).filter((_, i) => i !== index)
    }));
  };

  const testConnection = async () => {
    setTestingConn(true);
    try {
      const res = await adminAPI.testSmtpConnection(settings);
      if (res.data.success) toast.success(res.data.message);
      else toast.error(res.data.message);
    } catch (e) { toast.error(e.response?.data?.detail || 'Test failed'); }
    finally { setTestingConn(false); }
  };

  const testEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await adminAPI.testSmtpEmail({ ...settings, test_email: settings.email_to || settings.smtp_user });
      if (res.data.success) toast.success(res.data.message);
      else toast.error(res.data.message);
    } catch (e) { toast.error(e.response?.data?.detail || 'Test failed'); }
    finally { setTestingEmail(false); }
  };

  const colors = settings.colors || {};
  const colorFields = [
    { key: 'primary', label: 'Primary Color' },
    { key: 'accent', label: 'Accent Color' },
    { key: 'button_bg', label: 'Button Background' },
    { key: 'button_text', label: 'Button Text' },
    { key: 'link_color', label: 'Link Color' },
    { key: 'tab_active_bg', label: 'Tab Active Background' },
    { key: 'tab_active_text', label: 'Tab Active Text' },
    { key: 'icon_color', label: 'Icon Color' },
    { key: 'heading_color', label: 'Heading Color' },
    { key: 'body_text', label: 'Body Text Color' },
    { key: 'footer_bg', label: 'Footer Background' },
    { key: 'footer_text', label: 'Footer Text' },
  ];

  return (
    <div data-testid="settings-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Settings</h1>
        <button onClick={save} disabled={loading} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50" data-testid="settings-save-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
        </button>
      </div>
      <Tabs defaultValue="general">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="general"><Globe className="w-3 h-3 mr-1" />General</TabsTrigger>
          <TabsTrigger value="colors"><Palette className="w-3 h-3 mr-1" />Colors</TabsTrigger>
          <TabsTrigger value="sections"><Shield className="w-3 h-3 mr-1" />Sections</TabsTrigger>
          <TabsTrigger value="social"><Globe className="w-3 h-3 mr-1" />Social Links</TabsTrigger>
          <TabsTrigger value="email"><Mail className="w-3 h-3 mr-1" />Email/SMTP</TabsTrigger>
          <TabsTrigger value="blogapi"><Rss className="w-3 h-3 mr-1" />Blog API</TabsTrigger>
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

        <TabsContent value="colors">
          <div className="bg-white rounded-sm border border-slate-100 p-6">
            <p className="text-sm text-slate-500 mb-4">Manage all website colors. Changes will be reflected globally across the entire interface.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {colorFields.map(cf => (
                <div key={cf.key} className="p-3 border border-slate-100 rounded-sm">
                  <Label className="text-xs">{cf.label}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={colors[cf.key] || '#000000'} onChange={e => updateColor(cf.key, e.target.value)} className="w-8 h-8 rounded-sm cursor-pointer border-0" />
                    <Input value={colors[cf.key] || ''} onChange={e => updateColor(cf.key, e.target.value)} className="flex-1 h-8 text-xs font-mono" data-testid={`color-${cf.key}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <div className="bg-white rounded-sm border border-slate-100 p-6">
            <p className="text-sm text-slate-500 mb-4">Enable/disable homepage sections and edit their titles.</p>
            <div className="space-y-3">
              {Object.entries(settings.sections || {}).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-sm border border-slate-100">
                  <div className="flex items-center gap-4">
                    <Switch checked={val?.enabled !== false} onCheckedChange={(checked) => updateSection(key, 'enabled', checked)} data-testid={`section-toggle-${key}`} />
                    <Input value={val?.title || key} onChange={e => updateSection(key, 'title', e.target.value)} className="h-8 text-sm w-48" />
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{key.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <div className="bg-white rounded-sm border border-slate-100 p-6">
            <p className="text-sm text-slate-500 mb-4">Manage unlimited social media links displayed in the header and footer.</p>
            <div className="space-y-3">
              {(settings.social_links || []).map((link, idx) => (
                <div key={link.id || idx} className="flex items-center gap-3 p-3 border border-slate-100 rounded-sm">
                  <Input value={link.platform} onChange={e => updateSocialLink(idx, 'platform', e.target.value)} placeholder="Platform name" className="w-32 h-8 text-sm" />
                  <select value={link.icon} onChange={e => updateSocialLink(idx, 'icon', e.target.value)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-sm text-sm h-8">
                    {['facebook','twitter','instagram','linkedin','github','youtube'].map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <Input value={link.url} onChange={e => updateSocialLink(idx, 'url', e.target.value)} placeholder="https://..." className="flex-1 h-8 text-sm" />
                  <button onClick={() => removeSocialLink(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={addSocialLink} className="mt-3 flex items-center gap-2 text-sm text-[#0D9488] hover:underline" data-testid="add-social-link-btn"><Plus className="w-4 h-4" /> Add Social Link</button>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-semibold text-[#1a2332]">SMTP Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>SMTP Host</Label><Input value={settings.smtp_host || ''} onChange={e => setSettings({...settings, smtp_host: e.target.value})} className="mt-1" placeholder="valor-smtp.us-east-2.amazonaws.com" data-testid="smtp-host-input" /></div>
              <div><Label>SMTP Port</Label><Input type="number" value={settings.smtp_port || 587} onChange={e => setSettings({...settings, smtp_port: parseInt(e.target.value)})} className="mt-1" data-testid="smtp-port-input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>SMTP Username</Label><Input value={settings.smtp_user || ''} onChange={e => setSettings({...settings, smtp_user: e.target.value})} className="mt-1" data-testid="smtp-user-input" /></div>
              <div><Label>SMTP Password</Label><Input type="password" value={settings.smtp_password || ''} onChange={e => setSettings({...settings, smtp_password: e.target.value})} className="mt-1" data-testid="smtp-pass-input" /></div>
            </div>
            <hr className="border-slate-200" />
            <h3 className="font-semibold text-[#1a2332]">Email Sender/Receiver</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>From Name ($name_from)</Label><Input value={settings.name_from || ''} onChange={e => setSettings({...settings, name_from: e.target.value})} className="mt-1" placeholder="Contact form sender name" data-testid="name-from-input" /><p className="text-xs text-slate-400 mt-1">Uses contact form's "name" field if empty</p></div>
              <div><Label>From Email ($from)</Label><Input value={settings.email_from || ''} onChange={e => setSettings({...settings, email_from: e.target.value})} className="mt-1" placeholder="verified@yourdomain.com" data-testid="email-from-input" /><p className="text-xs text-slate-400 mt-1">Must be verified in AWS SES</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>To Name ($name_to)</Label><Input value={settings.name_to || ''} onChange={e => setSettings({...settings, name_to: e.target.value})} className="mt-1" placeholder="Company Name" data-testid="name-to-input" /></div>
              <div><Label>To Email ($email_to)</Label><Input value={settings.email_to || ''} onChange={e => setSettings({...settings, email_to: e.target.value})} className="mt-1" placeholder="operator@company.com" data-testid="email-to-input" /></div>
            </div>
            <div>
              <Label>CC Recipients (comma separated)</Label>
              <Input value={settings.email_cc || ''} onChange={e => setSettings({...settings, email_cc: e.target.value})} className="mt-1" placeholder="monitor1@company.com, monitor2@company.com" data-testid="email-cc-input" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={testConnection} disabled={testingConn} className="flex items-center gap-2 px-4 py-2 border border-[#0D9488] text-[#0D9488] rounded-sm text-sm font-medium hover:bg-[#0D9488]/5 disabled:opacity-50" data-testid="test-connection-btn">
                {testingConn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />} Test Connection
              </button>
              <button onClick={testEmail} disabled={testingEmail} className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-sm text-sm font-medium hover:bg-[#0D9488]/80 disabled:opacity-50" data-testid="test-email-btn">
                {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Test Email
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="blogapi">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-semibold text-[#1a2332]">External Blog API</h3>
            <p className="text-sm text-slate-500">Configure the external JSON API URL for the Blog section on the homepage. The News section uses internal posts.</p>
            <div>
              <Label>Blog API URL</Label>
              <Input value={settings.blog_api_url || ''} onChange={e => setSettings({...settings, blog_api_url: e.target.value})} className="mt-1" placeholder="https://carlosartiles.com/api.php" data-testid="blog-api-url-input" />
              <p className="text-xs text-slate-400 mt-1">The API must return JSON with a "posts" array. Each post should have: title, image, url/link, summary.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
