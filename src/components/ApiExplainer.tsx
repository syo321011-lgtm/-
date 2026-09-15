import React from 'react';
import { Terminal, Shield, Code, CheckCircle2, AlertCircle } from 'lucide-react';

export const ApiExplainer: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2">ChatWork API 連携仕様 ＆ 技術アーキテクチャ</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          ChatWork API v2 を利用して、ブラウザのDOMやWebSocketセッションを経由せず純粋なREST APIリクエストのみでメッセージを配送します。
        </p>

        {/* Endpoints Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">機能</th>
                <th className="p-3">HTTPメソッド / エンドポイント</th>
                <th className="p-3">必須ヘッダー</th>
                <th className="p-3">リクエスト形式 / パラメータ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600 font-mono text-[11.5px]">
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-sans font-medium text-slate-900">ルーム一覧取得</td>
                <td className="p-3">
                  <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10.5px] mr-1.5 font-sans">
                    GET
                  </span>
                  /v2/rooms
                </td>
                <td className="p-3 text-slate-700">X-ChatWorkToken: &lt;TOKEN&gt;</td>
                <td className="p-3 font-sans text-slate-500">なし（全件取得）</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-sans font-medium text-slate-900">メッセージ送信</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10.5px] mr-1.5 font-sans">
                    POST
                  </span>
                  /v2/rooms/{'{room_id}'}/messages
                </td>
                <td className="p-3 text-slate-700">
                  <div>X-ChatWorkToken: &lt;TOKEN&gt;</div>
                  <div>Content-Type: application/x-www-form-urlencoded</div>
                </td>
                <td className="p-3">
                  <span className="text-rose-600 font-semibold">body</span> = URLエンコード文字列
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-sans font-medium text-slate-900">写真・ファイル添付送信（任意）</td>
                <td className="p-3">
                  <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded text-[10.5px] mr-1.5 font-sans">
                    POST
                  </span>
                  /v2/rooms/{'{room_id}'}/files
                </td>
                <td className="p-3 text-slate-700">
                  <div>X-ChatWorkToken: &lt;TOKEN&gt;</div>
                  <div className="text-[10.5px] text-slate-500 font-sans">multipart/form-data (自動境界設定)</div>
                </td>
                <td className="p-3">
                  <div><span className="text-indigo-600 font-semibold">file</span> = バイナリ (上限5MB)</div>
                  <div><span className="text-slate-500 font-semibold">message</span> = 任意テキスト</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippet & Error Handling Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code Snippet */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 shadow-sm font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-3 pb-2 border-b border-slate-800">
            <Code className="w-4 h-4 text-[#eb5a46]" />
            <span className="font-semibold text-slate-200">送信リクエストの実装（fetch API）</span>
          </div>
          <pre className="text-slate-300 overflow-x-auto leading-relaxed text-[11.5px]">
{`// 1. URLエンコードされたフォームデータの作成
const formParams = new URLSearchParams();
formParams.append('body', messageText);

// 2. ChatWork API 送信
const response = await fetch(
  \`https://api.chatwork.com/v2/rooms/\${roomId}/messages\`,
  {
    method: 'POST',
    headers: {
      'X-ChatWorkToken': apiToken,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formParams.toString()
  }
);

// 3. レスポンス判定
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.errors?.[0] || '送信失敗');
}
const result = await response.json(); // { message_id: "..." }`}
          </pre>
        </div>

        {/* Error Code Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 pb-2 border-b border-slate-100">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h4 className="font-bold text-sm">エラーハンドリング一覧</h4>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
              <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                401
              </span>
              <div>
                <strong className="text-slate-800 block">Unauthorized (認証エラー)</strong>
                <span className="text-slate-500 text-[11px]">
                  APIトークンが不正、無効化、または失効しています。設定画面でトークンを再確認・保存してください。
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
              <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                403
              </span>
              <div>
                <strong className="text-slate-800 block">Forbidden (権限エラー)</strong>
                <span className="text-slate-500 text-[11px]">
                  該当のチャットルームに対する投稿権限（メンバーシップ）がありません。
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                429
              </span>
              <div>
                <strong className="text-slate-800 block">Too Many Requests (レート制限)</strong>
                <span className="text-slate-500 text-[11px]">
                  ChatWork APIの利用制限（通常5分間に300リクエスト）に到達しました。数分間待ってから再送信してください。
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
