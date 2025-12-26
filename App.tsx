import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnnouncementModal } from './components/Announcement';
import { ExamCard } from './components/ExamCard';
import { LoginView, RegisterView } from './components/AuthViews';
import { ChangePasswordView } from './components/ChangePasswordView';
import { ContactView } from './components/ContactView';
import { EXAMS } from './constants';
import { STATIC_CLOUD_EXAMS } from './cloud_data';
import { Exam, ExamResult, User } from './types';
import { authService } from './services/authService';
import { historyService } from './services/historyService';
import { permissionService, ExamPermission } from './services/permissionService';
import { systemService } from './services/systemService';
import { examService } from './services/examService';
import { GraduationCap, Search, TrendingUp, Lock, Star, Wrench, RefreshCcw, Loader2 } from 'lucide-react';

// Lazy load heavy components to reduce initial bundle size
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ExamPlayer = React.lazy(() => import('./components/ExamPlayer').then(m => ({ default: m.ExamPlayer })));
const ResultView = React.lazy(() => import('./components/ResultView').then(m => ({ default: m.ResultView })));
const HistoryView = React.lazy(() => import('./components/HistoryView').then(m => ({ default: m.HistoryView })));
const CollectionView = React.lazy(() => import('./components/CollectionView').then(m => ({ default: m.CollectionView })));

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('HOME');

  // Broadcast view changes to non-React elements (like speed booster in index.html)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('switchView', { detail: view }));
  }, [view]);

  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  
  // Static-First Strategy: HOME view always uses pre-compiled STATIC_CLOUD_EXAMS
  const [cloudExams, setCloudExams] = useState<Exam[]>(STATIC_CLOUD_EXAMS); 
  const [isLiveActive, setIsLiveActive] = useState(true); 

  // Load user on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // Listen for cross-component view switches
    const handleSwitchView = (e: any) => {
      if (e.detail) {
        setView(e.detail);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('switchView', handleSwitchView);
    return () => window.removeEventListener('switchView', handleSwitchView);
  }, []);

  const handleStartExam = async (exam: Exam) => {
    if (!currentUser) {
      setView('LOGIN');
      window.scrollTo(0, 0);
      return;
    }

    // Dynamic checks only when starting (On-demand fetching)
    try {
      // 1. Domain-aware Maintenance Check
      const isZeabur = window.location.hostname === 'marx.zeabur.app';
      const maintKey = isZeabur ? 'maintenance_mode_zeabur' : 'maintenance_mode_cloudflare';
      
      const isMaint = await systemService.isEnabled(maintKey);
      if (isMaint && currentUser.role !== 'ADMIN') {
        alert(`系统正在进行${isZeabur ? '主站' : '镜像站'}维护，暂时无法开始考试，请稍后再试。`);
        return;
      }

      // 2. Check permissions for this specific exam
      const perm = await permissionService.getPermission(exam.id);
      const isHighLevelUser = currentUser.role === 'ADMIN' || currentUser.role === 'VIP';
      if (perm) {
        if (perm.min_role === 'ADMIN' && !isHighLevelUser) {
          alert('该题库目前仅限高级用户及管理员访问。');
          return;
        }
        if (!perm.is_public && !isHighLevelUser) {
          alert('该题库尚未公开。');
          return;
        }
      }
    } catch (err) {
      console.warn("Permission check skipped due to network", err);
    }

    // OPTIMIZATION: Prioritize pre-compiled STATIC_CLOUD_EXAMS for instant load
    const staticExam = STATIC_CLOUD_EXAMS.find(e => e.id === exam.id);
    if (staticExam && staticExam.questions.length > 0) {
      setActiveExam(staticExam);
      setIsLiveActive(true);
    } else {
      // Fallback: Fetch LIVE questions from DB if not in static file
      try {
        const liveQuestions = await examService.getQuestions(exam.id);
        if (liveQuestions && liveQuestions.length > 0) {
          setActiveExam({ ...exam, questions: liveQuestions });
          setIsLiveActive(true);
        } else {
          setActiveExam(exam);
          setIsLiveActive(false);
        }
      } catch (err: any) {
        setActiveExam(exam);
        setIsLiveActive(false);
      }
    }

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

  const handleViewHistoryDetail = async (result: ExamResult) => {
    // 1. Try pre-compiled static cloud source first (fastest)
    let exam = STATIC_CLOUD_EXAMS.find(e => e.id === result.examId);
    
    if (exam && exam.questions.length > 0) {
      setActiveExam(exam);
      setIsLiveActive(true);
    } else {
      // 2. Fallback to live fetching
      try {
        const liveQuestions = await examService.getQuestions(result.examId);
        if (liveQuestions && liveQuestions.length > 0) {
          const baseExam = cloudExams.find(e => e.id === result.examId) || EXAMS.find(e => e.id === result.examId);
          if (baseExam) setActiveExam({ ...baseExam, questions: liveQuestions });
          setIsLiveActive(true);
        }
      } catch (err) {
        // ... handled below
      }
    }

    if (activeExam || exam) {
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

  const LoadingScreen = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="h-10 w-10 text-red-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse text-sm">正在加载组件...</p>
    </div>
  );

  // ==================== Render Logic ====================

  // 2. Normal View Rendering
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
          showRegister={true}
        />
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          onCancel={handleGoHome} 
          showRegister={true}
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
      <React.Suspense fallback={<LoadingScreen />}>
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
          showRegister={true}
        />
        <AdminDashboard 
          onGoHome={handleGoHome} 
          onSettingChange={() => {
            // Only update local view if needed
            alert('设置已更新，刷新页面生效。');
          }}
        />
      </React.Suspense>
    );
  }

  if (view === 'HISTORY' && currentUser) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
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
      </React.Suspense>
    );
  }

  if (view === 'EXAM' && activeExam && currentUser) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <ExamPlayer 
          exam={activeExam} 
          onFinish={handleFinishExam} 
          onExit={handleGoHome} 
          isCloud={isLiveActive}
        />
      </React.Suspense>
    );
  }

  if (view === 'RESULT' && activeExam && examResult) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
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
      </React.Suspense>
    );
  }

  if (view === 'COLLECTION' && currentUser) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <CollectionView user={currentUser} onGoHome={handleGoHome} />
      </React.Suspense>
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
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-red-600" />
              热门练习章节
            </h2>
            {currentUser && (
              <button 
                onClick={() => setView('COLLECTION')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm font-bold border border-yellow-200 hover:bg-yellow-100 transition-colors shadow-sm"
              >
                <Star size={14} fill="currentColor" /> 题目收藏
              </button>
            )}
          </div>
          {!currentUser && (
             <span className="text-sm text-gray-500 flex items-center gap-1">
               <Lock size={14} /> 登录后解锁答题
             </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {cloudExams.map(exam => {
            // Decoupled Logic: Only lock if NOT logged in. 
            // Permissions are checked inside handleStartExam on-demand.
            return (
              <ExamCard 
                key={exam.id} 
                exam={exam} 
                onStart={handleStartExam}
                isLocked={!currentUser}
              />
            );
          })}
          
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