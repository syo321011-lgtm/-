/**
 * ChatWork 未読キープ送信 Chrome拡張機能 (Manifest V3)
 * popup.js - 全ロジック (API通信, chrome.storage, DOM操作)
 */

// デフォルトの定型文テンプレート
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-morning',
    title: '【始業】朝会・業務開始連絡',
    body: `[info][title]業務開始連絡[/title]おはようございます。本日の業務を開始いたします。

【本日の予定タスク】
1. 
2. 
3. 

本日もよろしくお願いいたします。[/info]`
  },
  {
    id: 'tpl-evening',
    title: '【終業】日報・業務終了連絡',
    body: `[info][title]業務終了連絡（日報）[/title]お疲れ様です。本日の業務を終了いたします。

【実施内容】
・
・

【明日の予定】
・

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
    body: `[info][title]資料送付のご案内[/title]お疲れ様です。標記の件につきまして、資料を共有いたします。

お手すきの際にご確認いただけますと幸いです。
よろしくお願いいたします。[/info]`
  }
];

// ストレージヘルパー（chrome.storage.sync または local を透過的に利用）
const Storage = {
  get(keys) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(keys, (items) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            // sync容量制限等のフォールバック
            chrome.storage.local.get(keys, resolve);
          } else {
            resolve(items || {});
          }
        });
      } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, resolve);
      } else {
        // ブラウザ外やモック環境用のlocalStorageフォールバック
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
        // localStorage フォールバック
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
  // 設定関連
  toggleSettingsBtn: document.getElementById('toggleSettingsBtn'),
  settingsSection: document.getElementById('settingsSection'),
  apiTokenInput: document.getElementById('apiTokenInput'),
  toggleTokenVisibilityBtn: document.getElementById('toggleTokenVisibilityBtn'),
  saveTokenBtn: document.getElementById('saveTokenBtn'),
  tokenStatusBadge: document.getElementById('tokenStatusBadge'),

  // ルーム関連
  reloadRoomsBtn: document.getElementById('reloadRoomsBtn'),
  reloadSpinner: document.getElementById('reloadSpinner'),
  roomSearchInput: document.getElementById('roomSearchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  roomSelect: document.getElementById('roomSelect'),
  roomCountText: document.getElementById('roomCountText'),
  selectedRoomInfo: document.getElementById('selectedRoomInfo'),

  // テンプレート関連
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

  // メッセージ ＆ 送信関連
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

  // トースト
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

/**
 * 初期化処理
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadSavedSettings();
});

/**
 * イベントリスナーの登録
 */
function setupEventListeners() {
  // APIトークン設定
  DOM.toggleSettingsBtn.addEventListener('click', toggleSettingsPanel);
  DOM.toggleTokenVisibilityBtn.addEventListener('click', toggleTokenVisibility);
  DOM.saveTokenBtn.addEventListener('click', handleSaveToken);

  // ルーム関連
  DOM.reloadRoomsBtn.addEventListener('click', () => fetchRooms(true));
  DOM.roomSearchInput.addEventListener('input', handleRoomSearch);
  DOM.clearSearchBtn.addEventListener('click', handleClearRoomSearch);
  DOM.roomSelect.addEventListener('change', handleRoomSelectChange);

  // テンプレート関連
  DOM.templateSelect.addEventListener('change', handleTemplateSelectChange);
  DOM.toggleTemplateMgrBtn.addEventListener('click', toggleTemplateManager);
  DOM.saveTemplateBtn.addEventListener('click', handleSaveTemplate);
  DOM.cancelEditTemplateBtn.addEventListener('click', resetTemplateForm);

  // メッセージ ＆ 送信
  DOM.messageInput.addEventListener('input', updateCharCount);
  DOM.clearMessageBtn.addEventListener('click', handleClearMessage);
  DOM.sendMessageBtn.addEventListener('click', handleSendMessage);

  // 写真添付イベント（任意）
  DOM.fileInput.addEventListener('change', handleFileInputChange);
  DOM.removeFileBtn.addEventListener('click', handleRemoveFile);
  setupDropZone();

  // トースト
  DOM.toastClose.addEventListener('click', hideToast);
}

/**
 * 保存されたデータの読み込み
 */
async function loadSavedSettings() {
  try {
    const data = await Storage.get([
      'chatwork_api_token',
      'chatwork_templates',
      'chatwork_cached_rooms',
      'chatwork_last_room_id'
    ]);

    // APIトークン
    if (data.chatwork_api_token) {
      state.apiToken = data.chatwork_api_token;
      DOM.apiTokenInput.value = state.apiToken;
      updateTokenStatus(true);
    } else {
      updateTokenStatus(false);
      // 初回は設定画面を開いて案内する
      DOM.settingsSection.classList.remove('hidden');
    }

    // テンプレート
    if (data.chatwork_templates && Array.isArray(data.chatwork_templates) && data.chatwork_templates.length > 0) {
      state.templates = data.chatwork_templates;
    } else {
      state.templates = [...DEFAULT_TEMPLATES];
      await Storage.set({ chatwork_templates: state.templates });
    }
    renderTemplateDropdown();
    renderTemplateList();

    // キャッシュされたルーム
    if (data.chatwork_cached_rooms && Array.isArray(data.chatwork_cached_rooms)) {
      state.allRooms = data.chatwork_cached_rooms;
      state.selectedRoomId = data.chatwork_last_room_id || '';
      renderRoomOptions();
    }

    // トークンが設定されている場合は、最新のルーム一覧をバックグラウンド取得
    if (state.apiToken) {
      fetchRooms(false);
    }
  } catch (err) {
    console.error('初期データの読み込みに失敗しました:', err);
    showToast('データの読み込みに失敗しました', 'error');
  }
}

/**
 * 設定パネルの開閉トグル
 */
function toggleSettingsPanel() {
  DOM.settingsSection.classList.toggle('hidden');
}

/**
 * トークンのマスク/表示トグル
 */
function toggleTokenVisibility() {
  const isPass = DOM.apiTokenInput.type === 'password';
  DOM.apiTokenInput.type = isPass ? 'text' : 'password';
  DOM.toggleTokenVisibilityBtn.textContent = isPass ? '🙈' : '👁️';
}

/**
 * トークンの保存処理
 */
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
    // トークン保存後に自動でルーム一覧を取得
    await fetchRooms(true);
  } catch (err) {
    console.error('トークン保存エラー:', err);
    showToast('トークンの保存に失敗しました', 'error');
  }
}

/**
 * トークンステータスバッジの更新
 */
function updateTokenStatus(isConfigured) {
  if (isConfigured) {
    DOM.tokenStatusBadge.textContent = '設定済み';
    DOM.tokenStatusBadge.className = 'badge configured';
  } else {
    DOM.tokenStatusBadge.textContent = '未設定';
    DOM.tokenStatusBadge.className = 'badge';
  }
}

/**
 * ChatWork APIからチャットルーム一覧を取得 (GET /rooms)
 * @param {boolean} showSuccessToast 
 */
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
      // キャッシュに保存
      await Storage.set({ chatwork_cached_rooms: rooms });
      renderRoomOptions();

      if (showSuccessToast) {
        showToast(`${rooms.length}件のルームを取得しました`, 'success');
      }
    }
  } catch (error) {
    console.error('ルーム一覧取得エラー:', error);
    showToast(`ルーム取得失敗: ${error.message}`, 'error');
    DOM.roomCountText.textContent = 'ルーム取得に失敗しました';
  } finally {
    state.isFetchingRooms = false;
    DOM.reloadSpinner.classList.remove('spinning');
  }
}

/**
 * ルーム一覧ドロップダウンの描画（インクリメンタル検索対応）
 */
function renderRoomOptions() {
  const query = DOM.roomSearchInput.value.trim().toLowerCase();
  
  // 絞り込みフィルター
  state.filteredRooms = state.allRooms.filter(room => {
    if (!query) return true;
    const roomName = (room.name || '').toLowerCase();
    const roomIdStr = String(room.room_id || '');
    return roomName.includes(query) || roomIdStr.includes(query);
  });

  // ドロップダウン更新
  DOM.roomSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- 送信先ルームを選択してください --';
  DOM.roomSelect.appendChild(defaultOption);

  state.filteredRooms.forEach(room => {
    const option = document.createElement('option');
    option.value = String(room.room_id);

    // ルームタイプ表記
    let typeLabel = '[グループ]';
    if (room.type === 'direct') typeLabel = '[ダイレクト]';
    if (room.type === 'my') typeLabel = '[マイチャット]';

    option.textContent = `${typeLabel} ${room.name} (ID: ${room.room_id})`;
    DOM.roomSelect.appendChild(option);
  });

  // 直前選択の復元
  if (state.selectedRoomId && state.filteredRooms.some(r => String(r.room_id) === String(state.selectedRoomId))) {
    DOM.roomSelect.value = String(state.selectedRoomId);
  } else if (state.filteredRooms.length === 1) {
    // 検索結果が1件なら自動選択
    DOM.roomSelect.value = String(state.filteredRooms[0].room_id);
    state.selectedRoomId = String(state.filteredRooms[0].room_id);
  }

  // 件数表示
  if (state.allRooms.length === 0) {
    DOM.roomCountText.textContent = 'ルームがありません（「ルーム更新」を押してください）';
  } else if (query) {
    DOM.roomCountText.textContent = `全${state.allRooms.length}件中 ${state.filteredRooms.length}件一致`;
  } else {
    DOM.roomCountText.textContent = `参加中: 全${state.allRooms.length}ルーム`;
  }

  updateSelectedRoomInfo();
}

/**
 * ルーム検索インプット処理
 */
function handleRoomSearch() {
  const query = DOM.roomSearchInput.value;
  DOM.clearSearchBtn.classList.toggle('hidden', !query);
  renderRoomOptions();
}

/**
 * 検索クリア
 */
function handleClearRoomSearch() {
  DOM.roomSearchInput.value = '';
  DOM.clearSearchBtn.classList.add('hidden');
  renderRoomOptions();
}

/**
 * ルーム選択変更イベント
 */
async function handleRoomSelectChange() {
  state.selectedRoomId = DOM.roomSelect.value;
  if (state.selectedRoomId) {
    await Storage.set({ chatwork_last_room_id: state.selectedRoomId });
  }
  updateSelectedRoomInfo();
}

/**
 * 選択中ルーム情報の更新
 */
function updateSelectedRoomInfo() {
  const currentId = DOM.roomSelect.value;
  if (!currentId) {
    DOM.selectedRoomInfo.textContent = '';
    return;
  }

  const room = state.allRooms.find(r => String(r.room_id) === String(currentId));
  if (room) {
    DOM.selectedRoomInfo.textContent = `ID: ${room.room_id}`;
  } else {
    DOM.selectedRoomInfo.textContent = `ID: ${currentId}`;
  }
}

/**
 * テンプレートドロップダウンの描画
 */
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

/**
 * テンプレート選択時の本文反映
 */
function handleTemplateSelectChange() {
  const tplId = DOM.templateSelect.value;
  if (!tplId) return;

  const tpl = state.templates.find(t => t.id === tplId);
  if (tpl) {
    DOM.messageInput.value = tpl.body;
    updateCharCount();
    showToast(`「${tpl.title}」を反映しました`, 'success');
  }
}

/**
 * テンプレート管理パネルの表示トグル
 */
function toggleTemplateManager() {
  const isHidden = DOM.templateMgrPanel.classList.toggle('hidden');
  DOM.mgrToggleIcon.textContent = isHidden ? '⚙️' : '✖';
  DOM.mgrToggleText.textContent = isHidden ? '管理・作成' : '閉じる';
}

/**
 * 保存済みテンプレート一覧リストの描画
 */
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

    // 編集ボタン
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon-xs';
    editBtn.textContent = '✏️';
    editBtn.title = '編集';
    editBtn.addEventListener('click', () => editTemplate(tpl.id));

    // 削除ボタン
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

/**
 * テンプレート保存（追加または更新）
 */
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
    // 更新
    const idx = state.templates.findIndex(t => t.id === editId);
    if (idx !== -1) {
      state.templates[idx].title = title;
      state.templates[idx].body = body;
    }
  } else {
    // 新規作成
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

/**
 * テンプレート編集モードに入る
 */
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

/**
 * テンプレート編集フォームのリセット
 */
function resetTemplateForm() {
  DOM.editingTemplateId.value = '';
  DOM.templateTitleInput.value = '';
  DOM.templateBodyInput.value = '';
  DOM.templateFormTitle.textContent = '➕ 新規テンプレート作成';
  DOM.cancelEditTemplateBtn.classList.add('hidden');
}

/**
 * テンプレート削除
 */
async function deleteTemplate(id) {
  const tpl = state.templates.find(t => t.id === id);
  if (!tpl) return;

  if (!confirm(`テンプレート「${tpl.title}」を削除してもよろしいですか？`)) {
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

/**
 * 文字数カウント更新
 */
function updateCharCount() {
  const len = DOM.messageInput.value.length;
  DOM.charCount.textContent = len.toLocaleString();
}

/**
 * メッセージおよび添付ファイルのクリア
 */
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

/**
 * ドラッグ＆ドロップゾーンの初期化
 */
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

/**
 * ファイル入力選択ハンドラ
 */
function handleFileInputChange(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    processSelectedFile(files[0]);
  }
}

/**
 * 選択されたファイルの検証とプレビュー設定
 */
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

/**
 * 写真添付の解除
 */
function handleRemoveFile() {
  state.selectedFile = null;
  DOM.fileInput.value = '';
  DOM.imagePreview.src = '';
  DOM.filePreviewContainer.classList.add('hidden');
  DOM.dropZone.classList.remove('hidden');
  DOM.fileSizeError.classList.add('hidden');
  DOM.sendBtnText.textContent = '未読のまま送信';
}

/**
 * ファイルサイズのフォーマット
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * メッセージ / 写真送信処理
 * - 写真あり: POST /rooms/{room_id}/files (multipart/form-data)
 * - 写真なし: POST /rooms/{room_id}/messages (application/x-www-form-urlencoded)
 */
async function handleSendMessage() {
  // バリデーション
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

  // 二重送信防止
  if (state.isSending) return;
  setSendingState(true);

  try {
    if (hasFile) {
      // 📷 写真・ファイル添付送信: POST /rooms/{room_id}/files (multipart/form-data)
      const url = `https://api.chatwork.com/v2/rooms/${encodeURIComponent(roomId)}/files`;
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

      // 成功時
      showToast(`✅ 写真・メッセージを未読維持のまま送信しました (FileID: ${fileId})`, 'success');
      
      // 入力欄クリア
      DOM.messageInput.value = '';
      updateCharCount();
      handleRemoveFile();
      DOM.templateSelect.value = '';
    } else {
      // 📝 通常テキスト送信: POST /rooms/{room_id}/messages (application/x-www-form-urlencoded)
      const url = `https://api.chatwork.com/v2/rooms/${encodeURIComponent(roomId)}/messages`;
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

      // 成功時
      showToast(`✅ メッセージを未読維持のまま送信しました (MsgID: ${messageId})`, 'success');
      
      // 入力欄クリア
      DOM.messageInput.value = '';
      updateCharCount();
      DOM.templateSelect.value = '';
    }
  } catch (error) {
    console.error('メッセージ送信エラー:', error);
    showToast(`送信失敗: ${error.message}`, 'error');
  } finally {
    setSendingState(false);
  }
}

