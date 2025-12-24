
import React, { useState, useEffect } from 'react';
import { BookOpen, X, Maximize2, Minimize2, Save, FileEdit, Eye, Sparkles } from 'lucide-react';
import { Button } from './Button';
import ReactMarkdown from 'react-markdown';
import { historyService } from '../services/historyService';

interface NotebookProps {
  recordId: string | undefined;
  initialContent: string;
  onClose: () => void;
}

export const Notebook: React.FC<NotebookProps> = ({ recordId, initialContent, onClose }) => {
  const [content, setContent] = useState(initialContent);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync with external updates (like handleAddToNotes)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    // Auto-save logic (debounced)
    const timer = setTimeout(() => {
      if (content !== initialContent) {
        handleSave();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [content]);

  const handleSave = async () => {
    if (!recordId) return;
    setIsSaving(true);
    const success = await historyService.updateNotes(recordId, content);
    if (success) setLastSaved(new Date());
    setIsSaving(false);
  };

  return (
    <div className={`fixed transition-all duration-300 z-[100] shadow-2xl flex flex-col bg-white border border-gray-200 overflow-hidden
      ${isExpanded 
        ? 'inset-4 md:inset-10 rounded-2xl' 
        : 'bottom-4 right-4 w-[90vw] md:w-[400px] h-[500px] rounded-xl'}`}
    >
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <BookOpen size={20} />
          <h3 className="font-bold">答题笔记</h3>
          {isSaving ? (
            <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded animate-pulse">保存中...</span>
          ) : lastSaved && (
            <span className="text-[10px] opacity-70">已保存 {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsPreview(!isPreview)} className="p-1.5 hover:bg-white/20 rounded" title={isPreview ? "编辑" : "预览"}>
            {isPreview ? <FileEdit size={18} /> : <Eye size={18} />}
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/20 rounded hidden md:block">
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Toolbar / Tips */}
      {!isPreview && (
        <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between">
           <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Markdown Editor</span>
           <span className="text-[10px] text-indigo-400">点击解析下方的“记入笔记”自动抓取</span>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {isPreview ? (
          <div className="flex-1 overflow-y-auto p-6 prose prose-sm prose-indigo max-w-none bg-gray-50/30">
            <style>{`
              .notebook-preview h1 { border-bottom: 2px solid #e0e7ff; padding-bottom: 0.5rem; margin-top: 1.5rem; }
              .notebook-preview blockquote { border-left: 4px solid #6366f1; background: #f8fafc; padding: 1rem; border-radius: 0 8px 8px 0; }
              .notebook-preview strong { color: #1e1b4b; font-weight: 800; }
              .notebook-preview ul { list-style-type: disc; margin-left: 1.2rem; }
            `}</style>
            <div className="notebook-preview">
              <ReactMarkdown>{content || "*笔记内容为空，开始记录吧...*"}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            className="flex-1 w-full p-4 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            placeholder="在这里记录你的思考，或者点击题目下的按钮自动添加..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            id="notebook-textarea"
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center">
         <div className="flex gap-2">
            <span className="text-[10px] text-gray-400">字符: {content.length}</span>
         </div>
         <Button size="sm" onClick={handleSave} disabled={isSaving || content === initialContent} className="bg-indigo-600 text-white h-8 text-xs">
           <Save size={14} className="mr-1" /> 立即保存
         </Button>
      </div>
    </div>
  );
};
