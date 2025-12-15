import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  statusCode?: number;
}

async function getAuthToken(): Promise<string | null> {
  // First, try to get backend JWT from localStorage (cached)
  const cachedJwt = localStorage.getItem('backend_jwt');
  if (cachedJwt) {
    return cachedJwt;
  }
  
  // If no cached JWT, get Supabase session and exchange for backend JWT
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return null;
  }
  
  // Exchange Supabase token for backend JWT
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: session.access_token }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.jwt) {
        localStorage.setItem('backend_jwt', data.jwt);
        return data.jwt;
      }
    }
  } catch (error) {
    console.error('Failed to exchange token:', error);
  }
  
  return null;
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAuthToken();
  
  // Convert options.headers to a plain object if needed
  const existingHeaders: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        existingHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        existingHeaders[key] = value;
      });
    } else {
      Object.assign(existingHeaders, options.headers);
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...existingHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || response.statusText;
    } catch {
      // If response is not JSON, use statusText
    }
    
    const error: ApiError = {
      message: errorMessage,
      statusCode: response.status,
    };
    throw error;
  }

  return response;
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(endpoint);
    return response.json();
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: 'DELETE',
    });
    return response.json();
  },
};
