import React, { useState, useEffect } from 'react';
import { Megaphone, X, Bell, Info, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        // Try to get user info for role-based filtering
        const userStr = localStorage.getItem('marxism_user');
        let userRole: string | undefined;
        if (userStr) {
          const user = JSON.parse(userStr) as User;
          userRole = user.role;
        }

        const latest = await announcementService.getLatestAnnouncement(userRole);
        if (latest) {
          setCurrentAnnouncement(latest);
          
          // 如果是外部强制打开（点击小喇叭），则直接显示
          if (propsIsOpen === true) {
            setIsOpen(true);
            return;
          }

          // 自动弹出逻辑判定：当没有手动指定打开时，检查本地存储
          const lastSeenId = localStorage.getItem('last_seen_announcement_id');
          const dontShowUntil = localStorage.getItem('announcement_dont_show_until');
          const now = Date.now();

          // 判定条件：
          // 1. 公告 ID 变了（发布了新公告）
          // 2. 或者 没有设置过“不再提示”，或者“不再提示”的有效期已过
          const isNewAnnouncement = lastSeenId !== latest.id;
          const isQuietPeriodOver = !dontShowUntil || now > parseInt(dontShowUntil);

          if (isNewAnnouncement || isQuietPeriodOver) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch announcement:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
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

  if (loading || !isVisible || !currentAnnouncement) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-6 border-b flex items-center justify-between flex-shrink-0 ${getTypeStyles(currentAnnouncement.type)}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              {getIcon(currentAnnouncement.type)}
            </div>
            <div>
              <h3 className="text-lg font-bold">{currentAnnouncement.title}</h3>
              <p className="text-xs opacity-70 font-medium">{currentAnnouncement.date}</p>
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
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
