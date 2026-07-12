const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onTokenRefresh: ((token: string) => void) | null = null;
let isRefreshing = false;

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

async function performTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      onTokenRefresh = (token: string) => resolve(token);
    });
  }

  isRefreshing = true;
  const refToken = getRefreshToken();

  if (!refToken) {
    isRefreshing = false;
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refToken })
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    
    if (onTokenRefresh) {
      onTokenRefresh(data.accessToken);
      onTokenRefresh = null;
    }
    
    isRefreshing = false;
    return data.accessToken;
  } catch (err) {
    isRefreshing = false;
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    // Attempt token refresh
    const newAccessToken = await performTokenRefresh();
    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      const retryResponse = await fetch(`${API_URL}${path}`, {
        ...options,
        headers
      });
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${retryResponse.status}`);
      }
      return retryResponse.json();
    } else {
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  // Handle file downloads or empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.text();
  }
  
  return response.json().catch(() => ({}));
}
