import React, { useState } from 'react';
import { Button } from './Button';
import { UserRole, User } from '../types';
import { authService } from '../services/authService';
import { Shield, User as UserIcon, Lock, AlertCircle, ArrowLeft, Clock, WifiOff, CheckCircle2, Copy } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onCancel: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // First check status to provide better error messages
    const status = authService.getUserStatus(username);
    
    if (status === 'PENDING') {
      setError('您的账号正在审核中，请耐心等待管理员批准。');
      return;
    }

    const user = authService.login(username, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      if (status === 'NOT_FOUND') {
         setError('用户名或密码错误。注意：不同设备数据不互通，请确认您是在本机注册的。');
      } else {
         setError('密码错误');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            登录账号
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            登录后解锁完整题库练习功能
          </p>
        </div>
        
        {/* Offline Warning */}
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-700 flex gap-2">
           <WifiOff size={16} className="flex-shrink-0 mt-0.5" />
           <p>系统处于<b>离线模式</b>。账号数据保存在当前设备浏览器中。如果您更换了手机或电脑，需要重新注册或联系管理员导入数据。</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="flex gap-4">
             <Button type="button" variant="outline" className="w-full" onClick={onCancel}>取消</Button>
             <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">登录</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RegisterViewProps {
  onRegisterSuccess: () => void;
  onCancel: () => void;
  isAdminMode?: boolean; // True if an admin is creating a user, false if a guest is signing up
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess, onCancel, isAdminMode = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (username.length < 3) {
      setError('用户名长度至少3位');
      return;
    }
    if (password.length < 3) {
      setError('密码长度至少3位');
      return;
    }

    // Admin creates ACTIVE users immediately. Guests create PENDING users.
    const initialStatus = isAdminMode ? 'ACTIVE' : 'PENDING';
    
    const isSuccess = authService.register(username, password, role, initialStatus);
    
    if (isSuccess) {
      if (isAdminMode) {
        setSuccess(`用户 ${username} 创建成功！`);
        // Admin mode returns to list shortly
        setTimeout(() => onRegisterSuccess(), 2000);
      } else {
        setSuccess('申请提交成功');
      }
      setIsSubmitted(true);
    } else {
      setError('用户名已存在');
    }
  };

  if (isSubmitted && !isAdminMode) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-red-100/50 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-100/50 blur-[80px] pointer-events-none" />

        <div className="max-w-3xl w-full relative z-10">
          {/* Glassmorphism Success Card */}
          <div className="backdrop-blur-xl bg-white/60 border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.10)] rounded-3xl p-8 md:p-10 text-center">
             
             <div className="mb-6 inline-flex items-center justify-center p-3 bg-green-100 rounded-full">
               <CheckCircle2 className="h-10 w-10 text-green-600" />
             </div>

             <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
               注册申请已提交
             </h2>
             
             <div className="bg-red-50/80 border border-red-100 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
               <p className="text-lg font-bold text-red-700 mb-2">
                 感谢支持！目前价格 6元/账号！
               </p>
               <p className="text-gray-700">
                 请扫描下方二维码付款，并将<span className="font-bold">付款截图</span>及<span className="font-bold">您的注册用户名 ({username})</span> 发送至微信公众号后台。
               </p>
               <p className="text-sm text-gray-500 mt-2">
                 如有问题，请微信公众号后台私信！
               </p>
             </div>

             <div className="grid md:grid-cols-2 gap-8 items-center justify-center mb-10">
                {/* Official Account */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm w-full max-w-[240px]">
                    <img 
                      src="/wechat.jpg" 
                      alt="微信搜一搜 清言观" 
                      className="w-full rounded"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">① 关注公众号发送截图</span>
                </div>

                {/* Payment Code */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <img 
                      src="/qrcode.jpg" 
                      alt="付款码/赞赏码" 
                      className="w-40 h-40 rounded-full object-cover"
                    />
                  </div>
                   <span className="text-sm font-medium text-gray-600">② 扫码支付 6元</span>
                </div>
             </div>

             <Button 
               onClick={onCancel} 
               className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
             >
               返回首页
             </Button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Mode Success View (Simple)
  if (isSubmitted && isAdminMode) {
    return (
       <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{success}</h2>
            <p className="text-gray-500">即将返回用户列表...</p>
          </div>
       </div>
    );
  }

  // Standard Form View
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${isAdminMode ? 'bg-blue-100' : 'bg-green-100'}`}>
            {isAdminMode ? <Shield className="h-6 w-6 text-blue-600" /> : <UserIcon className="h-6 w-6 text-green-600" />}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isAdminMode ? '管理员后台：添加用户' : '注册新账号'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isAdminMode ? '创建新的成员或管理员账号' : '提交注册申请，审核通过后即可登录'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设置密码</label>
                <input
                  type="text" 
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                />
              </div>
              
              {/* Only Admins can choose roles. Guests are always MEMBERs */}
              {isAdminMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色权限</label>
                  <select
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="MEMBER">普通成员 (仅答题)</option>
                    <option value="ADMIN">管理员 (答题 + 管理用户)</option>
                  </select>
                </div>
              )}
            </div>
            
            {!isAdminMode && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-xs text-orange-800 flex gap-2">
                 <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                 <p><b>重要提示：</b>注册后需要管理员审核。建议注册后立即按提示联系管理员，以加快审核速度。</p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="flex gap-4">
               <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                 <ArrowLeft size={16} className="mr-2" />
                 返回
               </Button>
               <Button 
                type="submit" 
                className={`w-full ${isAdminMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
               >
                 {isAdminMode ? '确认创建' : '提交申请'}
               </Button>
            </div>
          </form>
      </div>
    </div>
  );
};