/**
 * 送信中のUI状態制御
 */
function setSendingState(isSending) {
  state.isSending = isSending;
  DOM.sendMessageBtn.disabled = isSending;
  DOM.sendSpinner.classList.toggle('hidden', !isSending);
  DOM.sendBtnText.textContent = isSending ? '送信中...' : '未読のまま送信';
}

/**
 * ChatWork APIのエラーレスポンスを解析して親切なメッセージを返す
 */
function parseChatWorkError(statusCode, errorData) {
  let detail = '';
  if (errorData && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    detail = errorData.errors.join(', ');
  } else if (errorData && errorData.message) {
    detail = errorData.message;
  }

  switch (statusCode) {
    case 401:
      return `APIトークンが無効または有効期限切れです (401)${detail ? `: ${detail}` : ''}`;
    case 403:
      return `指定したルームへの投稿権限がありません (403)${detail ? `: ${detail}` : ''}`;
    case 404:
      return `チャットルームが見つかりません (404)${detail ? `: ${detail}` : ''}`;
    case 429:
      return `ChatWork APIのレート制限に達しました。しばらく時間をおいて再試行してください (429)`;
    case 500:
    case 502:
    case 503:
      return `ChatWorkサーバー側でエラーが発生しています (${statusCode})`;
    default:
      return detail || `HTTPエラー ${statusCode}`;
  }
}

/**
 * トースト通知の表示
 */
function showToast(message, type = 'success') {
  if (state.toastTimeout) {
    clearTimeout(state.toastTimeout);
  }

  DOM.toastMessage.textContent = message;
  DOM.toastIcon.textContent = type === 'success' ? '✅' : '⚠️';
  DOM.toast.className = `toast ${type}`;

  state.toastTimeout = setTimeout(() => {
    hideToast();
  }, 5000);
}

/**
 * トースト通知を閉じる
 */
function hideToast() {
  DOM.toast.classList.add('hidden');
  if (state.toastTimeout) {
    clearTimeout(state.toastTimeout);
    state.toastTimeout = null;
  }
}
