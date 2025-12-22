import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { authService, StoredUser } from '../services/authService';
import { historyService } from '../services/historyService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { Shield, Users, Eye, EyeOff, ArrowLeft, Key, Sparkles, ToggleLeft, ToggleRight, UserPlus, X, Check, Cloud, RefreshCw, WifiOff } from 'lucide-react';

interface AdminDashboardProps {
  onGoHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoHome }) => {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        authService.getAllUsers(),
        historyService.getAllUserStats()
      ]);
      setUsers(usersData);
      setExamCounts(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const activeUsers = users.filter(u => u.status === 'ACTIVE' || !u.status);

  const togglePasswordVisibility = (username: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  const handleEditPassword = async (user: StoredUser) => {
    const newPassword = window.prompt(`正在修改用户【${user.username}】的密码。\n请输入新密码:`);
    if (newPassword !== null && newPassword.trim() !== '') {
      const success = await authService.updatePassword(user.username, newPassword);
      if (success) {
        alert('密码修改成功！');
        loadData();
      } else {
        alert('修改失败。');
      }
    }
  };

  const handleToggleAi = async (user: StoredUser) => {
    const newStatus = !user.aiEnabled;
    const success = await authService.updateAiAccess(user.username, newStatus);
    if (success) {
      loadData();
    }
  };

  const handleApprove = async (username: string) => {
    if (confirm(`确定批准用户 ${username} 的注册申请吗？`)) {
      await authService.approveUser(username);
      loadData();
    }
  };

  const handleReject = async (username: string) => {
    if (confirm(`确定拒绝并删除用户 ${username} 的申请吗？`)) {
      await authService.rejectUser(username);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
               <Shield className="h-6 w-6 text-blue-600" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-900">管理员控制台</h2>
               <p className="text-sm text-gray-500">用户管理与数据维护</p>
             </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw size={16} className="mr-2" /> 刷新
            </Button>
            <Button variant="outline" onClick={onGoHome}>
              <ArrowLeft size={16} className="mr-2" /> 返回首页
            </Button>
          </div>
        </div>

        {isSupabaseConfigured ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Cloud className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-green-800">
              <p className="font-bold mb-1">云端模式已启用</p>
              <p>所有用户数据存储在云端服务器，您在此处的操作将实时同步到所有设备。</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <WifiOff className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-bold mb-1">本地离线模式</p>
              <p>云端服务未配置，数据仅保存在当前设备浏览器中。不同设备间数据不互通。</p>
            </div>
          </div>
        )}

        {/* Pending Registrations Section */}
        {pendingUsers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
             <div className="p-6 border-b border-orange-100 bg-orange-50 flex items-center gap-2">
                <UserPlus className="text-orange-500" size={20} />
                <h3 className="font-bold text-orange-800">待审核注册申请 ({pendingUsers.length})</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-orange-50/50">
                    <tr className="text-orange-900 text-sm">
                      <th className="px-6 py-3 font-medium">申请用户名</th>
                      <th className="px-6 py-3 font-medium text-right">审核操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {pendingUsers.map(user => (
                      <tr key={user.username} className="hover:bg-orange-50/30">
                        <td className="px-6 py-4 font-semibold text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(user.username)}
                          >
                            <Check size={16} className="mr-1" /> 批准
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleReject(user.username)}
                          >
                            <X size={16} className="mr-1" /> 拒绝
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Active Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Users className="text-gray-400" size={20} />
            <h3 className="font-bold text-gray-800">正式用户列表</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="px-6 py-4 font-medium">用户名</th>
                  <th className="px-6 py-4 font-medium">身份权限</th>
                  <th className="px-6 py-4 font-medium text-center">AI 解析权限</th>
                  <th className="px-6 py-4 font-medium text-center">累计答题 (次)</th>
                  <th className="px-6 py-4 font-medium text-right">操作管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeUsers.map((user) => (
                  <tr key={user.username} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{user.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {user.role === 'ADMIN' ? '管理员' : '普通成员'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleAi(user)}
                        className={`flex items-center gap-1 mx-auto px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.aiEnabled
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={user.aiEnabled ? "点击关闭 AI 解析" : "点击开启 AI 解析"}
                      >
                         <Sparkles size={12} />
                         {user.aiEnabled ? '已开启' : '已关闭'}
                         {user.aiEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-gray-700">
                        {examCounts[user.id || ''] || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEditPassword(user)}
                      >
                        <Key size={14} className="mr-1.5" />
                        修改密码
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
