export type Status = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type View = 'overview' | 'board' | 'tasks' | 'projects';

export interface User { id: number; fullName: string; email: string }
export interface AuthResult { token: string; user: User }
export interface Project {
  id: number; name: string; description: string; color: string; createdAt: string;
}
export interface Task {
  id: number; projectId: number; projectName: string; title: string; description: string;
  status: Status; priority: Priority; dueDate: string | null; createdAt: string; updatedAt: string;
}
export interface TaskInput {
  projectId: number; title: string; description: string; status: Status; priority: Priority; dueDate: string | null;
}
export interface ProjectInput { name: string; description: string; color: string }
export interface Activity { id: number; action: string; detail: string; createdAt: string }
export interface Dashboard {
  totalProjects: number; totalTasks: number; doneTasks: number; inProgressTasks: number;
  overdueTasks: number; upcomingTasks: Task[]; activity: Activity[];
}

// Empty for local Vite proxy or same-origin Docker deployment.
// Set VITE_API_BASE_URL=https://your-service.onrender.com for Cloudflare Pages.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export async function api<T>(url: string, token?: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${url}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the Java backend is running.');
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let body: Record<string, unknown> = {};
  try { body = text ? JSON.parse(text) as Record<string, unknown> : {}; } catch { /* Unexpected response body */ }
  if (!response.ok) {
    if (response.status === 401 && token) {
      sessionStorage.removeItem('devflow_token');
      window.dispatchEvent(new Event('devflow:unauthorized'));
    }
    throw new Error(typeof body.error === 'string' ? body.error :
      typeof body.detail === 'string' ? body.detail :
      response.status === 401 ? 'Session expired. Please sign in again.' : `Request failed (${response.status})`);
  }
  return body as T;
}
