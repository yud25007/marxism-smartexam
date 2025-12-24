import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnnouncementModal } from './components/Announcement';
import { ExamCard } from './components/ExamCard';
import { ExamPlayer } from './components/ExamPlayer';
import { ResultView } from './components/ResultView';
import { LoginView, RegisterView } from './components/AuthViews';
import { HistoryView } from './components/HistoryView';
import { ChangePasswordView } from './components/ChangePasswordView';
import { AdminDashboard } from './components/AdminDashboard';
import { ContactView } from './components/ContactView';
import { EXAMS } from './constants';
import { Exam, ExamResult, User } from './types';
import { authService } from './services/authService';
import { historyService } from './services/historyService';
import { GraduationCap, Search, TrendingUp, Lock } from 'lucide-react';

type AppState = 'HOME' | 'EXAM' | 'RESULT' | 'LOGIN' | 'REGISTER' | 'HISTORY' | 'CHANGE_PASSWORD' | 'ADMIN_DASHBOARD' | 'CONTACT';

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('HOME');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Load user on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleStartExam = (exam: Exam) => {
    if (!currentUser) {
      setView('LOGIN');
      window.scrollTo(0, 0);
      return;
    }
    setActiveExam(exam);
    setView('EXAM');
    window.scrollTo(0, 0);
  };

  const handleFinishExam = async (result: ExamResult) => {
    if (currentUser) {
      await historyService.saveResult(currentUser.username, result);
    }
    setExamResult(result);
    setView('RESULT');
    window.scrollTo(0, 0);
  };

  const handleGoHome = () => {
    setActiveExam(null);
    setExamResult(null);
    setView('HOME');
    window.scrollTo(0, 0);
  };

  const handleRetry = () => {
    setView('EXAM');
    window.scrollTo(0, 0);
  };

  const handleHistoryClick = async () => {
    if (currentUser) {
      const userHistory = await historyService.getHistory(currentUser.username);
      setHistory(userHistory);
      setView('HISTORY');
      window.scrollTo(0, 0);
    }
  };

  const handleViewHistoryDetail = (result: ExamResult) => {
    const exam = EXAMS.find(e => e.id === result.examId);
    if (exam) {
      setActiveExam(exam);
      setExamResult(result);
      setView('RESULT');
      window.scrollTo(0, 0);
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Ensure history is cleared when a new user logs in, waiting for them to click 'History' to load theirs
    setHistory([]); 
    setView('HOME');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    
    // CRITICAL: Clear all user-specific data from state to ensure independence
    setHistory([]);
    setExamResult(null);
    setActiveExam(null);
    
    setView('HOME');
    window.scrollTo(0, 0);
  };

  const handleRegisterSuccess = () => {
    // Admin adding user: stay on screen or go home
    // Guest registering: The view itself handles the display, user eventually clicks Home
    setView('HOME');
  };

  const handleChangePasswordSuccess = () => {
    // Optionally log out or just go home
    setView('HOME');
  };

  // Render Logic

  if (view === 'CONTACT') {
    return (
      <>
        <AnnouncementModal 
          isOpen={showAnnouncement} 
          onClose={() => setShowAnnouncement(false)} 
        />
        <Header 
          onGoHome={handleGoHome} 
          user={currentUser} 
          onLoginClick={() => setView('LOGIN')}
          onLogoutClick={handleLogout}
          onRegisterClick={() => setView('REGISTER')}
          onHistoryClick={handleHistoryClick}
          onChangePasswordClick={() => setView('CHANGE_PASSWORD')}
          onAdminDashboardClick={() => setView('ADMIN_DASHBOARD')}
          onAnnouncementClick={() => setShowAnnouncement(true)}
          currentView={view}
        />
        <ContactView onGoHome={handleGoHome} />
      </>
    );
  }

  if (view === 'LOGIN') {
    return (
      <>
        <AnnouncementModal 
          isOpen={showAnnouncement} 
          onClose={() => setShowAnnouncement(false)} 
        />
        <Header 
          onGoHome={handleGoHome} 
          user={currentUser} 
          onLoginClick={() => setView('LOGIN')}
          onLogoutClick={handleLogout}
          onRegisterClick={() => setView('REGISTER')}
          onHistoryClick={handleHistoryClick}
          onChangePasswordClick={() => setView('CHANGE_PASSWORD')}
          onAdminDashboardClick={() => setView('ADMIN_DASHBOARD')}
          onAnnouncementClick={() => setShowAnnouncement(true)}
          currentView={view}
        />
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          onCancel={handleGoHome} 
        />
      </>
    );
  }

  if (view === 'REGISTER') {
    // Allow if user is NOT logged in (guest) OR if user is ADMIN.
    // Block if user is a normal MEMBER.
    if (currentUser && currentUser.role !== 'ADMIN') {
      setTimeout(() => setView('HOME'), 0);
      return null;
    }

    return (
      <>
        <AnnouncementModal 
          isOpen={showAnnouncement} 
          onClose={() => setShowAnnouncement(false)} 
        />
        <Header 
          onGoHome={handleGoHome} 
          user={currentUser} 
          onLoginClick={() => setView('LOGIN')}
          onLogoutClick={handleLogout}
          onRegisterClick={() => setView('REGISTER')}
          onHistoryClick={handleHistoryClick}
          onChangePasswordClick={() => setView('CHANGE_PASSWORD')}
          onAdminDashboardClick={() => setView('ADMIN_DASHBOARD')}
          onAnnouncementClick={() => setShowAnnouncement(true)}
          currentView={view}
        />
        <RegisterView 
          onRegisterSuccess={handleRegisterSuccess} 
          onCancel={handleGoHome}
          isAdminMode={!!currentUser && currentUser.role === 'ADMIN'}
        />
      </>
    );
  }

  if (view === 'CHANGE_PASSWORD' && currentUser) {
    return (
      <>
        <AnnouncementModal 
          isOpen={showAnnouncement} 
          onClose={() => setShowAnnouncement(false)} 
        />
        <Header 
          onGoHome={handleGoHome} 
          user={currentUser} 
          onLoginClick={() => setView('LOGIN')}
          onLogoutClick={handleLogout}
          onRegisterClick={() => setView('REGISTER')}
          onHistoryClick={handleHistoryClick}
          onChangePasswordClick={() => setView('CHANGE_PASSWORD')}
          onAdminDashboardClick={() => setView('ADMIN_DASHBOARD')}
          onAnnouncementClick={() => setShowAnnouncement(true)}
          currentView={view}
        />
        <ChangePasswordView 
          currentUser={currentUser}
          onSuccess={handleChangePasswordSuccess}
          onCancel={handleGoHome}
        />
      </>
    );
  }

  if (view === 'ADMIN_DASHBOARD') {
    if (currentUser?.role !== 'ADMIN') {
      setTimeout(() => setView('HOME'), 0);
      return null;
    }
    return (
      <>
        <AnnouncementModal 
          isOpen={showAnnouncement} 
          onClose={() => setShowAnnouncement(false)} 
        />
        <Header 
          onGoHome={handleGoHome} 
          user={currentUser} 
          onLoginClick={() => setView('LOGIN')}
          onLogoutClick={handleLogout}
          onRegisterClick={() => setView('REGISTER')}
          onHistoryClick={handleHistoryClick}
          onChangePasswordClick={() => setView('CHANGE_PASSWORD')}
          onAdminDashboardClick={() => setView('ADMIN_DASHBOARD')}
          onAnnouncementClick={() => setShowAnnouncement(true)}
          currentView={view}
        />
        <AdminDashboard onGoHome={handleGoHome} />
      </>
    );
  }

  if (view === 'HISTORY' && currentUser) {
    return (
      <>
        <AnnouncementModal 
          isOpen={showAnnouncement} 
          onClose={() => setShowAnnouncement(false)} 
        />
        <Header 
          onGoHome={handleGoHome} 
          user={currentUser} 
          onLoginClick={() => setView('LOGIN')}
          onLogoutClick={handleLogout}
          onRegisterClick={() => setView('REGISTER')}
          onHistoryClick={handleHistoryClick}
          onChangePasswordClick={() => setView('CHANGE_PASSWORD')}
          onAdminDashboardClick={() => setView('ADMIN_DASHBOARD')}
          onAnnouncementClick={() => setShowAnnouncement(true)}
          currentView={view}
        />
        <HistoryView 
          history={history}
          onViewDetail={handleViewHistoryDetail}
          onGoHome={handleGoHome}
        />
      </>
    );
  }

  if (view === 'EXAM' && activeExam && currentUser) {
    return (
      <ExamPlayer 
        exam={activeExam} 
        onFinish={handleFinishExam} 
        onExit={handleGoHome} 
      />
    );
  }

  if (view === 'RESULT' && activeExam && examResult) {
    return (
      <>
        <AnnouncementModal 
          isOpen={showAnnouncement} 
          onClose={() => setShowAnnouncement(false)} 
        />
        <Header 
          onGoHome={handleGoHome} 
          user={currentUser} 
          onLoginClick={() => setView('LOGIN')}
          onLogoutClick={handleLogout}
          onRegisterClick={() => setView('REGISTER')}
          onHistoryClick={handleHistoryClick}
          onChangePasswordClick={() => setView('CHANGE_PASSWORD')}
          onAdminDashboardClick={() => setView('ADMIN_DASHBOARD')}
          onAnnouncementClick={() => setShowAnnouncement(true)}
          currentView={view}
        />
        <ResultView 
          exam={activeExam} 
          result={examResult} 
          user={currentUser}
          onRetry={handleRetry} 
          onGoHome={handleGoHome}
        />
      </>
    );
  }

  // Home View
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <AnnouncementModal 
        isOpen={showAnnouncement} 
        onClose={() => setShowAnnouncement(false)} 
      />
      <Header 
        onGoHome={handleGoHome} 
        user={currentUser} 
        onLoginClick={() => setView('LOGIN')}
        onLogoutClick={handleLogout}
        onRegisterClick={() => setView('REGISTER')}
        onHistoryClick={handleHistoryClick}
        onChangePasswordClick={() => setView('CHANGE_PASSWORD')}
        onAdminDashboardClick={() => setView('ADMIN_DASHBOARD')}
        onAnnouncementClick={() => setShowAnnouncement(true)}
        currentView={view}
      />

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="container mx-auto px-4 py-12 md:py-20 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-2 mb-6 bg-red-50 rounded-full">
            <span className="px-3 py-1 text-xs font-semibold tracking-wide text-red-700 uppercase">
              最新题库已更新
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            马克思主义基本原理 <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-orange-600">
              在线智能专项练习
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10">
            涵盖导论及七大章节重点难点。实时评分、智能解析，助您轻松掌握理论知识。
          </p>
          
          <div className="max-w-md mx-auto relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input 
               type="text" 
               className="block w-full pl-10 pr-4 py-4 border-2 border-gray-100 rounded-2xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm"
               placeholder="搜索章节、知识点..." 
             />
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-red-600" />
            热门练习章节
          </h2>
          {!currentUser && (
             <span className="text-sm text-gray-500 flex items-center gap-1">
               <Lock size={14} /> 登录后解锁答题
             </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {EXAMS.map(exam => (
            <ExamCard 
              key={exam.id} 
              exam={exam} 
              onStart={handleStartExam}
              isLocked={!currentUser}
            />
          ))}
          
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 min-h-[340px] text-center hover:border-gray-300 transition-colors cursor-pointer group">
             <div className="h-14 w-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <GraduationCap className="text-gray-400" size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-900">更多内容敬请期待</h3>
             <p className="text-sm text-gray-500 mt-2 max-w-xs">
               我们会定期更新题库，增加新的章节和真题模拟。
             </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="container mx-auto px-4 py-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">©️2025 清言观 马原在线答题系统</p>
              <div className="flex gap-6">
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">隐私政策</a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">使用条款</a>
                <button onClick={() => setView('CONTACT')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">联系我们</button>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;