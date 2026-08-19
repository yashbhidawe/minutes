const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
  isFormData?: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(data.detail || "Request failed", res.status);
  }

  return res.json();
}

export interface User {
  id: number;
  email: string;
}

export interface Meeting {
  id: number;
  user_id: number;
  title: string;
  duration_sec: number;
  status: string;
  audio_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  id: number;
  meeting_id: number;
  raw_text: string;
  language: string;
  segments: TranscriptSegment[] | null;
  created_at: string;
}

export interface Note {
  id: number;
  meeting_id: number;
  section: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  description: string;
  assigned_to: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<User>("/users/", { method: "POST", body: { email, password } }),
    login: (email: string, password: string) =>
      request<LoginResponse>("/users/login", { method: "POST", body: { email, password } }),
  },
  meetings: {
    list: (token: string) =>
      request<Meeting[]>("/meetings/", { token }),
    get: (id: number, token: string) =>
      request<Meeting>(`/meetings/${id}`, { token }),
    create: (title: string, duration_sec: number, token: string) =>
      request<Meeting>("/meetings/", { method: "POST", body: { title, duration_sec }, token }),
    getNotes: (id: number, token: string) =>
      request<Note[]>(`/meetings/${id}/notes`, { token }),
    getActionItems: (id: number, token: string) =>
      request<ActionItem[]>(`/meetings/${id}/action-items`, { token }),
    uploadAudio: (id: number, file: File, token: string) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<{ meeting_id: number; status: string; audio_key: string }>(
        `/meetings/${id}/upload-audio`,
        { method: "POST", body: formData, token, isFormData: true }
      );
    },
    transcribe: (id: number, token: string) =>
      request<Transcript>(`/meetings/${id}/transcribe`, { method: "POST", token }),
    summarize: (id: number, token: string) =>
      request<{ meeting_id: number; key_decisions: string; discussion_points: string; blockers: string; next_steps: string; notes: Note[]; action_items: ActionItem[] }>(
        `/meetings/${id}/summarize`,
        { method: "POST", token }
      ),
  },
};
