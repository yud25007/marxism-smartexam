import React, { useState, useEffect, useRef } from 'react';
import { Exam, ExamResult, Question, User } from '../types';
import { CheckCircle2, XCircle, AlertCircle, RefreshCcw, Home, Sparkles, ChevronDown, ChevronUp, Lock, Send, MessageSquareText, Star, BookOpen, Edit3, Share, Maximize2, Minimize2, Trash2, Palette, Highlighter, Underline } from 'lucide-react';
import { Button } from './Button';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getAIExplanation } from '../services/aiService';
import { favoriteService } from '../services/favoriteService';
import { examService } from '../services/examService';
import { Notebook } from './Notebook';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Check, Edit } from 'lucide-react';

interface ResultViewProps {
  exam: Exam;
  result: ExamResult;
  user: User | null;
  onRetry: () => void;
  onGoHome: () => void;
}

interface ResultViewProps {
  exam: Exam;
  result: ExamResult;
  user: User | null;
  onRetry: () => void;
  onGoHome: () => void;
}

const COLORS = ['#10B981', '#EF4444', '#9CA3AF']; // Green, Red, Gray

export const ResultView: React.FC<ResultViewProps> = ({ exam, result, user, onRetry, onGoHome }) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showNotebook, setShowNotebook] = useState(false);
  const [notes, setNotes] = useState(result.notes || "");
  const [followUpQuery, setFollowUpText] = useState("");
  
  const [localNotesMap, setLocalNotesMap] = useState<Record<string, string>>({});
  const [fullScreenNoteId, setFullScreenNoteId] = useState<string | null>(null);
  
  // Quick Edit States
  const [editingAnsId, setEditingAnsId] = useState<string | null>(null);
  const [liveCorrectAnswers, setLiveCorrectAnswers] = useState<Record<string, number[]>>({});
  const [pendingAnsMap, setPendingAnsMap] = useState<Record<string, number[]>>({});

  const scrollPosRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Initialize live answers from original questions
    const initialMap: Record<string, number[]> = {};
    exam.questions.forEach(q => {
      initialMap[q.id] = q.correctAnswers;
    });
    setLiveCorrectAnswers(initialMap);
  }, [exam]);

  useEffect(() => {
    if (user) {
      favoriteService.getFavorites(user.username).then(setFavorites);
    }
  }, [user]);

  const handleQuickUpdateAnswer = (questionId: string, optionsIndex: number, isSingle: boolean) => {
    // Current state could be from pending, or from live (if not pending)
    const current = pendingAnsMap[questionId] || liveCorrectAnswers[questionId] || [];
    let next: number[];
    
    if (isSingle) {
      next = [optionsIndex];
    } else {
      next = current.includes(optionsIndex) 
        ? current.filter(i => i !== optionsIndex) 
        : [...current, optionsIndex].sort((a,b) => a-b);
    }

    setPendingAnsMap(prev => ({ ...prev, [questionId]: next }));
  };

  const handleCommitQuickAnswer = async (questionId: string) => {
    const next = pendingAnsMap[questionId];
    if (!next) return;

    console.log(`[QuickEdit] Committing new answer for ${questionId}:`, next);

    // Save to DB
    const res = await examService.updateQuestionAnswer(questionId, next);
    if (res.success) {
      console.log(`[QuickEdit] Successfully saved to cloud. Refreshing state...`);
      alert('✅ ' + res.message);
      
      // OPTIMIZATION: Force re-fetch chapter questions to be absolutely sure
      try {
        const freshQuestions = await examService.getQuestions(exam.id);
        const newMap: Record<string, number[]> = {};
        freshQuestions.forEach(q => {
          newMap[q.id] = q.correctAnswers;
        });
        setLiveCorrectAnswers(newMap);
      } catch (err) {
        // Fallback to local update if re-fetch fails
        setLiveCorrectAnswers(prev => ({ ...prev, [questionId]: next }));
      }

      setPendingAnsMap(prev => {
        const newer = { ...prev };
        delete newer[questionId];
        return newer;
      });
    } else {
      console.error(`[QuickEdit] Database update failed:`, res.message);
      alert('❌ 同步失败: ' + res.message);
    }
  };

  const handleToggleExpand = (questionId: string) => {
    if (expandedQuestionId === questionId) {
      const prevPos = scrollPosRef.current[questionId];
      setExpandedQuestionId(null);
      if (prevPos !== undefined) {
        setTimeout(() => {
          window.scrollTo({ top: prevPos, behavior: 'smooth' });
        }, 50);
      }
    } else {
      scrollPosRef.current[questionId] = window.scrollY;
      setExpandedQuestionId(questionId);
      setTimeout(() => {
        const element = document.getElementById(`q-card-${questionId}`);
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleToggleFavorite = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.id === 'guest-session') {
      alert('⚠️ 请登录后使用收藏功能，登录后可同步错题与重点题目。');
      return;
    }
    try {
      await favoriteService.toggleFavorite(user.username, questionId);
      setFavorites(prev => 
        prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleAddToNotes = (question: Question) => {
    const personalNote = localNotesMap[question.id] || "（暂无个人心得）";
    
    // 自动处理选项前缀，避免出现 "A. A." 的情况
    const cleanOptions = question.options.map((opt, i) => {
      const prefix = `${String.fromCharCode(65 + i)}.`;
      return opt.trim().startsWith(prefix) ? opt.trim() : `${prefix} ${opt}`;
    });

    const correctAns = question.correctAnswers.length > 0
      ? question.correctAnswers.map(i => String.fromCharCode(65 + i)).join(', ')
      : (question.answerText || "详见解析");

    // 构建更加稳健且支持 Markdown 的 HTML 块，关键点在于标签前后的换行符
    let block = `\n\n<details data-q-id="${question.id}" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 1.5rem; background: white; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">\n`;
    block += `  <summary style="padding: 14px 18px; cursor: pointer; font-weight: bold; background: #f8fafc; border-bottom: 1px solid transparent; list-style: none; transition: all 0.2s;">📝 考点记录：${question.text.substring(0, 35)}...</summary>\n`;
    block += `  <div style="padding: 20px; border-top: 1px solid #e2e8f0;">\n\n`;
    
    block += `#### 📥 题目原文\n\n`;
    block += `> ${question.text}\n\n`;
    
    block += `**选项参考：**  \n${cleanOptions.join('  \n')}\n\n`;
    block += `**标准答案：** \`${correctAns}\`\n\n`;
    
    block += `#### 💡 我的心得体会\n\n`;
    block += `<div style="background: #fdfdfd; padding: 12px; border-radius: 8px; border: 1px dashed #e2e8f0; line-height: 1.6;">\n\n`;
    block += `${personalNote}\n\n`;
    block += `</div>\n\n`;
    
    block += `  </div>\n</details>\n\n<hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 1.5rem 0;"/>\n\n`;
    
    setNotes(prev => prev + block);
    setShowNotebook(true);
  };

  const handleRemoveFromNotes = (questionId: string) => {
    // We look for the <details data-q-id="..."> block and remove it
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${notes}</div>`, 'text/html');
    const element = doc.querySelector(`details[data-q-id="${questionId}"]`);
    
    if (element) {
      element.nextElementSibling?.tagName === 'HR' && element.nextElementSibling.remove();
      element.remove();
      const newNotes = doc.querySelector('div')?.innerHTML || "";
      setNotes(newNotes);
    }
  };

  const handleAskAI = async (question: Question, followUp?: string) => {
    if (loadingMap[question.id]) return;
    
    setLoadingMap(prev => ({ ...prev, [question.id]: true }));
    // If it's initial ask, clear previous (if any)
    if (!followUp) {
      setAiExplanations(prev => ({ ...prev, [question.id]: "" }));
    }

    try {
      const userSelected = result.answers[question.id] || [];
      const currentExplanation = aiExplanations[question.id] || "";

      await getAIExplanation(
        question, 
        userSelected, 
        (content) => {
          // Stream callback
          setAiExplanations(prev => ({
            ...prev,
            [question.id]: followUp ? `${currentExplanation}\n\n--- 追问解答 ---\n${content}` : content
          }));
        },
        followUp
      );
      
      if (followUp) setFollowUpText("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const data = [
    { name: '正确', value: result.correctCount },
    { name: '错误', value: result.incorrectCount },
    { name: '未答', value: result.unansweredCount },
  ];

  const isAiEnabled = user?.aiEnabled;
  const isTrialExam = exam.id === 'trial-chapter';
  const isGuest = user?.id === 'guest-session';
  const isNannyModeEnabled = user?.role === 'ADMIN' || isTrialExam;
  const isVipOrAdmin = (user?.role === 'ADMIN' || user?.role === 'VIP') && !isGuest;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 text-center border-b bg-gradient-to-b from-white to-red-50/30">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">考试结果</h2>
            {isGuest && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                <Sparkles size={12} /> 极速试用模式 (保姆级 AI 已开启)
              </div>
            )}
            <p className="text-gray-500">{exam.title}</p>
            <div className="mt-8 relative inline-flex items-center justify-center">
               <div className="w-48 h-48">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                       {data.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-4xl font-extrabold text-gray-900">{result.percentage}%</span>
                 <span className="text-sm font-medium text-gray-500">得分率</span>
               </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="text-2xl font-bold text-green-600">{result.correctCount}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-green-700 mt-1">正确</div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="text-2xl font-bold text-red-600">{result.incorrectCount}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-red-700 mt-1">错误</div>
              </div>
              <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{result.unansweredCount}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-700 mt-1">未答</div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-center gap-4">
            <Button variant="outline" onClick={onGoHome}><Home size={18} className="mr-2" />返回首页</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onRetry}><RefreshCcw size={18} className="mr-2" />重新答题</Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-bold text-gray-800">详细解析</h3>
            {isVipOrAdmin && (
              <button onClick={() => setShowNotebook(true)} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm">
                <BookOpen size={16} /> 全卷学习笔记
              </button>
            )}
          </div>
          
          {exam.questions.map((question, index) => {
            const userAns = result.answers[question.id] || [];
            const currentCAns = liveCorrectAnswers[question.id] || question.correctAnswers;
            
            // Re-calculate correctness based on LIVE answers
            const isCorrect = userAns.length === currentCAns.length && 
                             userAns.every(val => currentCAns.includes(val)) && 
                             currentCAns.every(val => userAns.includes(val));
            
            const isSkipped = userAns.length === 0;
            const isOpen = expandedQuestionId === question.id;
            const explanation = aiExplanations[question.id];
            const isLoading = loadingMap[question.id];
            const localNote = localNotesMap[question.id] || "";
            const isAdmin = user?.role === 'ADMIN';

            return (
              <div key={question.id} id={`q-card-${question.id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all">
                <div className="p-5 cursor-pointer hover:bg-gray-50" onClick={() => handleToggleExpand(question.id)}>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {isCorrect ? <CheckCircle2 className="text-green-500" size={24} /> : isSkipped ? <AlertCircle className="text-gray-400" size={24} /> : <XCircle className="text-red-500" size={24} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-sm font-semibold text-gray-500">第 {index + 1} 题</span>
                           <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(question.id, e); }} className={`p-1 rounded-full transition-colors ${favorites.includes(question.id) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`} title="收藏题目">
                             <Star size={16} fill={favorites.includes(question.id) ? "currentColor" : "none"} />
                           </button>
                           {isAdmin && (
                             <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">云端同步</span>
                           )}
                         </div>
                         {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </div>
                      <p className="font-medium text-gray-900">{question.text}</p>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
                    {/* Admin Quick Edit Tools */}
                    {isAdmin && (
                      <div className={`mb-6 p-4 rounded-xl border transition-all ${pendingAnsMap[question.id] ? 'bg-amber-50 border-amber-200' : 'bg-white border-indigo-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`text-xs font-extrabold flex items-center gap-1 ${pendingAnsMap[question.id] ? 'text-amber-700' : 'text-indigo-600'}`}>
                            <Edit size={12} /> 管理员快捷工具：修正标准答案
                          </h4>
                          {pendingAnsMap[question.id] ? (
                            <span className="text-[10px] text-amber-600 font-bold animate-pulse">检测到修改，请及时保存</span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">当前为云端同步模式</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-wrap gap-2">
                            {question.options.length > 0 ? (
                              question.options.map((opt, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickUpdateAnswer(question.id, i, question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE');
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    (pendingAnsMap[question.id] || currentCAns).includes(i)
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105'
                                      : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                                  }`}
                                >
                                  {String.fromCharCode(65 + i)}
                                </button>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">此题型暂不支持快速修改</span>
                            )}
                          </div>
                          
                          {pendingAnsMap[question.id] && (
                            <div className="flex items-center gap-3 pt-2 border-t border-amber-100">
                              <button 
                                onClick={() => handleCommitQuickAnswer(question.id)}
                                className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-1"
                              >
                                <Check size={14} /> 确认并保存至云端
                              </button>
                              <button 
                                onClick={() => {
                                  setPendingAnsMap(prev => {
                                    const newer = { ...prev };
                                    delete newer[question.id];
                                    return newer;
                                  });
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                              >
                                撤销修改
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      {question.options.map((opt, i) => {
                         const isSelected = userAns.includes(i);
                         const isRight = currentCAns.includes(i);
                         let style = "p-3 rounded-lg text-sm border ";
                         if (isRight) style += "bg-green-100 border-green-200 text-green-800 font-medium";
                         else if (isSelected && !isRight) style += "bg-red-100 border-red-200 text-red-800";
                         else style += "bg-white border-gray-200 text-gray-600";
                         return (
                           <div key={i} className={style}>
                             <div className="flex items-center justify-between"><span>{opt}</span>{isRight && <CheckCircle2 size={16} />}{isSelected && !isRight && <XCircle size={16} />}</div>
                           </div>
                         )
                      })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {isAiEnabled ? (
                        !explanation && !isLoading ? (
                          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); handleAskAI(question); }}>
                            <Sparkles size={16} className="mr-2" />{isNannyModeEnabled ? '保姆级考点解析' : 'AI 解析此题'}
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 relative">
                               <div className="absolute top-4 left-4"><Sparkles size={20} className="text-indigo-500" /></div>
                               <div className="pl-9">
                                 <h4 className="text-sm font-bold text-indigo-900 mb-1">{isNannyModeEnabled ? '保姆级辅导' : 'AI 解析'}</h4>
                                 {isLoading && !explanation ? (
                                   <div className="space-y-2 animate-pulse"><div className="h-2 bg-indigo-200 rounded w-3/4"></div><div className="h-2 bg-indigo-200 rounded w-full"></div></div>
                                 ) : (
                                  <div className="text-sm text-indigo-800 leading-relaxed prose prose-sm prose-indigo max-w-none">
                                       <style>{`
                                         .markdown-content ul { list-style-type: disc; margin-left: 1.5rem; } 
                                         .markdown-content strong { font-weight: 800; color: #312e81; }
                                         .katex-display { overflow-x: auto; overflow-y: hidden; padding: 8px 0; }
                                       `}</style>
                                       <div className="markdown-content">
                                         <ReactMarkdown 
                                           remarkPlugins={[remarkMath, remarkGfm]} 
                                           rehypePlugins={[rehypeKatex, rehypeRaw]}
                                         >
                                           {explanation}
                                         </ReactMarkdown>
                                       </div>
                                       {isLoading && <span className="inline-block ml-2 animate-bounce">...</span>}
                                   </div>
                                   )}
                               </div>
                            </div>

                            {/* Question Local Note Area */} 
                            {explanation && !isLoading && (
                              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><Edit3 size={14} /> 个人心得笔记</div>
                                  <div className="flex gap-3">
                                    {notes.includes(`data-q-id="${question.id}"`) && (
                                      <button onClick={() => handleRemoveFromNotes(question.id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> 从全卷笔记中移除</button>
                                    )}
                                    <button onClick={() => setFullScreenNoteId(question.id)} className="text-[10px] font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1"><Maximize2 size={12} /> 全屏编辑</button>
                                  </div>
                                </div>
                                <div className="p-3">
                                  <div className="bg-gray-50 px-2 py-1 mb-2 border rounded flex gap-1">
                                     <button onClick={() => {
                                       const textarea = document.getElementById(`note-edit-${question.id}`) as HTMLTextAreaElement;
                                       if (textarea) {
                                         const start = textarea.selectionStart;
                                         const end = textarea.selectionEnd;
                                         const text = textarea.value;
                                         const newText = text.substring(0, start) + '<span style="color: #ef4444">' + text.substring(start, end) + '</span>' + text.substring(end);
                                         setLocalNotesMap(prev => ({...prev, [question.id]: newText}));
                                       }
                                     }} className="p-1 hover:bg-white text-red-600 rounded" title="红色"><Palette size={14} /></button>
                                     <button onClick={() => {
                                       const textarea = document.getElementById(`note-edit-${question.id}`) as HTMLTextAreaElement;
                                       if (textarea) {
                                         const start = textarea.selectionStart;
                                         const end = textarea.selectionEnd;
                                         const text = textarea.value;
                                         const newText = text.substring(0, start) + '<mark style="background: #fef08a">' + text.substring(start, end) + '</mark>' + text.substring(end);
                                         setLocalNotesMap(prev => ({...prev, [question.id]: newText}));
                                       }
                                     }} className="p-1 hover:bg-white text-yellow-600 rounded" title="高亮"><Highlighter size={14} /></button>
                                     <button onClick={() => {
                                       const textarea = document.getElementById(`note-edit-${question.id}`) as HTMLTextAreaElement;
                                       if (textarea) {
                                         const start = textarea.selectionStart;
                                         const end = textarea.selectionEnd;
                                         const text = textarea.value;
                                         const newText = text.substring(0, start) + '<u>' + text.substring(start, end) + '</u>' + text.substring(end);
                                         setLocalNotesMap(prev => ({...prev, [question.id]: newText}));
                                       }
                                     }} className="p-1 hover:bg-white text-gray-700 rounded" title="下划线"><Underline size={14} /></button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <textarea 
                                      id={`note-edit-${question.id}`}
                                      className="w-full text-sm focus:outline-none min-h-[120px] resize-none leading-relaxed border p-2 rounded" 
                                      placeholder="记录您的心得... 支持 HTML 标签美化" 
                                      value={localNote} 
                                      onChange={(e) => setLocalNotesMap(prev => ({...prev, [question.id]: e.target.value}))} 
                                    />
                                    <div className="border rounded p-2 bg-gray-50 overflow-y-auto max-h-[120px]">
                                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">预览</div>
                                      <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: localNote || '<i style="color: #999">暂未填写笔记内容</i>' }} />
                                    </div>
                                  </div>
                                  <div className="mt-3 flex justify-end">
                                    <Button onClick={() => handleAddToNotes(question)} className="bg-indigo-600 text-white h-8 text-[10px] font-bold"><Share size={12} className="mr-1" /> 整理并存入全卷笔记</Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {isAdmin && explanation && (
                              <div className="flex gap-2">
                                <div className="flex-1 relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MessageSquareText className="h-4 w-4 text-gray-400" /></div>
                                  <input type="text" className="block w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="追问老师..." value={followUpQuery} onChange={(e) => setFollowUpText(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && followUpQuery.trim()) { handleAskAI(question, followUpQuery); } }} />
                                </div>
                                <Button size="sm" disabled={isLoading || !followUpQuery.trim()} onClick={() => handleAskAI(question, followUpQuery)} className="bg-indigo-600 text-white"><Send size={14} /></Button>
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-100 p-3 rounded-lg border border-gray-200">
                          <Lock size={14} /><span>AI 解析未开启。</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Modal */} 
      {fullScreenNoteId && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold"><Edit3 size={20} /> 深度记录心得</div>
              <button onClick={() => setFullScreenNoteId(null)} className="p-1 hover:bg-white/20 rounded"><Minimize2 size={24} /></button>
            </div>
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <textarea className="flex-1 p-6 focus:outline-none resize-none text-base border-r border-gray-100 leading-relaxed" placeholder="支持 Markdown 语法..." value={localNotesMap[fullScreenNoteId] || ""} autoFocus onChange={(e) => setLocalNotesMap(prev => ({...prev, [fullScreenNoteId!]: e.target.value}))} />
              <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 prose prose-indigo max-w-none">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">实时预览</h4>
                <ReactMarkdown>{localNotesMap[fullScreenNoteId] || "*预览内容将在此显示*"}</ReactMarkdown>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end"><Button onClick={() => setFullScreenNoteId(null)} className="bg-indigo-600 text-white px-8">保存并返回</Button></div>
          </div>
        </div>
      )}

      {showNotebook && (
        <Notebook 
          recordId={result.id} 
          initialContent={notes} 
          onClose={() => setShowNotebook(false)} 
          onSaveSuccess={(newContent) => setNotes(newContent)}
        />
      )}

      {!showNotebook && isVipOrAdmin && (
        <button onClick={() => setShowNotebook(true)} className="fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition-all z-40 group">
          <BookOpen size={24} /><span className="absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">全卷笔记</span>
        </button>
      )}
    </div>
  );
};
