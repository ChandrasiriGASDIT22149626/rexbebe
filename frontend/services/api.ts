import { API_BASE_URL } from '../utils/constants';

function getEffectiveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    // When client browser is on localhost or 127.0.0.1, always use local same-origin /api
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return '/api';
    }
    try {
      const parsed = new URL(API_BASE_URL);
      // In browser over HTTPS, avoid mixed-content blocks by falling back to same-origin /api if API_BASE_URL is insecure localhost
      if (
        protocol === 'https:' &&
        parsed.protocol === 'http:' &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
      ) {
        if (currentHost.includes('vercel.app') || currentHost.includes('rexbebe.com')) {
          return 'https://rexbebe.vercel.app/api';
        }
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

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match && match[1] ? decodeURIComponent(match[1]).trim() : null;
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const local = localStorage.getItem('rexbebe_admin_token');
    if (local && local !== 'null' && local !== 'undefined' && local.trim()) {
      return local.trim();
    }
  } catch {}
  try {
    const cookie = getCookie('rexbebe_admin_token');
    if (cookie && cookie !== 'null' && cookie !== 'undefined' && cookie.trim()) {
      try { localStorage.setItem('rexbebe_admin_token', cookie.trim()); } catch {}
      return cookie.trim();
    }
  } catch {}
  return null;
}

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const local = localStorage.getItem('rexbebe_customer_token');
    if (local && local !== 'null' && local !== 'undefined' && local.trim()) return local.trim();
  } catch {}
  try {
    const alt = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (alt && alt !== 'null' && alt !== 'undefined' && alt.trim()) return alt.trim();
  } catch {}
  try {
    const cookie = getCookie('rexbebe_customer_token') || getCookie('token');
    if (cookie && cookie !== 'null' && cookie !== 'undefined' && cookie.trim()) return cookie.trim();
  } catch {}
  return null;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getEffectiveApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const url = `${baseUrl}${cleanEndpoint}`;
  
  const isAdminContext =
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) ||
    cleanEndpoint.startsWith('/admin') ||
    cleanEndpoint.startsWith('/upload') ||
    cleanEndpoint.startsWith('/auth/admin') ||
    (options.method && options.method.toUpperCase() !== 'GET' && (
      cleanEndpoint.startsWith('/products') ||
      cleanEndpoint.startsWith('/categories') ||
      cleanEndpoint.startsWith('/inventory') ||
      cleanEndpoint.startsWith('/navigation') ||
      cleanEndpoint.startsWith('/coupons') ||
      cleanEndpoint.startsWith('/delivery')
    ));

  let token: string | null = null;
  if (isAdminContext) {
    // Strictly prioritize admin token on administrative routes and mutations
    token = getAdminToken();
  } else {
    // For storefront / customer endpoints, prefer customer token; fallback to admin token if available
    token = getCustomerToken() || getAdminToken();
  }

  const isMutation = options.method && options.method.toUpperCase() !== 'GET';
  const isPrivateOrAdmin =
    Boolean(token) ||
    isAdminContext ||
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
    ...(token ? {
      Authorization: `Bearer ${token}`,
      'x-admin-token': token,
    } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const fetchCacheMode: RequestCache = isMutation || isPrivateOrAdmin ? 'no-store' : (options.cache || 'default');

  try {
    const response = await fetch(url, {
      cache: fetchCacheMode,
      credentials: 'include',
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
      // Handle authentication expiry on admin routes
      if (response.status === 401 && typeof window !== 'undefined') {
        const isCurrentlyAdmin = window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/admin/login');
        const isExpired = Boolean(
          data?.message?.toLowerCase().includes('expired') ||
          data?.error?.toLowerCase().includes('expired')
        );

        if (isCurrentlyAdmin && (isExpired || cleanEndpoint.startsWith('/auth/admin/me') || cleanEndpoint.startsWith('/auth/admin/verify'))) {
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
