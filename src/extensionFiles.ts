import JSZip from 'jszip';
import { ExtensionFile } from './types';

export const MANIFEST_JSON = `{
  "manifest_version": 3,
  "name": "ChatWork 未読キープ送信",
  "version": "1.0.0",
  "description": "ChatWork画面を開かずにAPI経由で未読状態を維持したまま、テンプレートメッセージを特定のチャットルームへ送信する拡張機能",
  "action": {
    "default_popup": "popup.html",
    "default_title": "ChatWork 未読キープ送信",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "permissions": [
    "storage"
  ],
  "host_permissions": [
    "https://api.chatwork.com/*"
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}`;

export const POPUP_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChatWork 未読キープ送信</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <!-- ヘッダー -->
  <header class="app-header">
    <div class="header-left">
      <div class="app-logo">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </div>
      <div>
        <h1 class="app-title">ChatWork 未読キープ送信</h1>
        <div class="app-subtitle">
          <span class="status-dot online"></span>
          <span>API直接送信・未読維持</span>
        </div>
      </div>
    </div>
    <div class="header-actions">
      <button id="toggleSettingsBtn" class="icon-btn" title="API設定を開く/閉じる" aria-label="設定">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- トースト通知 -->
  <div id="toast" class="toast hidden" role="alert">
    <span id="toastIcon" class="toast-icon"></span>
    <span id="toastMessage" class="toast-message"></span>
    <button id="toastClose" class="toast-close" aria-label="閉じる">&times;</button>
  </div>

  <main class="main-content">
    <!-- 設定パネル（APIトークン） -->
    <section id="settingsSection" class="card settings-card hidden">
      <div class="card-header">
        <h2 class="card-title">ChatWork API設定</h2>
        <span class="badge" id="tokenStatusBadge">未設定</span>
      </div>
      <div class="card-body">
        <p class="help-text">
          ChatWork APIトークンを入力してください。<br>
          <small>※トークンは端末の安全な拡張機能領域（chrome.storage）に保存されます。</small>
        </p>
        <div class="input-group">
          <label for="apiTokenInput" class="input-label">APIトークン</label>
          <div class="password-wrapper">
            <input 
              type="password" 
              id="apiTokenInput" 
              class="text-input" 
              placeholder="例: a1b2c3d4e5f6..." 
              autocomplete="off"
              spellcheck="false"
            />
            <button id="toggleTokenVisibilityBtn" type="button" class="btn-eye" title="表示/非表示切り替え">
              👁️
            </button>
          </div>
        </div>
        <div class="settings-actions">
          <button id="saveTokenBtn" class="btn btn-primary btn-sm">トークンを保存</button>
          <a href="https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php" target="_blank" rel="noopener noreferrer" class="link-external">
            トークン取得画面を開く ↗
          </a>
        </div>
      </div>
    </section>

    <!-- 1. 送信先チャットルーム選択 -->
    <section class="card">
      <div class="card-header">
        <div class="card-title-group">
          <span class="step-num">1</span>
          <h2 class="card-title">送信先チャットルーム</h2>
        </div>
        <button id="reloadRoomsBtn" class="btn-text" title="最新のチャットルーム一覧を取得">
          <span class="reload-icon" id="reloadSpinner">🔄</span>
          <span>ルーム更新</span>
        </button>
      </div>

      <div class="card-body">
        <!-- 絞り込み検索インプット -->
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="roomSearchInput" 
            class="text-input search-input" 
            placeholder="ルーム名で絞り込み検索..." 
            autocomplete="off"
          />
          <button id="clearSearchBtn" class="btn-clear hidden" title="クリア">×</button>
        </div>

        <!-- ルーム選択ドロップダウン -->
        <div class="select-wrapper">
          <select id="roomSelect" class="select-input" aria-label="チャットルーム選択">
            <option value="">-- ルームを選択してください --</option>
          </select>
        </div>

        <div class="room-stats">
          <span id="roomCountText">ルームを読み込んでいません</span>
          <span id="selectedRoomInfo" class="selected-room-info"></span>
        </div>
      </div>
    </section>

    <!-- 2. テンプレート選択 ＆ 管理 -->
    <section class="card">
      <div class="card-header">
        <div class="card-title-group">
          <span class="step-num">2</span>
          <h2 class="card-title">定型文テンプレート</h2>
        </div>
        <button id="toggleTemplateMgrBtn" class="btn-text" title="テンプレートの追加・編集・削除">
          <span id="mgrToggleIcon">⚙️</span>
          <span id="mgrToggleText">管理・作成</span>
        </button>
      </div>

      <div class="card-body">
        <div class="select-wrapper">
          <select id="templateSelect" class="select-input" aria-label="テンプレート選択">
            <option value="">-- テンプレートを選択して本文に反映 --</option>
          </select>
        </div>

        <!-- テンプレート管理ドロワー（アコーディオン） -->
        <div id="templateMgrPanel" class="template-mgr-panel hidden">
          <div class="template-form-card">
            <h3 class="subsection-title" id="templateFormTitle">➕ 新規テンプレート作成</h3>
            <input type="hidden" id="editingTemplateId" value="" />
            <div class="input-group">
              <label for="templateTitleInput" class="input-label">テンプレート名</label>
              <input type="text" id="templateTitleInput" class="text-input" placeholder="例: 【朝会報告】始業連絡" />
            </div>
            <div class="input-group">
              <label for="templateBodyInput" class="input-label">本文</label>
              <textarea id="templateBodyInput" class="textarea-input" rows="4" placeholder="定型文の本文を入力してください..."></textarea>
            </div>
            <div class="form-actions">
              <button id="saveTemplateBtn" class="btn btn-secondary btn-sm">保存する</button>
              <button id="cancelEditTemplateBtn" class="btn btn-text btn-sm hidden">キャンセル</button>
            </div>
          </div>

          <!-- 保存済みテンプレート一覧 -->
          <div class="saved-templates-list-wrapper">
            <h4 class="list-label">保存済み一覧</h4>
            <div id="savedTemplatesList" class="saved-templates-list">
              <!-- JSで動的生成 -->
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. メッセージ本文編集 ＆ 写真添付（任意） ＆ 送信 -->
    <section class="card">
      <div class="card-header">
        <div class="card-title-group">
          <span class="step-num">3</span>
          <h2 class="card-title">メッセージ編集 & 送信</h2>
        </div>
        <button id="clearMessageBtn" class="btn-text text-danger" title="本文・添付写真をクリア">
          クリア
        </button>
      </div>

      <div class="card-body">
        <div class="info-banner">
          <span class="info-icon">💡</span>
          <span class="info-text">ChatWork Web画面を開かずにAPI直接送信するため、<strong>未読メッセージは未読のまま維持</strong>されます。</span>
        </div>

        <div class="textarea-wrapper">
          <textarea 
            id="messageInput" 
            class="textarea-input message-textarea" 
            rows="5" 
            placeholder="ここに送信するメッセージを入力してください。テンプレートを選択すると自動で挿入されます。"
          ></textarea>
        </div>

        <div class="char-count-row">
          <div class="char-count">
            <span id="charCount">0</span> 文字
          </div>
        </div>

        <!-- 任意: 写真・画像添付エリア -->
        <div class="attachment-section">
          <div class="attachment-header">
            <div class="attachment-title-group">
              <span class="attachment-icon">📷</span>
              <span class="attachment-title">写真・画像添付</span>
              <span class="badge badge-optional">任意</span>
            </div>
            <span class="attachment-limit-note">ChatWork API上限: 5MB</span>
          </div>

          <!-- 未選択時: ドロップゾーン ＆ ファイル選択 -->
          <div id="dropZone" class="drop-zone">
            <input 
              type="file" 
              id="fileInput" 
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" 
              class="drop-zone-input"
            />
            <div class="drop-zone-content">
              <span class="drop-icon">🖼️</span>
              <span class="drop-text">ここをクリックしてパソコンから写真を選択</span>
              <span class="drop-subtext">またはドラッグ＆ドロップ (PNG, JPG, GIF, WebP / 最大5MB)</span>
            </div>
          </div>

          <!-- 選択時: プレビューカード -->
          <div id="filePreviewContainer" class="file-preview-container hidden">
            <div class="preview-thumbnail-wrapper">
              <img id="imagePreview" src="" alt="添付写真プレビュー" class="image-preview" />
            </div>
            <div class="preview-info">
              <div class="preview-filename" id="previewFileName">photo.png</div>
              <div class="preview-meta">
                <span id="previewFileSize">0 KB</span>
                <span id="fileValidationBadge" class="badge-valid">添付中 (任意)</span>
              </div>
            </div>
            <button id="removeFileBtn" type="button" class="btn-remove-file" title="添付を解除">
              ✕
            </button>
          </div>

          <!-- 5MB超過エラー警告 -->
          <div id="fileSizeError" class="file-error hidden">
            ⚠️ ファイルサイズが5MBを超えています。5MB以下の写真を選択してください。
          </div>
        </div>

        <div class="message-footer">
          <button id="sendMessageBtn" class="btn btn-send">
            <span class="send-spinner hidden" id="sendSpinner"></span>
            <svg class="send-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span id="sendBtnText">未読のまま送信</span>
          </button>
        </div>
      </div>
    </section>
  </main>

  <footer class="app-footer">
    <span>ChatWork API v2 連携 | 未読ステータス保護</span>
  </footer>

  <script src="popup.js"></script>
