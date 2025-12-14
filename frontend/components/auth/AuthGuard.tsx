'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { setUser, clearUser } from '@/lib/store/authSlice';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Exchange Supabase token for backend JWT
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: session.access_token }),
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            dispatch(setUser({ 
              user: session.user, 
              supabaseToken: session.access_token,
              backendJwt: verifyData.jwt 
            }));
            localStorage.setItem('backend_jwt', verifyData.jwt);
          } else {
            dispatch(clearUser());
            router.push('/login');
          }
        } catch (error) {
          console.error('Failed to verify token:', error);
          dispatch(clearUser());
          router.push('/login');
        }
      } else {
        dispatch(clearUser());
        localStorage.removeItem('backend_jwt');
        router.push('/login');
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: session.access_token }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              dispatch(setUser({ 
                user: session.user, 
                supabaseToken: session.access_token,
                backendJwt: verifyData.jwt 
              }));
              localStorage.setItem('backend_jwt', verifyData.jwt);
            } else {
              dispatch(clearUser());
              router.push('/login');
            }
          } catch (error) {
            console.error('Failed to verify token:', error);
            dispatch(clearUser());
            router.push('/login');
          }
        } else {
          dispatch(clearUser());
          localStorage.removeItem('backend_jwt');
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
