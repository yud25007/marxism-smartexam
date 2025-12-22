import React, { useState, useEffect } from 'react';
import { Exam, ExamResult } from '../types';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from './Button';
import { Clock, ChevronLeft, ChevronRight, LayoutGrid, CheckCircle2, LogOut, X } from 'lucide-react';

interface ExamPlayerProps {
  exam: Exam;
  onFinish: (result: ExamResult) => void;
  onExit: () => void;
}

export const ExamPlayer: React.FC<ExamPlayerProps> = ({ exam, onFinish, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [showOverview, setShowOverview] = useState(false);

  // Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Force submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (indices: number[]) => {
    const questionId = exam.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: indices }));
  };

  const handleExit = () => {
    if(window.confirm('退出后当前进度将丢失，确定退出吗？')) {
      onExit();
    }
  };

  const handleSubmit = (force: boolean = false) => {
    // Check unanswered questions if not forced (timeout)
    if (!force) {
      const answeredCount = Object.keys(answers).length;
      const totalCount = exam.questions.length;
      const unanswered = totalCount - answeredCount;

      if (unanswered > 0) {
        if (!window.confirm(`还有 ${unanswered} 道题未作答，确定要现在交卷吗？`)) {
          return;
        }
      } else {
        if (!window.confirm(`确认提交试卷吗？`)) {
          return;
        }
      }
    }

    // Calculate Score
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    exam.questions.forEach(q => {
      maxScore += q.points;
      const userAns = answers[q.id] || [];
      
      const isCorrect = 
        userAns.length === q.correctAnswers.length && 
        userAns.every(val => q.correctAnswers.includes(val)) &&
        q.correctAnswers.every(val => userAns.includes(val));

      if (userAns.length === 0) {
        unansweredCount++;
      } else if (isCorrect) {
        score += q.points;
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const result: ExamResult = {
      examId: exam.id,
      score,
      maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      correctCount,
      incorrectCount,
      unansweredCount,
      answers,
      completedAt: new Date()
    };

    onFinish(result);
  };

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progressPercentage = ((Object.keys(answers).length) / exam.questionCount) * 100;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shadow-sm z-20">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          {/* Desktop Exit Button */}
          <Button variant="ghost" size="sm" onClick={handleExit} className="hidden md:flex">
             退出
          </Button>
          {/* Mobile Exit Button */}
          <button 
            onClick={handleExit} 
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            title="退出"
          >
             <X size={20} />
          </button>

          <h1 className="text-lg font-bold text-gray-800 truncate max-w-[150px] md:max-w-md">
            {exam.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
           <div className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-full font-mono font-medium text-sm md:text-base ${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
             <Clock size={16} />
             {formatTime(timeLeft)}
           </div>
           <Button className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all px-3 md:px-4" size="sm" onClick={() => handleSubmit(false)}>
             <CheckCircle2 size={16} className="md:mr-1" /> 
             <span className="hidden md:inline">交卷</span>
           </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Overview - Hidden on mobile unless toggled */}
        <aside className={`absolute md:relative z-10 w-full md:w-64 h-full bg-white border-r transform transition-transform duration-300 ${showOverview ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
           <div className="p-4 border-b">
             <h3 className="font-semibold text-gray-700 flex items-center gap-2">
               <LayoutGrid size={18} /> 答题卡
             </h3>
           </div>
           <div className="p-4 grid grid-cols-4 gap-2 overflow-y-auto flex-1 content-start">
             {exam.questions.map((q, idx) => {
               const isAnswered = answers[q.id] && answers[q.id].length > 0;
               const isCurrent = idx === currentQuestionIndex;
               return (
                 <button
                   key={q.id}
                   onClick={() => {
                     setCurrentQuestionIndex(idx);
                     setShowOverview(false);
                   }}
                   className={`h-10 w-10 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                     isCurrent ? 'bg-red-600 text-white ring-2 ring-red-300 ring-offset-1' :
                     isAnswered ? 'bg-blue-100 text-blue-700' :
                     'bg-gray-100 text-gray-600 hover:bg-gray-200'
                   }`}
                 >
                   {idx + 1}
                 </button>
               );
             })}
           </div>
           <div className="p-4 border-t bg-gray-50">
             <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
               <span>进度</span>
               <span className="font-semibold">{Math.round(progressPercentage)}%</span>
             </div>
             <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
             </div>
           </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 md:pb-24 relative">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[500px]">
            <div className="flex justify-between items-center mb-6 md:hidden">
              <span className="text-sm font-medium text-gray-500">第 {currentQuestionIndex + 1} / {exam.questions.length} 题</span>
              <button onClick={() => setShowOverview(!showOverview)} className="text-blue-600 text-sm font-medium">
                 {showOverview ? '隐藏答题卡' : '显示答题卡'}
              </button>
            </div>

            <QuestionRenderer
              question={currentQuestion}
              selectedIndices={answers[currentQuestion.id] || []}
              onSelectOption={handleSelectAnswer}
            />
          </div>
        </main>
      </div>

      {/* Footer Navigation */}
      <div className="h-20 bg-white border-t flex items-center justify-between px-4 md:px-8 z-20">
        <Button 
          variant="outline" 
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
        >
          <ChevronLeft size={18} className="mr-2" />
          上一题
        </Button>
        
        <div className="hidden md:block text-sm font-medium text-gray-500">
           第 {currentQuestionIndex + 1} / {exam.questions.length} 题
        </div>

        <Button 
          className="bg-gray-900 hover:bg-gray-800 text-white"
          onClick={() => {
            if (currentQuestionIndex < exam.questions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
            } else {
              // On last question, button becomes Submit
              handleSubmit(false);
            }
          }}
        >
          {currentQuestionIndex === exam.questions.length - 1 ? '完成交卷' : '下一题'}
          {currentQuestionIndex < exam.questions.length - 1 && <ChevronRight size={18} className="ml-2" />}
        </Button>
      </div>
    </div>
  );
};