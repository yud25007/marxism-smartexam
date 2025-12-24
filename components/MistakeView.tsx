
import React, { useState, useEffect } from 'react';
import { Exam, Question, User } from '../types';
import { favoriteService } from '../services/favoriteService';
import { EXAMS } from '../constants';
import { ArrowLeft, Star, Trash2, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { QuestionRenderer } from './QuestionRenderer';

interface MistakeViewProps {
  user: User;
  onGoHome: () => void;
}

export const MistakeView: React.FC<MistakeViewProps> = ({ user, onGoHome }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    const ids = await favoriteService.getFavorites(user.username);
    setFavoriteIds(ids);
    
    // Find questions across all exams
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
    if (confirm('确定要从错题本中移除这道题吗？')) {
      await favoriteService.toggleFavorite(user.username, questionId);
      loadFavorites();
    }
  };

  if (loading) return <div className="p-20 text-center">加载错题本中...</div>;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
          <div className="h-16 w-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="text-yellow-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">错题本空空如也</h2>
          <p className="text-gray-500 mb-6">在练习结果页点击五角星，即可将题目收藏到这里。针对性复习效率更高！</p>
          <Button onClick={onGoHome} className="bg-red-600 text-white w-full">返回首页</Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onGoHome} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="text-yellow-500 fill-current" size={20} /> 我的错题本
            </h1>
          </div>
          <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[400px]">
          <QuestionRenderer 
            question={currentQ}
            selectedIndices={[]} // Always empty for practice
            onSelectOption={() => {}} // Read-only practice
            isReadOnly={false}
          />
          
          <div className="mt-10 pt-6 border-t border-dashed flex flex-col gap-4">
             <div className="flex justify-between items-center">
                <Button variant="ghost" className="text-red-600" onClick={() => handleRemove(currentQ.id)}>
                  <Trash2 size={16} className="mr-2" /> 移出错题本
                </Button>
                <div className="flex gap-2">
                   <Button variant="outline" disabled={currentIndex === 0} onClick={() => {setCurrentIndex(v => v - 1); setShowAnswer(false);}}>上一题</Button>
                   <Button variant="outline" disabled={currentIndex === questions.length - 1} onClick={() => {setCurrentIndex(v => v + 1); setShowAnswer(false);}}>下一题</Button>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};
