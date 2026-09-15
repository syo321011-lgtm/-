import React from 'react';
import { Download, Chrome, ToggleRight, FolderOpen, Pin, ExternalLink, KeyRound, AlertTriangle } from 'lucide-react';
import { downloadExtensionZip } from '../extensionFiles';

export const InstallGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* 5-Step Visual Installation Guide */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <Chrome className="w-3.5 h-3.5" />
              <span>所要時間：約1分</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Chrome 拡張機能のインストール手順</h3>
            <p className="text-xs text-slate-500 mt-1">
              Google Chromeの「パッケージ化されていない拡張機能」機能を使用して簡単にインストールできます。
            </p>
          </div>

          <button
            onClick={() => downloadExtensionZip()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#eb5a46] hover:bg-[#d64936] text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>ZIPをダウンロード</span>
          </button>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1.5">ZIPファイルを解凍</h4>
              <p className="text-[11.5px] text-slate-600 leading-normal">
                ダウンロードした <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-[10.5px]">chatwork-unread-sender-extension.zip</code> をお好きなフォルダに解凍（展開）します。
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>manifest.json があるフォルダ</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1.5">拡張機能管理を開く</h4>
              <p className="text-[11.5px] text-slate-600 leading-normal">
                ChromeのURLバーに <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-[10.5px]">chrome://extensions</code> と入力してEnterを押します。
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1">
              <Chrome className="w-3.5 h-3.5 text-slate-400" />
              <span>または右上の︙メニュー ➔ 拡張機能</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1.5">デベロッパーモードON</h4>
              <p className="text-[11.5px] text-slate-600 leading-normal">
                拡張機能画面の右上のスイッチ <strong>「デベロッパーモード」</strong> をオンにします。
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1">
              <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>トグルを右にスライド</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-[#eb5a46] text-white font-bold text-xs flex items-center justify-center mb-3">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1.5">フォルダを読み込む</h4>
              <p className="text-[11.5px] text-slate-600 leading-normal">
                左上に現れる <strong>「パッケージ化されていない拡張機能を読み込む」</strong> を押し、Step 1で解凍したフォルダを選択します。
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-[#eb5a46]" />
              <span>1クリックで即座に追加完了</span>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                5
              </div>
              <h4 className="font-bold text-slate-900 text-xs mb-1.5">ピン留めして起動</h4>
              <p className="text-[11.5px] text-slate-600 leading-normal">
                Chromeツールバーのパズルピースアイコンから「ChatWork 未読キープ送信」をピン留め（📌）します。
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1">
              <Pin className="w-3.5 h-3.5 text-slate-400" />
              <span>いつでもワンクリックで送信</span>
            </div>
          </div>
        </div>
      </div>

      {/* ChatWork API Token Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-[#eb5a46]" />
            <h4 className="font-bold text-slate-900 text-sm">ChatWork APIトークンの取得方法</h4>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
            <li>
              ブラウザで <a href="https://www.chatwork.com/" target="_blank" rel="noopener noreferrer" className="text-[#eb5a46] hover:underline font-medium">ChatWork</a> にログインします。
            </li>
            <li>
              画面右上の <strong>ご自身の名前（アイコン）</strong> をクリックし、メニューから <strong>「サービス連携」</strong> を選択します。
            </li>
            <li>
              左側メニューの <strong>「APIトークン」</strong> を選択します。
            </li>
            <li>
              ChatWorkログインパスワードを入力して「表示」をクリックします。
            </li>
            <li>
              表示された文字列をコピーし、拡張機能の設定画面に貼り付けて「トークンを保存」を押してください。
            </li>
          </ol>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">※組織管理者によるAPI利用許可が必要な場合があります</span>
            <a
              href="https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#eb5a46] hover:underline"
            >
              <span>トークン取得画面を開く</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-slate-900 text-sm">セキュリティと安心設計</h4>
          </div>
          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-800 block mb-1">🔐 外部サーバーへの送信は一切なし</strong>
              <p className="text-[11.5px] text-slate-500">
                APIトークンやお書きになったメッセージは、あなたのブラウザ内（<code>chrome.storage</code>）のみに保存され、通信先は <code>https://api.chatwork.com</code> のみです。第三者サーバーやクラウドには一切送信されません。
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-800 block mb-1">🛡️ Manifest V3 の厳格なセキュリティ仕様</strong>
              <p className="text-[11.5px] text-slate-500">
                リモートコードの実行を禁止するManifest V3仕様に100%準拠しており、安全かつ高速にバックグラウンド動作します。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
