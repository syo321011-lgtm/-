/**
 * ChatWork API クライアント
 * スマホWeb（Safari/Chrome）環境でもCORSエラーなく動作するプロキシ通信サービス
 */

import { ChatWorkRoom } from '../types';
import { fileToBase64 } from '../utils/imageCompressor';

// デモ用サンプルルーム一覧
export const DEMO_ROOMS: ChatWorkRoom[] = [
  {
    room_id: 1001,
    name: '【現場】工事写真・進捗共有グループ',
    type: 'group',
    role: 'admin',
    sticky: true,
    unread_num: 3,
    mention_num: 1,
    mytask_num: 0,
    message_num: 1420,
    file_num: 89,
    task_num: 2,
    icon_path: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=100&h=100&fit=crop',
    last_update_time: Math.floor(Date.now() / 1000) - 300
  },
  {
    room_id: 1002,
    name: '営業部・日報＆現場直帰連絡',
    type: 'group',
    role: 'member',
    sticky: true,
    unread_num: 5,
    mention_num: 0,
    mytask_num: 1,
    message_num: 8520,
    file_num: 120,
    task_num: 4,
    icon_path: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop',
    last_update_time: Math.floor(Date.now() / 1000) - 1800
  },
  {
    room_id: 1003,
    name: '佐藤 課長（個別ダイレクト）',
    type: 'direct',
    role: 'member',
    sticky: false,
    unread_num: 2,
    mention_num: 2,
    mytask_num: 0,
    message_num: 430,
    file_num: 12,
    task_num: 1,
    icon_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    last_update_time: Math.floor(Date.now() / 1000) - 3600
  },
  {
    room_id: 1004,
    name: 'マイチャット（自分専用メモ・写真控え）',
    type: 'my',
    role: 'admin',
    sticky: false,
    unread_num: 0,
    mention_num: 0,
    mytask_num: 0,
    message_num: 210,
    file_num: 45,
    task_num: 0,
    icon_path: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    last_update_time: Math.floor(Date.now() / 1000) - 7200
  },
  {
    room_id: 1005,
    name: '総務・経理 領収書＆出張精算',
    type: 'group',
    role: 'member',
    sticky: false,
    unread_num: 1,
    mention_num: 0,
    mytask_num: 0,
    message_num: 3200,
    file_num: 410,
    task_num: 3,
    icon_path: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
    last_update_time: Math.floor(Date.now() / 1000) - 14400
  }
];

export interface SendResult {
  success: boolean;
  id?: string;
  type: 'message' | 'file';
  durationMs: number;
  error?: string;
}

/**
 * ルーム一覧取得
 */
export async function getChatWorkRooms(token: string, isDemo = false): Promise<ChatWorkRoom[]> {
  if (isDemo || !token.trim()) {
    // デモ遅延を少し模擬
    await new Promise((r) => setTimeout(r, 400));
    return DEMO_ROOMS;
  }

  const res = await fetch('/api/chatwork/rooms', {
    headers: {
      'x-chatworktoken': token.trim()
    }
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data?.errors?.[0] || `HTTP ${res.status}: ルーム一覧の取得に失敗しました`;
    throw new Error(errorMsg);
  }

  return data as ChatWorkRoom[];
}

/**
 * メッセージ送信（テキストのみ）
 */
export async function sendChatWorkMessage(
  token: string,
  roomId: number | string,
  message: string,
  isDemo = false
): Promise<SendResult> {
  const startTime = Date.now();

  if (isDemo || !token.trim()) {
    await new Promise((r) => setTimeout(r, 600));
    const simulatedMsgId = String(Math.floor(1000000000 + Math.random() * 9000000000));
    return {
      success: true,
      id: simulatedMsgId,
      type: 'message',
      durationMs: Date.now() - startTime
    };
  }

  const res = await fetch('/api/chatwork/messages', {
    method: 'POST',
    headers: {
      'x-chatworktoken': token.trim(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      roomId: String(roomId),
      message: message.trim()
    })
  });

  const data = await res.json();
  const durationMs = Date.now() - startTime;

  if (!res.ok) {
    const errorMsg = data?.errors?.[0] || `HTTP ${res.status}: メッセージの送信に失敗しました`;
    return {
      success: false,
      type: 'message',
      durationMs,
      error: errorMsg
    };
  }

  return {
    success: true,
    id: data.message_id,
    type: 'message',
    durationMs
  };
}

/**
 * ファイル・写真送信（＋メッセージ）
 */
export async function sendChatWorkFile(
  token: string,
  roomId: number | string,
  file: File,
  message = '',
  isDemo = false
): Promise<SendResult> {
  const startTime = Date.now();

  if (isDemo || !token.trim()) {
    await new Promise((r) => setTimeout(r, 900));
    const simulatedFileId = String(Math.floor(1000000000 + Math.random() * 9000000000));
    return {
      success: true,
      id: simulatedFileId,
      type: 'file',
      durationMs: Date.now() - startTime
    };
  }

  const fileBase64 = await fileToBase64(file);

  const res = await fetch('/api/chatwork/files', {
    method: 'POST',
    headers: {
      'x-chatworktoken': token.trim(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      roomId: String(roomId),
      fileName: file.name,
      fileType: file.type || 'image/jpeg',
      fileBase64,
      message: message.trim()
    })
  });

  const data = await res.json();
  const durationMs = Date.now() - startTime;

  if (!res.ok) {
    const errorMsg = data?.errors?.[0] || `HTTP ${res.status}: 写真の送信に失敗しました`;
    return {
      success: false,
      type: 'file',
      durationMs,
      error: errorMsg
    };
  }

  return {
    success: true,
    id: data.file_id,
    type: 'file',
    durationMs
  };
}
