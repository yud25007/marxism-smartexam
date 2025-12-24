import React, { useState } from 'react';
import { Exam, ExamResult, Question, User } from '../types';
import { CheckCircle2, XCircle, AlertCircle, RefreshCcw, Home, Sparkles, ChevronDown, ChevronUp, Lock, Send, MessageSquareText, Star } from 'lucide-react';
import { Button } from './Button';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getAIExplanation } from '../services/aiService';
import { favoriteService } from '../services/favoriteService';
import { Notebook } from './Notebook';
import ReactMarkdown from 'react-markdown';

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
  // Persistent storage for explanations: questionId -> text
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showNotebook, setShowNotebook] = useState(false);
  const [notes, setNotes] = useState(result.notes || "");
  
  // Follow-up state
  const [followUpQuery, setFollowUpText] = useState("");

  const handleAddToNotes = (question: Question, explanation: string) => {
    const formattedNote = `\n\n### 题目：${question.text}\n> **AI 解析：**\n${explanation}\n\n---`;
    const newNotes = notes + formattedNote;
    setNotes(newNotes);
    setShowNotebook(true);
    // Focus or scroll to notebook is handled by opening it
  };

  // Load favorites on mount
  React.useEffect(() => {
    if (user) {
      favoriteService.getFavorites(user.username).then(setFavorites);
    }
  }, [user]);

  const handleToggleFavorite = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const success = await favoriteService.toggleFavorite(user.username, questionId);
    if (success) {
      setFavorites(prev => 
        prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
      );
    }
  };

  const data = [
    { name: '正确', value: result.correctCount },
    { name: '错误', value: result.incorrectCount },
    { name: '未答', value: result.unansweredCount },
  ];

  const handleToggleExpand = (questionId: string) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
    } else {
      setExpandedQuestionId(questionId);
    }
  };

  const handleAskAI = async (question: Question, followUp?: string) => {
    if (loadingMap[question.id]) return;
    
    setLoadingMap(prev => ({ ...prev, [question.id]: true }));

    try {
      const userSelected = result.answers[question.id] || [];
      const explanation = await getAIExplanation(question, userSelected, followUp);
      
      setAiExplanations(prev => ({
        ...prev, 
        [question.id]: followUp ? `${prev[question.id]}\n\n--- 追问解答 ---\n${explanation}` : explanation 
      }));
      
      if (followUp) setFollowUpText("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [question.id]: false }));
    }
  };

  const isAiEnabled = user?.aiEnabled;
  const isNannyModeEnabled = user?.role === 'ADMIN'; // Only ADMIN gets nanny mode and follow-up
  const isVipOrAdmin = user?.role === 'ADMIN' || user?.role === 'VIP';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 text-center border-b bg-gradient-to-b from-white to-red-50/30">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">考试结果</h2>
            <p className="text-gray-500">{exam.title}</p>
            
            <div className="mt-8 relative inline-flex items-center justify-center">
               <div className="w-48 h-48">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={data}
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                       stroke="none"
                     >
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
            <Button variant="outline" onClick={onGoHome}>
              <Home size={18} className="mr-2" />
              返回首页
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onRetry}>
              <RefreshCcw size={18} className="mr-2" />
              重新答题
            </Button>
          </div>
        </div>

        {/* Detailed Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 ml-1">详细解析</h3>
          
          {exam.questions.map((question, index) => {
            const userAns = result.answers[question.id] || [];
            const isCorrect = 
              userAns.length === question.correctAnswers.length && 
              userAns.every(val => question.correctAnswers.includes(val)) &&
              question.correctAnswers.every(val => userAns.includes(val));
            const isSkipped = userAns.length === 0;

            const isOpen = expandedQuestionId === question.id;
            const explanation = aiExplanations[question.id];
            const isLoading = loadingMap[question.id];

            return (
              <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all">
                <div className="p-5 cursor-pointer hover:bg-gray-50" onClick={() => handleToggleExpand(question.id)}>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="text-green-500" size={24} />
                      ) : isSkipped ? (
                        <AlertCircle className="text-gray-400" size={24} />
                      ) : (
                        <XCircle className="text-red-500" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-sm font-semibold text-gray-500">第 {index + 1} 题</span>
                           <button 
                             onClick={(e) => handleToggleFavorite(question.id, e)}
                             className={`p-1 rounded-full transition-colors ${favorites.includes(question.id) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                             title={favorites.includes(question.id) ? "取消收藏" : "加入收藏"}
                           >
                             <Star size={16} fill={favorites.includes(question.id) ? "currentColor" : "none"} />
                           </button>
                         </div>
                         {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </div>
                      <p className="font-medium text-gray-900">{question.text}</p>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
                    <div className="space-y-2 mb-4">
                      {question.options.map((opt, i) => {
                         const isSelected = userAns.includes(i);
                         const isRight = question.correctAnswers.includes(i);
                         
                         let style = "p-3 rounded-lg text-sm border ";
                         if (isRight) style += "bg-green-100 border-green-200 text-green-800 font-medium";
                         else if (isSelected && !isRight) style += "bg-red-100 border-red-200 text-red-800";
                         else style += "bg-white border-gray-200 text-gray-600";

                         return (
                           <div key={i} className={style}>
                             <div className="flex items-center justify-between">
                               <span>{opt}</span>
                               {isRight && <CheckCircle2 size={16} />}
                               {isSelected && !isRight && <XCircle size={16} />}
                             </div>
                           </div>
                         )
                      })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {isAiEnabled ? (
                        !explanation && !isLoading ? (
                          <Button 
                             variant="ghost" 
                             size="sm" 
                             className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleAskAI(question);
                             }}
                          >
                            <Sparkles size={16} className="mr-2" />
                            {isNannyModeEnabled ? '保姆级考点解析' : 'AI 解析此题'}
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 relative">
                               <div className="absolute top-4 left-4">
                                 <Sparkles size={20} className="text-indigo-500" />
                               </div>
                               <div className="pl-9">
                                 <h4 className="text-sm font-bold text-indigo-900 mb-1">
                                   {isNannyModeEnabled ? '保姆级辅导' : 'AI 解析'}
                                 </h4>
                                 {isLoading && !explanation ? (
                                   <div className="space-y-2 animate-pulse">
                                     <div className="h-2 bg-indigo-200 rounded w-3/4"></div>
                                     <div className="h-2 bg-indigo-200 rounded w-full"></div>
                                     <div className="h-2 bg-indigo-200 rounded w-5/6"></div>
                                   </div>
                                 ) : (
                                  <div className="text-sm text-indigo-800 leading-relaxed prose prose-sm prose-indigo max-w-none">
                                       <style>{`
                                         .markdown-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
                                         .markdown-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
                                         .markdown-content li { margin-bottom: 0.5rem; }
                                         .markdown-content strong { font-weight: 800; color: #312e81; }
                                         .markdown-content p { margin-bottom: 0.75rem; }
                                       `}</style>
                                       <div className="markdown-content">
                                         <ReactMarkdown>{explanation}</ReactMarkdown>
                                       </div>
                                       {isLoading && (
                                         <span className="inline-block ml-2 animate-bounce">...</span>
                                       )}
                                   </div>
                                   {!isLoading && (
                                     <button 
                                       onClick={() => handleAddToNotes(question, explanation)}
                                       className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-100 transition-colors"
                                     >
                                       <BookOpen size={12} /> 记入笔记
                                     </button>
                                   )}
                               </div>
                            </div>

                            {/* Admin Follow-up UI */}
                            {isNannyModeEnabled && explanation && (
                              <div className="flex gap-2">
                                <div className="flex-1 relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MessageSquareText className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <input 
                                    type="text"
                                    className="block w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="追问老师，彻底吃透..."
                                    value={followUpQuery}
                                    onChange={(e) => setFollowUpText(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && followUpQuery.trim()) {
                                        handleAskAI(question, followUpQuery);
                                      }
                                    }}
                                  />
                                </div>
                                <Button 
                                  size="sm" 
                                  disabled={isLoading || !followUpQuery.trim()}
                                  onClick={() => handleAskAI(question, followUpQuery)}
                                  className="bg-indigo-600 text-white"
                                >
                                  <Send size={14} />
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-100 p-3 rounded-lg border border-gray-200">
                          <Lock size={14} />
                          <span>AI 解析功能未开启，请联系管理员开通。</span>
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
        
              {/* Notebook Floating Component */}
              {showNotebook && (
                <Notebook 
                  recordId={result.id}
                  initialContent={notes}
                  onClose={() => setShowNotebook(false)}
                />
              )}
        
              {/* Persistent Floating Button to open notebook */}
              {!showNotebook && (
                <button 
                  onClick={() => setShowNotebook(true)}
                  className="fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition-all z-40 group"
                >
                  <BookOpen size={24} />
                  <span className="absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">打开答题笔记</span>
                </button>
              )}
            </div>
          );
        };
        