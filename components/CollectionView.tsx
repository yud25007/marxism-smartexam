
import React, { useState, useEffect } from 'react';
import { Exam, Question, User, QuestionType } from '../types';
import { favoriteService } from '../services/favoriteService';
import { EXAMS } from '../constants';
import { ArrowLeft, Star, Trash2, CheckCircle2, XCircle, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { QuestionRenderer } from './QuestionRenderer';
import { getAIExplanation } from '../services/aiService';
import ReactMarkdown from 'react-markdown';

interface CollectionViewProps {
  user: User;
  onGoHome: () => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({ user, onGoHome }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Interaction states
  const [userAnswers, setUserAnswers] = useState<Record<string, number[]>>({});
  const [showResultMap, setShowResultMap] = useState<Record<string, boolean>>({});
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    const ids = await favoriteService.getFavorites(user.username);
    
    const allQuestions: Question[] = [];
    EXAMS.forEach(exam => {
      exam.questions.forEach(q => {
        if (ids.includes(q.id)) {
          allQuestions.push(q);
        }
      });
    });
    
    setQuestions(allQuestions);
    setLoading(false);
  };

  const handleRemove = async (questionId: string) => {
    if (confirm('确定要取消收藏这道题吗？')) {
      await favoriteService.toggleFavorite(user.username, questionId);
      const newQuestions = questions.filter(q => q.id !== questionId);
      setQuestions(newQuestions);
      if (currentIndex >= newQuestions.length && newQuestions.length > 0) {
        setCurrentIndex(newQuestions.length - 1);
      }
    }
  };

  const handleSelectOption = (indices: number[]) => {
    const currentQ = questions[currentIndex];
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: indices }));
  };

  const handleCheckAnswer = () => {
    const currentQ = questions[currentIndex];
    setShowResultMap(prev => ({ ...prev, [currentQ.id]: true }));
  };

  const handleAskAI = async () => {
    const currentQ = questions[currentIndex];
    if (isLoadingAi[currentQ.id]) return;

    setIsLoadingAi(prev => ({ ...prev, [currentQ.id]: true }));
    setAiExplanations(prev => ({ ...prev, [currentQ.id]: "" }));

    try {
      const selected = userAnswers[currentQ.id] || [];
      await getAIExplanation(currentQ, selected, (content) => {
        setAiExplanations(prev => ({ ...prev, [currentQ.id]: content }));
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentQ.id]: false }));
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">加载收藏题目中...</div>;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
          <div className="h-16 w-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="text-yellow-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">暂无收藏内容</h2>
          <p className="text-gray-500 mb-6">您还没有收藏任何题目。在答题后的解析页面点击星星，即可将重点难点收藏到这里进行针对性练习。</p>
          <Button onClick={onGoHome} className="bg-red-600 text-white w-full">去练习</Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selected = userAnswers[currentQ.id] || [];
  const showResult = showResultMap[currentQ.id];
  const explanation = aiExplanations[currentQ.id];
  const loadingAi = isLoadingAi[currentQ.id];

  const isCorrect = 
    selected.length === currentQ.correctAnswers.length && 
    selected.every(v => currentQ.correctAnswers.includes(v));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onGoHome} className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="返回首页"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="text-yellow-500 fill-current" size={20} /> 题目收藏
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Practice Mode</span>
            <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[500px] flex flex-col">
          <div className="flex-1">
            <QuestionRenderer 
              question={currentQ}
              selectedIndices={selected}
              onSelectOption={handleSelectOption}
              isReadOnly={showResult}
            />

            {showResult && (
              <div className={`mt-6 p-4 rounded-xl border-2 flex items-center gap-3 animate-in zoom-in-95 duration-200 ${isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <span className="font-bold">{isCorrect ? '回答正确！太棒了' : '回答错误，再接再厉'}</span>
                {!isCorrect && currentQ.type !== QuestionType.SHORT_ANSWER && (
                  <span className="ml-auto text-sm">正确答案: {currentQ.correctAnswers.map(i => String.fromCharCode(65 + i)).join(', ')}</span>
                )}
              </div>
            )}

            {explanation && (
              <div className="mt-6 bg-indigo-50 rounded-xl p-5 border border-indigo-100 relative">
                <style>{`
                  .sa-content ul { list-style-type: disc; margin-left: 1.2rem; }
                  .sa-content strong { color: #1e1b4b; font-weight: 800; }
                `}</style>
                <h4 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                  <Sparkles size={16} /> AI 深度解析
                </h4>
                <div className="text-sm text-indigo-800 leading-relaxed sa-content">
                  <ReactMarkdown>{explanation}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-100 space-y-6">
             <div className="flex flex-wrap gap-3">
                {!showResult && currentQ.type !== QuestionType.SHORT_ANSWER ? (
                  <Button 
                    className="bg-gray-900 text-white" 
                    disabled={selected.length === 0}
                    onClick={handleCheckAnswer}
                  >
                    核对答案
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={handleAskAI}
                    disabled={loadingAi}
                  >
                    {loadingAi ? '正在思考...' : <><Sparkles size={16} className="mr-2" /> AI 辅助理解</>}
                  </Button>
                )}
                
                <Button variant="ghost" className="text-gray-400 hover:text-red-600 ml-auto" onClick={() => handleRemove(currentQ.id)}>
                  <Trash2 size={16} className="mr-2" /> 移除收藏
                </Button>
             </div>

             <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentIndex === 0} 
                  onClick={() => {setCurrentIndex(v => v - 1);}}
                >
                  <ChevronLeft size={18} className="mr-1" /> 上一题
                </Button>
                <div className="flex gap-1">
                  {questions.map((_, idx) => (
                    <div key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === currentIndex ? 'bg-indigo-600 w-4' : 'bg-gray-300'} transition-all`}></div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentIndex === questions.length - 1} 
                  onClick={() => {setCurrentIndex(v => v + 1);}}
                >
                  下一题 <ChevronRight size={18} className="ml-1" />
                </Button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};