</body>
</html>`;

export const POPUP_CSS = `/* ChatWork 未読キープ送信 - Chrome Extension Popup Stylesheet */
:root {
  --cw-red: #eb5a46;
  --cw-red-hover: #d64936;
  --cw-red-dark: #b83321;
  --cw-red-light: #fff5f4;
  --cw-red-border: #fecaca;
  
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-alt: #f1f5f9;
  
  --text-main: #0f172a;
  --text-muted: #475569;
  --text-sub: #64748b;
  --text-light: #94a3b8;
  
  --border-color: #e2e8f0;
  --border-focus: #eb5a46;
  
  --success-bg: #ecfdf5;
  --success-text: #065f46;
  --success-border: #a7f3d0;
  
  --error-bg: #fef2f2;
  --error-text: #991b1b;
  --error-border: #fecaca;
  
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  width: 400px;
  min-height: 480px;
  max-height: 600px;
  background-color: var(--color-bg);
  color: var(--text-main);
  font-family: var(--font-family);
  font-size: 13px;
  line-height: 1.5;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--color-bg);
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Header */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-logo {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--cw-red), var(--cw-red-hover));
  color: white;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(235, 90, 70, 0.25);
}

.app-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.app-subtitle {
  font-size: 11px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 1px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #cbd5e1;
}

.status-dot.online {
  background-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--color-surface-alt);
  color: var(--text-main);
  border-color: var(--border-color);
}

/* Toast */
.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 16px 0;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.toast.hidden {
  display: none;
}

