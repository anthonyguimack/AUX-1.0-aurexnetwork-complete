import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { memberAPI, publicAPI } from '../../lib/api';
import { UserPlus, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function MemberRegister() {
  const { setUserData } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [settings, setSettings] = useState({});
  const [step, setStep] = useState('code'); // 'code' | 'form'
  const [code, setCode] = useState(params.get('code') || '');
  const [codeValid, setCodeValid] = useState(null); // null | true | false
  const [codeInfo, setCodeInfo] = useState(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm_password: '',
    phone: '', gender: '', date_of_birth: '',
  });

  useEffect(() => {
    publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  // Auto-validate code from URL
  useEffect(() => {
    if (params.get('code')) validateCode(params.get('code'));
  }, []); // eslint-disable-line

  const validateCode = async (c) => {
    const val = (c || code).trim();
    if (!val) return;
    setValidating(true);
    setCodeValid(null);
    try {
      const res = await memberAPI.validateCode(val);
      setCodeValid(true);
      setCodeInfo(res.data);
      setStep('form');
    } catch {
      setCodeValid(false);
      setCodeInfo(null);
    } finally {
      setValidating(false);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    validateCode();
  };

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (field === 'email') setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await memberAPI.register({
        invite_code: code,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        confirm_password: form.confirm_password,
        phone: form.phone,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
      });
      // Auto-login: store token and set user data
      if (res.data.token) {
        localStorage.setItem('auth_token', res.data.token);
        if (res.data.member) setUserData(res.data.member);
      }
      toast.success(`Welcome! Your membership ID is ${res.data.membership_id}`);
      navigate('/my-account/mentorship-profile', { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Registration failed';
      if (detail.toLowerCase().includes('email already')) {
        setEmailError(detail);
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const brandName = settings.brand_name || 'Legacy';
  const bgImage = settings.membership_login_bg || '';

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }} data-testid="member-register-page">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center bg-[#0d0f14] px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#c9a84c] rounded flex items-center justify-center">
              <span className="text-[#0d0f14] font-bold text-lg" style={{ fontFamily: "'DM Serif Display', serif" }}>{brandName[0]}</span>
            </div>
            <span className="text-white text-xl font-semibold">{brandName}</span>
          </Link>

          {step === 'code' && (
            <>
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Join {brandName}
              </h1>
              <p className="text-gray-400 text-sm mb-8">Enter your invitation code to get started</p>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}
              <form onSubmit={handleCodeSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Invitation Code</label>
                  <input type="text" value={code} onChange={e => { setCode(e.target.value); setCodeValid(null); }}
                    placeholder="e.g. AUX-1-abc123"
                    className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                    required data-testid="register-invite-code" />
                  {codeValid === true && (
                    <div className="flex items-center gap-1.5 mt-2 text-green-400 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" /> Valid invitation code from {codeInfo?.sponsor_membership_id}
                    </div>
                  )}
                  {codeValid === false && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs" data-testid="register-code-error">
                      <XCircle className="w-3.5 h-3.5" /> Invalid or already used invitation code
                    </div>
                  )}
                </div>
                <button type="submit" disabled={validating || !code.trim()}
                  className="w-full py-3 bg-[#c9a84c] text-[#0d0f14] font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#b8973f] transition-colors disabled:opacity-50"
                  data-testid="register-validate-btn">
                  {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {validating ? 'Validating...' : 'Validate Code'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/my-account/login" className="text-[#c9a84c] text-sm hover:underline flex items-center justify-center gap-1" data-testid="register-login-link">
                  <ArrowLeft className="w-3.5 h-3.5" /> Already have an account? Sign In
                </Link>
              </div>
            </>
          )}

          {step === 'form' && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setStep('code')} className="text-gray-500 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Create Account</h1>
              </div>
              <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-lg p-3 mb-6 text-xs text-[#c9a84c]">
                Sponsored by: <strong>{codeInfo?.sponsor_membership_id}</strong> | Code: <strong>{code}</strong>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4" data-testid="register-form-error">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">First Name *</label>
                    <input type="text" value={form.first_name} onChange={set('first_name')} required
                      className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                      data-testid="register-firstname" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">Last Name *</label>
                    <input type="text" value={form.last_name} onChange={set('last_name')} required
                      className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                      data-testid="register-lastname" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Email * <span className="text-gray-600">(this will be your username)</span></label>
                  <input type="email" value={form.email} onChange={set('email')} required
                    className={`w-full bg-[#13161e] border ${emailError ? 'border-red-500/50' : 'border-white/10'} text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/50`}
                    data-testid="register-email" />
                  {emailError && <p className="text-red-400 text-xs mt-1" data-testid="register-email-error">{emailError}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">Password *</label>
                    <input type="password" value={form.password} onChange={set('password')} required minLength={8}
                      className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                      data-testid="register-password" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">Confirm Password *</label>
                    <input type="password" value={form.confirm_password} onChange={set('confirm_password')} required
                      className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                      data-testid="register-confirm-password" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">Phone</label>
                    <input type="tel" value={form.phone} onChange={set('phone')}
                      className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                      data-testid="register-phone" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">Gender</label>
                    <select value={form.gender} onChange={set('gender')}
                      className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                      data-testid="register-gender">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')}
                    className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                    data-testid="register-dob" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-[#c9a84c] text-[#0d0f14] font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#b8973f] transition-colors disabled:opacity-50 mt-2"
                  data-testid="register-submit-btn">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {/* Right: Image */}
      <div className="hidden lg:block lg:w-[45%] relative bg-[#13161e]"
        style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        {!bgImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#c9a84c]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-[#c9a84c] text-3xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>{brandName[0]}</span>
              </div>
              <h2 className="text-white text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>{brandName}</h2>
              <p className="text-gray-500 text-sm mt-2">Join our community</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
