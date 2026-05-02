import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../lib/api';
import { Mail, Loader2, ArrowLeft, Check } from 'lucide-react';

/**
 * Step 1 of the recovery flow — operator enters their email and we trigger
 * the backend to send a one-time link. The backend returns the same neutral
 * message whether or not the email exists, so we never leak account presence.
 */
export default function MemberForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not send the email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] px-6 py-12" style={{ fontFamily: "'DM Sans', sans-serif" }} data-testid="forgot-password-page">
      <div className="w-full max-w-md">
        <Link to="/my-account/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#c9a84c] mb-6" data-testid="back-to-login">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Forgot your password?
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Enter the email associated with your account and we&apos;ll send you a one-time link to reset your password.
        </p>

        {sent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-lg flex items-start gap-3" data-testid="forgot-password-success">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Check your inbox</p>
              <p className="text-xs">If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly. The link expires in 30 minutes and can only be used once.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg" data-testid="forgot-password-error">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#13161e] border border-white/10 text-white rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                  required
                  autoComplete="email"
                  data-testid="forgot-password-email"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-[#c9a84c] text-[#0d0f14] font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#b8973f] transition-colors disabled:opacity-50"
              data-testid="forgot-password-submit"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
