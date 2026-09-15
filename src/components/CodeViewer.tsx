import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';
import { EXTENSION_FILES, downloadSingleFile, downloadExtensionZip } from '../extensionFiles';

export const CodeViewer: React.FC = () => {
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const activeFile = EXTENSION_FILES[activeFileIndex];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownloadActiveFile = () => {
    let mime = 'text/plain';
    if (activeFile.name.endsWith('.json')) mime = 'application/json';
    if (activeFile.name.endsWith('.html')) mime = 'text/html';
    if (activeFile.name.endsWith('.css')) mime = 'text/css';
    if (activeFile.name.endsWith('.js')) mime = 'application/javascript';
    downloadSingleFile(activeFile.name, activeFile.content, mime);
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      await downloadExtensionZip();
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const lineCount = activeFile.content.split('\n').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Top Header & File Tabs */}
      <div className="bg-slate-900 text-slate-200 p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#eb5a46] text-white">
              Manifest V3 完全準拠
            </span>
            <span className="text-xs text-slate-400">4ファイル構成 (省略なし全文出力)</span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">Chrome拡張機能 ソースコードハブ</h3>
        </div>

        {/* Global Action: Download Extension ZIP */}
        <button
          id="btn-download-extension-zip"
          onClick={handleDownloadAllZip}
          disabled={isZipping}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#eb5a46] to-[#d64936] hover:from-[#d64936] hover:to-[#b83321] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-xs"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'パッケージ生成中...' : '拡張機能一括ダウンロード (.zip)'}</span>
        </button>
      </div>

      {/* File Navigation Tabs */}
      <div className="bg-slate-950 px-4 pt-3 flex flex-wrap gap-2 border-b border-slate-800">
        {EXTENSION_FILES.map((file, idx) => (
          <button
            key={file.name}
            id={`tab-${file.name.replace('.', '-')}`}
            onClick={() => {
              setActiveFileIndex(idx);
              setCopied(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-mono text-xs font-semibold transition border-t border-x ${
              activeFileIndex === idx
                ? 'bg-slate-900 text-white border-slate-700 border-b-transparent shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent'
            }`}
          >
            <FileCode
              className={`w-3.5 h-3.5 ${
                file.name === 'manifest.json'
                  ? 'text-amber-400'
                  : file.name === 'popup.html'
                  ? 'text-orange-400'
                  : file.name === 'popup.css'
                  ? 'text-sky-400'
                  : 'text-yellow-400'
              }`}
            />
            <span>{file.name}</span>
          </button>
        ))}
      </div>

      {/* File Info Bar */}
      <div className="bg-slate-900/60 px-4 py-2.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-400 font-semibold">{activeFile.path}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{lineCount} 行</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{activeFile.description}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            id="btn-copy-code"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'コピー完了！' : 'コードをコピー'}</span>
          </button>

          {/* Download File Button */}
          <button
            id="btn-download-active-file"
            onClick={handleDownloadActiveFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>保存</span>
          </button>
        </div>
      </div>

      {/* Code Editor / Viewer Area */}
      <div className="bg-[#0f172a] text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-[560px] leading-relaxed">
        <pre className="table w-full">
          {activeFile.content.split('\n').map((line, idx) => (
            <div key={idx} className="table-row hover:bg-slate-800/40">
              <span className="table-cell select-none pr-4 text-right text-slate-600 text-[11px] w-10 font-mono">
                {idx + 1}
              </span>
              <span className="table-cell whitespace-pre font-mono text-slate-200">
                {line || ' '}
              </span>
            </div>
          ))}
        </pre>
      </div>

      {/* Technical Requirements Checklist Footer */}
      <div className="bg-slate-50 p-4 border-t border-slate-200">
        <h4 className="text-xs font-bold text-slate-900 mb-2">要件達成チェックリスト:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Manifest V3 / storage権限</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>GET /rooms インクリメンタル検索</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>定型文CRUD ＆ 本文自動反映</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>POST x-www-form-urlencoded 送信</span>
          </div>
        </div>
      </div>
    </div>
  );
};
