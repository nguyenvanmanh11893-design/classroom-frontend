import BACKEND_BASE_URL from '@/constants';
import { translateError } from '@/i18n';

export async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (response.status === 204) return { data: null };
  const body = await response.json();
  if (!response.ok) throw new Error(translateError(body.error?.code, body.error?.message));
  return body;
}
export const mutation = (path: string, method: string, data?: unknown) => api(path, { method, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
export async function allOptions(resource: string) {
  const rows: Array<Record<string, any>> = [];
  for (let page = 1; ; page++) {
    const body = await api(`${resource}${resource.includes('?') ? '&' : '?'}page=${page}&pageSize=100&sort=name&order=asc`);
    rows.push(...body.data);
    if (page >= body.pagination.totalPages) return rows;
  }
}
