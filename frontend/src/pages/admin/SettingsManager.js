import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Save, Loader2, Globe, Palette, Mail, Shield, Plug, Rss, Plus, Trash2, Send, Wifi, Users, Layout, ChevronDown, ChevronRight, Check, Map } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import RichTextEditor from '../../components/RichTextEditor';
import { WEBSITE_COLORS, MYACCOUNT_COLORS, ADMIN_COLORS, LANDING_PAGE_COLORS, ENROLLMENT_COLORS, THEMES } from '../../lib/themeColors';
import { MAP_LANGUAGES } from '../../lib/mapConfig';

function ColorGroup({ title, description, colors, values, onChange, testIdPrefix }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'var(--ad-card-border, #e2e8f0)' }} data-testid={`color-group-${testIdPrefix}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-50 transition-colors">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--ad-heading, #1a2332)' }}>{title}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ad-text-secondary, #64748b)' }}>{description}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-5 py-4 border-t border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {colors.map(cf => (
              <div key={cf.key} className="p-2.5 border border-slate-100 rounded-sm">
                <Label className="text-xs block mb-1.5">{cf.label}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={values[cf.key] || cf.default} onChange={e => onChange(cf.key, e.target.value)} className="w-7 h-7 rounded-sm cursor-pointer border-0 flex-shrink-0" />
                  <Input value={values[cf.key] || cf.default} onChange={e => onChange(cf.key, e.target.value)} className="flex-1 h-7 text-xs font-mono" data-testid={`color-${testIdPrefix}-${cf.key}`} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => {
            const defaults = {};
            colors.forEach(c => { defaults[c.key] = c.default; });
            Object.keys(defaults).forEach(k => onChange(k, defaults[k]));
          }} className="mt-3 text-xs text-slate-400 hover:text-slate-600 hover:underline">
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

export default function SettingsManager() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => { adminAPI.getSettings().then(r => setSettings(r.data || {})).catch(console.error); }, []);

  const save = async () => {
    setLoading(true);
    try { await adminAPI.updateSettings(settings); toast.success('Settings saved! Refresh the page to see color changes.'); }
    catch { toast.error('Error saving'); }
    finally { setLoading(false); }
  };

  const updateSection = (key, field, value) => {
    setSettings(prev => ({ ...prev, sections: { ...prev.sections, [key]: { ...prev.sections?.[key], [field]: value } } }));
  };

  const updateThemeColor = (group, key, value) => {
    setSettings(prev => ({
      ...prev,
      theme_colors: {
        ...prev.theme_colors,
        [group]: { ...(prev.theme_colors || {})[group], [key]: value }
      }
    }));
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

  const tc = settings.theme_colors || {};
  // Migrate legacy colors if theme_colors.website is empty
  const websiteColors = tc.website || settings.colors || {};
  const myAccountColors = tc.my_account || {};
  const adminColors = tc.admin || {};
  const landingPageColors = tc.landing_page || {};
  const enrollmentColors = tc.enrollment || {};

  const activeTheme = settings.active_theme || 'default';

  return (
    <div data-testid="settings-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}>Settings</h1>
        <button onClick={save} disabled={loading} className="text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="settings-save-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
        </button>
      </div>
      <Tabs defaultValue="general">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="general"><Globe className="w-3 h-3 mr-1" />General</TabsTrigger>
          <TabsTrigger value="colors"><Palette className="w-3 h-3 mr-1" />Colors</TabsTrigger>
          <TabsTrigger value="themes"><Layout className="w-3 h-3 mr-1" />Themes</TabsTrigger>
          <TabsTrigger value="sections"><Shield className="w-3 h-3 mr-1" />Sections</TabsTrigger>
          <TabsTrigger value="social"><Globe className="w-3 h-3 mr-1" />Social Links</TabsTrigger>
          <TabsTrigger value="email"><Mail className="w-3 h-3 mr-1" />Email/SMTP</TabsTrigger>
          <TabsTrigger value="blogapi"><Rss className="w-3 h-3 mr-1" />Blog API</TabsTrigger>
          <TabsTrigger value="membership"><Users className="w-3 h-3 mr-1" />Membership</TabsTrigger>
          <TabsTrigger value="apis"><Plug className="w-3 h-3 mr-1" />APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Brand Name</Label><Input value={settings.brand_name || ''} onChange={e => setSettings({...settings, brand_name: e.target.value})} className="mt-1" data-testid="settings-brand-name" /></div>
              <div><Label>Tagline</Label><Input value={settings.tagline || ''} onChange={e => setSettings({...settings, tagline: e.target.value})} className="mt-1" /></div>
            </div>
            <div><Label>Meta Title</Label><Input value={settings.meta_title || ''} onChange={e => setSettings({...settings, meta_title: e.target.value})} className="mt-1" /></div>
            <div><Label>Meta Description</Label><textarea value={settings.meta_description || ''} onChange={e => setSettings({...settings, meta_description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" /></div>

            <hr className="border-slate-200" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--ad-heading, #1a2332)' }}>Logo &amp; Favicon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Logo On #1 <span className="text-xs text-slate-400 font-normal">(Hero / Initial)</span></Label>
                <p className="text-xs text-slate-400 mb-2">Shown on the hero or when the page first loads (before scrolling).</p>
                <ImageUpload value={settings.logo_on_1 || ''} onChange={v => setSettings({...settings, logo_on_1: v})} data-testid="settings-logo-on-1" />
              </div>
              <div>
                <Label>Logo On #2 <span className="text-xs text-slate-400 font-normal">(Scrolled Header)</span></Label>
                <p className="text-xs text-slate-400 mb-2">Shown when the header has a white/solid background (after scrolling).</p>
                <ImageUpload value={settings.logo_on_2 || ''} onChange={v => setSettings({...settings, logo_on_2: v})} data-testid="settings-logo-on-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Logo Off <span className="text-xs text-slate-400 font-normal">(Footer, Admin Sidebar, My Account)</span></Label>
                <p className="text-xs text-slate-400 mb-2">Displayed in the footer, admin sidebar, and My Account sidebar.</p>
                <ImageUpload value={settings.logo_off || ''} onChange={v => setSettings({...settings, logo_off: v})} data-testid="settings-logo-off" />
              </div>
              <div>
                <Label>Favicon</Label>
                <p className="text-xs text-slate-400 mb-2">Browser tab icon. Recommended: 32x32 or 64x64 PNG.</p>
                <ImageUpload value={settings.favicon || ''} onChange={v => setSettings({...settings, favicon: v})} data-testid="settings-favicon" />
              </div>
            </div>

            <hr className="border-slate-200" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--ad-heading, #1a2332)' }}>Footer Text</h3>
            <div><Label>Footer Description</Label><p className="text-xs text-slate-400 mb-1">Text shown below the logo in the footer.</p><textarea value={settings.footer_description || ''} onChange={e => setSettings({...settings, footer_description: e.target.value})} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" data-testid="settings-footer-description" /></div>
            <div><Label>Footer Copyright</Label><p className="text-xs text-slate-400 mb-1">Copyright text at the bottom of the footer.</p><Input value={settings.footer_copyright || ''} onChange={e => setSettings({...settings, footer_copyright: e.target.value})} className="mt-1" data-testid="settings-footer-copyright" /></div>

            <hr className="border-slate-200" />
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--ad-heading, #1a2332)' }}><Map className="w-4 h-4" /> Maps Configuration</h3>
            <div>
              <Label>Maps Language</Label>
              <p className="text-xs text-slate-400 mb-1">Select the language for map tile labels globally across all maps.</p>
              <select value={settings.maps_language || 'local'} onChange={e => setSettings({...settings, maps_language: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" data-testid="settings-maps-language">
                {MAP_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            <hr className="border-slate-200" />
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--ad-heading, #1a2332)' }}>Landing Page</h3>
            <div>
              <Label>Enable Landing Page</Label>
              <p className="text-xs text-slate-400 mb-2">When enabled, visitors see the Landing Page instead of the Website until the launch date.</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="lp_enabled" checked={settings.landing_page_enabled === true} onChange={() => setSettings({...settings, landing_page_enabled: true})} className="accent-[#0D9488]" data-testid="lp-enabled-yes" />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="lp_enabled" checked={settings.landing_page_enabled !== true} onChange={() => setSettings({...settings, landing_page_enabled: false})} className="accent-[#0D9488]" data-testid="lp-enabled-no" />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
            {settings.landing_page_enabled && (
              <>
                <div>
                  <Label>Website Launch Date</Label>
                  <p className="text-xs text-slate-400 mb-1">The landing page shows until this date, then auto-switches to the website.</p>
                  <Input type="datetime-local" value={settings.landing_page_launch_date || ''} onChange={e => setSettings({...settings, landing_page_launch_date: e.target.value})} className="mt-1" data-testid="lp-launch-date" />
                </div>
                <div>
                  <Label>Landing Page Logo</Label>
                  <p className="text-xs text-slate-400 mb-1">Exclusive logo for the landing page. Upload or paste URL.</p>
                  <ImageUpload value={settings.landing_page_logo || ''} onChange={v => setSettings({...settings, landing_page_logo: v})} data-testid="lp-logo" />
                </div>
              </>
            )}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2" style={{ color: 'var(--ad-heading, #1a2332)' }}>Membership Enrollment</h3>
              <div>
                <Label>Membership Enrollment Logo</Label>
                <p className="text-xs text-slate-400 mb-1">Exclusive logo displayed only in the Membership Enrollment portal. Upload or paste URL.</p>
                <ImageUpload value={settings.enrollment_logo || ''} onChange={v => setSettings({...settings, enrollment_logo: v})} data-testid="enrollment-logo" />
              </div>
            </div>

            <hr className="border-slate-200" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--ad-heading, #1a2332)' }}>Mentor Slot Templates</h3>
            <div>
              <Label>Enable Mentor Slot Templates</Label>
              <p className="text-xs text-slate-400 mb-2">When enabled, mentors see an &quot;Apply Template&quot; dropdown inside the slot editor that pre-fills title, duration, description, and virtual link from admin-managed templates. Manage the library in <span className="font-medium">Calendar &rarr; Mentor Slot Templates</span>.</p>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.mentor_slot_templates_enabled === true}
                  onCheckedChange={(checked) => setSettings({ ...settings, mentor_slot_templates_enabled: checked })}
                  data-testid="mentor-slot-templates-toggle"
                />
                <span className="text-sm text-slate-600">{settings.mentor_slot_templates_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colors">
          <div className="space-y-4" data-testid="colors-tab">
            <div className="bg-white rounded-sm border border-slate-100 p-4">
              <p className="text-sm text-slate-500">Customize colors for every section of the application. Changes apply globally after saving.</p>
            </div>
            <ColorGroup
              title="Website"
              description="Colors for the public-facing frontend — header, hero, cards, buttons, footer."
              colors={WEBSITE_COLORS}
              values={websiteColors}
              onChange={(key, val) => updateThemeColor('website', key, val)}
              testIdPrefix="website"
            />
            <ColorGroup
              title="My Account (Member Portal)"
              description="Colors for the member portal — sidebar, cards, forms, modals, progress bars."
              colors={MYACCOUNT_COLORS}
              values={myAccountColors}
              onChange={(key, val) => updateThemeColor('my_account', key, val)}
              testIdPrefix="myaccount"
            />
            <ColorGroup
              title="CMS (Admin Panel)"
              description="Colors for the admin interface — sidebar, navbar, tables, buttons, badges."
              colors={ADMIN_COLORS}
              values={adminColors}
              onChange={(key, val) => updateThemeColor('admin', key, val)}
              testIdPrefix="admin"
            />
            <ColorGroup
              title="Landing Page"
              description="Colors for the Coming Soon landing page — backgrounds, countdown, buttons, modal, forms, footer, cookie banner."
              colors={LANDING_PAGE_COLORS}
              values={landingPageColors}
              onChange={(key, val) => updateThemeColor('landing_page', key, val)}
              testIdPrefix="landing"
            />
            <ColorGroup
              title="Membership Enrollment"
              description="Colors for the Membership Enrollment portal — header, progress bar, form inputs, buttons, footer."
              colors={ENROLLMENT_COLORS}
              values={enrollmentColors}
              onChange={(key, val) => updateThemeColor('enrollment', key, val)}
              testIdPrefix="enrollment"
            />
          </div>
        </TabsContent>

        <TabsContent value="themes">
          <div className="bg-white rounded-sm border border-slate-100 p-6" data-testid="themes-tab">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--ad-heading, #1a2332)' }}>Website Theme</h3>
            <p className="text-sm text-slate-500 mb-6">Select a layout template for the public website. This only affects the frontend — Admin Panel and My Account are not changed.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {THEMES.map(theme => (
                <button key={theme.id}
                  onClick={() => setSettings(prev => ({ ...prev, active_theme: theme.id }))}
                  className={`text-left rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg ${activeTheme === theme.id ? 'border-[#0D9488] shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                  data-testid={`theme-${theme.id}`}
                >
                  <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                    <ThemePreview themeId={theme.id} />
                    {activeTheme === theme.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#0D9488] rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm" style={{ color: 'var(--ad-heading, #1a2332)' }}>{theme.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{theme.description}</p>
                  </div>
                </button>
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
            <button onClick={addSocialLink} className="mt-3 flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--ad-accent, #0D9488)' }} data-testid="add-social-link-btn"><Plus className="w-4 h-4" /> Add Social Link</button>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-semibold" style={{ color: 'var(--ad-heading, #1a2332)' }}>SMTP Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>SMTP Host</Label><Input value={settings.smtp_host || ''} onChange={e => setSettings({...settings, smtp_host: e.target.value})} className="mt-1" placeholder="valor-smtp.us-east-2.amazonaws.com" data-testid="smtp-host-input" /></div>
              <div><Label>SMTP Port</Label><Input type="number" value={settings.smtp_port || 587} onChange={e => setSettings({...settings, smtp_port: parseInt(e.target.value)})} className="mt-1" data-testid="smtp-port-input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>SMTP Username</Label><Input value={settings.smtp_user || ''} onChange={e => setSettings({...settings, smtp_user: e.target.value})} className="mt-1" data-testid="smtp-user-input" /></div>
              <div><Label>SMTP Password</Label><Input type="password" value={settings.smtp_password || ''} onChange={e => setSettings({...settings, smtp_password: e.target.value})} className="mt-1" data-testid="smtp-pass-input" /></div>
            </div>
            <hr className="border-slate-200" />
            <h3 className="font-semibold" style={{ color: 'var(--ad-heading, #1a2332)' }}>Email Sender/Receiver</h3>
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
              <button onClick={testConnection} disabled={testingConn} className="flex items-center gap-2 px-4 py-2 border rounded-sm text-sm font-medium hover:bg-slate-50 disabled:opacity-50" style={{ borderColor: 'var(--ad-accent, #0D9488)', color: 'var(--ad-accent, #0D9488)' }} data-testid="test-connection-btn">
                {testingConn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />} Test Connection
              </button>
              <button onClick={testEmail} disabled={testingEmail} className="flex items-center gap-2 px-4 py-2 text-white rounded-sm text-sm font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--ad-accent, #0D9488)' }} data-testid="test-email-btn">
                {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Test Email
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="blogapi">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-semibold" style={{ color: 'var(--ad-heading, #1a2332)' }}>External Blog API</h3>
            <p className="text-sm text-slate-500">Configure the external JSON API URL for the Blog section on the homepage. The News section uses internal posts.</p>
            <div>
              <Label>Blog API URL</Label>
              <Input value={settings.blog_api_url || ''} onChange={e => setSettings({...settings, blog_api_url: e.target.value})} className="mt-1" placeholder="https://carlosartiles.com/api.php" data-testid="blog-api-url-input" />
              <p className="text-xs text-slate-400 mt-1">The API must return JSON with a "posts" array. Each post should have: title, image, url/link, summary.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="membership">
          <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
            <h3 className="font-semibold" style={{ color: 'var(--ad-heading, #1a2332)' }}>Membership Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>AUX Prefix</Label><Input value={settings.aux_prefix || 'AUX'} onChange={e => setSettings({...settings, aux_prefix: e.target.value})} className="mt-1" placeholder="AUX" data-testid="aux-prefix-input" />
                <p className="text-xs text-slate-400 mt-1">Prefix for membership IDs (e.g. AUX-1, AUX-2)</p></div>
              <div><Label>Platform Domain</Label><Input value={settings.platform_domain || ''} onChange={e => setSettings({...settings, platform_domain: e.target.value})} className="mt-1" placeholder="legacy.com" /></div>
            </div>
            <div><Label>Login Background Image</Label>
              <ImageUpload value={settings.membership_login_bg || ''} onChange={val => setSettings({...settings, membership_login_bg: val})} className="mt-1" /></div>
            <div><Label>Default Member Avatar</Label>
              <ImageUpload value={settings.membership_default_avatar || ''} onChange={val => setSettings({...settings, membership_default_avatar: val})} className="mt-1" /></div>
            <div><Label>Welcome Email Template</Label>
              <p className="text-xs text-slate-400 mb-1">Use placeholders: {'{{first_name}}'}, {'{{last_name}}'}, {'{{membership_id}}'}, {'{{username}}'}, {'{{platform_name}}'}</p>
              <div className="mt-1"><RichTextEditor value={settings.welcome_email_template || ''} onChange={val => setSettings({...settings, welcome_email_template: val})} placeholder="Welcome email HTML template..." /></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="apis">
          <div className="bg-white rounded-sm border border-slate-100 p-6" data-testid="apis-tab">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--ad-heading, #1a2332)' }}>Third-Party API Integrations</h3>
            <p className="text-sm text-slate-500 mb-5">Overview of all external services and APIs used in this project.</p>
            <div className="space-y-3">
              {[
                { name: 'Stripe', desc: 'Payment processing for services checkout', status: settings.stripe_configured !== false, config: 'API key configured in backend environment', category: 'Payments' },
                { name: 'Google OAuth', desc: 'Social login via Emergent-managed Google Auth', status: true, config: 'Managed by Emergent platform', category: 'Authentication' },
                { name: 'SMTP (Email)', desc: 'Transactional emails — contact form, invitations, welcome emails', status: !!(settings.smtp_host && settings.smtp_user), config: settings.smtp_host ? `Host: ${settings.smtp_host}:${settings.smtp_port || 587}` : 'Not configured — set up in Email/SMTP tab', category: 'Email' },
                { name: 'External Blog API', desc: 'Fetches blog posts from an external JSON endpoint', status: !!settings.blog_api_url, config: settings.blog_api_url || 'Not configured — set up in Blog API tab', category: 'Content' },
                { name: 'Leaflet / OpenStreetMap', desc: 'Interactive maps for location display', status: true, config: 'Open-source — no API key needed', category: 'Maps' },
                { name: 'MongoDB', desc: 'Primary database for all application data', status: true, config: 'Configured in backend environment', category: 'Database' },
              ].map(api => (
                <div key={api.name} className="flex items-start gap-4 p-4 border border-slate-100 rounded-sm" data-testid={`api-${api.name.toLowerCase().replace(/[\s/()]+/g, '-')}`}>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${api.status ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm" style={{ color: 'var(--ad-heading, #1a2332)' }}>{api.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{api.category}</span>
                    </div>
                    <p className="text-xs text-slate-500">{api.desc}</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{api.config}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${api.status ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                    {api.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Visual theme previews rendered as mini mockups
function ThemePreview({ themeId }) {
  if (themeId === 'default') {
    return (
      <div className="w-full h-full bg-white flex flex-col text-[3px]">
        <div className="bg-[#1a2332] h-[4%]" />
        <div className="bg-white h-[6%] border-b border-slate-100 flex items-center px-[4%]">
          <div className="w-[8%] h-[60%] bg-[#1a2332] rounded-sm" />
          <div className="flex-1 flex justify-center gap-[3%]">
            <div className="w-[8%] h-[40%] bg-slate-300 rounded-full" />
            <div className="w-[8%] h-[40%] bg-slate-300 rounded-full" />
            <div className="w-[8%] h-[40%] bg-slate-300 rounded-full" />
          </div>
        </div>
        <div className="bg-[#1a2332] h-[35%] flex items-center justify-center">
          <div className="text-center">
            <div className="w-[40%] mx-auto h-[3px] bg-white/80 rounded mb-1" />
            <div className="w-[60%] mx-auto h-[2px] bg-white/40 rounded mb-2" />
            <div className="w-[20%] mx-auto h-[4px] bg-[#0D9488] rounded" />
          </div>
        </div>
        <div className="flex-1 bg-white p-[4%]">
          <div className="flex gap-[3%]">
            <div className="flex-1 h-[20px] bg-slate-100 rounded-sm" />
            <div className="flex-1 h-[20px] bg-slate-100 rounded-sm" />
            <div className="flex-1 h-[20px] bg-slate-100 rounded-sm" />
          </div>
        </div>
        <div className="bg-[#1a2332] h-[15%]" />
      </div>
    );
  }
  if (themeId === 'modern') {
    return (
      <div className="w-full h-full bg-white flex flex-col text-[3px]">
        <div className="h-[45%] bg-gradient-to-br from-slate-900 to-slate-700 relative">
          <div className="absolute inset-x-0 top-0 h-[12%] flex items-center justify-between px-[5%]">
            <div className="w-[8%] h-[50%] bg-white/20 rounded" />
            <div className="flex gap-[3%]">
              <div className="w-[6%] h-[40%] bg-white/30 rounded-full" />
              <div className="w-[6%] h-[40%] bg-white/30 rounded-full" />
              <div className="w-[6%] h-[40%] bg-white/30 rounded-full" />
            </div>
          </div>
          <div className="absolute bottom-[15%] left-[8%]">
            <div className="w-[45%] h-[3px] bg-white rounded mb-1" />
            <div className="w-[30%] h-[2px] bg-white/50 rounded mb-2" />
            <div className="flex gap-1">
              <div className="w-[15%] h-[4px] bg-[#0D9488] rounded-full" />
              <div className="w-[15%] h-[4px] bg-white/20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-[5%] flex gap-[3%]">
          <div className="flex-1 bg-slate-50 rounded-lg p-[3%]">
            <div className="w-full h-[8px] bg-slate-200 rounded-lg mb-1" />
            <div className="w-[70%] h-[4px] bg-slate-100 rounded" />
          </div>
          <div className="flex-1 bg-slate-50 rounded-lg p-[3%]">
            <div className="w-full h-[8px] bg-slate-200 rounded-lg mb-1" />
            <div className="w-[70%] h-[4px] bg-slate-100 rounded" />
          </div>
        </div>
        <div className="bg-slate-900 h-[12%]" />
      </div>
    );
  }
  if (themeId === 'classic') {
    return (
      <div className="w-full h-full bg-[#faf9f6] flex flex-col text-[3px]">
        <div className="bg-[#2c1810] h-[4%]" />
        <div className="bg-[#faf9f6] border-b-2 border-[#2c1810] h-[8%] flex items-center px-[5%]">
          <div className="w-[10%] h-[50%] bg-[#2c1810] rounded-sm" />
          <div className="flex-1 flex justify-center gap-[2%]">
            <div className="w-[10%] h-[40%] bg-[#2c1810]/20 rounded-sm" />
            <div className="w-[10%] h-[40%] bg-[#2c1810]/20 rounded-sm" />
            <div className="w-[10%] h-[40%] bg-[#2c1810]/20 rounded-sm" />
          </div>
        </div>
        <div className="mx-[8%] my-[3%] border-2 border-[#2c1810]/20 p-[3%] flex-1 flex gap-[4%]">
          <div className="flex-1">
            <div className="w-[70%] h-[3px] bg-[#2c1810] rounded mb-1" />
            <div className="w-full h-[2px] bg-[#2c1810]/30 rounded mb-0.5" />
            <div className="w-full h-[2px] bg-[#2c1810]/30 rounded mb-0.5" />
            <div className="w-[60%] h-[2px] bg-[#2c1810]/30 rounded mb-2" />
            <div className="w-[25%] h-[4px] bg-[#8B4513] rounded-sm" />
          </div>
          <div className="w-[40%] bg-[#2c1810]/10 rounded-sm" />
        </div>
        <div className="flex gap-[3%] mx-[8%] mb-[3%]">
          <div className="flex-1 border border-[#2c1810]/20 p-[2%] rounded-sm">
            <div className="w-full h-[10px] bg-[#2c1810]/10 rounded-sm" />
          </div>
          <div className="flex-1 border border-[#2c1810]/20 p-[2%] rounded-sm">
            <div className="w-full h-[10px] bg-[#2c1810]/10 rounded-sm" />
          </div>
          <div className="flex-1 border border-[#2c1810]/20 p-[2%] rounded-sm">
            <div className="w-full h-[10px] bg-[#2c1810]/10 rounded-sm" />
          </div>
        </div>
        <div className="bg-[#2c1810] h-[12%]" />
      </div>
    );
  }
  return null;
}
