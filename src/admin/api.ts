import type { Content } from '../lib/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers: {
      'X-Requested-With': 'parador-admin',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Algo salió mal', res.status);
  return data as T;
}

export const api = {
  me: () => request<{ email: string }>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<{ email: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  content: () => request<Content>('/api/admin/content'),
  save: <K extends keyof Content>(section: K, value: Content[K]) =>
    request<Content[K]>(`/api/admin/content/${section}`, { method: 'PUT', body: JSON.stringify(value) }),
  upload: (file: File) => {
    const body = new FormData();
    body.append('image', file);
    return request<{ src: string }>('/api/admin/upload', { method: 'POST', body });
  },
};

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'item';

export const uniqueId = (base: string, taken: string[]) => {
  let id = slugify(base);
  let n = 2;
  while (taken.includes(id)) id = `${slugify(base)}-${n++}`;
  return id;
};
