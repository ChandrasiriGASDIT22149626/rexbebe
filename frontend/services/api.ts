import { API_BASE_URL } from '../utils/constants';

function getEffectiveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    try {
      const parsed = new URL(API_BASE_URL);
      // In browser over HTTPS, avoid mixed-content blocks by falling back to same-origin /api if API_BASE_URL is insecure localhost
      if (
        protocol === 'https:' &&
        parsed.protocol === 'http:' &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
      ) {
        return '/api';
      }
      // If client is on 127.0.0.1, localhost, or LAN, match hostname
      if (
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
        currentHost &&
        !currentHost.includes('.vercel.app') &&
        !currentHost.includes('rexbebe.com')
      ) {
        parsed.hostname = currentHost;
        return parsed.toString().replace(/\/$/, '');
      }
    } catch {
      // ignore
    }
  }
  return API_BASE_URL.replace(/\/$/, '');
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getEffectiveApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const url = `${baseUrl}${cleanEndpoint}`;
  
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      token =
        localStorage.getItem('rexbebe_admin_token') ||
        localStorage.getItem('rexbebe_customer_token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token');
    } catch {}
  }

  const isMutation = options.method && options.method.toUpperCase() !== 'GET';
  const isPrivateOrAdmin =
    Boolean(token) ||
    cleanEndpoint.startsWith('/admin') ||
    cleanEndpoint.startsWith('/auth') ||
    cleanEndpoint.startsWith('/cart') ||
    cleanEndpoint.startsWith('/orders') ||
    cleanEndpoint.startsWith('/checkout') ||
    cleanEndpoint.startsWith('/payments');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(isMutation || isPrivateOrAdmin
      ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const fetchCacheMode: RequestCache = isMutation || isPrivateOrAdmin ? 'no-store' : (options.cache || 'default');

  try {
    const response = await fetch(url, {
      cache: fetchCacheMode,
      ...options,
      headers,
    });
    
    // Safely retrieve response text without premature JSON parsing
    const text = await response.text();
    let data: any = null;
    let isJson = false;

    if (text) {
      try {
        data = JSON.parse(text);
        isJson = true;
      } catch {
        // Response is non-JSON (e.g. HTML 404/500 page or plain text)
        isJson = false;
        data = null;
      }
    }

    if (!response.ok) {
      // Handle authentication expiry / unauthorized on admin routes only when a token was actually provided
      if (response.status === 401 && typeof window !== 'undefined') {
        const isCurrentlyAdmin = window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/admin/login');
        if (isCurrentlyAdmin && token && (cleanEndpoint.startsWith('/auth/admin/me') || cleanEndpoint.startsWith('/auth/admin/verify'))) {
          localStorage.removeItem('rexbebe_admin_token');
          localStorage.removeItem('rexbebe_admin_user');
          document.cookie = 'rexbebe_admin_token=; path=/; max-age=0; SameSite=Strict';
          window.location.href = `/admin/login?reason=expired&redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      }

      // Safe error extraction that never crashes on HTML or non-JSON error pages
      const errorMsg =
        data?.message ||
        data?.error ||
        (isJson
          ? `API request failed with status ${response.status}`
          : `API request to ${cleanEndpoint} returned status ${response.status} (${response.statusText || 'Error'})`);

      const apiError = new Error(errorMsg);
      (apiError as any).status = response.status;
      (apiError as any).statusText = response.statusText;
      (apiError as any).endpoint = cleanEndpoint;
      throw apiError;
    }

    if (!isJson && text) {
      return text as unknown as T;
    }

    return data?.data !== undefined ? data.data : data;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const helpfulMsg = `Failed to connect to backend API at ${baseUrl}. Please ensure the backend server is running on port 5000 ('npm run dev:backend') and CORS is enabled.`;
      console.error(`[API Network Error] ${endpoint}:`, helpfulMsg, error);
      const networkError = new Error(helpfulMsg);
      (networkError as any).isNetworkError = true;
      (networkError as any).endpoint = endpoint;
      throw networkError;
    }
    console.error(`[API Fetch Error] ${endpoint}:`, error.message);
    throw error;
  }
}
