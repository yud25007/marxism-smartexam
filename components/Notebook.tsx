
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, X, Maximize2, Minimize2, Save, FileEdit, Eye, Palette, Highlighter, Underline, List, Bold, Italic, Type, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { historyService } from '../services/historyService';

interface NotebookProps {
  recordId: string | undefined;
  initialContent: string;
  onClose: () => void;
}

export const Notebook: React.FC<NotebookProps> = ({ recordId, initialContent, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const handleSave = async () => {
    if (!recordId || !editorRef.current) return;
    setIsSaving(true);
    const content = editorRef.current.innerHTML;
    const success = await historyService.updateNotes(recordId, content);
    if (success) setLastSaved(new Date());
    setIsSaving(false);
  };

  // Auto save
  useEffect(() => {
    const timer = setInterval(() => {
      handleSave();
    }, 10000); // Auto save every 10s
    return () => clearInterval(timer);
  }, []);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const applyColor = (color: string) => execCommand('foreColor', color);
  const applyBg = (color: string) => execCommand('hiliteColor', color);

  return (
    <div className={`fixed transition-all duration-300 z-[100] shadow-2xl flex flex-col bg-white border border-gray-200 overflow-hidden
      ${isExpanded 
        ? 'inset-4 md:inset-10 rounded-2xl' 
        : 'bottom-4 right-4 w-[90vw] md:w-[450px] h-[600px] rounded-xl'}`}
    >
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <BookOpen size={20} />
          <h3 className="font-bold">全卷学习笔记 (富文本)</h3>
          {isSaving ? (
            <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded animate-pulse">保存中...</span>
          ) : lastSaved && (
            <span className="text-[10px] opacity-70">已保存 {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/20 rounded hidden md:block">
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="bg-gray-50 px-2 py-2 border-b border-gray-200 flex items-center gap-1 flex-wrap sticky top-0 z-10">
         <button onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="加粗"><Bold size={16} /></button>
         <button onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="斜体"><Italic size={16} /></button>
         <button onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="下划线"><Underline size={16} /></button>
         <div className="w-px h-4 bg-gray-300 mx-1"></div>
         <button onClick={() => applyColor('#ef4444')} className="p-2 hover:bg-red-50 text-red-600 rounded" title="红色"><Palette size={16} /></button>
         <button onClick={() => applyColor('#3b82f6')} className="p-2 hover:bg-blue-50 text-blue-600 rounded" title="蓝色"><Palette size={16} /></button>
         <button onClick={() => applyBg('#fef08a')} className="p-2 hover:bg-yellow-100 text-yellow-600 rounded" title="高亮"><Highlighter size={16} /></button>
         <div className="w-px h-4 bg-gray-300 mx-1"></div>
         <button onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="列表"><List size={16} /></button>
         <button onClick={() => execCommand('formatBlock', 'H3')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold text-xs" title="标题">H3</button>
         <button onClick={() => execCommand('removeFormat')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="清除格式"><Type size={16} /></button>
      </div>

      <div 
        ref={editorRef}
        contentEditable
        className="flex-1 overflow-y-auto p-6 focus:outline-none bg-white prose prose-indigo max-w-none text-gray-800 leading-relaxed"
        style={{ minHeight: '100px' }}
        onBlur={handleSave}
      />

      <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-end items-center">
         <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white h-8 text-xs">
           <Save size={14} className="mr-1" /> 立即保存
         </Button>
      </div>
    </div>
  );
};

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
