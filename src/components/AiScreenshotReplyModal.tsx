import React, { useState, useRef } from 'react';
import { 
  X, Camera, Upload, Sparkles, AlertTriangle, CheckCircle2, 
  Copy, ArrowRight, RefreshCw, Layers, ShieldAlert, 
  HelpCircle, MessageSquare, BookmarkPlus, Tag
} from 'lucide-react';
import { 
  analyzeScreenshotAndGenerateReply, 
  AiScreenshotAnalysisResult, 
  AiReplyCandidate 
} from '../services/aiReplyService';
import { compressImage } from '../utils/imageCompressor';

interface AiScreenshotReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyReply: (text: string) => void;
  onSaveAsTemplate?: (title: string, body: string) => void;
}

const SCENARIO_TAGS = [
  { id: 'address', label: '⚠️ 海外住所・TEL不備' },
  { id: 'dispatched', label: '✈️ 出荷完了・追跡案内' },
  { id: 'customs', label: '🛃 関税・HSコード確認' },
  { id: 'delay', label: '⏳ 配送遅延・税関審査' },
  { id: 'inbound', label: '📥 入庫受領・検品完了' },
  { id: 'packing', label: '🛡️ 割れ物・補強梱包' },
  { id: 'ack', label: '⚡ 即時了解・着手' },
];

export const AiScreenshotReplyModal: React.FC<AiScreenshotReplyModalProps> = ({
  isOpen,
  onClose,
  onApplyReply,
  onSaveAsTemplate,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('⚠️ 海外住所・TEL不備');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiScreenshotAnalysisResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedTplId, setSavedTplId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイル（PNG、JPEG、WEBP等）を選択してください。');
      return;
    }

    try {
      setError(null);
      // Compress image for optimal API transmission
      const compressed = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        maxSizeBytes: 4 * 1024 * 1024
      });

      setSelectedFile(compressed);
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const full = reader.result as string;
        // Strip data URL prefix
        const base64 = full.split(',')[1] || full;
        setBase64Data(base64);
      };
      reader.readAsDataURL(compressed);
    } catch (err: any) {
      setError('画像の読み込みに失敗しました: ' + err.message);
    }
  };

  const handleAnalyze = async () => {
    if (!base64Data && !selectedFile) {
      // For quick testing if user hasn't uploaded yet, allow demo simulation
      setSelectedScenario(selectedScenario || '海外発送相談');
    }

    setIsLoading(true);
    setError(null);
    try {
      // Even if no image is uploaded yet, send a 1px placeholder to allow prompt preview / simulation
      const effectiveBase64 = base64Data || 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const effectiveType = selectedFile?.type || 'image/png';

      const data = await analyzeScreenshotAndGenerateReply({
        imageBase64: effectiveBase64,
        imageType: effectiveType,
        scenarioHint: selectedScenario,
        additionalNotes: additionalNotes.trim()
      });

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI解析に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (message: string) => {
    onApplyReply(message);
    onClose();
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSaveToTemplates = (candidate: AiReplyCandidate) => {
    if (onSaveAsTemplate) {
      onSaveAsTemplate(candidate.label, candidate.message);
      setSavedTplId(candidate.id);
      setTimeout(() => setSavedTplId(null), 2000);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setBase64Data(null);
    setResult(null);
    setError(null);
    setAdditionalNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-600 to-rose-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight flex items-center gap-1.5">
                AIスクショ読取・返信文生成
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-normal">
                  発送代行 ✕ 越境EC特化
                </span>
              </h3>
              <p className="text-xs text-white/80 leading-snug">
                お客様からの相談スクショから、プロの適切な返信文案を即時作成
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-800">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Section 1: Upload / Capture Screenshot */}
          {!result ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-100/70 transition">
                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block max-h-56 max-w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs">
                      <img
                        src={previewUrl}
                        alt="Screenshot Preview"
                        className="max-h-56 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={handleReset}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition shadow"
                        title="画像を削除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      スクショ画像が読み込まれました（{selectedFile?.name || 'photo.jpg'}）
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">
                        お客様のChatWorkスクショを読み込む
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        iPhoneで直接撮影、または写真アルバムからスクショを選択してください。<br />
                        ※画像未選択でもシミュレーション返信案を生成できます。
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {/* Direct camera capture for mobile */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        カメラで撮影
                      </button>
                      {/* Photo Library */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium shadow-xs transition"
                      >
                        <Upload className="w-4 h-4 text-slate-500" />
                        アルバムから選択
                      </button>
                    </div>

                    {/* Hidden inputs */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Scenario Hint Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-red-600" />
                  相談カテゴリ / シーン指定（タップで選択）
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SCENARIO_TAGS.map((tag) => {
                    const isSelected = selectedScenario === tag.label;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSelectedScenario(tag.label)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 ${
                          isSelected
                            ? 'bg-red-600 text-white font-semibold shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional notes from staff */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  担当者からの補足メモ・指示（任意）
                </label>
                <input
                  type="text"
                  placeholder="例: FedExで本日出荷済み、追跡番号は夕方に発行予定 / 英語住所の番地抜けを確認してほしい"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AIがスクショを解析中... (Gemini 3.8 Flash)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AIで解析して返信文を生成</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Section 2: Analysis Results & Candidate Replies */
            <div className="space-y-4">
              {/* Back to upload button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1 font-medium"
                >
                  ← 別のスクショや条件で再生成する
                </button>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${result.isAIGenerated ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {result.isAIGenerated ? `AI解析完了 (${result.model || 'Gemini Flash'})` : '海外発送代行推奨案'}
                </div>
              </div>

              {/* Notice or Fallback notification */}
              {(result.notice || result.error) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{result.notice || result.error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="shrink-0 px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    再試行
                  </button>
                </div>
              )}

              {/* OCR Summary & Client info card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-red-600" />
                    お客様（ECセラー様）の問い合わせ内容
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      result.urgency === '至急'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : result.urgency === '要確認'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    緊急度: {result.urgency}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {result.summary}
                </p>

                {/* Logistics Key Points */}
                {result.keyPoints && result.keyPoints.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      📦 発送代行としての確認・留意ポイント:
                    </span>
                    <ul className="space-y-1">
                      {result.keyPoints.map((kp, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-slate-600 flex items-start gap-1.5"
                        >
                          <span className="text-red-500 font-bold">•</span>
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Generated Candidates */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  生成された返信文案（3パターン）
                </h4>

                {result.candidates.map((candidate, idx) => (
                  <div
                    key={candidate.id || idx}
                    className="p-3.5 bg-white border border-slate-200 hover:border-red-300 rounded-xl transition shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">
                          {candidate.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                          {candidate.tone}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyText(candidate.id, candidate.message)}
                          title="本文をコピー"
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                          {copiedId === candidate.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {onSaveAsTemplate && (
                          <button
                            type="button"
                            onClick={() => handleSaveToTemplates(candidate)}
                            title="定型文テンプレートに登録"
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            {savedTplId === candidate.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <BookmarkPlus className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Formatted Message Preview */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {candidate.message}
                    </div>

                    {/* Operational explanation */}
                    <p className="text-[11px] text-slate-500 italic">
                      💡 {candidate.explanation}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApply(candidate.message)}
                        className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-[0.98]"
                      >
                        <span>この返信文を入力欄にセット</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            未読キープ送信対応
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