.toast.success {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.toast.error {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
}

.toast-message {
  flex: 1;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  line-height: 1;
}

.toast-close:hover {
  opacity: 1;
}

/* Main Content */
.main-content {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

/* Cards */
.card {
  background: var(--color-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px;
  box-shadow: var(--shadow-sm);
}

.card.hidden {
  display: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.card-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-main);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Form Controls */
.input-label {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.text-input,
.select-input,
.textarea-input {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--text-main);
  padding: 7px 10px;
  font-size: 12.5px;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.text-input:focus,
.select-input:focus,
.textarea-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(235, 90, 70, 0.15);
}

.textarea-input {
  resize: vertical;
  line-height: 1.5;
}

.message-textarea {
  min-height: 110px;
  font-size: 13px;
}

/* Password input with toggle button */
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .text-input {
  padding-right: 36px;
}

.btn-eye {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 13px;
  opacity: 0.7;
}

.btn-eye:hover {
  opacity: 1;
}

/* Search Box */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 8px;
  font-size: 11px;
  pointer-events: none;
  color: var(--text-light);
}

.search-input {
  padding-left: 28px;
  padding-right: 28px;
  font-size: 12px;
}

.btn-clear {
  position: absolute;
  right: 6px;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
}

.btn-clear.hidden {
  display: none;
}

/* Room Stats & Info */
.room-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-sub);
  padding: 0 2px;
}

.selected-room-info {
  font-weight: 600;
  color: var(--cw-red);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  text-decoration: none;
}

.btn-primary {
  background: var(--cw-red);
  color: white;
}

.btn-primary:hover {
  background: var(--cw-red-hover);
}

.btn-secondary {
  background: var(--color-surface-alt);
  color: var(--text-main);
  border-color: var(--border-color);
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-send {
  background: linear-gradient(135deg, var(--cw-red), #d64936);
  color: white;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 700;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 4px rgba(235, 90, 70, 0.3);
}

.btn-send:hover:not(:disabled) {
  background: linear-gradient(135deg, #d64936, var(--cw-red-dark));
  box-shadow: 0 4px 8px rgba(235, 90, 70, 0.35);
  transform: translateY(-1px);
}

.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-text {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 11.5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 4px;
}

.btn-text:hover {
  color: var(--text-main);
  background: var(--color-surface-alt);
}

.btn-text.text-danger {
  color: #ef4444;
}

.btn-text.text-danger:hover {
  color: #b91c1c;
  background: var(--error-bg);
}

.btn-sm {
  padding: 5px 10px;
  font-size: 11.5px;
}

/* Info Banner */
.info-banner {
  background: var(--cw-red-light);
  border: 1px solid var(--cw-red-border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: #7f1d1d;
  line-height: 1.4;
}

.info-icon {
  font-size: 13px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Message Footer */
.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}

.char-count {
  font-size: 11.5px;
  color: var(--text-sub);
}

/* Badges & Spinners */
.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  background: #e2e8f0;
  color: #475569;
}

.badge.configured {
  background: var(--success-bg);
  color: var(--success-text);
}

.reload-icon.spinning,
.send-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.reload-icon.spinning {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: var(--text-main);
}

.hidden {
  display: none !important;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Settings Card */
.settings-card {
  border-left: 3px solid var(--cw-red);
  background: #fffafa;
}

.help-text {
  font-size: 11.5px;
  color: var(--text-sub);
  line-height: 1.4;
}

.help-text small {
  color: var(--text-light);
}

.settings-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.link-external {
  color: var(--cw-red);
  text-decoration: none;
  font-size: 11.5px;
  font-weight: 500;
}

.link-external:hover {
  text-decoration: underline;
}

/* Template Manager Panel */
.template-mgr-panel {
  border-top: 1px dashed var(--border-color);
  padding-top: 10px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-form-card {
  background: var(--color-surface-alt);
  padding: 10px;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subsection-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
}

.form-actions {
  display: flex;
  gap: 8px;
}

.saved-templates-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.list-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-sub);
}

.saved-templates-list {
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--color-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  transition: all 0.15s ease;
}

.template-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.template-item-title {
  font-weight: 600;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}

.template-item-actions {
  display: flex;
  gap: 2px;
}

.btn-icon-xs {
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px 5px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.btn-icon-xs:hover {
  background: var(--color-surface-alt);
  color: var(--text-main);
}

.btn-icon-xs.delete:hover {
  color: #dc2626;
  background: var(--error-bg);
}

/* Attachment Section (Optional) */
.attachment-section {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.attachment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.attachment-title-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.attachment-icon {
  font-size: 13px;
}

.attachment-title {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-main);
}

.badge-optional {
  background: #e0e7ff;
  color: #3730a3;
  font-size: 9.5px;
  padding: 1px 5px;
  border-radius: 9999px;
  font-weight: 700;
}

.attachment-limit-note {
  font-size: 10px;
  color: var(--text-light);
}

.drop-zone {
  border: 1.5px dashed #cbd5e1;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  text-align: center;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
}

.drop-zone:hover,
.drop-zone.dragover {
  border-color: var(--cw-red);
  background: var(--cw-red-light);
}

.drop-zone-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  pointer-events: none;
}

.drop-icon {
  font-size: 18px;
  margin-bottom: 2px;
}

.drop-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.drop-subtext {
  font-size: 9.5px;
  color: var(--text-light);
  margin-top: 2px;
}

.file-preview-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
}

.preview-thumbnail-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  overflow: hidden;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-filename {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: var(--text-sub);
  margin-top: 2px;
}

.badge-valid {
  background: #dcfce7;
  color: #166534;
  font-size: 9.5px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
}

.btn-remove-file {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 4px 6px;
  font-size: 14px;
  border-radius: 4px;
  line-height: 1;
}

.btn-remove-file:hover {
  color: #dc2626;
  background: var(--error-bg);
}

.file-error {
  font-size: 10.5px;
  color: #dc2626;
  background: var(--error-bg);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--error-border);
}

.char-count-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

/* Footer */
.app-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--color-surface);
  text-align: center;
  font-size: 10.5px;
  color: var(--text-light);
}`;

export const POPUP_JS = `/**
 * ChatWork 未読キープ送信 Chrome拡張機能 (Manifest V3)
 * popup.js - 全ロジック (API通信, chrome.storage, DOM操作)
 */

