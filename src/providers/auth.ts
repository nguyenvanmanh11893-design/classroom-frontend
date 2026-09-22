import type { AccessControlProvider, AuthProvider, HttpError } from '@refinedev/core';
import BACKEND_BASE_URL from '@/constants';
import { translateError } from '@/i18n';

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  isActive: boolean;
  preferredLocale: 'en' | 'vi';
  image?: string | null;
};

type SessionResponse = { user?: SessionUser } | null;

const authUrl = (path: string) => `${BACKEND_BASE_URL}auth/${path}`;

async function readError(response: Response, fallback: string): Promise<HttpError> {
  try {
    const payload = await response.json() as {
      message?: string;
      error?: { code?: string; message?: string; params?: Record<string, unknown> } | string;
    };
    const structured = typeof payload.error === 'object' ? payload.error : undefined;
    return {
      name: structured?.code ?? 'AUTH_ERROR',
      message: translateError(structured?.code, structured?.message ?? payload.message ?? fallback),
      statusCode: response.status,
      ...(structured?.params ?? {}),
    };
  } catch {
    return { name: 'AUTH_ERROR', message: fallback, statusCode: response.status };
  }
}

async function getSession(): Promise<SessionResponse> {
  const response = await fetch(authUrl('get-session'), { credentials: 'include' });
  if (!response.ok) return null;
  return response.json() as Promise<SessionResponse>;
}

export const authProvider: AuthProvider = {
  login: async ({ email, password, providerName }) => {
    if (providerName) return {
      success: false,
      error: { name: 'PROVIDER_NOT_CONFIGURED', message: 'This sign-in provider is not configured', statusCode: 400 },
    };
    const response = await fetch(authUrl('sign-in/email'), {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return { success: false, error: await readError(response, 'Unable to sign in') };
    return { success: true, redirectTo: '/' };
  },
  register: async ({ name, email, password, providerName }) => {
    if (providerName) return {
      success: false,
      error: { name: 'PROVIDER_NOT_CONFIGURED', message: 'This sign-up provider is not configured', statusCode: 400 },
    };
    const response = await fetch(authUrl('sign-up/email'), {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) return { success: false, error: await readError(response, 'Unable to create account') };
    return { success: true, redirectTo: '/' };
  },
  logout: async () => {
    const response = await fetch(authUrl('sign-out'), { method: 'POST', credentials: 'include' });
    return response.ok
      ? { success: true, redirectTo: '/login' }
      : { success: false, error: await readError(response, 'Unable to sign out') };
  },
  check: async () => {
    const session = await getSession();
    if (session?.user?.isActive !== false && session?.user?.id) return { authenticated: true };
    return { authenticated: false, redirectTo: '/login', logout: true };
  },
  onError: async (error) => {
    if (error?.statusCode === 401) return { logout: true, redirectTo: '/login', error };
    return { error };
  },
  getIdentity: async () => {
    const user = (await getSession())?.user;
    if (!user) return null;
    const names = user.name.trim().split(/\s+/);
    return {
      ...user,
      fullName: user.name,
      firstName: names[0] ?? user.name,
      lastName: names.slice(1).join(' '),
      avatar: user.image ?? undefined,
    };
  },
  getPermissions: async () => (await getSession())?.user?.role ?? null,
  forgotPassword: async ({ email }) => {
    const response = await fetch(authUrl('request-password-reset'), {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo: `${window.location.origin}/reset-password` }),
    });
    if (!response.ok) return { success: false, error: await readError(response, 'Password reset is unavailable') };
    return { success: true, redirectTo: '/login' };
  },
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const role = await authProvider.getPermissions?.() as SessionUser['role'] | null;
    if (!role) return { can: false, reason: 'Authentication is required' };
    if (role === 'admin') return { can: true };
    if (resource === 'users') return { can: false, reason: 'Admin role is required' };
    if (['departments', 'subjects', 'semesters'].includes(resource ?? '')) {
      return { can: action === 'list' || action === 'show', reason: 'Admin role is required for changes' };
    }
    if (resource === 'classes') {
      return { can: action === 'list' || action === 'show', reason: 'Class changes require admin role' };
    }
    return { can: action === 'list' || action === 'show' };
  },
  options: { buttons: { enableAccessControl: true, hideIfUnauthorized: true } },
};
