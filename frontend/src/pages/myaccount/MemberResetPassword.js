import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import { Lock, Loader2, ArrowLeft, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';

/**
 * Step 2 of the recovery flow — operator landed here from the email link.
 * The token is read from the `?token=` query string.
 *
 * We hit /auth/reset-password/verify on mount so we can show a friendly
 * "expired or already used" message instead of letting them type a new
 * password and only learn it failed on submit. The token is single-use:
 * after a successful POST /auth/reset-password the backend marks it used.
 */
export default function MemberResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [tokenStatus, setTokenStatus] = useState({ valid: false, reason: '' });
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pw1Visible, setPw1Visible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenStatus({ valid: false, reason: 'missing' });
      setVerifying(false);
      return;
    }
    authAPI.verifyResetToken(token)
      .then(r => setTokenStatus(r.data || { valid: false, reason: 'unknown' }))
      .catch(() => setTokenStatus({ valid: false, reason: 'network' }))
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw1.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (pw1 !== pw2) {
      setError('The passwords don\u2019t match.');
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.resetPassword(token, pw1);
      setDone(true);
      setTimeout(() => navigate('/my-account/login'), 2500);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not reset the password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const reasonText = {
    missing:   'No reset token was provided. Use the link from your email.',
    not_found: 'This reset link is not valid. It may have been mistyped.',
    used:      'This reset link has already been used. Request a new one if you still need to change your password.',
    expired:   'This reset link has expired. Reset links are valid for 30 minutes — please request a new one.',
    network:   'We could not verify the reset link. Check your connection and try again.',
    unknown:   'This reset link could not be verified.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] px-6 py-12" style={{ fontFamily: "'DM Sans', sans-serif" }} data-testid="reset-password-page">
      <div className="w-full max-w-md">
        <Link to="/my-account/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#c9a84c] mb-6" data-testid="back-to-login">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Reset your password
        </h1>

        {verifying ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm mt-8" data-testid="reset-password-verifying">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying reset link…
          </div>
        ) : !tokenStatus.valid ? (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm p-4 rounded-lg flex items-start gap-3" data-testid="reset-password-invalid">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Link not valid</p>
              <p className="text-xs">{reasonText[tokenStatus.reason] || reasonText.unknown}</p>
              <Link to="/my-account/forgot-password" className="inline-block mt-3 text-amber-200 hover:text-white text-xs font-medium underline" data-testid="request-new-link">
                Request a new reset link
              </Link>
            </div>
          </div>
        ) : done ? (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-lg flex items-start gap-3" data-testid="reset-password-success">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Password updated</p>
              <p className="text-xs">You can now sign in with your new password. Redirecting to login…</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-8">
              Enter your new password below.
              {tokenStatus.email && <> You&apos;re resetting the password for <strong className="text-gray-300">{tokenStatus.email}</strong>.</>}
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg" data-testid="reset-password-error">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={pw1Visible ? 'text' : 'password'}
                    value={pw1}
                    onChange={e => setPw1(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    data-testid="reset-password-pw1"
                  />
                  <button
                    type="button"
                    onClick={() => setPw1Visible(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={pw1Visible ? 'Hide password' : 'Show password'}
                  >
                    {pw1Visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Confirm new password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    placeholder="Repeat the new password"
                    className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    data-testid="reset-password-pw2"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !pw1 || !pw2}
                className="w-full py-3 bg-[#c9a84c] text-[#0d0f14] font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#b8973f] transition-colors disabled:opacity-50"
                data-testid="reset-password-submit"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
