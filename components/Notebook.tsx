
import React, { useState, useEffect } from 'react';
import { BookOpen, X, Maximize2, Minimize2, Save, FileEdit, Eye, Palette, Highlighter, Underline, List, Bold, Italic, Type, Trash2, Columns, Download, FileText, Globe, Printer } from 'lucide-react';
import { Button } from './Button';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { historyService } from '../services/historyService';

interface NotebookProps {
  recordId: string | undefined;
  initialContent: string;
  onClose: () => void;
  onSaveSuccess?: (content: string) => void;
}

export const Notebook: React.FC<NotebookProps> = ({ recordId, initialContent, onClose, onSaveSuccess }) => {
  const [content, setContent] = useState(initialContent);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasExternalUpdate, setHasExternalUpdate] = useState(false);

  // Sync with external updates
  useEffect(() => {
    if (initialContent !== content) {
      setContent(initialContent);
      setHasExternalUpdate(true); // Mark as dirty when new content arrives from ResultView
    }
  }, [initialContent]);

  const handleSave = async () => {
    if (!recordId) return;
    setIsSaving(true);
    const success = await historyService.updateNotes(recordId, content);
    if (success) {
      setLastSaved(new Date());
      setHasExternalUpdate(false); // Reset dirty flag after successful manual save
      if (onSaveSuccess) onSaveSuccess(content);
    }
    setIsSaving(false);
  };

  // Auto save
  useEffect(() => {
    const timer = setInterval(() => {
      if (content !== initialContent) handleSave();
    }, 15000);
    return () => clearInterval(timer);
  }, [content, initialContent]);

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

  const handleDownloadMd = (isPure: boolean = false) => {
    let finalContent = content;
    
    if (isPure) {
      // 剥离 HTML 标签，转化为标准 MD
      finalContent = content
        .replace(/<details[^>]*>/g, '\n\n---\n')
        .replace(/<summary[^>]*>(.*?)<\/summary>/g, '### $1\n')
        .replace(/<div[^>]*>/g, '\n')
        .replace(/<\/div>/g, '\n')
        .replace(/<\/details>/g, '\n---\n')
        .replace(/<hr[^>]*\/>/g, '\n---\n')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, '> $1\n')
        .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
        .replace(/<br\s*\/?>/g, '\n');
    }

    const blob = new Blob([finalContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `马原学习笔记_${isPure ? '纯净版_' : ''}${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const dateStr = new Date().toLocaleDateString();
    // 构建完整样式的 HTML 模板
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>马原学习笔记 - ${dateStr}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #f8fafc; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
        .header h1 { color: #1e1b4b; margin: 0; }
        .header p { color: #64748b; font-size: 0.9rem; }
        details { border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 1.5rem; background: white; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.3s; }
        details[open] { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #6366f1; }
        summary { padding: 16px 20px; cursor: pointer; font-weight: bold; background: #f8fafc; border-bottom: 1px solid transparent; list-style: none; display: flex; align-items: center; }
        summary::-webkit-details-marker { display: none; }
        summary::before { content: "▶"; margin-right: 10px; font-size: 0.8rem; color: #6366f1; transition: transform 0.2s; }
        details[open] summary::before { transform: rotate(90deg); }
        details[open] summary { border-bottom-color: #e2e8f0; background: #f5f3ff; color: #4338ca; }
        .content { padding: 20px; }
        blockquote { border-left: 4px solid #6366f1; background: #f8fafc; padding: 12px 20px; margin: 16px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #475569; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 0.9em; color: #e11d48; }
        h4 { color: #1e40af; margin-top: 24px; margin-bottom: 12px; border-left: 3px solid #3b82f6; padding-left: 10px; }
        hr { border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
        .footer { text-align: center; color: #94a3b8; font-size: 0.8rem; margin-top: 60px; }
        @media print { body { background: white; padding: 0; } details { border: 1px solid #ddd; break-inside: avoid; } details[open] { box-shadow: none; } summary { background: #eee !important; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>马原学习笔记</h1>
        <p>导出日期：${new Date().toLocaleString()}</p>
    </div>
    <div class="notebook-body">
        ${content.replace(/\n/g, '<br/>')}
    </div>
    <div class="footer">由 Marxism Smart Exam 系统自动生成</div>
    <script>
        // 简单的 Markdown 转换逻辑或保持 HTML 原始展示
        document.querySelectorAll('.notebook-body').forEach(el => {
            // 这里可以接入一个轻量级转换器，或者依靠我们之前已经生成好的 HTML 块
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `精装笔记_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`fixed transition-all duration-300 z-[100] shadow-2xl flex flex-col bg-white border border-gray-200 overflow-hidden
      ${isExpanded 
        ? 'inset-4 md:inset-10 rounded-2xl' 
        : 'bottom-4 right-4 w-[90vw] md:w-[450px] h-[600px] rounded-xl'}`}
    >
      {/* 打印样式注入 */}
      <style>{`
        @media print {
          body > *:not(.print-container) { display: none !important; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white no-print">
        <div className="flex items-center gap-2">
          <BookOpen size={20} />
          <h3 className="font-bold">答题笔记 (Markdown)</h3>
          {isSaving ? (
            <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded animate-pulse">保存中...</span>
          ) : lastSaved && (
            <span className="text-[10px] opacity-70">已保存 {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsPreview(!isPreview)} className="p-1.5 hover:bg-white/20 rounded" title={isPreview ? "返回编辑" : "预览效果"}>
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

      <div className="bg-gray-50 px-2 py-1.5 border-b border-gray-200 flex items-center gap-1 flex-wrap sticky top-0 z-10 no-print">
         <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="加粗"><Bold size={16} /></button>
         <button onClick={() => insertText('_', '_')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="斜体"><Italic size={16} /></button>
         <button onClick={() => insertText('<u>', '</u>')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="下划线"><Underline size={16} /></button>
         <div className="w-px h-4 bg-gray-300 mx-1"></div>
         <button onClick={() => insertText('<span style="color: #ef4444">', '</span>')} className="p-2 hover:bg-red-50 text-red-600 rounded" title="红色"><Palette size={16} /></button>
         <button onClick={() => insertText('<span style="color: #3b82f6">', '</span>')} className="p-2 hover:bg-blue-50 text-blue-600 rounded" title="蓝色"><Palette size={16} /></button>
         <button onClick={() => insertText('<mark style="background: #fef08a; padding: 0 2px">', '</mark>')} className="p-2 hover:bg-yellow-100 text-yellow-600 rounded" title="高亮"><Highlighter size={16} /></button>
         <div className="w-px h-4 bg-gray-300 mx-1"></div>
         <button onClick={() => insertText('- ')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="列表"><List size={16} /></button>
         <button onClick={() => insertText('### ')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold text-xs" title="标题">H3</button>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row print-container">
        {/* Editor Area */}
        <textarea
          id="notebook-textarea"
          className={`flex-1 w-full p-4 focus:outline-none resize-none font-sans text-sm leading-relaxed border-r border-gray-100 no-print ${isPreview && !isExpanded ? 'hidden' : 'block'}`}
          placeholder="支持 Markdown 及上方工具栏... 公式请用 $...$ 包含"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Preview Area (Visible when isPreview is true OR in expanded side-by-side mode) */}
        {(isPreview || isExpanded) && (
          <div className={`flex-1 overflow-y-auto p-6 prose prose-sm prose-indigo max-w-none bg-gray-50/30 ${!isPreview && isExpanded ? 'hidden md:block' : 'block'}`}>
            <style>{`
              .notebook-preview { white-space: pre-wrap; }
              .notebook-preview details { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem; background: white; overflow: hidden; }
              .notebook-preview summary { padding: 12px 16px; cursor: pointer; font-weight: bold; background: #f8fafc; border-bottom: 1px solid transparent; transition: all 0.2s; list-style: none; }
              .notebook-preview details[open] summary { border-bottom-color: #e2e8f0; background: #eff6ff; color: #1e40af; }
              .notebook-preview blockquote { border-left: 4px solid #6366f1; background: #f8fafc; padding: 12px; margin: 12px 0; border-radius: 0 4px 4px 0; }
              .notebook-preview table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #cbd5e1; }
              .notebook-preview th, .notebook-preview td { border: 1px solid #cbd5e1; padding: 8px 12px; }
              .notebook-preview th { background: #f1f5f9; }
              .katex-display { overflow-x: auto; overflow-y: hidden; padding: 8px 0; }
            `}</style>
            <div className="notebook-preview">
              <ReactMarkdown 
                rehypePlugins={[rehypeRaw, rehypeKatex]} 
                remarkPlugins={[remarkGfm, remarkMath]}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-3 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center no-print">
         <div className="flex gap-1.5">
           <button 
             onClick={() => handleDownloadMd(true)}
             className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-indigo-600 border rounded bg-white transition-colors"
             title="导出为不含 HTML 标签的标准 Markdown"
           >
             <FileText size={12} /> 纯净 MD
           </button>
           <button 
             onClick={handleDownloadHtml}
             className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-indigo-600 border rounded bg-white transition-colors"
             title="导出为独立 HTML 网页，完美保留所有样式"
           >
             <Globe size={12} /> 精装 HTML
           </button>
           <button 
             onClick={handlePrint}
             className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-indigo-600 border rounded bg-white transition-colors"
             title="调用浏览器打印功能，可另存为 PDF"
           >
             <Printer size={12} /> PDF/打印
           </button>
         </div>
         <Button size="sm" onClick={handleSave} disabled={isSaving || (content === initialContent && !hasExternalUpdate)} className="bg-indigo-600 text-white h-8 text-xs">
           <Save size={14} className="mr-1" /> 立即保存
         </Button>
      </div>
    </div>
  );
};
