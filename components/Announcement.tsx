import React, { useState, useEffect } from 'react';
import { Megaphone, X, Bell, Info, Loader2 } from 'lucide-react';
import { announcementService, Announcement } from '../services/announcementService';

export const AnnouncementModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const latest = await announcementService.getLatestAnnouncement();
        if (latest) {
          // 检查本地存储，如果这个公告还没看过，就显示
          const lastSeenId = localStorage.getItem('last_seen_announcement_id');
          if (lastSeenId !== latest.id) {
            setCurrentAnnouncement(latest);
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
  }, []);

  const handleClose = () => {
    if (currentAnnouncement) {
      localStorage.setItem('last_seen_announcement_id', currentAnnouncement.id);
    }
    setIsOpen(false);
  };

  if (loading || !isOpen || !currentAnnouncement) return null;

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-6 border-b flex items-center justify-between ${getTypeStyles(currentAnnouncement.type)}`}>
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
        
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">
            {currentAnnouncement.content}
          </p>
        </div>
        
        <div className="p-6 pt-0 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
