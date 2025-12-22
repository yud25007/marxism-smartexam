import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { authService, StoredUser } from '../services/authService';
import { historyService } from '../services/historyService';
import { Shield, Users, Eye, EyeOff, Edit, ArrowLeft, Key, Sparkles, ToggleLeft, ToggleRight, UserPlus, X, Check, Database, Download, Upload, AlertTriangle } from 'lucide-react';

interface AdminDashboardProps {
  onGoHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoHome }) => {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [usersData, countsData] = await Promise.all([authService.getAllUsers(), historyService.getAllUserStats()]); setUsers(usersData);
    setExamCounts(countsData);
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

  // --- Data Export/Import Logic ---

  const handleExport = () => {
    const data: Record<string, string> = {};
    // Iterate all localStorage keys starting with 'smart_exam_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('smart_exam_')) {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = value;
        }
      }
    }
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_exam_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      if (!importData.trim()) {
        alert('请输入或粘贴备份数据 JSON。');
        return;
      }
      const data = JSON.parse(importData);
      
      if (confirm('警告：导入数据将覆盖当前设备上的所有用户和答题记录，确定继续吗？')) {
        // Clear current app data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
           const key = localStorage.key(i);
           if (key && key.startsWith('smart_exam_')) {
             keysToRemove.push(key);
           }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Restore new data
        Object.keys(data).forEach(key => {
          if (key.startsWith('smart_exam_')) {
            localStorage.setItem(key, data[key]);
          }
        });

        alert('数据导入成功！页面将刷新。');
        window.location.reload();
      }
    } catch (e) {
      alert('数据格式错误，请确保复制的是完整的 JSON 内容。');
      console.error(e);
    }
  };

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
          <Button variant="outline" onClick={onGoHome}>
            <ArrowLeft size={16} className="mr-2" /> 返回首页
          </Button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-yellow-800">
            <p className="font-bold mb-1">系统运行模式提示</p>
            <p>当前系统运行在<b>本地离线模式</b>。不同设备（如手机和电脑）之间的数据互不相通。</p>
            <p className="mt-1">如果您在电脑上批准了用户，该用户必须使用这台电脑才能登录。如需在其他设备使用，请使用下方的<b>“数据备份与恢复”</b>功能手动同步数据。</p>
          </div>
        </div>

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
                      <th className="px-6 py-3 font-medium">申请密码</th>
                      <th className="px-6 py-3 font-medium text-right">审核操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {pendingUsers.map(user => (
                      <tr key={user.username} className="hover:bg-orange-50/30">
                        <td className="px-6 py-4 font-semibold text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono">{user.password}</td>
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
                  <th className="px-6 py-4 font-medium">密码详情</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {visiblePasswords[user.username] ? user.password : '••••••'}
                        </span>
                        <button 
                          onClick={() => togglePasswordVisibility(user.username)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                          title={visiblePasswords[user.username] ? "隐藏密码" : "显示密码"}
                        >
                          {visiblePasswords[user.username] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
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
                        {examCounts[user.username] || 0}
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

        {/* Data Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Database className="text-purple-600" size={20} />
            <h3 className="font-bold text-gray-800">数据备份与恢复 (手动同步)</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              由于本系统为离线版本，不同设备间数据不互通。您可以通过以下功能将“当前设备”的所有数据（用户、成绩）导出，并发送到“其他设备”进行导入，从而实现手动同步。
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                   <Download size={16} /> 导出数据 (备份)
                 </h4>
                 <p className="text-xs text-gray-500">将当前设备的所有数据打包下载为 JSON 文件。</p>
                 <Button onClick={handleExport} variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                   下载备份文件
                 </Button>
               </div>

               <div className="space-y-4">
                 <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                   <Upload size={16} /> 导入数据 (恢复)
                 </h4>
                 <p className="text-xs text-gray-500">将备份内容粘贴到下方文本框，点击导入以覆盖当前设备数据。</p>
                 {!showImport ? (
                    <Button onClick={() => setShowImport(true)} variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                      开始导入
                    </Button>
                 ) : (
                   <div className="space-y-3">
                     <textarea 
                       className="w-full h-32 p-3 text-xs border rounded-md font-mono"
                       placeholder='请粘贴 JSON 内容...'
                       value={importData}
                       onChange={e => setImportData(e.target.value)}
                     />
                     <div className="flex gap-2">
                        <Button onClick={handleImport} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                          确认覆盖导入
                        </Button>
                        <Button onClick={() => setShowImport(false)} size="sm" variant="ghost" className="flex-1">
                          取消
                        </Button>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};