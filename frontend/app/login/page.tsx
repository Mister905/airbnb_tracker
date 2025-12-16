'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/lib/hooks';
import { setUser } from '@/lib/store/authSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Exchange Supabase token for backend JWT
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: data.session.access_token }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text();
            let errorMessage = 'Failed to verify token with backend';
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
            throw new Error(`${errorMessage} (Status: ${verifyResponse.status})`);
          }

          const verifyData = await verifyResponse.json();
          
          dispatch(setUser({ 
            user: data.user, 
            supabaseToken: data.session.access_token,
            backendJwt: verifyData.jwt 
          }));
          
          // Store backend JWT in localStorage
          localStorage.setItem('backend_jwt', verifyData.jwt);
          
          router.push('/dashboard');
        } catch (err) {
          let errorMessage = 'Failed to authenticate with backend';
          if (err instanceof Error) {
            if (err.name === 'AbortError') {
              errorMessage = 'Request timed out. The backend may be starting up (this can take 30-60 seconds on free tier). Please try again in a moment.';
            } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Network request failed')) {
              errorMessage = `Cannot reach backend at ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}. The backend may be starting up or unavailable. Please check that NEXT_PUBLIC_API_URL is correctly set in Vercel.`;
            } else {
              errorMessage = err.message;
            }
          }
          console.error('Backend authentication error:', err);
          setError(errorMessage);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to login');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="card max-w-md w-full space-y-8 p-8">
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image
              src="/images/Airbnb_Logo.svg"
              alt="Airbnb"
              width={100}
              height={31}
              className="h-8 w-auto"
              priority
            />
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
              Tracker
            </h2>
          </div>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input appearance-none rounded-none relative block w-full px-3 py-2 rounded-t-md focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input appearance-none rounded-none relative block w-full px-3 py-2 rounded-b-md focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary group relative w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
