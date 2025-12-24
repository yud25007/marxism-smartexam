import React, { useState } from 'react';
import { Question, QuestionType } from '../types';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  selectedIndices: number[];
  onSelectOption: (indices: number[]) => void;
  isReadOnly?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  selectedIndices,
  onSelectOption,
  isReadOnly = false
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  
  const handleToggle = (index: number) => {
    if (isReadOnly) return;

    if (question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
      onSelectOption([index]);
    } else {
      // Multiple choice
      if (selectedIndices.includes(index)) {
        onSelectOption(selectedIndices.filter(i => i !== index));
      } else {
        onSelectOption([...selectedIndices, index].sort());
      }
    }
  };

  const getTypeName = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE: return '单选题';
      case QuestionType.MULTIPLE_CHOICE: return '多选题';
      case QuestionType.TRUE_FALSE: return '判断题';
      case QuestionType.SHORT_ANSWER: return '简答/填空';
      default: return '未知';
    }
  };

  const getOptionStyle = (index: number) => {
    const isSelected = selectedIndices.includes(index);
    let base = "relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ";
    
    if (isReadOnly) {
       base += isSelected ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-gray-50";
       base += " cursor-default";
    } else {
       base += isSelected 
        ? "border-red-600 bg-red-50 ring-1 ring-red-600 shadow-sm" 
        : "border-gray-200 hover:border-red-300 hover:bg-gray-50";
    }
    
    return base;
  };

  if (question.type === QuestionType.SHORT_ANSWER) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
             <span className="text-xs font-bold tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
              {getTypeName(question.type)}
             </span>
             <span className="text-xs font-semibold text-gray-500">
              {question.points} 分
             </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            {question.text}
          </h2>
        </div>

        <div className="space-y-4">
          <textarea 
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none min-h-[150px] text-gray-700 font-medium transition-colors"
            placeholder="请在此输入您的答案进行练习..."
            disabled={isReadOnly}
            onChange={(e) => {
              // Mark as answered if user types anything
              if (e.target.value.length > 0 && selectedIndices.length === 0) {
                onSelectOption([0]); // Dummy index to indicate answered
              } else if (e.target.value.length === 0 && selectedIndices.length > 0) {
                onSelectOption([]);
              }
            }}
          />

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <button 
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-red-600 transition-colors mb-2"
            >
              {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
              {showAnswer ? '隐藏参考答案' : '显示参考答案'}
            </button>
            
            {showAnswer && (
              <div className="p-3 bg-white rounded-lg border border-red-100 text-red-900 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                {question.answerText}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
           <span className="text-xs font-bold tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
            {getTypeName(question.type)}
           </span>
           <span className="text-xs font-semibold text-gray-500">
            {question.points} 分
           </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
          {question.text}
        </h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedIndices.includes(idx);
          
          return (
            <div 
              key={idx} 
              className={getOptionStyle(idx)}
              onClick={() => handleToggle(idx)}
            >
              <div className={`flex-shrink-0 h-6 w-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
                 isSelected 
                 ? 'border-red-600 bg-red-600 text-white' 
                 : 'border-gray-300 text-transparent'
              }`}>
                 {isSelected && <CheckCircle2 size={16} />}
              </div>
              
              <span className={`text-base font-medium ${isSelected ? 'text-red-900' : 'text-gray-700'}`}>
                {option}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};