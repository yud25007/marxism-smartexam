
import React, { useState, useEffect } from 'react';
import { BookOpen, X, Maximize2, Minimize2, Save, FileEdit, Eye, Palette, Highlighter, Underline, List } from 'lucide-react';
import { Button } from './Button';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
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

  // Sync with external updates
  useEffect(() => {
    if (initialContent.length > content.length + 50) {
      setIsPreview(true); // Switch to preview when a big block is added
    }
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== initialContent) {
        handleSave();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [content]);

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('notebook-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

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

      {!isPreview && (
        <div className="bg-white px-2 py-1.5 border-b border-gray-100 flex items-center gap-1 flex-wrap shadow-sm">
           <button onClick={() => insertText('<span style="color: #ef4444">', '</span>')} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="红色文字"><Palette size={16} /></button>
           <button onClick={() => insertText('<span style="color: #3b82f6">', '</span>')} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="蓝色文字"><Palette size={16} /></button>
           <button onClick={() => insertText('<mark style="background: #fef08a; padding: 0 2px">', '</mark>')} className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded" title="黄色高亮"><Highlighter size={16} /></button>
           <button onClick={() => insertText('<u>', '</u>')} className="p-1.5 hover:bg-gray-100 text-gray-700 rounded" title="下划线"><Underline size={16} /></button>
           <div className="w-px h-4 bg-gray-200 mx-1"></div>
           <button onClick={() => insertText('### ')} className="p-1.5 hover:bg-gray-100 text-gray-700 rounded font-bold text-xs">H3</button>
           <button onClick={() => insertText('- ')} className="p-1.5 hover:bg-gray-100 text-gray-700 rounded"><List size={16} /></button>
           <button onClick={() => insertText('**', '**')} className="p-1.5 hover:bg-gray-100 text-gray-700 rounded font-bold text-xs">B</button>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {isPreview ? (
          <div className="flex-1 overflow-y-auto p-6 prose prose-sm prose-indigo max-w-none bg-gray-50/30">
            <style>{`
              .notebook-preview { white-space: pre-wrap; }
              .notebook-preview details { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem; background: white; overflow: hidden; }
              .notebook-preview summary { padding: 12px 16px; cursor: pointer; font-weight: bold; background: #f8fafc; border-bottom: 1px solid transparent; transition: all 0.2s; list-style: none; }
              .notebook-preview summary::-webkit-details-marker { display: none; }
              .notebook-preview details[open] summary { border-bottom-color: #e2e8f0; background: #eff6ff; color: #1e40af; }
              .notebook-preview blockquote { border-left: 4px solid #6366f1; background: #f8fafc; padding: 12px; margin: 12px 0; border-radius: 0 4px 4px 0; }
              .notebook-preview pre { background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 0.8rem; overflow-x: auto; }
              .notebook-preview table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #cbd5e1; }
              .notebook-preview th, .notebook-preview td { border: 1px solid #cbd5e1; padding: 8px 12px; }
              .notebook-preview th { background: #f1f5f9; }
            `}</style>
            <div className="notebook-preview">
              <ReactMarkdown 
                rehypePlugins={[rehypeRaw]} 
                remarkPlugins={[remarkGfm]}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            className="flex-1 w-full p-4 focus:outline-none resize-none font-sans text-sm leading-relaxed"
            placeholder="在这里记录你的思考... 支持 Markdown 和上方工具栏格式。"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            id="notebook-textarea"
          />
        )}
      </div>

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
