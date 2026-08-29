import type { ApiErrorBody, Room, RoomMutationResponse } from '../types/room';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export function readApiError(body: ApiErrorBody | undefined, fallback: string, status: number): string {
  const error = body?.error;
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object' && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return fallback || `Request failed with status ${status}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(readApiError(body, '', response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  createRoom: (body: { username: string; userId: string; name: string; videoUrl: string }) =>
    request<RoomMutationResponse>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  joinRoom: (code: string, body: { username: string; userId: string }) =>
    request<RoomMutationResponse>(`/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getRoom: (code: string) => request<Room>(`/api/rooms/${code}`),
};

export { API_URL };
