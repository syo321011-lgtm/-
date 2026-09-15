import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Image as ImageIcon, Send, RefreshCw, Search, Settings, 
  Eye, EyeOff, Plus, Trash2, CheckCircle2, AlertCircle, 
  Share2, QrCode, Smartphone, X, Check, ShieldCheck, 
  Sparkles, ExternalLink, ChevronDown, Clock, ArrowRight,
  FileText, SlidersHorizontal, Github
} from 'lucide-react';
import { ChatWorkRoom, MessageTemplate } from '../types';
import { 
  getChatWorkRooms, sendChatWorkMessage, sendChatWorkFile, DEMO_ROOMS 
} from '../services/chatworkApi';
import { 
  optimizeMobilePhoto, formatBytes, MAX_CHATWORK_FILE_SIZE, CompressionResult 
} from '../utils/imageCompressor';
import { TemplateManagerModal } from './TemplateManagerModal';
import { GitHubExportModal } from './GitHubExportModal';
import { 
  loadSavedTemplates, 
  saveTemplatesToStorage, 
  SHIPPING_PRESET_TEMPLATES 
} from '../data/shippingTemplates';

interface MobileWebAppProps {
  onBackToDesktop?: () => void;
}

export function MobileWebApp({ onBackToDesktop }: MobileWebAppProps) {
  // Settings & Auth State
  const [apiToken, setApiToken] = useState<string>(() => {
    return localStorage.getItem('cw_api_token') || '';
  });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('cw_demo_mode') === 'true' || !localStorage.getItem('cw_api_token');
  });
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showTokenText, setShowTokenText] = useState<boolean>(false);

  // Rooms State
  const [rooms, setRooms] = useState<ChatWorkRoom[]>(DEMO_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(DEMO_ROOMS[0].room_id);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [showRoomPickerModal, setShowRoomPickerModal] = useState<boolean>(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>('');

  // Templates & Message State
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    return loadSavedTemplates();
  });
  const [message, setMessage] = useState<string>(() => {
    const initTpls = loadSavedTemplates();
    return initTpls[0]?.body || '';
  });
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  // Photo Attachment State (Direct Camera & Library)
  const [attachedPhoto, setAttachedPhoto] = useState<CompressionResult | null>(null);
  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // References to native hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // UI State: Send status, Toast, Guidance Modals
  const [isSending, setIsSending] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showIosPwaGuide, setShowIosPwaGuide] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showGitHubModal, setShowGitHubModal] = useState<boolean>(false);

  // 1. 初期ロード：保存された設定とルーム一覧
  useEffect(() => {
    loadRooms(apiToken, isDemoMode);
  }, []);

  // 設定保存
  const handleSaveSettings = (newToken: string, demo: boolean) => {
    setApiToken(newToken);
    setIsDemoMode(demo);
    localStorage.setItem('cw_api_token', newToken);
    localStorage.setItem('cw_demo_mode', String(demo));
    setShowSettingsDrawer(false);
    showToast('設定を保存しました', 'success');
    loadRooms(newToken, demo);
  };

  // 定型文テンプレートの保存（AI返信からの登録含む）
  const handleSaveAsTemplate = (title: string, body: string) => {
    const newTpl: MessageTemplate = {
      id: `tpl-${Date.now()}`,
      title: title.trim(),
      body: body.trim()
    };
    const updated = [newTpl, ...templates];
    setTemplates(updated);
    saveTemplatesToStorage(updated);
    showToast(`定型文「${title}」を登録しました`, 'success');
  };

  // ルーム取得
  const loadRooms = async (token: string, demo: boolean) => {
    setIsLoadingRooms(true);
    try {
      const roomList = await getChatWorkRooms(token, demo);
      setRooms(roomList);
      if (roomList.length > 0 && !roomList.some(r => r.room_id === selectedRoomId)) {
        setSelectedRoomId(roomList[0].room_id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // トースト表示ヘルパー
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // 写真選択・カメラ撮影処理（iPhoneカメラの自動圧縮含む）
  const handleFilePicked = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPhotoError('画像ファイル（JPEG, PNG, HEIC等）を選択してください');
      showToast('画像ファイルを選択してください', 'error');
      return;
    }

    setPhotoError(null);
    setIsOptimizingPhoto(true);

    try {
      // 古いプレビュー解放
      if (attachedPhoto?.previewUrl) {
        URL.revokeObjectURL(attachedPhoto.previewUrl);
      }

      // iPhoneの12MP/48MP超高画質写真を5MB制限以内に自動最適化
      const result = await optimizeMobilePhoto(file);
      setAttachedPhoto(result);

      if (result.wasCompressed) {
        showToast(
          `写真を添付しました (${formatBytes(result.originalSize)} ➔ ${formatBytes(result.compressedSize)} に自動最適化)`,
          'success'
        );
      } else {
        showToast(`写真を添付しました (${formatBytes(result.compressedSize)})`, 'success');
      }
    } catch (err: any) {
      console.error('Photo optimization error:', err);
      setPhotoError('写真の読み込みに失敗しました');
      showToast('写真の処理に失敗しました', 'error');
    } finally {
      setIsOptimizingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    if (attachedPhoto?.previewUrl) {
      URL.revokeObjectURL(attachedPhoto.previewUrl);
    }
    setAttachedPhoto(null);
    setPhotoError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // 送信実行（未読キープ送信）
  const handleSend = async () => {
    if (!selectedRoomId) {
      showToast('送信先ルームを選択してください', 'error');
      return;
    }
    if (!message.trim() && !attachedPhoto) {
      showToast('メッセージまたは写真を入力・撮影してください', 'error');
      return;
    }

    setIsSending(true);

    try {
      if (attachedPhoto) {
        // 写真付き送信 (POST /rooms/{room_id}/files)
        const res = await sendChatWorkFile(
          apiToken,
          selectedRoomId,
          attachedPhoto.file,
          message.trim(),
          isDemoMode
        );

        if (!res.success) {
          throw new Error(res.error || '送信に失敗しました');
        }

        showToast(
          `✅ 写真・メッセージを未読キープで送信完了！ (FileID: ${res.id})`,
          'success'
        );
        handleRemovePhoto();
        setMessage('');
      } else {
        // メッセージのみ送信 (POST /rooms/{room_id}/messages)
        const res = await sendChatWorkMessage(
          apiToken,
          selectedRoomId,
          message.trim(),
          isDemoMode
        );

        if (!res.success) {
          throw new Error(res.error || '送信に失敗しました');
        }

        showToast(
          `✅ 未読状態のままメッセージ送信完了！ (MsgID: ${res.id})`,
          'success'
        );
        setMessage('');
      }
    } catch (err: any) {
      showToast(`送信エラー: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  // 選択中ルームオブジェクト
  const selectedRoom = rooms.find(r => r.room_id === selectedRoomId) || rooms[0];

  // 絞り込みルームリスト
  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
    String(r.room_id).includes(roomSearchQuery)
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-100 flex flex-col justify-between shadow-2xl relative select-none sm:rounded-3xl sm:border sm:border-slate-300 sm:overflow-hidden sm:my-4 sm:max-h-[920px]">
      
      {/* 1. Header (iOS Native App Style) */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3 flex items-center justify-between pt-safe">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#eb5a46] to-[#ff7866] text-white flex items-center justify-center shadow-md shadow-[#eb5a46]/30">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-slate-900 tracking-tight">未読キープ送信</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-50 text-[#eb5a46] border border-rose-200/60">
                スマホ版
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>相手の未読ステータスを保護</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* QR Code / Share Button */}
          <button
            id="mobile-share-qr-btn"
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
            title="スマホで開くQRコード"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* iOS PWA Install Guide */}
          <button
            id="mobile-pwa-install-btn"
            onClick={() => setShowIosPwaGuide(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
            title="iPhoneホーム画面に追加"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Settings Drawer Button */}
          <button
            id="mobile-settings-btn"
            onClick={() => setShowSettingsDrawer(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 relative"
            title="API設定"
          >
            <Settings className="w-4 h-4" />
            {isDemoMode && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Scrollable Body Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 pb-24">
        
        {/* Demo Mode Notice Banner */}
        {isDemoMode && (
          <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <span className="text-sm">🧪</span>
              <span className="font-semibold text-[11px]">デモ動作中 (本番トークン未設定)</span>
            </div>
            <button
              onClick={() => setShowSettingsDrawer(true)}
              className="text-[10px] font-bold text-amber-800 bg-amber-200/60 hover:bg-amber-200 px-2 py-1 rounded-lg transition"
            >
              API設定
            </button>
          </div>
        )}

        {/* Room Selector Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">送信先チャットルーム</span>
            <button
              onClick={() => loadRooms(apiToken, isDemoMode)}
              disabled={isLoadingRooms}
              className="text-[10.5px] text-[#eb5a46] hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
              <span>更新</span>
            </button>
          </div>

          <button
            id="mobile-room-selector-btn"
            onClick={() => setShowRoomPickerModal(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition text-left active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#eb5a46]/15 text-[#eb5a46] flex items-center justify-center shrink-0 font-bold text-xs">
                💬
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {selectedRoom?.name || 'ルームを選択してください'}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
                  <span>ID: {selectedRoom?.room_id}</span>
                  {selectedRoom?.unread_num !== undefined && selectedRoom.unread_num > 0 && (
                    <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold text-[9px]">
                      未読 {selectedRoom.unread_num}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Quick Message Template Chips with Registration Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">定型文テンプレート</span>
              <span className="text-[9px] bg-red-50 text-red-600 font-bold px-1.5 py-0.2 rounded-full border border-red-100">
                海外発送
              </span>
            </div>
            <button
              type="button"
              id="open-template-manager-btn"
              onClick={() => setShowTemplateModal(true)}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg transition active:scale-95"
            >
              <Plus className="w-3 h-3" />
              <span>登録・管理</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {/* Quick Add / Manage Chip */}
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="shrink-0 px-3 py-1.5 bg-red-50 border border-dashed border-red-300 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>新規登録</span>
            </button>
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => {
                  setMessage(tpl.body);
                  showToast(`定型文「${tpl.title}」をセットしました`, 'success');
                }}
                className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition active:scale-95"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Area */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">メッセージ本文</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMessage('')}
                className="text-[11px] text-rose-500 hover:text-rose-700 font-medium"
              >
                クリア
              </button>
            </div>
          </div>

          <textarea
            id="mobile-message-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="送信するメッセージを入力..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#eb5a46] resize-none leading-relaxed transition"
          />

          <div className="text-right text-[10px] text-slate-400 font-mono">
            {message.length} 文字
          </div>
        </div>

        {/* 3. iPhone Camera & Photo Attachment (Highlighted Core Feature!) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#eb5a46]" />
              <span className="text-xs font-bold text-slate-900">写真添付 (iPhoneカメラ撮影対応)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                任意
              </span>
            </div>
            <span className="text-[10px] text-slate-400">上限 5MB</span>
          </div>

          {/* Hidden HTML5 Native File Inputs */}
          {/* A: Direct Camera Capture (environment = back camera) */}
          <input
            ref={cameraInputRef}
            id="mobile-native-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFilePicked(file);
            }}
            className="hidden"
          />

          {/* B: Photo Library Picker */}
          <input
            ref={galleryInputRef}
            id="mobile-native-gallery-input"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFilePicked(file);
            }}
            className="hidden"
          />

          {!attachedPhoto ? (
            /* Action Buttons: Snap with Camera OR Choose from Album */
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Direct Camera Shoot */}
                <button
                  type="button"
                  id="mobile-shoot-camera-btn"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isOptimizingPhoto}
                  className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border-2 border-dashed border-[#eb5a46]/40 bg-rose-50/50 hover:bg-rose-50 hover:border-[#eb5a46] text-[#eb5a46] transition active:scale-95 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#eb5a46] text-white flex items-center justify-center shadow-sm shadow-[#eb5a46]/30">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">今すぐカメラ撮影</span>
                  <span className="text-[9.5px] text-rose-500/80">iPhoneカメラが起動</span>
                </button>

                {/* 2. Photo Library */}
                <button
                  type="button"
                  id="mobile-open-gallery-btn"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isOptimizingPhoto}
                  className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 text-slate-700 transition active:scale-95 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">ライブラリから選択</span>
                  <span className="text-[9.5px] text-slate-400">アルバム・保存写真</span>
                </button>
              </div>

              {isOptimizingPhoto && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center gap-2 text-xs text-blue-700">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>iPhone写真をChatWork仕様に自動最適化中...</span>
                </div>
              )}
            </div>
          ) : (
            /* Attached Photo Preview & Controls */
            <div id="mobile-photo-preview-card" className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/80 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300 shadow-2xs relative">
                  <img
                    src={attachedPhoto.previewUrl}
                    alt="Attached preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {attachedPhoto.file.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                    <span className="font-mono">{formatBytes(attachedPhoto.compressedSize)}</span>
                    <span className="text-[9.5px] text-slate-400">
                      ({attachedPhoto.width}×{attachedPhoto.height})
                    </span>
                  </div>
                  {attachedPhoto.wasCompressed ? (
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9.5px] font-medium border border-emerald-200/60">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>5MB制限内に自動圧縮済み</span>
                    </div>
                  ) : (
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[9.5px] font-medium">
                      <span>準備完了</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="写真を削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 text-[10.5px]">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                >
                  <Camera className="w-3 h-3" />
                  <span>再撮影</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>別の写真に変更</span>
                </button>
              </div>
            </div>
          )}

          {photoError && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              ⚠️ {photoError}
            </div>
          )}
        </div>

        {/* Back to desktop switch option for PC users */}
        {onBackToDesktop && (
          <div className="text-center pt-2">
            <button
              onClick={onBackToDesktop}
              className="text-xs text-slate-500 hover:text-slate-800 underline inline-flex items-center gap-1"
            >
              <span>PC用 Chrome拡張機能管理画面へ戻る</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </main>

      {/* 4. Sticky Bottom Send Button */}
      <footer className="bg-white/95 backdrop-blur border-t border-slate-200 p-3 pb-safe sticky bottom-0 z-20 shadow-lg">
        <button
          id="mobile-main-send-btn"
          onClick={handleSend}
          disabled={isSending || (!message.trim() && !attachedPhoto)}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
            attachedPhoto
              ? 'bg-gradient-to-r from-[#eb5a46] to-[#ff5238] shadow-[#eb5a46]/30'
              : 'bg-[#eb5a46] hover:bg-[#d64936] shadow-[#eb5a46]/25'
          }`}
        >
          {isSending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>送信処理中...</span>
            </>
          ) : attachedPhoto ? (
            <>
              <Camera className="w-4 h-4" />
              <span>写真付きで未読キープ送信</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>未読のまま送信</span>
            </>
          )}
        </button>
        <div className="text-center mt-1.5">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>ChatWork API直接通信：相手の未読バッジを消さずに送信</span>
          </span>
        </div>
      </footer>

      {/* 5. Toast Notification Popup */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm transition-all animate-bounce-once">
          <div
            className={`p-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal: Room Picker */}
      {showRoomPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">送信先ルームを選択</h3>
              <button
                onClick={() => setShowRoomPickerModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="ルーム名またはIDで検索..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#eb5a46]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredRooms.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  一致するルームが見つかりません
                </div>
              ) : (
                filteredRooms.map(r => (
                  <button
                    key={r.room_id}
                    onClick={() => {
                      setSelectedRoomId(r.room_id);
                      setShowRoomPickerModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                      r.room_id === selectedRoomId
                        ? 'bg-rose-50 text-[#eb5a46] font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs truncate">{r.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {r.room_id}</div>
                    </div>
                    {r.room_id === selectedRoomId && (
                      <Check className="w-4 h-4 text-[#eb5a46] shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Drawer: API Token & Settings */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#eb5a46]" />
                <h3 className="font-bold text-sm text-slate-900">スマホ版 API設定</h3>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Token Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">ChatWork APIトークン</label>
                <div className="relative">
                  <input
                    type={showTokenText ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="32桁のAPIトークンを入力..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#eb5a46]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenText(!showTokenText)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showTokenText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  ※ トークンはお使いのスマートフォンのブラウザ内（localStorage）に安全に保存されます。
                </p>
              </div>

              {/* Demo Mode Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">デモテストモード</div>
                  <div className="text-[10px] text-slate-500">トークンなしで画面動作やカメラ添付を体験</div>
                </div>
                <input
                  type="checkbox"
                  checked={isDemoMode}
                  onChange={(e) => setIsDemoMode(e.target.checked)}
                  className="w-4 h-4 accent-[#eb5a46] rounded cursor-pointer"
                />
              </div>

              {/* Token Guide Link */}
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1 text-slate-700">
                <div className="font-bold text-[#eb5a46] flex items-center gap-1">
                  <span>ChatWork APIトークンの取得方法</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
                <p className="text-[10.5px] text-slate-600 leading-relaxed">
                  ChatWork右上のアカウントメニュー ➔ [サービス連携] ➔ [API Token] から発行できます。
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSaveSettings(apiToken, isDemoMode)}
                  className="w-full py-3 bg-[#eb5a46] hover:bg-[#d64936] text-white font-bold rounded-xl text-xs shadow-md shadow-[#eb5a46]/20 transition active:scale-[0.99]"
                >
                  設定を保存して更新
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsDrawer(false);
                    setShowGitHubModal(true);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-[0.99]"
                >
                  <Github className="w-4 h-4 text-white" />
                  <span>GitHub公開・コードDL手順</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: iPhone Safari "ホーム画面に追加" Guide */}
      {showIosPwaGuide && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#eb5a46] text-white flex items-center justify-center font-bold text-xs">
                  📱
                </div>
                <h3 className="font-bold text-sm text-slate-900">iPhoneホーム画面への追加方法</h3>
              </div>
              <button
                onClick={() => setShowIosPwaGuide(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
              <p className="text-slate-600 text-[11.5px] leading-relaxed">
                Safariの「ホーム画面に追加」を行うと、<strong>アドレスバーのない全画面アプリ</strong>として1タップ起動できるようになり、現場での写真送信がさらに快適になります。
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-[#eb5a46] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Safari画面下部の「共有」をタップ</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">四角から上矢印が伸びたアイコン（<Share2 className="w-3 h-3 inline text-slate-700" />）をタップします。</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-[#eb5a46] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">メニューから「ホーム画面に追加」を選択</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">メニュー一覧を少し下へスクロールし、「ホーム画面に追加」をタップします。</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-[#eb5a46] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">右上の「追加」をタップで完了</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">iPhoneのホーム画面にアプリアイコンが作成され、ネイティブアプリ感覚で使えるようになります。</div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowIosPwaGuide(false)}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: QR Code to open on Smartphone */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4 text-center">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">スマホで開く (Safari用)</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center">
              {/* Simple dynamically rendered SVG QR code generator */}
              <div className="w-48 h-48 bg-white p-2 border border-slate-300 rounded-xl shadow-xs flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    window.location.href
                  )}`}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5">
                iPhoneのカメラでこのQRコードを読み取ると、Safariで即座に開けます。
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('URLをクリップボードにコピーしました', 'success');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                URLをコピー
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2.5 bg-[#eb5a46] text-white font-bold rounded-xl text-xs transition"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Modal: Template Manager (Add, Edit, Delete, Reset) */}
      <TemplateManagerModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templates={templates}
        onUpdateTemplates={(newTpls) => {
          setTemplates(newTpls);
          saveTemplatesToStorage(newTpls);
        }}
        onSelectTemplate={(tpl) => {
          setMessage(tpl.body);
          showToast(`定型文「${tpl.title}」をセットしました`, 'success');
        }}
      />

      {/* 11. Modal: GitHub Export & Instructions */}
      <GitHubExportModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
      />

    </div>
  );
}
