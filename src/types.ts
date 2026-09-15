/**
 * Shared TypeScript interfaces
 */

export interface ChatWorkRoom {
  room_id: number;
  name: string;
  type: 'group' | 'direct' | 'my';
  role?: string;
  sticky?: boolean;
  unread_num?: number;
  mention_num?: number;
  mytask_num?: number;
  message_num?: number;
  file_num?: number;
  task_num?: number;
  icon_path?: string;
  last_update_time?: number;
}

export interface MessageTemplate {
  id: string;
  title: string;
  body: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST';
  endpoint: string;
  status: number;
  headers: Record<string, string>;
  payload?: string;
  response: unknown;
  durationMs: number;
}

export interface ExtensionFile {
  name: string;
  path: string;
  language: 'json' | 'html' | 'css' | 'javascript' | 'markdown';
  description: string;
  content: string;
}
