import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { memberAPI } from '../../lib/api';
import { publicAPI } from '../../lib/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function MemberRegister() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = params.get('code') || '';
  const [codeValid, setCodeValid] = useState(null);
  const [sponsorId, setSponsorId] = useState('');
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({
    invite_code: codeFromUrl, first_name: '', last_name: '', email: '',
    password: '', confirm_password: '', gender: '', phone: '', date_of_birth: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (codeFromUrl) {
      memberAPI.validateCode(codeFromUrl).then(r => {
        setCodeValid(true);
        setSponsorId(r.data.sponsor_membership_id);
      }).catch(() => setCodeValid(false));
    }
  }, [codeFromUrl]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await memberAPI.register(form);
      toast.success(`Welcome! Your Membership ID is ${res.data.membership_id}`);
      navigate('/my-account/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  const platformName = settings.brand_name || 'Legacy';
  const bgImage = settings.membership_login_bg || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80';

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }} data-testid="member-register-page">
      {/* Left Background */}
      <div className="hidden lg:flex lg:w-[55%] relative">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <h2 className="text-white text-3xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Join <span className="text-[#c9a84c]">{platformName}</span>
          </h2>
          <p className="text-gray-300 text-sm mt-2">Create your membership account to access exclusive features.</p>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-[45%] bg-white flex items-start justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-[#1a2e4a] mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>Register</h1>
          <p className="text-sm text-gray-500 mb-6">Complete the form below to create your account</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded mb-4" data-testid="register-error">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Invite Code */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Invite Code</label>
              <div className="flex items-center gap-2">
                <input name="invite_code" value={form.invite_code} onChange={handleChange} required readOnly={!!codeFromUrl}
                  className={`flex-1 px-3 py-2.5 border rounded text-sm ${codeFromUrl ? 'bg-gray-50' : ''} focus:outline-none focus:border-[#1a2e4a]`}
                  placeholder="e.g. AUX-1-abc123" data-testid="register-code-input" />
                {codeValid === true && <CheckCircle className="w-5 h-5 text-green-500" />}
                {codeValid === false && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
              {sponsorId && <p className="text-xs text-green-600 mt-1">Sponsor: {sponsorId}</p>}
              {codeValid === false && <p className="text-xs text-red-500 mt-1">Invalid or already used code</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">First Name *</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]"
                  data-testid="register-firstname-input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Last Name *</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]"
                  data-testid="register-lastname-input" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]"
                data-testid="register-email-input" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]"
                  data-testid="register-password-input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Confirm Password *</label>
                <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]"
                  data-testid="register-confirm-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]"
                  data-testid="register-gender-select">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Date of Birth</label>
              <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]" />
            </div>

            <button type="submit" disabled={loading || codeValid === false}
              className="w-full py-3 bg-[#1a2e4a] text-white rounded text-sm font-semibold hover:bg-[#243a5a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="register-submit-btn">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account? <a href="/my-account/login" className="text-[#1a2e4a] font-medium hover:underline">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
