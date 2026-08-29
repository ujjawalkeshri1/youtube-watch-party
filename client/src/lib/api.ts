import type { Room } from '../types/room';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  createRoom: (body: { username: string; userId: string }) =>
    request<Room>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  joinRoom: (code: string, body: { username: string; userId: string }) =>
    request<Room>(`/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getRoom: (code: string) => request<Room>(`/api/rooms/${code}`),
};

export { API_URL };