// デフォルトの定型文テンプレート
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-morning',
    title: '【始業】朝会・業務開始連絡',
    body: \`[info][title]業務開始連絡[/title]おはようございます。本日の業務を開始いたします。

【本日の予定タスク】
1. 
2. 
3. 

本日もよろしくお願いいたします。[/info]\`
  },
  {
    id: 'tpl-evening',
    title: '【終業】日報・業務終了連絡',
    body: \`[info][title]業務終了連絡（日報）[/title]お疲れ様です。本日の業務を終了いたします。

【実施内容】
・
・

【明日の予定】
・

何か至急の要件がございましたら、個別チャットまたはお電話にてご連絡ください。[/info]\`
  },
  {
    id: 'tpl-ack',
    title: '【受領】メッセージ確認・対応連絡',
    body: \`ご確認ありがとうございます。内容承知いたしました。
順次対応を進め、完了次第改めてご報告いたします。\`
  },
  {
    id: 'tpl-share',
    title: '【共有】資料送付・確認依頼',
    body: \`[info][title]資料送付のご案内[/title]お疲れ様です。標記の件につきまして、資料を共有いたします。

お手すきの際にご確認いただけますと幸いです。
よろしくお願いいたします。[/info]\`
  }
];

// ストレージヘルパー（chrome.storage.sync または local を透過的に利用）
const Storage = {
  get(keys) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(keys, (items) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            chrome.storage.local.get(keys, resolve);
          } else {
            resolve(items || {});
          }
        });
      } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, resolve);
      } else {
        const result = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach(k => {
          try {
            const v = localStorage.getItem(k);
            if (v !== null) result[k] = JSON.parse(v);
          } catch (e) {
            console.error('Storage get error', e);
          }
        });
        resolve(result);
      }
    });
  },

  set(items) {
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set(items, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            chrome.storage.local.set(items, () => resolve());
          } else {
            resolve();
          }
        });
      } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(items, resolve);
      } else {
        try {
          Object.entries(items).forEach(([k, v]) => {
            localStorage.setItem(k, JSON.stringify(v));
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }
};

// DOM要素のキャッシュ
const DOM = {
  toggleSettingsBtn: document.getElementById('toggleSettingsBtn'),
  settingsSection: document.getElementById('settingsSection'),
  apiTokenInput: document.getElementById('apiTokenInput'),
  toggleTokenVisibilityBtn: document.getElementById('toggleTokenVisibilityBtn'),
  saveTokenBtn: document.getElementById('saveTokenBtn'),
  tokenStatusBadge: document.getElementById('tokenStatusBadge'),

  reloadRoomsBtn: document.getElementById('reloadRoomsBtn'),
  reloadSpinner: document.getElementById('reloadSpinner'),
  roomSearchInput: document.getElementById('roomSearchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  roomSelect: document.getElementById('roomSelect'),
  roomCountText: document.getElementById('roomCountText'),
  selectedRoomInfo: document.getElementById('selectedRoomInfo'),

  templateSelect: document.getElementById('templateSelect'),
  toggleTemplateMgrBtn: document.getElementById('toggleTemplateMgrBtn'),
  mgrToggleIcon: document.getElementById('mgrToggleIcon'),
  mgrToggleText: document.getElementById('mgrToggleText'),
  templateMgrPanel: document.getElementById('templateMgrPanel'),
  templateFormTitle: document.getElementById('templateFormTitle'),
  editingTemplateId: document.getElementById('editingTemplateId'),
  templateTitleInput: document.getElementById('templateTitleInput'),
  templateBodyInput: document.getElementById('templateBodyInput'),
  saveTemplateBtn: document.getElementById('saveTemplateBtn'),
  cancelEditTemplateBtn: document.getElementById('cancelEditTemplateBtn'),
  savedTemplatesList: document.getElementById('savedTemplatesList'),

  clearMessageBtn: document.getElementById('clearMessageBtn'),
  messageInput: document.getElementById('messageInput'),
  charCount: document.getElementById('charCount'),
  sendMessageBtn: document.getElementById('sendMessageBtn'),
  sendBtnText: document.getElementById('sendBtnText'),
  sendSpinner: document.getElementById('sendSpinner'),

  // 写真添付（任意）DOM
  fileInput: document.getElementById('fileInput'),
  dropZone: document.getElementById('dropZone'),
  filePreviewContainer: document.getElementById('filePreviewContainer'),
  imagePreview: document.getElementById('imagePreview'),
  previewFileName: document.getElementById('previewFileName'),
  previewFileSize: document.getElementById('previewFileSize'),
  removeFileBtn: document.getElementById('removeFileBtn'),
  fileSizeError: document.getElementById('fileSizeError'),

  toast: document.getElementById('toast'),
  toastIcon: document.getElementById('toastIcon'),
  toastMessage: document.getElementById('toastMessage'),
  toastClose: document.getElementById('toastClose')
};

// アプリケーション状態
const state = {
  apiToken: '',
  allRooms: [],
  filteredRooms: [],
  selectedRoomId: '',
  templates: [],
  selectedFile: null,
  isSending: false,
  isFetchingRooms: false,
  toastTimeout: null
};

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadSavedSettings();
});

function setupEventListeners() {
  DOM.toggleSettingsBtn.addEventListener('click', toggleSettingsPanel);
  DOM.toggleTokenVisibilityBtn.addEventListener('click', toggleTokenVisibility);
  DOM.saveTokenBtn.addEventListener('click', handleSaveToken);

  DOM.reloadRoomsBtn.addEventListener('click', () => fetchRooms(true));
  DOM.roomSearchInput.addEventListener('input', handleRoomSearch);
  DOM.clearSearchBtn.addEventListener('click', handleClearRoomSearch);
  DOM.roomSelect.addEventListener('change', handleRoomSelectChange);

  DOM.templateSelect.addEventListener('change', handleTemplateSelectChange);
  DOM.toggleTemplateMgrBtn.addEventListener('click', toggleTemplateManager);
  DOM.saveTemplateBtn.addEventListener('click', handleSaveTemplate);
  DOM.cancelEditTemplateBtn.addEventListener('click', resetTemplateForm);

  DOM.messageInput.addEventListener('input', updateCharCount);
  DOM.clearMessageBtn.addEventListener('click', handleClearMessage);
  DOM.sendMessageBtn.addEventListener('click', handleSendMessage);

  // 写真添付イベント（任意）
  DOM.fileInput.addEventListener('change', handleFileInputChange);
  DOM.removeFileBtn.addEventListener('click', handleRemoveFile);
  setupDropZone();

  DOM.toastClose.addEventListener('click', hideToast);
}

async function loadSavedSettings() {
  try {
    const data = await Storage.get([
      'chatwork_api_token',
      'chatwork_templates',
      'chatwork_cached_rooms',
      'chatwork_last_room_id'
    ]);

    if (data.chatwork_api_token) {
      state.apiToken = data.chatwork_api_token;
      DOM.apiTokenInput.value = state.apiToken;
      updateTokenStatus(true);
    } else {
      updateTokenStatus(false);
      DOM.settingsSection.classList.remove('hidden');
    }

    if (data.chatwork_templates && Array.isArray(data.chatwork_templates) && data.chatwork_templates.length > 0) {
      state.templates = data.chatwork_templates;
    } else {
      state.templates = [...DEFAULT_TEMPLATES];
      await Storage.set({ chatwork_templates: state.templates });
    }
    renderTemplateDropdown();
    renderTemplateList();

    if (data.chatwork_cached_rooms && Array.isArray(data.chatwork_cached_rooms)) {
      state.allRooms = data.chatwork_cached_rooms;
      state.selectedRoomId = data.chatwork_last_room_id || '';
      renderRoomOptions();
    }

    if (state.apiToken) {
      fetchRooms(false);
    }
  } catch (err) {
    console.error('初期データの読み込みに失敗しました:', err);
    showToast('データの読み込みに失敗しました', 'error');
  }
}

function toggleSettingsPanel() {
  DOM.settingsSection.classList.toggle('hidden');
}

function toggleTokenVisibility() {
  const isPass = DOM.apiTokenInput.type === 'password';
  DOM.apiTokenInput.type = isPass ? 'text' : 'password';
  DOM.toggleTokenVisibilityBtn.textContent = isPass ? '🙈' : '👁️';
}

async function handleSaveToken() {
  const token = DOM.apiTokenInput.value.trim();
  if (!token) {
    showToast('APIトークンを入力してください', 'error');
    return;
  }

  state.apiToken = token;
  try {
    await Storage.set({ chatwork_api_token: token });
    updateTokenStatus(true);
    showToast('APIトークンを保存しました', 'success');
    DOM.settingsSection.classList.add('hidden');
    await fetchRooms(true);
  } catch (err) {
    console.error('トークン保存エラー:', err);
    showToast('トークンの保存に失敗しました', 'error');
  }
}

function updateTokenStatus(isConfigured) {
  if (isConfigured) {
    DOM.tokenStatusBadge.textContent = '設定済み';
    DOM.tokenStatusBadge.className = 'badge configured';
  } else {
    DOM.tokenStatusBadge.textContent = '未設定';
    DOM.tokenStatusBadge.className = 'badge';
  }
}

async function fetchRooms(showSuccessToast = false) {
  if (!state.apiToken) {
    showToast('先にAPIトークンを設定してください', 'error');
    DOM.settingsSection.classList.remove('hidden');
    return;
  }

  if (state.isFetchingRooms) return;
  state.isFetchingRooms = true;
  DOM.reloadSpinner.classList.add('spinning');
  DOM.roomCountText.textContent = 'ルーム一覧を取得中...';

  try {
    const response = await fetch('https://api.chatwork.com/v2/rooms', {
      method: 'GET',
      headers: {
        'X-ChatWorkToken': state.apiToken
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = parseChatWorkError(response.status, errorData);
      throw new Error(errorMsg);
    }

    const rooms = await response.json();
    if (Array.isArray(rooms)) {
      state.allRooms = rooms;
      await Storage.set({ chatwork_cached_rooms: rooms });
      renderRoomOptions();

      if (showSuccessToast) {
        showToast(\`\${rooms.length}件のルームを取得しました\`, 'success');
      }
    }
  } catch (error) {
    console.error('ルーム一覧取得エラー:', error);
    showToast(\`ルーム取得失敗: \${error.message}\`, 'error');
    DOM.roomCountText.textContent = 'ルーム取得に失敗しました';
  } finally {
    state.isFetchingRooms = false;
    DOM.reloadSpinner.classList.remove('spinning');
  }
}

function renderRoomOptions() {
  const query = DOM.roomSearchInput.value.trim().toLowerCase();
  
  state.filteredRooms = state.allRooms.filter(room => {
    if (!query) return true;
    const roomName = (room.name || '').toLowerCase();
    const roomIdStr = String(room.room_id || '');
    return roomName.includes(query) || roomIdStr.includes(query);
  });

  DOM.roomSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- 送信先ルームを選択してください --';
  DOM.roomSelect.appendChild(defaultOption);

  state.filteredRooms.forEach(room => {
    const option = document.createElement('option');
    option.value = String(room.room_id);

    let typeLabel = '[グループ]';
    if (room.type === 'direct') typeLabel = '[ダイレクト]';
    if (room.type === 'my') typeLabel = '[マイチャット]';

    option.textContent = \`\${typeLabel} \${room.name} (ID: \${room.room_id})\`;
    DOM.roomSelect.appendChild(option);
  });

  if (state.selectedRoomId && state.filteredRooms.some(r => String(r.room_id) === String(state.selectedRoomId))) {
    DOM.roomSelect.value = String(state.selectedRoomId);
  } else if (state.filteredRooms.length === 1) {
    DOM.roomSelect.value = String(state.filteredRooms[0].room_id);
    state.selectedRoomId = String(state.filteredRooms[0].room_id);
  }

  if (state.allRooms.length === 0) {
    DOM.roomCountText.textContent = 'ルームがありません（「ルーム更新」を押してください）';
  } else if (query) {
    DOM.roomCountText.textContent = \`全\${state.allRooms.length}件中 \${state.filteredRooms.length}件一致\`;
  } else {
    DOM.roomCountText.textContent = \`参加中: 全\${state.allRooms.length}ルーム\`;
  }

  updateSelectedRoomInfo();
}

function handleRoomSearch() {
  const query = DOM.roomSearchInput.value;
  DOM.clearSearchBtn.classList.toggle('hidden', !query);
  renderRoomOptions();
}

function handleClearRoomSearch() {
  DOM.roomSearchInput.value = '';
  DOM.clearSearchBtn.classList.add('hidden');
  renderRoomOptions();
}

async function handleRoomSelectChange() {
  state.selectedRoomId = DOM.roomSelect.value;
  if (state.selectedRoomId) {
    await Storage.set({ chatwork_last_room_id: state.selectedRoomId });
  }
  updateSelectedRoomInfo();
}

function updateSelectedRoomInfo() {
  const currentId = DOM.roomSelect.value;
  if (!currentId) {
    DOM.selectedRoomInfo.textContent = '';
    return;
  }

  const room = state.allRooms.find(r => String(r.room_id) === String(currentId));
  if (room) {
    DOM.selectedRoomInfo.textContent = \`ID: \${room.room_id}\`;
  } else {
    DOM.selectedRoomInfo.textContent = \`ID: \${currentId}\`;
  }
}

function renderTemplateDropdown() {
  DOM.templateSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- テンプレートを選択して本文に反映 --';
  DOM.templateSelect.appendChild(defaultOption);

  state.templates.forEach(tpl => {
    const option = document.createElement('option');
    option.value = tpl.id;
    option.textContent = tpl.title;
    DOM.templateSelect.appendChild(option);
  });
}

function handleTemplateSelectChange() {
  const tplId = DOM.templateSelect.value;
  if (!tplId) return;

  const tpl = state.templates.find(t => t.id === tplId);
  if (tpl) {
    DOM.messageInput.value = tpl.body;
    updateCharCount();
    showToast(\`「\${tpl.title}」を反映しました\`, 'success');
  }
}

function toggleTemplateManager() {
  const isHidden = DOM.templateMgrPanel.classList.toggle('hidden');
  DOM.mgrToggleIcon.textContent = isHidden ? '⚙️' : '✖';
  DOM.mgrToggleText.textContent = isHidden ? '管理・作成' : '閉じる';
}

function renderTemplateList() {
  DOM.savedTemplatesList.innerHTML = '';

  if (state.templates.length === 0) {
    DOM.savedTemplatesList.innerHTML = '<div style="font-size:11px;color:#94a3b8;padding:4px;">テンプレートがありません</div>';
    return;
  }

  state.templates.forEach(tpl => {
    const item = document.createElement('div');
    item.className = 'template-item';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'template-item-title';
    titleSpan.textContent = tpl.title;
    titleSpan.title = tpl.title;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'template-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon-xs';
    editBtn.textContent = '✏️';
    editBtn.title = '編集';
    editBtn.addEventListener('click', () => editTemplate(tpl.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon-xs delete';
    delBtn.textContent = '🗑️';
    delBtn.title = '削除';
    delBtn.addEventListener('click', () => deleteTemplate(tpl.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(delBtn);

    item.appendChild(titleSpan);
    item.appendChild(actionsDiv);
    DOM.savedTemplatesList.appendChild(item);
  });
}

async function handleSaveTemplate() {
  const title = DOM.templateTitleInput.value.trim();
  const body = DOM.templateBodyInput.value.trim();
  const editId = DOM.editingTemplateId.value;

  if (!title) {
    showToast('テンプレート名を入力してください', 'error');
    DOM.templateTitleInput.focus();
    return;
  }
  if (!body) {
    showToast('本文を入力してください', 'error');
    DOM.templateBodyInput.focus();
    return;
  }

  if (editId) {
    const idx = state.templates.findIndex(t => t.id === editId);
    if (idx !== -1) {
      state.templates[idx].title = title;
      state.templates[idx].body = body;
    }
  } else {
    const newTpl = {
      id: 'tpl-' + Date.now(),
      title,
      body
    };
    state.templates.push(newTpl);
  }

  try {
    await Storage.set({ chatwork_templates: state.templates });
    renderTemplateDropdown();
    renderTemplateList();
    resetTemplateForm();
    showToast('テンプレートを保存しました', 'success');
  } catch (err) {
    console.error('テンプレート保存エラー:', err);
    showToast('テンプレートの保存に失敗しました', 'error');
  }
}

function editTemplate(id) {
  const tpl = state.templates.find(t => t.id === id);
  if (!tpl) return;

  DOM.editingTemplateId.value = tpl.id;
  DOM.templateTitleInput.value = tpl.title;
  DOM.templateBodyInput.value = tpl.body;

  DOM.templateFormTitle.textContent = '✏️ テンプレート編集';
  DOM.cancelEditTemplateBtn.classList.remove('hidden');
  DOM.templateTitleInput.focus();
}

function resetTemplateForm() {
  DOM.editingTemplateId.value = '';
  DOM.templateTitleInput.value = '';
  DOM.templateBodyInput.value = '';
  DOM.templateFormTitle.textContent = '➕ 新規テンプレート作成';
  DOM.cancelEditTemplateBtn.classList.add('hidden');
}

async function deleteTemplate(id) {
  const tpl = state.templates.find(t => t.id === id);
  if (!tpl) return;

  if (!confirm(\`テンプレート「\${tpl.title}」を削除してもよろしいですか？\`)) {
    return;
  }

  state.templates = state.templates.filter(t => t.id !== id);

  try {
    await Storage.set({ chatwork_templates: state.templates });
    renderTemplateDropdown();
    renderTemplateList();
    if (DOM.editingTemplateId.value === id) {
      resetTemplateForm();
    }
    showToast('テンプレートを削除しました', 'success');
  } catch (err) {
    console.error('テンプレート削除エラー:', err);
    showToast('テンプレートの削除に失敗しました', 'error');
  }
}

function updateCharCount() {
  const len = DOM.messageInput.value.length;
  DOM.charCount.textContent = len.toLocaleString();
}

function handleClearMessage() {
  if (!DOM.messageInput.value && !state.selectedFile) return;
  if (confirm('入力中のメッセージおよび添付写真をクリアしますか？')) {
    DOM.messageInput.value = '';
    updateCharCount();
    handleRemoveFile();
  }
}

// 写真・画像添付（任意）関連の処理
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (ChatWork API 上限)

function setupDropZone() {
  const dropZone = DOM.dropZone;
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt && dt.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  }, false);
}

function handleFileInputChange(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    processSelectedFile(files[0]);
  }
}

function processSelectedFile(file) {
  // 画像形式チェック
  if (!file.type.startsWith('image/')) {
    showToast('画像ファイル（PNG, JPG, GIF, WebP等）を選択してください', 'error');
    DOM.fileInput.value = '';
    return;
  }

  // 容量チェック (5MB上限)
  if (file.size > MAX_FILE_SIZE) {
    DOM.fileSizeError.classList.remove('hidden');
    showToast('ファイルサイズが5MBを超えています (ChatWork API上限)', 'error');
    DOM.fileInput.value = '';
    return;
  }

  DOM.fileSizeError.classList.add('hidden');
  state.selectedFile = file;

  // プレビュー表示
  DOM.previewFileName.textContent = file.name;
  DOM.previewFileSize.textContent = formatFileSize(file.size);

  const reader = new FileReader();
  reader.onload = (e) => {
    DOM.imagePreview.src = e.target.result;
    DOM.dropZone.classList.add('hidden');
    DOM.filePreviewContainer.classList.remove('hidden');
    DOM.sendBtnText.textContent = '写真付きで未読送信';
  };
  reader.readAsDataURL(file);
}

function handleRemoveFile() {
  state.selectedFile = null;
  DOM.fileInput.value = '';
  DOM.imagePreview.src = '';
  DOM.filePreviewContainer.classList.add('hidden');
  DOM.dropZone.classList.remove('hidden');
  DOM.fileSizeError.classList.add('hidden');
  DOM.sendBtnText.textContent = '未読のまま送信';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function handleSendMessage() {
  if (!state.apiToken) {
    showToast('先にChatWork APIトークンを設定してください', 'error');
    DOM.settingsSection.classList.remove('hidden');
    return;
  }

  const roomId = DOM.roomSelect.value;
  if (!roomId) {
    showToast('送信先チャットルームを選択してください', 'error');
    DOM.roomSelect.focus();
    return;
  }

  const messageText = DOM.messageInput.value.trim();
  const hasFile = !!state.selectedFile;

  // 本文または写真のいずれかが必須
  if (!messageText && !hasFile) {
    showToast('メッセージ本文または添付写真のいずれかを入力してください', 'error');
    DOM.messageInput.focus();
    return;
  }

  if (state.isSending) return;
  setSendingState(true);

  try {
    if (hasFile) {
      // 📷 写真添付送信: POST /rooms/{room_id}/files (multipart/form-data)
      const url = \`https://api.chatwork.com/v2/rooms/\${encodeURIComponent(roomId)}/files\`;
      const formData = new FormData();
      formData.append('file', state.selectedFile, state.selectedFile.name);
      if (messageText) {
        formData.append('message', messageText);
      }

      // 注意: Content-Typeヘッダーは手動指定せず、ブラウザに boundary 付き multipart/form-data を自動設定させる
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-ChatWorkToken': state.apiToken
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = parseChatWorkError(response.status, errorData);
        throw new Error(errorMsg);
      }

      const result = await response.json();
      const fileId = result && result.file_id ? result.file_id : 'OK';

      showToast(\`✅ 写真・メッセージを未読維持のまま送信しました (FileID: \${fileId})\`, 'success');
      
      DOM.messageInput.value = '';
      updateCharCount();
      handleRemoveFile();
      DOM.templateSelect.value = '';
    } else {
      // 📝 通常テキスト送信: POST /rooms/{room_id}/messages (application/x-www-form-urlencoded)
      const url = \`https://api.chatwork.com/v2/rooms/\${encodeURIComponent(roomId)}/messages\`;
      const formParams = new URLSearchParams();
      formParams.append('body', messageText);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-ChatWorkToken': state.apiToken,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formParams.toString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = parseChatWorkError(response.status, errorData);
        throw new Error(errorMsg);
      }

      const result = await response.json();
      const messageId = result && result.message_id ? result.message_id : 'OK';

      showToast(\`✅ メッセージを未読維持のまま送信しました (MsgID: \${messageId})\`, 'success');
      
      DOM.messageInput.value = '';
      updateCharCount();
      DOM.templateSelect.value = '';
    }
  } catch (error) {
    console.error('メッセージ送信エラー:', error);
    showToast(\`送信失敗: \${error.message}\`, 'error');
  } finally {
    setSendingState(false);
  }
}

function setSendingState(isSending) {
  state.isSending = isSending;
  DOM.sendMessageBtn.disabled = isSending;
  DOM.sendSpinner.classList.toggle('hidden', !isSending);
  DOM.sendBtnText.textContent = isSending ? '送信中...' : '未読のまま送信';
}

function parseChatWorkError(statusCode, errorData) {
  let detail = '';
  if (errorData && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    detail = errorData.errors.join(', ');
  } else if (errorData && errorData.message) {
    detail = errorData.message;
  }

  switch (statusCode) {
    case 401:
      return \`APIトークンが無効または有効期限切れです (401)\${detail ? \`: \${detail}\` : ''}\`;
    case 403:
      return \`指定したルームへの投稿権限がありません (403)\${detail ? \`: \${detail}\` : ''}\`;
    case 404:
      return \`チャットルームが見つかりません (404)\${detail ? \`: \${detail}\` : ''}\`;
    case 429:
      return \`ChatWork APIのレート制限に達しました。しばらく時間をおいて再試行してください (429)\`;
    case 500:
    case 502:
    case 503:
      return \`ChatWorkサーバー側でエラーが発生しています (\${statusCode})\`;
    default:
      return detail || \`HTTPエラー \${statusCode}\`;
  }
}

function showToast(message, type = 'success') {
  if (state.toastTimeout) {
    clearTimeout(state.toastTimeout);
  }

  DOM.toastMessage.textContent = message;
  DOM.toastIcon.textContent = type === 'success' ? '✅' : '⚠️';
  DOM.toast.className = \`toast \${type}\`;

  state.toastTimeout = setTimeout(() => {
    hideToast();
  }, 5000);
}

function hideToast() {
  DOM.toast.classList.add('hidden');
  if (state.toastTimeout) {
    clearTimeout(state.toastTimeout);
    state.toastTimeout = null;
  }
}`;

