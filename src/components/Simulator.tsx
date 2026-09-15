import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, RefreshCw, Search, Settings, Eye, EyeOff, Plus, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Check, Info, 
  Terminal, ShieldCheck, X, Image as ImageIcon, UploadCloud,
  Sparkles, ArrowRight
} from 'lucide-react';
import { ChatWorkRoom, MessageTemplate, ApiLogEntry } from '../types';
import { AiScreenshotReplyModal } from './AiScreenshotReplyModal';
import { 
  loadSavedTemplates, 
  saveTemplatesToStorage 
} from '../data/shippingTemplates';

const MOCK_ROOMS: ChatWorkRoom[] = [
  { room_id: 10129384, name: '【全社】連絡・アナウンス掲示板', type: 'group', unread_num: 3 },
  { room_id: 10482910, name: 'DX推進・システム開発プロジェクト', type: 'group', unread_num: 12 },
  { room_id: 10928374, name: '営業本部 定例・売上報告', type: 'group', unread_num: 0 },
  { room_id: 11029482, name: 'カスタマーサクセス＆サポート連絡', type: 'group', unread_num: 5 },
  { room_id: 11592834, name: 'マーケティング・PR連携ルーム', type: 'group', unread_num: 1 },
  { room_id: 12049281, name: '人事・総務・労務手続き相談', type: 'group', unread_num: 0 },
  { room_id: 20194820, name: '佐藤 健一', type: 'direct', unread_num: 2 },
  { room_id: 20491829, name: '鈴木 恵子', type: 'direct', unread_num: 0 },
  { room_id: 99999999, name: 'マイチャット', type: 'my', unread_num: 0 }
];

const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-morning',
    title: '【始業】朝会・業務開始連絡',
    body: `[info][title]業務開始連絡[/title]おはようございます。本日の業務を開始いたします。

【本日の予定タスク】
1. 仕様設計レビュー
2. API連携機能の改修
3. 顧客ミーティング（15:00〜）

本日もよろしくお願いいたします。[/info]`
  },
  {
    id: 'tpl-evening',
    title: '【終業】日報・業務終了連絡',
    body: `[info][title]業務終了連絡（日報）[/title]お疲れ様です。本日の業務を終了いたします。

【実施内容】
・ChatWork拡張機能の実装とテスト完了
・定型文テンプレート整備

【明日の予定】
・本番環境デプロイと運用手順書作成

何か至急の要件がございましたら、個別チャットまたはお電話にてご連絡ください。[/info]`
  },
  {
    id: 'tpl-ack',
    title: '【受領】メッセージ確認・対応連絡',
    body: `ご確認ありがとうございます。内容承知いたしました。
順次対応を進め、完了次第改めてご報告いたします。`
  },
  {
    id: 'tpl-share',
    title: '【共有】資料送付・確認依頼',
    body: `[info][title]資料送付のご案内[/title]お疲れ様です。標記の件につきまして、更新版の資料を共有いたします。

お手すきの際にご確認いただけますと幸いです。
よろしくお願いいたします。[/info]`
  }
];

