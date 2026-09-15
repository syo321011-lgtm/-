/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, FileCode, PlayCircle, BookOpen, Layers, 
  ShieldCheck, CheckCircle2, MessageSquare, ExternalLink,
  Smartphone, QrCode, Camera, X, Github
} from 'lucide-react';
import { Simulator } from './components/Simulator';
import { CodeViewer } from './components/CodeViewer';
import { InstallGuide } from './components/InstallGuide';
import { ApiExplainer } from './components/ApiExplainer';
import { MobileWebApp } from './components/MobileWebApp';
import { GitHubExportModal } from './components/GitHubExportModal';
import { downloadExtensionZip } from './extensionFiles';

type ActiveTab = 'mobile' | 'simulator' | 'code' | 'install' | 'spec';

export default function App() {
  // Check if mobile device or small screen
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      return isMobile ? 'mobile' : 'mobile'; // Default to mobile tab as requested by user, easily switchable
    }
    return 'mobile';
  });

  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [showDesktopQrModal, setShowDesktopQrModal] = useState<boolean>(false);
  const [showGitHubModal, setShowGitHubModal] = useState<boolean>(false);

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadExtensionZip();
    } catch (err) {
      console.error('ZIP download error:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-[#eb5a46]/20 selection:text-[#eb5a46]">
      {/* Global Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#eb5a46] to-[#d64936] text-white flex items-center justify-center shadow-md shadow-[#eb5a46]/25">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  ChatWork 未読キープ送信
                </h1>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#eb5a46] text-white uppercase tracking-wider">
                  スマホWeb ＆ Chrome拡張
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Web画面を開かずAPI経由で未読ステータスを維持したまま、iPhoneカメラ写真や定型文を一発送信
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* GitHub Export / Download Guide Button */}
            <button
              id="top-github-guide-btn"
              onClick={() => setShowGitHubModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition active:scale-95"
              title="GitHub公開・サイト版コードダウンロード手順"
            >
              <Github className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">GitHub公開手順</span>
              <span className="sm:hidden">GitHub</span>
            </button>

            {/* Open on Phone QR Button */}
            <button
              id="top-open-phone-qr-btn"
              onClick={() => setShowDesktopQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95"
              title="iPhoneで開くQRコードを表示"
            >
              <QrCode className="w-4 h-4 text-[#eb5a46]" />
              <span className="hidden sm:inline">スマホで開く</span>
            </button>

            {/* Extension ZIP Download */}
            <button
              id="top-download-zip-btn"
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#eb5a46] hover:bg-[#d64936] text-white font-bold rounded-xl text-xs shadow-sm shadow-[#eb5a46]/20 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isDownloadingZip ? '生成中...' : '拡張機能一括ダウンロード (.zip)'}
              </span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-t border-slate-200 bg-slate-50/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-1">
            
            {/* 📱 スマホWeb版 (iPhone/Safari) Tab */}
            <button
              id="nav-tab-mobile"
              onClick={() => setActiveTab('mobile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'mobile'
                  ? 'bg-white text-[#eb5a46] shadow-xs border border-slate-200/80 ring-1 ring-[#eb5a46]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#eb5a46]" />
              <span>スマホWeb版 (iPhone/Safari)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-[#eb5a46] font-extrabold">
                カメラ対応
              </span>
            </button>

            <button
              id="nav-tab-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-white text-[#eb5a46] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>実機シミュレーター</span>
            </button>

            <button
              id="nav-tab-code"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'code'
                  ? 'bg-white text-[#eb5a46] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>拡張機能コード (4ファイル)</span>
            </button>

            <button
              id="nav-tab-install"
              onClick={() => setActiveTab('install')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'install'
                  ? 'bg-white text-[#eb5a46] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Chrome導入ガイド</span>
            </button>

            <button
              id="nav-tab-spec"
              onClick={() => setActiveTab('spec')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'spec'
                  ? 'bg-white text-[#eb5a46] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>API仕様 ＆ 未読維持</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
        
        {/* Banner summary */}
        {activeTab !== 'mobile' && (
          <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-[#eb5a46] rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  相手の未読メッセージを開封（既読化）せずに、こちらの定型連絡を即座に送信
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ChatWork API（<code className="bg-slate-100 px-1 py-0.2 rounded text-slate-700">POST /rooms/{'{id}'}/messages</code>）を直接実行することで、Web画面の既読化イベントを一切発生させません。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>未読保護保証</span>
              </span>
              <button
                onClick={() => setActiveTab('mobile')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#eb5a46] border border-rose-200 hover:bg-rose-100 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>スマホ版を見る</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Contents */}
        {activeTab === 'mobile' && (
          <div className="py-2">
            <div className="hidden md:flex items-center justify-between max-w-md mx-auto mb-3 bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#eb5a46]" />
                <span>iPhoneのSafari等で開くと、カメラが直接起動します</span>
              </div>
              <button
                onClick={() => setShowDesktopQrModal(true)}
                className="text-[#eb5a46] font-bold hover:underline flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR表示</span>
              </button>
            </div>
            <MobileWebApp onBackToDesktop={() => setActiveTab('simulator')} />
          </div>
        )}
        {activeTab === 'simulator' && <Simulator />}
        {activeTab === 'code' && <CodeViewer />}
        {activeTab === 'install' && <InstallGuide />}
        {activeTab === 'spec' && <ApiExplainer />}
      </main>

      {/* Desktop QR Modal */}
      {showDesktopQrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 text-center">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#eb5a46] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">iPhone / スマホで開く</h3>
                  <p className="text-[10.5px] text-slate-500">Safariですぐに使えます</p>
                </div>
              </div>
              <button
                onClick={() => setShowDesktopQrModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-white p-2 border border-slate-300 rounded-xl shadow-xs flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    typeof window !== 'undefined' ? window.location.href : ''
                  )}`}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-slate-600 font-medium mt-3">
                iPhoneの標準カメラで上記QRを読み取ると、Safariで即座にアプリが起動します。
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                📷 写真の直接撮影・添付＆未読キープ送信が可能になります
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('URLをクリップボードにコピーしました！');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                URLをコピー
              </button>
              <button
                type="button"
                onClick={() => setShowDesktopQrModal(false)}
                className="flex-1 py-2.5 bg-[#eb5a46] text-white font-bold rounded-xl text-xs transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#eb5a46] flex items-center justify-center text-white text-[10px] font-bold">
              CW
            </div>
            <span>ChatWork 未読キープ送信 (スマホWeb版 ＆ Chrome拡張機能 MV3)</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://developer.chatwork.com/reference/post-rooms-room_id-messages"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800 transition flex items-center gap-1"
            >
              <span>ChatWork API v2 公式リファレンス</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://developer.chrome.com/docs/extensions/mv3/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800 transition flex items-center gap-1"
            >
              <span>Chrome Manifest V3 公式ドキュメント</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* GitHub Export & Instructions Modal */}
      <GitHubExportModal 
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
      />
    </div>
  );
}
