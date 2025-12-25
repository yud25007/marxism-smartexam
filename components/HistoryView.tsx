import React, { useState } from 'react';
import { ExamResult } from '../types';
import { Button } from './Button';
import { Clock, Calendar, ChevronRight, BarChart2, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { EXAMS } from '../constants';
import { historyService } from '../services/historyService';

interface HistoryViewProps {
  history: ExamResult[];
  onViewDetail: (result: ExamResult) => void;
  onGoHome: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history: initialHistory, onViewDetail, onGoHome }) => {
  const [history, setHistory] = useState(initialHistory);
  const [loadingId, setLoadingId] = useState<string | Date | null>(null);

  const getExamTitle = (examId: string) => {
    const exam = EXAMS.find(e => e.id === examId);
    return exam ? exam.title : '未知试卷';
  };

  const formatDate = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteRecord = async (e: React.MouseEvent, record: ExamResult) => {
    e.stopPropagation();
    if (confirm('确定要永久删除这条答题记录吗？此操作不可撤销。')) {
      const id = record.id || record.completedAt;
      setLoadingId(id);
      try {
        const userStr = localStorage.getItem('smart_exam_current_user');
        const username = userStr ? JSON.parse(userStr).username : '';
        const success = await historyService.deleteRecord(username, record.id, record.completedAt);
        if (success) {
          setHistory(prev => prev.filter(r => 
            record.id ? r.id !== record.id : r.completedAt !== record.completedAt
          ));
        } else {
          alert('删除失败，请重试');
        }
      } catch (err) {
        alert('删除过程中发生错误');
      } finally {
        setLoadingId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="text-red-600" />
            答题记录
          </h2>
          <Button variant="outline" onClick={onGoHome}>返回首页</Button>
        </div>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">暂无答题记录</h3>
            <p className="text-gray-500 mt-2 mb-6">您还没有进行过任何考试，快去挑战一下吧！</p>
            <Button onClick={onGoHome} className="bg-red-600 hover:bg-red-700 text-white">
              去答题
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => onViewDetail(record)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-red-600 transition-colors">
                      {getExamTitle(record.examId)}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(record.completedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {/* Assuming we might store duration later, strictly user completedAt for now */}
                        已完成
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${record.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.score} <span className="text-sm text-gray-400 font-normal">/ {record.maxScore}</span>
                      </div>
                      <div className="text-xs text-gray-500">得分</div>
                    </div>
                    
                    <div className="text-center hidden sm:block">
                      <div className="text-2xl font-bold text-gray-800">
                        {record.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">正确率</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteRecord(e, record)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="删除记录"
                        disabled={!!loadingId}
                      >
                        {loadingId === (record.id || record.completedAt) ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                      <ChevronRight className="text-gray-300 group-hover:text-red-500" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};