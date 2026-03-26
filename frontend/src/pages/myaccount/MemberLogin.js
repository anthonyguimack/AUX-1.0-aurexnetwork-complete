import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '../../lib/memberAuth';
import { publicAPI } from '../../lib/api';
import { User, Lock } from 'lucide-react';

export default function MemberLogin() {
  const { login, member } = useMember();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (member) navigate('/my-account/mentorship-profile');
  }, [member, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/my-account/mentorship-profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const platformName = settings.brand_name || 'Legacy';
  const domain = settings.platform_domain || 'legacy.com';
  const bgImage = settings.membership_login_bg || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80';

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }} data-testid="member-login-page">
      {/* Left — Background Image (70%) */}
      <div className="hidden lg:flex lg:w-[70%] relative">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <p className="text-white text-lg font-light" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Use your <span className="text-[#c9a84c]">{platformName}</span> account
          </p>
          <p className="text-gray-400 text-xs mt-2">2026 &copy; {domain} - ALL Rights Reserved.</p>
        </div>
      </div>

      {/* Right — Login Form (30%) */}
      <div className="w-full lg:w-[30%] bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#1a2e4a] rounded flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2e4a]" style={{ fontFamily: "'DM Serif Display', serif" }}>Membership</h1>
              <p className="text-gray-400 text-xs">Login</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">Please introduce your username and password</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded mb-4" data-testid="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                placeholder="Username" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]"
                data-testid="member-username-input" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Password" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1a2e4a]"
                data-testid="member-password-input" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#1a2e4a] text-white rounded text-sm font-semibold hover:bg-[#243a5a] transition-colors disabled:opacity-50"
              data-testid="member-login-btn">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <button className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-[#1a2e4a] transition-colors" data-testid="forgot-password-btn">
            Forgot your Password?
          </button>

          {/* Mobile: show small copyright */}
          <p className="lg:hidden text-center text-gray-300 text-xs mt-8">2026 &copy; {domain} - ALL Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}
