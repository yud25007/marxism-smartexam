import React, { useState, useEffect } from 'react';
import { Megaphone, X, Bell, Info, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { announcementService, Announcement } from '../services/announcementService';

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen: propsIsOpen,
  onClose: propsOnClose
}) => {
  // ... (保持之前的状态和 Effect 不变)

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
        
        <div className="p-6 pt-0 flex justify-end flex-shrink-0">
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
