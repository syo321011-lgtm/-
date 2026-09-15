import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Edit3, Check, Search, 
  FileText, Sparkles, Copy, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { MessageTemplate } from '../types';
import { saveTemplatesToStorage } from '../data/shippingTemplates';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MessageTemplate[];
  onUpdateTemplates: (newTemplates: MessageTemplate[]) => void;
  onSelectTemplate: (template: MessageTemplate) => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  templates,
  onUpdateTemplates,
  onSelectTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingId(null);
    setFormTitle('');
    setFormBody('');
  };

  const handleStartEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setIsCreatingNew(false);
    setFormTitle(template.title);
    setFormBody(template.body);
  };

  const handleCancelForm = () => {
    setIsCreatingNew(false);
    setEditingId(null);
    setFormTitle('');
    setFormBody('');
  };

  const handleSaveForm = () => {
    if (!formTitle.trim() || !formBody.trim()) {
      alert('タイトルと本文を入力してください');
      return;
    }

    let updated: MessageTemplate[];
    if (isCreatingNew) {
      const newTpl: MessageTemplate = {
        id: `tpl-${Date.now()}`,
        title: formTitle.trim(),
        body: formBody.trim(),
      };
      updated = [newTpl, ...templates];
    } else if (editingId) {
      updated = templates.map((t) =>
        t.id === editingId
          ? { ...t, title: formTitle.trim(), body: formBody.trim() }
          : t
      );
    } else {
      return;
    }

    onUpdateTemplates(updated);
    saveTemplatesToStorage(updated);
    handleCancelForm();
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`テンプレート「${title}」を削除しますか？`)) {
      const updated = templates.filter((t) => t.id !== id);
      onUpdateTemplates(updated);
      saveTemplatesToStorage(updated);
      if (editingId === id) {
        handleCancelForm();
      }
    }
  };

  const handleCopy = (id: string, body: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(body);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 1500);
  };

  const handleApply = (template: MessageTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                定型文テンプレート登録・管理
              </h3>
              <p className="text-xs text-slate-500">
                海外発送代行・EC顧客対応用の定型メッセージを編集・登録
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Action buttons & Search */}
          {!isCreatingNew && !editingId && (
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="テンプレートを検索（出荷完了、住所不備、税関...）"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  新規登録
                </button>
              </div>
            </div>
          )}

          {/* Form (Create / Edit) */}
          {(isCreatingNew || editingId) && (
            <div className="bg-slate-50 border border-red-200 rounded-xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  {isCreatingNew ? '新しいテンプレートを登録' : 'テンプレートを編集'}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  キャンセル
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  テンプレート名 / ラベル（絵文字推奨）
                </label>
                <input
                  type="text"
                  placeholder="例: ✈️ 【出荷完了】FedEx追跡番号・インボイス送付"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  メッセージ本文（ChatWork記法 [info][title] 使用可）
                </label>
                <textarea
                  rows={6}
                  placeholder={`[info][title]件名[/title]いつもお世話になっております。...\n\n【追跡番号】: [追跡番号: XXXXXXXX][/info]`}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSaveForm}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  {isCreatingNew ? '保存して登録' : '変更を保存'}
                </button>
              </div>
            </div>
          )}

          {/* Template List */}
          <div className="space-y-2.5">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  該当するテンプレートが見つかりません。
                </p>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="mt-2 text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  新しい定型文を登録する
                </button>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3.5 bg-white border border-slate-200 hover:border-red-300 rounded-xl transition shadow-xs group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h5 className="font-semibold text-slate-800 text-sm leading-snug">
                      {template.title}
                    </h5>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopy(template.id, template.body, e)}
                        title="本文をコピー"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      >
                        {copySuccessId === template.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(template)}
                        title="編集"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(template.id, template.title)}
                        title="削除"
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body Preview */}
                  <div className="bg-slate-50 rounded-lg p-2 text-xs font-mono text-slate-600 line-clamp-3 leading-relaxed border border-slate-100 mb-2">
                    {template.body}
                  </div>

                  {/* 1-Click Apply Button */}
                  <button
                    type="button"
                    onClick={() => handleApply(template)}
                    className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
                  >
                    <span>この定型文を入力欄にセット</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>登録件数: {templates.length}件</span>
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
