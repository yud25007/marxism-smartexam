import React, { useState, useEffect } from 'react';
import { Megaphone, X, Bell, Info, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { announcementService, Announcement } from '../services/announcementService';

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
        const latest = await announcementService.getLatestAnnouncement();
        if (latest) {
          setCurrentAnnouncement(latest);
          
          // 如果是外部强制打开（点击小喇叭），则直接显示
          if (propsIsOpen === true) {
            setIsOpen(true);
            return;
          }

          // 自动弹出逻辑判定
          if (propsIsOpen === undefined) {
            const lastSeenId = localStorage.getItem('last_seen_announcement_id');
            const dontShowUntil = localStorage.getItem('announcement_dont_show_until');
            const now = Date.now();

            // 只有当公告ID变了，或者当前时间超过了“不再提示”的有效期，才弹出
            const isNewAnnouncement = lastSeenId !== latest.id;
            const isQuietPeriodOver = !dontShowUntil || now > parseInt(dontShowUntil);

            if (isNewAnnouncement || isQuietPeriodOver) {
              setIsOpen(true);
            }
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

  const isVisible = propsIsOpen !== undefined ? propsIsOpen : isOpen;

  const handleClose = () => {
    if (currentAnnouncement) {
      localStorage.setItem('last_seen_announcement_id', currentAnnouncement.id);
      
      // 如果勾选了“今日不再提示”，设置有效期为 24 小时
      if (dontShowToday) {
        const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('announcement_dont_show_until', tomorrow.toString());
      }
    }
    
    if (propsOnClose) {
      propsOnClose();
    } else {
      setIsOpen(false);
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
        
        <div className="p-6 overflow-y-auto flex-1 text-gray-600 leading-relaxed whitespace-pre-wrap">
          <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:mb-3 prose-headings:mt-4">
            <ReactMarkdown>{currentAnnouncement.content}</ReactMarkdown>
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
