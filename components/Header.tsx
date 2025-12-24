import React from 'react';
import { BookOpen, User, LogOut, UserPlus, Shield, Key, LayoutDashboard, Home, History, Megaphone } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  onGoHome: () => void;
  user: UserType | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onRegisterClick: () => void;
  onHistoryClick: () => void;
  onChangePasswordClick: () => void;
  onAdminDashboardClick: () => void;
  onAnnouncementClick: () => void;
  currentView?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onGoHome, 
  user, 
  onLoginClick, 
  onLogoutClick,
  onRegisterClick,
  onHistoryClick,
  onChangePasswordClick,
  onAdminDashboardClick,
  onAnnouncementClick,
  currentView
}) => {
  
  const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
    <button
      onClick={onClick}
      className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active 
          ? 'bg-red-600 text-white shadow-md' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-white/60">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="container mx-auto px-4">
        {/* Top Row: Logo & User Actions */}
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onGoHome}>
            <div className="h-8 w-8 bg-red-700 rounded-lg flex items-center justify-center text-white">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-700 to-red-500">
              马原题库
            </span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onGoHome(); }} 
              className={`text-sm font-medium transition-colors ${currentView === 'HOME' ? 'text-red-700 font-bold' : 'text-gray-700 hover:text-red-700'}`}
            >
              题库首页
            </a>
            {user && (
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onHistoryClick(); }}
                className={`text-sm font-medium transition-colors ${currentView === 'HISTORY' ? 'text-red-700 font-bold' : 'text-gray-700 hover:text-red-700'}`}
              >
                答题记录
              </a>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onAnnouncementClick}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
              title="查看公告"
            >
              <Megaphone size={18} />
            </button>
            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <div className="hidden md:flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
                    <button 
                      onClick={onAdminDashboardClick}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors px-2 py-1.5 rounded-md ${currentView === 'ADMIN_DASHBOARD' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-blue-700 hover:bg-gray-100'}`}
                      title="管理员控制台"
                    >
                      <LayoutDashboard size={16} />
                      后台管理
                    </button>
                    <button 
                      onClick={onRegisterClick}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors px-2 py-1.5 rounded-md ${currentView === 'REGISTER' ? 'bg-blue-50 text-blue-700' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}`}
                      title="管理员注册新用户"
                    >
                      <UserPlus size={16} />
                      注册成员
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-3 pl-2">
                   {/* Mobile User Avatar only */}
                   <div className="md:hidden relative group">
                     <div className="h-8 w-8 bg-red-50 rounded-full flex items-center justify-center border border-red-100 text-red-600 font-bold">
                       {user.username.charAt(0).toUpperCase()}
                     </div>
                   </div>

                   {/* Desktop User Info */}
                  <div className="hidden md:block text-right">
                     <p className="text-xs font-medium text-gray-500 flex items-center justify-end gap-1">
                        {user.role === 'ADMIN' && <Shield size={10} className="text-red-500" />}
                        欢迎回来
                     </p>
                     <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                  </div>
                  
                  <div className="hidden md:block relative group">
                     <div className="h-9 w-9 bg-red-50 rounded-full flex items-center justify-center border border-red-100 text-red-600 font-bold cursor-default">
                       {user.username.charAt(0).toUpperCase()}
                     </div>
                  </div>

                  <div className="flex items-center gap-1">
                     <button 
                      onClick={onChangePasswordClick}
                      className="p-2 text-gray-400 hover:text-yellow-600 transition-colors rounded-full hover:bg-yellow-50"
                      title="修改密码"
                    >
                      <Key size={18} />
                    </button>
                    <button 
                      onClick={onLogoutClick}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                      title="退出登录"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={onRegisterClick}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  注册
                </button>
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">登录</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Sliding Navigation Row */}
        <div className="md:hidden overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          <div className="flex items-center gap-3">
            <NavItem 
              active={currentView === 'HOME' || !currentView} 
              onClick={onGoHome} 
              icon={Home} 
              label="题库首页" 
            />
            {user && (
              <NavItem 
                active={currentView === 'HISTORY'} 
                onClick={onHistoryClick} 
                icon={History} 
                label="答题记录" 
              />
            )}
            {user?.role === 'ADMIN' && (
              <>
                <NavItem 
                  active={currentView === 'ADMIN_DASHBOARD'} 
                  onClick={onAdminDashboardClick} 
                  icon={LayoutDashboard} 
                  label="后台管理" 
                />
                <NavItem 
                  active={currentView === 'REGISTER'} 
                  onClick={onRegisterClick} 
                  icon={UserPlus} 
                  label="注册成员" 
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};