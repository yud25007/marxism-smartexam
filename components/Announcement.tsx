import React, { useState, useEffect } from 'react';
import { Megaphone, X, Bell, Info, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { announcementService } from '../services/announcementService';
import { Announcement, User } from '../types';

interface AnnouncementModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ 
  isOpen: propsIsOpen, 
  onClose: propsOnClose 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [viewMode, setViewMode] = useState<'latest' | 'list'>('latest');
  const [loading, setLoading] = useState(true);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const userStr = localStorage.getItem('marxism_user');
        let userRole: string | undefined;
        if (userStr) {
          const user = JSON.parse(userStr) as User;
          userRole = user.role;
        }

        const data = await announcementService.getAllAnnouncements(userRole);
        setAllAnnouncements(data);

        if (data.length > 0) {
          const latest = data[0];
          setCurrentAnnouncement(latest);
          
          if (propsIsOpen === true) {
            setIsOpen(true);
            setViewMode('list'); // 点击图标打开时默认显示列表
            return;
          }

          const lastSeenId = localStorage.getItem('last_seen_announcement_id');
          const dontShowUntil = localStorage.getItem('announcement_dont_show_until');
          const now = Date.now();

          const isNewAnnouncement = lastSeenId !== latest.id;
          const isQuietPeriodOver = !dontShowUntil || now > parseInt(dontShowUntil);

          if (isNewAnnouncement || isQuietPeriodOver) {
            setIsOpen(true);
            setViewMode('latest'); // 自动弹出时显示最新详情
          }
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [propsIsOpen]);

  // 最终显示的判定：外部强制打开 (propsIsOpen 为 true) OR 内部自动逻辑打开 (isOpen 为 true)
  const isVisible = propsIsOpen === true || isOpen;

  const handleClose = () => {
    if (currentAnnouncement) {
      localStorage.setItem('last_seen_announcement_id', currentAnnouncement.id);
      
      // 如果勾选了“今日不再提示”，设置有效期为 24 小时
      if (dontShowToday) {
        const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('announcement_dont_show_until', tomorrow.toString());
      }
    }
    
    setIsOpen(false); // 无论如何都关闭内部状态
    if (propsOnClose) {
      propsOnClose(); // 通知父组件更新状态
    }
  };

  const getTypeStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'important':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'important':
        return <Bell size={24} className="text-red-600" />;
      case 'warning':
        return <Megaphone size={24} className="text-amber-600" />;
      default:
        return <Info size={24} className="text-blue-600" />;
    }
  };

  if (loading || !isVisible || allAnnouncements.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-6 border-b flex items-center justify-between flex-shrink-0 ${viewMode === 'latest' ? getTypeStyles(currentAnnouncement?.type || 'info') : 'bg-gray-50 text-gray-900 border-gray-100'}`}>
          <div className="flex items-center gap-3">
            {viewMode === 'latest' && (
              <button 
                onClick={() => setViewMode('list')}
                className="p-1.5 bg-white/50 hover:bg-white rounded-lg transition-colors text-gray-700"
                title="返回列表"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="p-2 bg-white rounded-xl shadow-sm">
              {viewMode === 'latest' && currentAnnouncement ? getIcon(currentAnnouncement.type) : <Megaphone size={24} className="text-blue-600" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {viewMode === 'latest' ? currentAnnouncement?.title : '历史公告'}
              </h3>
              {viewMode === 'latest' && <p className="text-xs opacity-70 font-medium">{currentAnnouncement?.date}</p>}
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 text-gray-600 leading-relaxed">
          {viewMode === 'latest' && currentAnnouncement ? (
            <>
              {currentAnnouncement.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <img 
                    src={currentAnnouncement.image_url} 
                    alt={currentAnnouncement.title}
                    className="w-full h-auto object-cover max-h-64"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:mb-3 prose-headings:mt-4 prose-img:rounded-xl prose-table:border-collapse prose-th:border prose-th:border-gray-200 prose-th:p-2 prose-td:border prose-td:border-gray-200 prose-td:p-2 overflow-x-auto">
                <ReactMarkdown 
                  rehypePlugins={[rehypeRaw]} 
                  remarkPlugins={[remarkGfm]}
                >
                  {currentAnnouncement.content}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {allAnnouncements.map((ann) => (
                <button
                  key={ann.id}
                  onClick={() => {
                    setCurrentAnnouncement(ann);
                    setViewMode('latest');
                  }}
                  className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ann.type === 'important' ? 'bg-red-100 text-red-600' :
                      ann.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {ann.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{ann.date}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{ann.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-1">{ann.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
            />
            <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">今日不再提示</span>
          </label>
          <div className="flex gap-2">
            {viewMode === 'latest' && (
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                查看历史
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
            >
              知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
