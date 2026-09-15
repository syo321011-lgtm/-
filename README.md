# ChatWork 未読キープ送信 (Keep Unread Sender)

> **Web画面を開かずAPI経由で未読ステータスを維持したまま、メッセージやiPhone撮影写真を即座に送信できるWebアプリ＆Chrome拡張機能**

---

## 🌟 主な特徴

- 👁️ **未読ステータスを完全維持**:
  ChatWorkの公式Web画面やスマホアプリを開かずにChatWork API経由でメッセージ・ファイルを直接送信するため、ルーム内の未読バッジが消えません。
- 📱 **スマホ（iPhone/Safari）最適化**:
  iPhoneカメラでの直接撮影・即時圧縮送信に対応。Safariの「ホーム画面に追加」でネイティブアプリ感覚で利用可能。
- 📦 **定型文テンプレート登録・管理**:
  日常の業務連絡、出荷連絡、確認依頼などの定型文をワンタップで呼び出し・編集・保存可能。
- 🌐 **CORSプロキシ内蔵**:
  ブラウザから直接ChatWork APIを叩いた場合のCORS制限を回避するNode.js / Expressバックエンドを同梱。
- 💻 **Chrome拡張機能同梱**:
  ブラウザのツールバーからポップアップで未読送信できるChrome拡張機能も同梱。

---

## 🚀 ローカル環境での起動方法

### 前提条件
- Node.js 18以上
- npm または bun / pnpm

### 1. リポジトリのクローン・ダウンロード
```bash
git clone https://github.com/あなたのユーザー名/リポジトリ名.git
cd リポジトリ名
```

### 2. 依存パッケージのインストール
```bash
npm install
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
起動後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

### 4. 本番ビルドと実行
```bash
npm run build
npm start
```

---

## 🐙 GitHubへのプッシュ手順（初回）

GitHubにリポジトリを新規作成した後、ターミナルで以下のコマンドを実行します:

```bash
# 1. git初期化
git init

# 2. 全ファイルをステージング
git add .

# 3. コミット
git commit -m "feat: initial commit of ChatWork Unread Sender"

# 4. ブランチ名をmainに設定
git branch -M main

# 5. リモートリポジトリの登録（URLをご自身のリポジトリに変更してください）
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git

# 6. プッシュ
git push -u origin main
```

---

## ☁️ クラウドへのデプロイ方法（無料枠あり）

本アプリはExpressサーバーとViteフロントエンドが一体となったフルスタック構成です。

### 選択肢 1: Render / Railway / Fly.io（おすすめ）
1. [Render.com](https://render.com) や [Railway.app](https://railway.app) にログイン
2. GitHubリポジトリを連携
3. 設定:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Port**: `3000`
4. デプロイ完了後、発行されたURLでスマホやPCから常時利用可能です。

### 選択肢 2: Google Cloud Run
AI Studioの右上「Deploy」ボタンから、1クリックでCloud Runに直接デプロイすることも可能です。

---

## 🔑 ChatWork APIトークンの取得手順

1. ChatWorkにログイン
2. 右上のアカウント名アイコンをクリック ➔ **[サービス連携]**
3. 左メニューの **[API Token]** をクリック
4. パスワードを入力してAPIトークンを発行・コピー
5. 本アプリの右上の設定（⚙️）画面に貼り付けて「保存」

---

## 📂 プロジェクト構成

```
.
├── src/
│   ├── components/       # UIコンポーネント (MobileWebApp, Simulator, etc.)
│   ├── data/             # 定型文初期データ
│   ├── services/         # ChatWork API通信クライアント
│   ├── utils/            # 画像圧縮・最適化ツール
│   ├── extensionFiles.ts # Chrome拡張機能の同梱ファイル
│   ├── App.tsx           # メインアプリケーション
│   └── main.tsx          # エントリーポイント
├── public/               # 静的アセット・PWAアイコン
├── server.ts             # Expressプロキシサーバー (CORS回避用)
├── vite.config.ts        # Vite設定
├── package.json
└── README.md
```

---

## 📄 ライセンス
MIT License
