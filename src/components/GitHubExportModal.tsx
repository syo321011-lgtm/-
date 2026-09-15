import React, { useState } from 'react';
import { 
  Github, Download, Terminal, ExternalLink, Check, Copy, 
  HelpCircle, Sparkles, Cloud, Globe, X, ArrowRight, ShieldCheck 
} from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitCommands = `# 1. ZIPを解凍したフォルダに移動してGit初期化
git init

# 2. ファイルをすべてステージング
git add .

# 3. コミットを作成
git commit -m "Initial commit: ChatWork 未読キープ送信 Web App"

# 4. メインブランチに名前を変更
git branch -M main

# 5. GitHubで作成したリポジトリURLを紐付け
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 6. GitHubにプッシュ
git push -u origin main`;

  const runCommands = `# パッケージのインストール
npm install

# 開発サーバー起動（ブラウザで http://localhost:3000）
npm run dev

# 本番ビルドと起動
npm run build
npm start`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                GitHubにサイト版コードを載せる手順
              </h3>
              <p className="text-xs text-slate-300">
                コードのダウンロード、GitHub公開、Webサイトとしての無料デプロイ方法
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
          
          {/* Method 1: AI Studio Built-in 1-Click Export (Easiest!) */}
          <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#eb5a46] text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>AI Studio標準機能で1クリック公開・ダウンロード（一番簡単）</span>
            </div>
            
            <p className="text-xs text-slate-700 leading-relaxed">
              このAI Studio画面の<strong>右上メニュー（⚙️ 設定 / Settings）</strong>から、直接GitHub連携およびコードの丸ごとダウンロードが可能です：
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-lg border border-red-100 shadow-2xs space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Github className="w-4 h-4 text-slate-700" />
                  <span>Export to GitHub</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  画面右上の ⚙️ ➔ <strong>Export to GitHub</strong> を選ぶと、あなたのGitHubアカウントに新規リポジトリが自動作成されて全コードが即座に同期されます。
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-red-100 shadow-2xs space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-slate-700" />
                  <span>Download ZIP</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  画面右上の ⚙️ ➔ <strong>Download ZIP</strong> を選ぶと、このWebサイトの全ソースコード一式（フロント＋Expressサーバー）がZIPで保存されます。
                </p>
              </div>
            </div>
          </div>

          {/* Method 2: Manual Git Push Commands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs">
                  2
                </span>
                <span>手動でGitHubにプッシュする場合のコマンド</span>
              </div>
              <button
                onClick={() => copyToClipboard(gitCommands, 1)}
                className="text-xs text-[#eb5a46] hover:text-[#d64936] font-semibold flex items-center gap-1 transition"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 1 ? 'コピー完了！' : 'コマンドを一括コピー'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">
              GitHubで空のリポジトリ（New Repository）を作成後、ZIPを解凍したフォルダで下記を実行します：
            </p>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 font-mono text-xs overflow-x-auto relative">
              <pre className="whitespace-pre">{gitCommands}</pre>
            </div>
          </div>

          {/* Method 3: Local Run Commands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs">
                  3
                </span>
                <span>PCローカルでの動作確認コマンド</span>
              </div>
              <button
                onClick={() => copyToClipboard(runCommands, 2)}
                className="text-xs text-[#eb5a46] hover:text-[#d64936] font-semibold flex items-center gap-1 transition"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 2 ? 'コピー完了！' : 'コピー'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre">{runCommands}</pre>
            </div>
          </div>

          {/* Method 4: Hosting / Deploy to Web */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Globe className="w-4 h-4 text-[#eb5a46]" />
              <span>スマホやチームで使えるようWebサイトとして無料公開する方法</span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              GitHubにプッシュした後、下記のクラウドサービスにリポジトリを連携するだけで、自動で公開URL（https://〜）が発行され、iPhoneやPCからいつでも利用できるようになります：
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <strong className="text-slate-900">Render.com / Railway / Fly.io:</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Expressプロキシを含む完全版をそのまま無料〜格安で常時稼働可能（Build: <code className="bg-slate-100 px-1">npm run build</code> / Start: <code className="bg-slate-100 px-1">npm start</code>）
                </p>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <strong className="text-slate-900">Google Cloud Run:</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  AI Studio上部の「Deploy」ボタンから即座にCloud Run本番環境へ公開できます。
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>README.md もプロジェクト内に同梱済みです</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition active:scale-95"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