export const EXTENSION_FILES: ExtensionFile[] = [
  {
    name: 'manifest.json',
    path: 'manifest.json',
    language: 'json',
    description: 'Chrome Manifest V3 拡張機能設定ファイル (storage権限、host_permissions設定)',
    content: MANIFEST_JSON
  },
  {
    name: 'popup.html',
    path: 'popup.html',
    language: 'html',
    description: '拡張機能ポップアップ画面のHTML構造 (ルーム検索・テンプレート選択・メッセージ編集)',
    content: POPUP_HTML
  },
  {
    name: 'popup.css',
    path: 'popup.css',
    language: 'css',
    description: 'ポップアップ用CSSスタイルシート (ChatWorkカラー、レスポンシブ、アニメーション)',
    content: POPUP_CSS
  },
  {
    name: 'popup.js',
    path: 'popup.js',
    language: 'javascript',
    description: 'API通信 (メッセージ送信/任意写真添付POST・X-ChatWorkToken)・chrome.storage・DOM制御ロジック',
    content: POPUP_JS
  }
];

/**
 * Download a single file
 */
export function downloadSingleFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download the entire extension folder as a zip package
 */
export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();

  // Add root files
  zip.file('manifest.json', MANIFEST_JSON);
  zip.file('popup.html', POPUP_HTML);
  zip.file('popup.css', POPUP_CSS);
  zip.file('popup.js', POPUP_JS);

  // Add README
  const readmeContent = `# ChatWork 未読キープ送信 Chrome拡張機能 (Manifest V3)

ChatWorkのWeb画面を開かずにAPI経由でメッセージ・写真を送信することで、
既存の未読状態を維持したまま定型文や写真添付メッセージを特定ルームへ送信できるGoogle Chrome拡張機能です。

## 🌟 主な機能
- **未読維持送信**: Web画面を開かないため、対象チャットルームの未読バッジや未読カウントが「既読」になりません。
- **動的ルーム取得＆検索**: GET /v2/rooms により所属ルーム一覧を取得し、インクリメンタル検索・選択できます。
- **定型文テンプレート管理**: 朝会、日報、確認などのテンプレートをワンクリック挿入。作成・編集・削除も可能。
- **📷 写真・画像添付（任意機能）**: 
  - 任意で写真（PNG, JPG, GIF, WebP / 最大5MB）を添付可能。
  - 写真添付時は \`POST /v2/rooms/{room_id}/files\` (multipart/form-data) 経由で送信。
  - 写真なしの場合は通常の \`POST /v2/rooms/{room_id}/messages\` で送信。
  - 添付解除もワンクリックで簡単に行えます。

## 🚀 導入手順（インストール方法）
1. このZIPファイルを任意のフォルダに解凍（展開）します。
2. Google Chromeで chrome://extensions を開きます。
3. 画面右上の「デベロッパーモード」をONにします。
4. 左上の「パッケージ化されていない拡張機能を読み込む」をクリックし、解凍したフォルダを選択します。
5. ツールバーの拡張機能一覧からピン留めして完了です！
`;
  zip.file('README.md', readmeContent);

  // Add icons folder
  const iconsFolder = zip.folder('icons');
  if (iconsFolder) {
    try {
      // Fetch icons from public directory or fallback
      const [res16, res48, res128] = await Promise.all([
        fetch('/extension/icons/icon16.png').then(r => r.blob()).catch(() => null),
        fetch('/extension/icons/icon48.png').then(r => r.blob()).catch(() => null),
        fetch('/extension/icons/icon128.png').then(r => r.blob()).catch(() => null)
      ]);

      if (res16) iconsFolder.file('icon16.png', res16);
      if (res48) iconsFolder.file('icon48.png', res48);
      if (res128) iconsFolder.file('icon128.png', res128);
    } catch (e) {
      console.warn('Could not bundle image blobs into zip, skipping icons:', e);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chatwork-unread-sender-extension.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
