import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';

export default function LandingContentManager() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminAPI.getLandingContent().then(r => setContent(r.data || {})).catch(console.error);
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await adminAPI.updateLandingContent(content);
      toast.success('Landing page content saved!');
    } catch { toast.error('Error saving'); }
    finally { setLoading(false); }
  };

  const u = (key, val) => setContent(prev => ({ ...prev, [key]: val }));

  return (
    <div data-testid="landing-content-manager">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}>Landing Page Content</h1>
        <button onClick={save} disabled={loading} className="text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }} data-testid="lp-content-save-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Content
        </button>
      </div>

      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--ad-heading, #1a2332)' }}>Hero / Countdown Section</h2>
          <div><Label>Main Title</Label><Input value={content.hero_title || ''} onChange={e => u('hero_title', e.target.value)} className="mt-1" placeholder="Launching in:" data-testid="lp-hero-title" /></div>
          <div><Label>Subtitle</Label><textarea value={content.hero_subtitle || ''} onChange={e => u('hero_subtitle', e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" placeholder="Your value proposition..." data-testid="lp-hero-subtitle" /></div>
          <div><Label>Positioning Text</Label><textarea value={content.hero_positioning || ''} onChange={e => u('hero_positioning', e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" placeholder="Private community, limited membership..." data-testid="lp-hero-positioning" /></div>
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--ad-heading, #1a2332)' }}>Navigation Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Button 1 Text</Label><Input value={content.btn1_text || ''} onChange={e => u('btn1_text', e.target.value)} className="mt-1" placeholder="More Information" data-testid="lp-btn1-text" /></div>
            <div><Label>Button 2 Text</Label><Input value={content.btn2_text || ''} onChange={e => u('btn2_text', e.target.value)} className="mt-1" placeholder="Membership Lounge" data-testid="lp-btn2-text" /></div>
            <div><Label>Button 3 Text</Label><Input value={content.btn3_text || ''} onChange={e => u('btn3_text', e.target.value)} className="mt-1" placeholder="Notify Me!" data-testid="lp-btn3-text" /></div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--ad-heading, #1a2332)' }}>Description / Value Proposition</h2>
          <div><Label>Section Title</Label><Input value={content.desc_title || ''} onChange={e => u('desc_title', e.target.value)} className="mt-1" placeholder="Get in touch with us!" data-testid="lp-desc-title" /></div>
          <div><Label>Subtitle</Label><Input value={content.desc_subtitle || ''} onChange={e => u('desc_subtitle', e.target.value)} className="mt-1" placeholder="" data-testid="lp-desc-subtitle" /></div>
          <div><Label>Description</Label>
            <RichTextEditor value={content.desc_body || ''} onChange={val => u('desc_body', val)} />
          </div>
          <div><Label>CTA Button Text</Label><Input value={content.desc_cta_text || ''} onChange={e => u('desc_cta_text', e.target.value)} className="mt-1" placeholder="Request Access" data-testid="lp-desc-cta" /></div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--ad-heading, #1a2332)' }}>Contact Form</h2>
          <div><Label>Section Title</Label><Input value={content.contact_title || ''} onChange={e => u('contact_title', e.target.value)} className="mt-1" placeholder="Contact Us" data-testid="lp-contact-title" /></div>
          <div><Label>Submit Button Text</Label><Input value={content.contact_btn_text || ''} onChange={e => u('contact_btn_text', e.target.value)} className="mt-1" placeholder="Send my Message" data-testid="lp-contact-btn" /></div>
        </div>

        {/* Notify Me Modal */}
        <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--ad-heading, #1a2332)' }}>Notify Me! Modal</h2>
          <div><Label>Modal Title</Label><Input value={content.notify_title || ''} onChange={e => u('notify_title', e.target.value)} className="mt-1" placeholder="Notify Me!" data-testid="lp-notify-title" /></div>
          <div><Label>Modal Text</Label><textarea value={content.notify_text || ''} onChange={e => u('notify_text', e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" placeholder="Signing up to our newsletter gives you exclusive access..." data-testid="lp-notify-text" /></div>
          <div><Label>Submit Button Text</Label><Input value={content.notify_btn_text || ''} onChange={e => u('notify_btn_text', e.target.value)} className="mt-1" placeholder="Get notified" data-testid="lp-notify-btn" /></div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--ad-heading, #1a2332)' }}>Footer</h2>
          <div><Label>Footer Text</Label><Input value={content.footer_text || ''} onChange={e => u('footer_text', e.target.value)} className="mt-1" placeholder="&copy; aurexnetwork.com - Coming Soon" data-testid="lp-footer-text" /></div>
        </div>

        {/* Cookie Banner */}
        <div className="bg-white rounded-sm border border-slate-100 p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--ad-heading, #1a2332)' }}>Cookie Banner (GDPR)</h2>
          <div><Label>Cookie Message</Label><textarea value={content.cookie_message || ''} onChange={e => u('cookie_message', e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm mt-1" placeholder="We use cookies and analytics to improve your experience..." data-testid="lp-cookie-msg" /></div>
        </div>
      </div>
    </div>
  );
}
