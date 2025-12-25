import React, { useState } from 'react';
import { Button } from './Button';
import { UserRole, User } from '../types';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { Shield, User as UserIcon, AlertCircle, ArrowLeft, Cloud, WifiOff, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onCancel: () => void;
  showRegister?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLoginSuccess, 
  onCancel,
  showRegister = true
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const status = await authService.getUserStatus(username);

      if (status === 'PENDING') {
        setError('您的账号正在审核中，请耐心等待管理员批准。');
        setLoading(false);
        return;
      }

      const user = await authService.login(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        if (status === 'NOT_FOUND') {
           setError('用户名或密码错误。');
        } else {
           setError('密码错误');
        }
      }
    } catch (err) {
      setError('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">登录账号</h2>
          <p className="mt-2 text-sm text-gray-600">登录后解锁完整题库练习功能</p>
        </div>

        {isSupabaseConfigured ? (
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-xs text-green-700 flex gap-2">
             <Cloud size={16} className="flex-shrink-0 mt-0.5" />
             <p>系统已开启<b>云端模式</b>。您的账号数据存储在云端服务器，可在任意设备登录使用。</p>
          </div>
        ) : (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-700 flex gap-2">
             <WifiOff size={16} className="flex-shrink-0 mt-0.5" />
             <p>系统处于<b>离线模式</b>。账号数据保存在当前设备浏览器中，不同设备间数据不互通。</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input type="text" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm" placeholder="请输入用户名" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input type="password" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="flex gap-4">
             <Button type="button" variant="outline" className="w-full" onClick={onCancel} disabled={loading}>取消</Button>
             <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>{loading ? '登录中...' : '登录'}</Button>
          </div>
        </form>

        {showRegister && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              还没有账号？
              <button 
                onClick={() => (window as any).dispatchEvent(new CustomEvent('switchView', { detail: 'REGISTER' }))}
                className="ml-1 text-red-600 font-bold hover:underline"
              >
                立即注册申请
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface RegisterViewProps {
  onRegisterSuccess: () => void;
  onCancel: () => void;
  isAdminMode?: boolean;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess, onCancel, isAdminMode = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [invitedBy, setInvitedBy] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (username.length < 3) { setError('用户名长度至少3位'); return; }
    if (password.length < 3) { setError('密码长度至少3位'); return; }

    setLoading(true);

    try {
      const initialStatus = isAdminMode ? 'ACTIVE' : 'PENDING';
      const result = await authService.register(username, password, role, initialStatus, invitedBy);

      if (result.success) {
        if (isAdminMode) {
          setSuccess('用户 ' + username + ' 创建成功！');
          setTimeout(() => onRegisterSuccess(), 2000);
        } else {
          setSuccess('注册申请已提交！');
        }
        setUsername('');
        setPassword('');
        setInvitedBy('');
      } else {
        if (result.error === 'REGISTRATION_DISABLED') {
          setError('当前阶段无法注册，请微信公众号私信留言。');
        } else if (result.error === 'USER_EXISTS') {
          setError('用户名已存在，请尝试其他名称。');
        } else {
          setError('注册失败: ' + (result.error || '未知错误'));
        }
      }
    } catch (err) {
      setError('注册失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className={isAdminMode ? 'mx-auto h-12 w-12 rounded-full flex items-center justify-center bg-blue-100' : 'mx-auto h-12 w-12 rounded-full flex items-center justify-center bg-green-100'}>
            {isAdminMode ? <Shield className="h-6 w-6 text-blue-600" /> : <UserIcon className="h-6 w-6 text-green-600" />}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{isAdminMode ? '管理员后台：添加用户' : '注册新账号'}</h2>
          <p className="mt-2 text-sm text-gray-600">{isAdminMode ? '创建新的成员或管理员账号' : '提交注册申请，审核通过后即可登录'}</p>
        </div>

        {!success ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input type="text" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设置密码</label>
                <input type="text" required className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" disabled={loading} />
              </div>
              {!isAdminMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邀请人用户名 (可选)</label>
                  <input type="text" className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={invitedBy} onChange={(e) => setInvitedBy(e.target.value)} placeholder="输入推荐您的用户名" disabled={loading} />
                </div>
              )}
              {isAdminMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色权限</label>
                  <select className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" value={role} onChange={(e) => setRole(e.target.value as UserRole)} disabled={loading}>
                    <option value="MEMBER">普通成员 (仅答题)</option>
                    <option value="ADMIN">管理员 (答题 + 管理用户)</option>
                  </select>
                </div>
              )}
            </div>

            {!isAdminMode && (
              <div className={isSupabaseConfigured ? 'p-3 rounded-lg border text-xs flex gap-2 bg-blue-50 border-blue-100 text-blue-800' : 'p-3 rounded-lg border text-xs flex gap-2 bg-orange-50 border-orange-100 text-orange-800'}>
                 <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                 {isSupabaseConfigured ? (
                   <p><b>提示：</b>注册申请提交后，管理员会在云端收到您的申请并进行审核。审核通过后您可以在任意设备登录。</p>
                 ) : (
                   <p><b>重要提示：</b>注册信息仅保存在本设备。管理员必须在<b>本设备</b>上登录后台才能看到并批准您的申请。</p>
                 )}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="flex gap-4">
               <Button type="button" variant="outline" className="w-full" onClick={onCancel} disabled={loading}><ArrowLeft size={16} className="mr-2" />返回</Button>
               <Button type="submit" className={isAdminMode ? 'w-full bg-blue-600 hover:bg-blue-700' : 'w-full bg-green-600 hover:bg-green-700'} disabled={loading}>{loading ? '提交中...' : (isAdminMode ? '确认创建' : '提交申请')}</Button>
            </div>
          </form>
        ) : (
          <div className="mt-8">
            {isAdminMode ? (
              <div className="rounded-md bg-green-50 p-6 flex flex-col items-center gap-4 text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                <div className="text-green-800 font-medium text-lg">{success}</div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-md bg-green-50 p-4 flex flex-col items-center gap-2 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div className="text-green-800 font-medium text-lg">{success}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-lg font-bold text-red-700 mb-2">感谢支持！目前价格 6元/账号！</p>
                  <p className="text-gray-700 text-sm">请扫描下方二维码付款，并将<span className="font-bold">付款截图和用户名</span>发送至微信公众号后台。</p>
                  <p className="text-gray-500 text-xs mt-1">（平台目前是人工客服，付款后两小时内会审核通过）</p>
                  <p className="text-gray-500 text-xs mt-1">如有问题，请微信公众号后台私信！</p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><img src="/wechat.jpg" alt="微信公众号" className="w-48 h-auto object-contain rounded" /></div>
                    <span className="text-sm text-gray-600 font-medium">① 关注公众号发送截图</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><img src="/qrcode.jpg" alt="付款码" className="w-48 h-auto object-contain rounded" /></div>
                    <span className="text-sm text-gray-600 font-medium">② 扫码支付 6元</span>
                  </div>
                </div>
                <Button onClick={onCancel} className="w-full bg-gray-800 hover:bg-gray-700">返回首页</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
