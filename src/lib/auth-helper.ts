// Authentication Helper Functions for Backend Integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4001";

import { createLogger } from "@/lib/logger";

const authHelperLogger = createLogger("auth:helper");

export interface BackendUser {
  id: string;
  discordId: string;
  username: string;
  email?: string;
  avatar?: string;
  balance: number;
  points: number;
  totalSpent: number;
  role: string;
  createdAt?: string;
}

export interface BackendSession {
  user: BackendUser;
  token: string;
}

/**
 * Set cookie helper
 */
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get cookie helper
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Erase cookie helper
 */
export function eraseCookie(name: string) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

/**
 * Create backend session after Discord OAuth
 */
export async function createBackendSession(user: {
  accessToken: string;
}): Promise<BackendSession> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort("Auth request timeout");
    } catch (e) {
      controller.abort();
    }
  }, 30000); // Increased to 30s for safety

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: user.accessToken,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to create backend session: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the structure is { success: true, data: { user: ..., accessToken: ..., refreshToken: ... } }
    // which is what the backend's authService.syncUser returns inside success()
    if (data.success && data.data && data.data.accessToken) {
      const sessionData = data.data;
      // Store JWT token in both localStorage and Cookies
      localStorage.setItem('auth_token', sessionData.accessToken);
      setCookie('auth_token', sessionData.accessToken, 30); // 30 days
      return {
        user: sessionData.user,
        token: sessionData.accessToken
      };
    }
    
    // Fallback for different response structures
    if (data.success && data.data && data.data.token) {
      localStorage.setItem('auth_token', data.data.token);
      setCookie('auth_token', data.data.token, 30);
      return data.data;
    }
    
    authHelperLogger.error('[AuthHelper] Unexpected session response structure:', data);
    throw new Error(data.message || 'Invalid response from backend');
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))) {
      authHelperLogger.warn('createBackendSession timed out or aborted');
    } else {
      authHelperLogger.error('createBackendSession error', { error });
    }
    throw error;
  }
}

/**
 * Get current backend session
 */
export async function getBackendSession(): Promise<BackendUser | null> {
  // Try to get token from cookie first (faster for middleware sync), fallback to localStorage
  const token = getCookie('auth_token') || localStorage.getItem('auth_token');
  if (!token) return null;

  // Sync if one is missing
  if (typeof window !== 'undefined') {
    if (getCookie('auth_token') && !localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', token);
    } else if (!getCookie('auth_token') && localStorage.getItem('auth_token')) {
      setCookie('auth_token', token, 30);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort("Auth request timeout");
    } catch (e) {
      controller.abort();
    }
  }, 30000); // Increased to 30s for safety

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        eraseCookie('auth_token');
      }
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        eraseCookie('auth_token');
      }
      return null;
    }
    return data.data.user;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))) {
      authHelperLogger.warn('getBackendSession timed out or aborted');
    } else {
      authHelperLogger.error('Failed to fetch session', { error });
    }
    return null;
  }
}

/**
 * Clear backend session
 */
export function clearBackendSession(): void {
  localStorage.removeItem('auth_token');
  eraseCookie('auth_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!(getCookie('auth_token') || (typeof window !== 'undefined' && localStorage.getItem('auth_token')));
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return getCookie('auth_token') || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
}