export const Simulator: React.FC = () => {
  // State
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [apiToken, setApiToken] = useState<string>('cw_token_demo_sample_key_98765');
  const [tokenInput, setTokenInput] = useState<string>('cw_token_demo_sample_key_98765');
  const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Rooms
  const [rooms, setRooms] = useState<ChatWorkRoom[]>(MOCK_ROOMS);
  const [roomQuery, setRoomQuery] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('10129384');
  const [isFetchingRooms, setIsFetchingRooms] = useState<boolean>(false);

  // Templates & AI
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    return loadSavedTemplates();
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isTemplateMgrOpen, setIsTemplateMgrOpen] = useState<boolean>(false);
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplFormTitle, setTplFormTitle] = useState<string>('');
  const [tplFormBody, setTplFormBody] = useState<string>('');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Message
  const [message, setMessage] = useState<string>(() => {
    const saved = loadSavedTemplates();
    return saved[0]?.body || '';
  });
  const [isSending, setIsSending] = useState<boolean>(false);

  // Photo Attachment (Optional)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (ChatWork API 上限)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFileError('画像ファイル（PNG, JPG, GIF, WebP等）を選択してください');
      showNotification('画像ファイルを選択してください', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('ファイルサイズが5MBを超えています (ChatWork API上限)');
      showNotification('ファイルサイズが5MBを超えています', 'error');
      return;
    }

    setFileError(null);
    setSelectedFile(file);

    // 古いプレビューURLがあれば解放
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);
    showNotification(`写真「${file.name}」を添付しました（任意設定）`, 'success');
  };

  const handleRemoveFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Toast & logs
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([
    {
      id: 'init-log',
      timestamp: new Date().toLocaleTimeString(),
      method: 'GET',
      endpoint: '/v2/rooms',
      status: 200,
      headers: { 'X-ChatWorkToken': 'cw_token_demo_••••••••' },
      response: { count: 9, status: 'OK' },
      durationMs: 84
    }
  ]);

  // Toast timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setToast({ message: msg, type });
  };

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    if (!roomQuery) return true;
    const q = roomQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || String(r.room_id).includes(q);
  });

  // Handle Token Save
  const handleSaveToken = () => {
    if (!tokenInput.trim()) {
      showNotification('APIトークンを入力してください', 'error');
      return;
    }
    setApiToken(tokenInput.trim());
    setIsSettingsOpen(false);
    showNotification('ChatWork APIトークンを保存しました', 'success');
  };

  // Fetch / Refresh rooms
  const handleRefreshRooms = async () => {
    if (!apiToken) {
      showNotification('先にAPIトークンを設定してください', 'error');
      setIsSettingsOpen(true);
      return;
    }

    setIsFetchingRooms(true);
    const startTime = Date.now();

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 600));
      setRooms(MOCK_ROOMS);
      setIsFetchingRooms(false);
      showNotification(`${MOCK_ROOMS.length}件のルーム一覧を取得しました (デモモード)`, 'success');

      setApiLogs(prev => [
        {
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          method: 'GET',
          endpoint: '/v2/rooms',
          status: 200,
          headers: { 'X-ChatWorkToken': apiToken.slice(0, 6) + '••••••••' },
          response: { count: MOCK_ROOMS.length, rooms: MOCK_ROOMS.map(r => ({ room_id: r.room_id, name: r.name })) },
          durationMs: Date.now() - startTime
        },
        ...prev.slice(0, 9)
      ]);
      return;
    }

    // Real API fetch
    try {
      const res = await fetch('https://api.chatwork.com/v2/rooms', {
        headers: { 'X-ChatWorkToken': apiToken }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.errors?.[0] || `HTTP ${res.status}`);
      }
      setRooms(data);
      showNotification(`${data.length}件のルームを取得しました`, 'success');
      setApiLogs(prev => [
        {
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          method: 'GET',
          endpoint: '/v2/rooms',
          status: res.status,
          headers: { 'X-ChatWorkToken': apiToken.slice(0, 6) + '••••••••' },
          response: data,
          durationMs: Date.now() - startTime
        },
        ...prev.slice(0, 9)
      ]);
    } catch (err: any) {
      showNotification(`取得エラー: ${err.message} (※ブラウザiframeからのAPI直接呼び出しはCORS制限される場合があります。拡張機能本体ではhost_permissionsで動作します)`, 'error');
    } finally {
      setIsFetchingRooms(false);
    }
  };

  // Select template
  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      setMessage(tpl.body);
      showNotification(`「${tpl.title}」を反映しました`, 'success');
    }
  };

  // Save template
  const handleSaveTemplate = () => {
    if (!tplFormTitle.trim() || !tplFormBody.trim()) {
      showNotification('テンプレート名と本文の両方を入力してください', 'error');
      return;
    }

    let updated: MessageTemplate[];
    if (editingTplId) {
      updated = templates.map(t => t.id === editingTplId ? { ...t, title: tplFormTitle.trim(), body: tplFormBody.trim() } : t);
      showNotification('テンプレートを更新しました', 'success');
    } else {
      const newTpl: MessageTemplate = {
        id: 'tpl-' + Date.now(),
        title: tplFormTitle.trim(),
        body: tplFormBody.trim()
      };
      updated = [...templates, newTpl];
      showNotification('新規テンプレートを作成しました', 'success');
    }

    setTemplates(updated);
    saveTemplatesToStorage(updated);
    setEditingTplId(null);
    setTplFormTitle('');
    setTplFormBody('');
  };

  // Start edit template
  const handleEditTemplate = (tpl: MessageTemplate) => {
    setEditingTplId(tpl.id);
    setTplFormTitle(tpl.title);
    setTplFormBody(tpl.body);
    setIsTemplateMgrOpen(true);
  };

  // Delete template
  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplatesToStorage(updated);
    if (selectedTemplateId === id) setSelectedTemplateId('');
    showNotification('テンプレートを削除しました', 'success');
  };

  // AIからのテンプレート保存
  const handleSaveAsTemplateFromAi = (title: string, body: string) => {
    const newTpl: MessageTemplate = {
      id: 'tpl-' + Date.now(),
      title: title.trim(),
      body: body.trim()
    };
    const updated = [newTpl, ...templates];
    setTemplates(updated);
    saveTemplatesToStorage(updated);
    showNotification(`定型文「${title}」を登録しました`, 'success');
  };

  // Send message
  const handleSendMessage = async () => {
    if (!apiToken) {
      showNotification('APIトークンを設定してください', 'error');
      setIsSettingsOpen(true);
      return;
    }
    if (!selectedRoomId) {
      showNotification('送信先ルームを選択してください', 'error');
      return;
    }
    if (!message.trim() && !selectedFile) {
      showNotification('メッセージ本文または添付写真のいずれかを入力してください', 'error');
      return;
    }

    setIsSending(true);
    const startTime = Date.now();

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 750));
      setIsSending(false);

      if (selectedFile) {
        // 📷 写真添付送信 (POST /rooms/{room_id}/files)
        const simulatedFileId = String(Math.floor(1000000000 + Math.random() * 9000000000));
        showNotification(`✅ 写真・メッセージを未読維持のまま送信完了 (FileID: ${simulatedFileId})`, 'success');

        setApiLogs(prev => [
          {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            method: 'POST',
            endpoint: `/v2/rooms/${selectedRoomId}/files`,
            status: 200,
            headers: {
              'X-ChatWorkToken': apiToken.slice(0, 6) + '••••••••',
              'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary...'
            },
            payload: `FormData: { file: "${selectedFile.name}" (${formatFileSize(selectedFile.size)})${message.trim() ? `, message: "${message.trim()}"` : ''} }`,
            response: { file_id: simulatedFileId },
            durationMs: Date.now() - startTime
          },
          ...prev.slice(0, 9)
        ]);

        handleRemoveFile();
        setMessage('');
      } else {
        // 📝 通常メッセージ送信 (POST /rooms/{room_id}/messages)
        const simulatedMsgId = String(Math.floor(1000000000 + Math.random() * 9000000000));
        const encodedPayload = new URLSearchParams({ body: message.trim() }).toString();
        showNotification(`✅ 未読状態を維持したまま送信完了 (MsgID: ${simulatedMsgId})`, 'success');

        setApiLogs(prev => [
          {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            method: 'POST',
            endpoint: `/v2/rooms/${selectedRoomId}/messages`,
            status: 200,
            headers: {
              'X-ChatWorkToken': apiToken.slice(0, 6) + '••••••••',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            payload: encodedPayload,
            response: { message_id: simulatedMsgId },
            durationMs: Date.now() - startTime
          },
          ...prev.slice(0, 9)
        ]);

        setMessage('');
      }
      return;
    }

    // Live API mode
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);
        if (message.trim()) {
          formData.append('message', message.trim());
        }

        const res = await fetch(`https://api.chatwork.com/v2/rooms/${selectedRoomId}/files`, {
          method: 'POST',
          headers: {
            'X-ChatWorkToken': apiToken
          },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.errors?.[0] || `HTTP ${res.status}`);
        }
        showNotification(`✅ 写真・メッセージ送信完了 (FileID: ${data.file_id})`, 'success');
        setApiLogs(prev => [
          {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            method: 'POST',
            endpoint: `/v2/rooms/${selectedRoomId}/files`,
            status: res.status,
            headers: {
              'X-ChatWorkToken': apiToken.slice(0, 6) + '••••••••'
            },
            payload: `FormData: { file: "${selectedFile.name}", message: "${message.trim()}" }`,
            response: data,
            durationMs: Date.now() - startTime
          },
          ...prev.slice(0, 9)
        ]);
        handleRemoveFile();
        setMessage('');
      } else {
        const encodedPayload = new URLSearchParams({ body: message.trim() }).toString();
        const res = await fetch(`https://api.chatwork.com/v2/rooms/${selectedRoomId}/messages`, {
          method: 'POST',
          headers: {
            'X-ChatWorkToken': apiToken,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: encodedPayload
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.errors?.[0] || `HTTP ${res.status}`);
        }
        showNotification(`✅ メッセージ送信完了 (MsgID: ${data.message_id})`, 'success');
        setApiLogs(prev => [
          {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            method: 'POST',
            endpoint: `/v2/rooms/${selectedRoomId}/messages`,
            status: res.status,
            headers: {
              'X-ChatWorkToken': apiToken.slice(0, 6) + '••••••••',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            payload: encodedPayload,
            response: data,
            durationMs: Date.now() - startTime
          },
          ...prev.slice(0, 9)
        ]);
        setMessage('');
      }
    } catch (err: any) {
      showNotification(`送信エラー: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const selectedRoomObj = rooms.find(r => String(r.room_id) === String(selectedRoomId));

  return (
    <div id="simulator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Extension Mockup */}
      <div className="lg:col-span-6 flex flex-col items-center">
        {/* Browser Mockup Frame */}
        <div className="w-full max-w-[440px] bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* Chrome Toolbar Mockup */}
          <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs text-slate-400 font-mono ml-2">Chrome 拡張機能ポップアップ</span>
            </div>

            {/* Extension Icon in Browser Bar */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700">
              <div className="w-4 h-4 rounded-full bg-[#eb5a46] flex items-center justify-center text-white text-[9px] font-bold">
                CW
              </div>
              <span className="text-[11px] text-slate-200 font-medium">未読キープ</span>
            </div>
          </div>

          {/* Extension Popup Content Area */}
          <div className="bg-slate-50 text-slate-900 w-full min-h-[520px] max-h-[640px] overflow-y-auto flex flex-col relative text-xs">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#eb5a46] to-[#d64936] text-white flex items-center justify-center shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-none">
                    ChatWork 未読キープ送信
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>API直接送信・未読維持</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  id="sim-settings-btn"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`p-1.5 rounded-md transition-colors ${
                    isSettingsOpen ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  title="API設定を開く"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Toast Notice */}
            {toast && (
              <div
                id="sim-toast"
                className={`mx-3 mt-2.5 p-2.5 rounded-lg flex items-start gap-2 text-[11.5px] shadow-sm transition-all ${
                  toast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 leading-snug">{toast.message}</span>
                <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-3.5 flex flex-col gap-3 flex-1">
              {/* Settings Card */}
              {isSettingsOpen && (
                <section id="sim-settings-card" className="bg-white border-l-4 border-l-[#eb5a46] border border-slate-200 rounded-lg p-3 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 text-xs">ChatWork API設定</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {apiToken ? '設定済み' : '未設定'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    APIトークンは <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">chrome.storage</code> に安全保存されます。
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700 block">APIトークン</label>
                    <div className="relative flex items-center">
                      <input
                        id="sim-token-input"
                        type={isTokenVisible ? 'text' : 'password'}
                        value={tokenInput}
                        onChange={e => setTokenInput(e.target.value)}
                        placeholder="例: a1b2c3d4e5f6..."
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 pr-8 text-xs focus:bg-white focus:outline-none focus:border-[#eb5a46]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsTokenVisible(!isTokenVisible)}
                        className="absolute right-2 text-slate-400 hover:text-slate-600"
                      >
                        {isTokenVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      id="sim-save-token-btn"
                      onClick={handleSaveToken}
                      className="px-3 py-1.5 bg-[#eb5a46] hover:bg-[#d64936] text-white font-semibold rounded text-xs transition"
                    >
                      トークンを保存
                    </button>
                    <a
                      href="https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#eb5a46] text-[11px] hover:underline"
                    >
                      トークン取得画面 ↗
                    </a>
                  </div>
                </section>
              )}

              {/* Step 1: Room Selector */}
              <section id="sim-room-card" className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">送信先チャットルーム</h4>
                  </div>
                  <button
                    id="sim-refresh-rooms-btn"
                    onClick={handleRefreshRooms}
                    disabled={isFetchingRooms}
                    className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#eb5a46] transition"
                    title="ルーム一覧を再取得 (GET /rooms)"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingRooms ? 'animate-spin' : ''}`} />
                    <span>更新</span>
                  </button>
                </div>

                {/* Incremental Search Input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="sim-room-search"
                    type="text"
                    value={roomQuery}
                    onChange={e => setRoomQuery(e.target.value)}
                    placeholder="ルーム名またはIDで絞り込み..."
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-7 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-[#eb5a46]"
                  />
                  {roomQuery && (
                    <button
                      onClick={() => setRoomQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Room Select Dropdown */}
                <select
                  id="sim-room-select"
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#eb5a46]"
                >
                  <option value="">-- 送信先ルームを選択してください --</option>
                  {filteredRooms.map(r => (
                    <option key={r.room_id} value={r.room_id}>
                      {r.type === 'direct' ? '[ダイレクト]' : r.type === 'my' ? '[マイチャット]' : '[グループ]'}{' '}
                      {r.name} (ID: {r.room_id})
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1.5">
                  <span>
                    全{rooms.length}件中 {filteredRooms.length}件一致
                  </span>
                  {selectedRoomObj && (
                    <span className="font-semibold text-[#eb5a46]">
                      {selectedRoomObj.unread_num !== undefined && selectedRoomObj.unread_num > 0 && (
                        <span className="bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-normal mr-1">
                          未読: {selectedRoomObj.unread_num}件
                        </span>
                      )}
                      ID: {selectedRoomObj.room_id}
                    </span>
                  )}
                </div>
              </section>

              {/* AI Screenshot to Reply Feature Card */}
              <section className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-lg p-3 text-white shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        <span>AIスクショ返信アシスタント</span>
                        <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-normal">海外発送EC特化</span>
                      </div>
                      <div className="text-[10.5px] text-white/80">ChatWorkの問い合わせスクショからプロの返信文を自動生成</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="shrink-0 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-red-600 text-xs font-bold rounded shadow-xs transition active:scale-95 flex items-center gap-1"
                  >
                    <span>作成</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </section>

              {/* Step 2: Template Selector */}
              <section id="sim-template-card" className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">定型文テンプレート</h4>
                  </div>
                  <button
                    id="sim-toggle-tpl-mgr-btn"
                    onClick={() => setIsTemplateMgrOpen(!isTemplateMgrOpen)}
                    className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#eb5a46] transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isTemplateMgrOpen ? '閉じる' : '登録・管理'}</span>
                  </button>
                </div>

                <select
                  id="sim-template-select"
                  value={selectedTemplateId}
                  onChange={e => handleSelectTemplate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#eb5a46]"
                >
                  <option value="">-- テンプレートを選択して本文に挿入 --</option>
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title}
                    </option>
                  ))}
                </select>

                {/* Template Manager Drawer */}
                {isTemplateMgrOpen && (
                  <div className="mt-3 pt-3 border-t border-dashed border-slate-200 space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2">
                      <div className="font-semibold text-slate-700 text-[11.5px]">
                        {editingTplId ? '✏️ テンプレート編集' : '➕ 新規テンプレート作成'}
                      </div>
                      <input
                        type="text"
                        value={tplFormTitle}
                        onChange={e => setTplFormTitle(e.target.value)}
                        placeholder="テンプレート名 (例: 【共有】資料送付)"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#eb5a46]"
                      />
                      <textarea
                        value={tplFormBody}
                        onChange={e => setTplFormBody(e.target.value)}
                        rows={3}
                        placeholder="定型文本文..."
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#eb5a46]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTemplate}
                          className="px-2.5 py-1 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-900"
                        >
                          保存
                        </button>
                        {editingTplId && (
                          <button
                            onClick={() => {
                              setEditingTplId(null);
                              setTplFormTitle('');
                              setTplFormBody('');
                            }}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs"
                          >
                            キャンセル
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Saved Template List */}
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
                        登録済みテンプレート
                      </div>
                      {templates.map(t => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded text-[11px]"
                        >
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">{t.title}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditTemplate(t)}
                              className="p-1 text-slate-400 hover:text-slate-700"
                              title="編集"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="削除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Step 3: Message Editor & Send */}
              <section id="sim-message-card" className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                      3
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">メッセージ編集 & 送信</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI返信作成</span>
                    </button>
                    <button
                      onClick={() => {
                        setMessage('');
                        handleRemoveFile();
                      }}
                      className="text-[11px] text-rose-500 hover:text-rose-700"
                    >
                      クリア
                    </button>
                  </div>
                </div>

                {/* Notice Badge */}
                <div className="bg-rose-50/80 border border-rose-200 rounded p-2 flex items-start gap-1.5 mb-2 text-[11px] text-rose-900 leading-snug">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#eb5a46] shrink-0 mt-0.5" />
                  <span>
                    ChatWorkのWeb画面を開かないため、<strong>ルーム内の未読メッセージは未読のまま維持</strong>されます。
                  </span>
                </div>

                <textarea
                  id="sim-message-input"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder="送信するメッセージを入力してください..."
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#eb5a46] resize-none"
                />

                {/* Photo Attachment Section (Optional) */}
                <div id="sim-attachment-card" className="mt-2.5 p-2.5 bg-slate-50/90 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                      <ImageIcon className="w-3.5 h-3.5 text-[#eb5a46]" />
                      <span>写真・画像添付</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-semibold text-[9.5px]">
                        任意
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">上限: 5MB</span>
                  </div>

                  {!selectedFile ? (
                    /* Click to open PC folder file selector / Drag & drop */
                    <div
                      id="sim-dropzone"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleFileSelect(f);
                      }}
                      className={`relative border-2 border-dashed rounded-lg p-3 text-center transition-all overflow-hidden ${
                        isDraggingFile 
                          ? 'border-[#eb5a46] bg-[#eb5a46]/10' 
                          : 'border-slate-300 hover:border-[#eb5a46] hover:bg-white bg-white/70'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        id="sim-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileSelect(f);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                        <UploadCloud className="w-5 h-5 text-slate-400" />
                        <div className="text-[11.5px] font-semibold text-slate-700">
                          ここをクリックしてパソコンから写真を選択
                        </div>
                        <div className="text-[10px] text-slate-400">
                          または画像をドラッグ＆ドロップ (PNG, JPG, GIF, WebP / 最大5MB)
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Attached file preview */
                    <div id="sim-file-preview" className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg p-2 shadow-xs">
                      <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                        {filePreviewUrl ? (
                          <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-[11px] truncate">
                          {selectedFile.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span>{formatFileSize(selectedFile.size)}</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium text-[9.5px]">
                            添付中
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        id="sim-remove-file-btn"
                        onClick={handleRemoveFile}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="写真を解除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[10.5px]">
                      ⚠️ {fileError}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500 font-mono">{message.length} 文字</span>
                  <button
                    id="sim-send-btn"
                    onClick={handleSendMessage}
                    disabled={isSending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#eb5a46] to-[#d64936] hover:from-[#d64936] hover:to-[#b83321] text-white font-bold rounded shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isSending ? '送信中...' : selectedFile ? '写真付きで未読送信' : '未読のまま送信'}</span>
                  </button>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="px-4 py-2 bg-white border-t border-slate-200 text-center text-[10px] text-slate-400">
              ChatWork API v2 連携 | 未読ステータス保護
            </footer>
          </div>
        </div>

        {/* Demo Mode Toggle */}
        <div className="mt-4 flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-700">動作モード:</span>
          <button
            onClick={() => setIsDemoMode(true)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              isDemoMode
                ? 'bg-[#eb5a46] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🧪 デモ・モック通信
          </button>
          <button
            onClick={() => {
              setIsDemoMode(false);
              setIsSettingsOpen(true);
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              !isDemoMode
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🌐 実機API通信
          </button>
        </div>
      </div>

      {/* Right Column: Live API Inspector & Real-time Diagnostics */}
      <div className="lg:col-span-6 space-y-6">
        {/* Core Value Proposition Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-2.5 mb-3 text-rose-400">
            <ShieldCheck className="w-5 h-5 text-[#eb5a46]" />
            <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">
              なぜ「未読状態」が完全に維持されるのか？
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            ChatWorkのWebブラウザ画面を開いてメッセージを送信すると、画面がチャットを描画した瞬間に自動で{' '}
            <code className="bg-slate-950 px-1.5 py-0.5 rounded text-rose-300 font-mono">PUT /rooms/{'{id}'}/messages/read</code>{' '}
            が実行され、未読が「既読」になってしまいます。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-rose-900/40">
              <div className="text-rose-400 font-bold mb-1 flex items-center gap-1.5">
                <span>❌ 通常のWeb画面</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                画面を開く ➔ WebSocket検知 ➔ 最新メッセージまで自動で「既読」化
              </p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-900/40">
              <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                <span>✅ 本拡張機能 (API)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                バックグラウンドで <code className="text-emerald-300">POST /messages</code> のみ実行 ➔ <strong>既読化処理が一切走らない</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Live HTTP Request / Response Inspector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#eb5a46]" />
              <h4 className="font-bold text-slate-900 text-sm">リアルタイム API 通信ログ</h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              X-ChatWorkToken & x-www-form-urlencoded
            </span>
          </div>

          {/* Log Items */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto font-mono text-xs">
            {apiLogs.map(log => (
              <div
                key={log.id}
                className="bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        log.method === 'POST' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {log.method}
                    </span>
                    <span className="text-slate-300 font-semibold">{log.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">{log.status} OK</span>
                    <span className="text-slate-500 text-[10px]">{log.timestamp} ({log.durationMs}ms)</span>
                  </div>
                </div>

                {/* Headers */}
                <div className="text-[11px] text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] font-sans font-semibold mb-0.5">REQUEST HEADERS:</div>
                  {Object.entries(log.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-amber-400">{k}:</span>
                      <span className="text-slate-300 truncate">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Payload if POST */}
                {log.payload && (
                  <div className="text-[11px] text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800/80">
                    <div className="text-slate-500 text-[10px] font-sans font-semibold mb-0.5">
                      REQUEST BODY (application/x-www-form-urlencoded):
                    </div>
                    <div className="text-rose-300 break-all">{log.payload}</div>
                  </div>
                )}

                {/* Response */}
                <div className="text-[11px] text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] font-sans font-semibold mb-0.5">RESPONSE JSON:</div>
                  <pre className="text-emerald-400 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.response, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Screenshot Reply Modal */}
      <AiScreenshotReplyModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyReply={(replyText) => {
          setMessage(replyText);
          showNotification('AI返信文を入力欄に反映しました', 'success');
        }}
        onSaveAsTemplate={handleSaveAsTemplateFromAi}
      />
    </div>
  );
};
