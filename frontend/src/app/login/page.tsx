'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { Globe, LogIn } from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async (credential: string) => {
    setError('');
    try {
      const res = await authAPI.loginWithGoogle({ credential });
      localStorage.setItem('warops_token', res.data.access_token);
      localStorage.setItem('warops_user', JSON.stringify(res.data));
      window.location.href = '/dashboard';
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Google sign-in failed');
    }
  };

  const persistSession = (data: { access_token: string; user: unknown; organization: unknown }) => {
    localStorage.setItem('warops_token', data.access_token);
    localStorage.setItem('warops_user', JSON.stringify(data));
    window.location.href = '/dashboard';
  };

  const backendLogin = async (emailValue: string, passwordValue: string) => {
    const res = await authAPI.login({ email: emailValue, password: passwordValue });
    persistSession(res.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const emailValue = email.trim().toLowerCase();

      // Primary path: Supabase authentication (when configured).
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
            email: emailValue,
            password,
          });

          if (!supabaseError && supabaseData.session?.access_token) {
            const res = await authAPI.loginWithSupabase({ access_token: supabaseData.session.access_token });
            persistSession(res.data);
            return;
          }
        } catch {
          // If Supabase fails or is unreachable, continue to backend login fallback
        }
      }

      // Backend email/password authentication
      await backendLogin(emailValue, password);
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot reach API server. Please check your network connection.');
        return;
      }
      if (err.response.status === 429) {
        setError('Too many login attempts. Please wait a minute before trying again.');
        return;
      }
      if (err.response.status === 401) {
        setError('Incorrect email or password. Please check your credentials.');
        return;
      }
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Login failed') || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Globe size={40} style={{ color: '#6366f1' }} />
        </div>
        <h1 className="brand-wordmark brand-wordmark-auth">SHARVAGYA.AI</h1>
        <p>Sign in to your operations workspace</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <GoogleSignInButton
            text="signin_with"
            onCredential={signInWithGoogle}
            onError={(message) => setError(message)}
          />
        </div>
        <p style={{ marginBottom: 20, fontSize: 12 }}>or continue with email</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <Link href="/forgot-password" style={{ color: 'var(--accent-indigo)', fontSize: 13 }}>
                Forgot password?
              </Link>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 16 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 13, textAlign: 'center', color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-indigo)' }}>Create one</Link>
        </p>
        <p style={{ marginTop: 12, fontSize: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Link href="/privacy" style={{ color: 'var(--accent-indigo)' }}>Privacy</Link>{' · '}
          <Link href="/support" style={{ color: 'var(--accent-indigo)' }}>Support</Link>
        </p>
      </motion.div>
    </div>
  );
}
