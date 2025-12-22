import React from 'react';
import { Clock, HelpCircle, BarChart2, ChevronRight, Lock } from 'lucide-react';
import { Exam } from '../types';
import { Button } from './Button';

interface ExamCardProps {
  exam: Exam;
  onStart: (exam: Exam) => void;
  isLocked?: boolean;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam, onStart, isLocked = false }) => {
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all ${isLocked ? 'opacity-80' : 'hover:shadow-md hover:border-red-200'}`}>
      <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
        <img 
          src={exam.coverImage} 
          alt={exam.title}
          className={`h-full w-full object-cover transition-transform duration-300 ${isLocked ? 'grayscale' : 'group-hover:scale-105'} opacity-90`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-md border border-white/30">
              <Lock className="text-white h-8 w-8" />
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 text-white font-bold text-lg drop-shadow-md">
           {exam.title}
        </div>
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm">
            {exam.category}
          </span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">
          {exam.description}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium mb-5">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            {exam.durationMinutes} 分钟
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle size={14} />
            {exam.questionCount} 题
          </div>
           <div className={`flex items-center gap-1 text-yellow-600`}>
            <BarChart2 size={14} />
            中等
          </div>
        </div>
        
        <div className="mt-auto">
          <Button 
            onClick={() => onStart(exam)} 
            className={`w-full justify-between border-red-200 text-red-700 hover:bg-red-50 ${isLocked ? 'cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-50' : 'group-hover:bg-red-700 group-hover:text-white'}`}
            variant="outline"
          >
            {isLocked ? '请先登录' : '开始答题'}
            {isLocked ? <Lock size={16} /> : <ChevronRight size={16} className="text-red-300 group-hover:text-white" />}
          </Button>
        </div>
      </div>
    </div>
  );
};