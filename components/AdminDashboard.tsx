import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { authService, StoredUser } from '../services/authService';
import { historyService } from '../services/historyService';
import { announcementService, Announcement } from '../services/announcementService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { examService } from '../services/examService';
import { importService } from '../services/importService';
import { systemService, SystemSetting } from '../services/systemService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shield, Users, Eye, EyeOff, ArrowLeft, Key, Sparkles, ToggleLeft, ToggleRight, UserPlus, X, Check, Cloud, RefreshCw, WifiOff, Megaphone, Plus, Trash2, Maximize2, Minimize2, Database, Edit, Settings, Info, Wrench } from 'lucide-react';
import { Exam, Question } from '../types';

interface AdminDashboardProps {
  onGoHome: () => void;
  onSettingChange?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoHome, onSettingChange }) => {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  
  // Announcement states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info' as Announcement['type'],
    image_url: '',
    target_group: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  // Question Management states
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [tempAnswers, setTempAnswers] = useState<number[]>([]);

  // System Settings states
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);

  // Local Sync states
  const [syncServiceStatus, setSyncServiceStatus] = useState<'online' | 'offline'>('offline');
  const [syncConfig, setSyncConfig] = useState({ targetPath: '', port: 3001 });
  const [isLocalSyncing, setIsLocalSyncing] = useState(false);

  useEffect(() => {
    loadData();
    checkSyncService();
  }, []);

  const checkSyncService = async () => {
    try {
      const res = await fetch('http://localhost:3001/status');
      const data = await res.json();
      if (data.status === 'online') {
        setSyncServiceStatus('online');
        setSyncConfig(data.config);
      }
    } catch (e) {
      setSyncServiceStatus('offline');
    }
  };

  const handleLocalSync = async () => {
    setIsLocalSyncing(true);
    try {
      const res = await fetch('http://localhost:3001/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`🎉 同步成功！已更新题库至：\n${data.path}`);
      } else {
        alert('❌ 同步失败: ' + data.error);
      }
    } catch (e) {
      alert('❌ 无法连接到本地同步助手，请确保已在终端运行 node sync_to_source.js');
    } finally {
      setIsLocalSyncing(false);
    }
  };

  const saveSyncConfig = async () => {
    try {
      const res = await fetch('http://localhost:3001/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath: syncConfig.targetPath })
      });
      if (res.ok) {
        alert('✅ 固化位置已更新！');
      }
    } catch (e) {
      alert('❌ 保存失败');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData, announcementData, examData, settingsData] = await Promise.all([
        authService.getAllUsers(),
        historyService.getAllUserStats(),
        announcementService.getAdminAnnouncements(),
        examService.getExams(),
        systemService.getAllSettings()
      ]);
      setUsers(usersData);
      setExamCounts(statsData);
      setAnnouncements(announcementData);
      setExams(examData);
      setSystemSettings(settingsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    const success = await systemService.updateSetting(key, !currentValue);
    if (success) {
      setSystemSettings(prev => prev.map(s => s.key === key ? { ...s, value: !currentValue } : s));
      if (onSettingChange) onSettingChange();
    } else {
      alert('更新设置失败');
    }
  };

  const handleSyncExams = async () => {
    const syncSetting = systemSettings.find(s => s.key === 'allow_sync');
    if (syncSetting && !syncSetting.value) {
      alert('云端同步功能当前已被系统管理员禁用，请在“核心控制中心”开启后再试。');
      return;
    }

    if (!confirm('确定要将本地 constants.ts 中的题库同步到云端吗？这将覆盖云端同 ID 的题目。')) return;
    
    setIsSyncing(true);
    try {
      const res = await importService.syncToCloud();
      if (res.success) {
        alert('🎉 ' + res.message);
        loadData();
      } else {
        alert('❌ 同步失败: ' + res.message + '\n\n请检查：\n1. Supabase SQL 文档中的 RLS 策略是否已运行\n2. 网络连接是否稳定');
      }
    } catch (err: any) {
      alert('❌ 发生异常: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadQuestions = async (examId: string) => {
    setSelectedExamId(examId);
    if (!examId) {
      setQuestions([]);
      return;
    }
    const data = await examService.getQuestions(examId);
    setQuestions(data);
  };

  const handleEditAnswer = (q: Question) => {
    setEditingQuestionId(q.id);
    setTempAnswers([...q.correctAnswers]);
  };

  const toggleTempAnswer = (index: number, isSingle: boolean) => {
    if (isSingle) {
      setTempAnswers([index]);
    } else {
      setTempAnswers(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].sort((a,b) => a-b)
      );
    }
  };

  const saveNewAnswer = async (questionId: string) => {
    console.log(`[Admin] Attempting to update answer for: ${questionId}`);
    const res = await examService.updateQuestionAnswer(questionId, tempAnswers);
    
    if (res.success) {
      alert('✅ ' + res.message);
      setQuestions(prev => prev.map(q => q.id === questionId ? {...q, correctAnswers: tempAnswers} : q));
      setEditingQuestionId(null);
    } else {
      alert('❌ ' + res.message);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert('请填写标题和内容');
      return;
    }
    const success = await announcementService.saveAnnouncement(newAnnouncement);
    if (success) {
      alert('发布成功！');
      setShowAddAnnouncement(false);
      setNewAnnouncement({ title: '', content: '', type: 'info', image_url: '', target_group: '' });
      loadData();
    } else {
      alert('发布失败，请检查数据库配置');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('确定要删除这条公告吗？')) {
      const success = await announcementService.deleteAnnouncement(id);
      if (success) {
        loadData();
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await announcementService.uploadImage(file);
      if (url) {
        setNewAnnouncement(prev => ({ ...prev, image_url: url }));
      } else {
        alert('图片上传失败，请检查 Supabase Storage 配置');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('上传出错');
    } finally {
      setIsUploading(false);
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

  const handleUpdateAiModel = async (username: string, model: string) => {
    const success = await authService.updateAiModel(username, model);
    if (success) {
      loadData();
    } else {
      alert('更新模型失败');
    }
  };

  const handleUpdateRole = async (username: string, role: any) => {
    const success = await authService.updateRole(username, role);
    if (success) {
      loadData();
    } else {
      alert('更新角色失败');
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

  const handleDeleteUser = async (username: string) => {
    if (confirm(`⚠️ 极其重要：确定要永久删除用户【${username}】吗？\n\n该操作将移除其所有账号信息、AI解析权限及登录凭证（其答题历史仍将保留在统计中），此操作无法撤销。`)) {
      const success = await authService.deleteUser(username);
      if (success) {
        alert('用户已永久删除');
        loadData();
      } else {
        alert('删除失败，请检查网络或权限');
      }
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
              <p>云端服务未配置，数据仅保存在当前设备浏览器中。</p>
            </div>
          </div>
        )}

        {/* System Settings Control Center */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <Settings className="text-gray-600" size={20} />
            <h3 className="font-bold text-gray-800">系统核心控制中心</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {systemSettings.map((setting) => {
                // Special handling for maintenance mode split
                if (setting.key === 'maintenance_mode') return null;

                const getIcon = (key: string) => {
                  switch(key) {
                    case 'public_registration': return <UserPlus size={18} />;
                    case 'maintenance_mode_zeabur': return <Database size={18} />;
                    case 'maintenance_mode_cloudflare': return <Cloud size={18} />;
                    case 'allow_sync': return <RefreshCw size={18} />;
                    default: return <Sparkles size={18} />;
                  }
                };
                const getColor = (key: string) => {
                  switch(key) {
                    case 'public_registration': return setting.value ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400';
                    case 'maintenance_mode_zeabur': return setting.value ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400';
                    case 'maintenance_mode_cloudflare': return setting.value ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400';
                    case 'allow_sync': return setting.value ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400';
                    default: return 'bg-blue-50 text-blue-600';
                  }
                };

                return (
                  <div key={setting.key} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg transition-colors ${getColor(setting.key)}`}>
                        {getIcon(setting.key)}
                      </div>
                      <button 
                        onClick={() => handleToggleSetting(setting.key, setting.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${setting.value ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.value ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{setting.description}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        <div className={`w-1.5 h-1.5 rounded-full ${setting.value ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        {setting.value ? '已启用 (Active)' : '已关闭 (Disabled)'}
                      </div>
                    </div>
                  </div>
                );
              })}
              {systemSettings.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-400 italic flex flex-col items-center gap-2">
                  <Info size={24} />
                  <p>未在数据库中检测到系统开关配置，请先运行 SQL 初始化。</p>
                </div>
              )}
            </div>
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
                      <th className="px-6 py-3 font-medium">邀请人</th>
                      <th className="px-6 py-3 font-medium text-right">审核操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {pendingUsers.map(user => (
                      <tr key={user.username} className="hover:bg-orange-50/30">
                        <td className="px-6 py-4 font-semibold text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.invitedBy ? (
                            <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded border border-orange-200">
                              <Users size={12} /> {user.invitedBy}
                            </span>
                          ) : ('-')}
                        </td>
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

        {/* Announcements Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="text-gray-400" size={20} />
              <h3 className="font-bold text-gray-800">系统公告管理</h3>
            </div>
            <Button size="sm" onClick={() => setShowAddAnnouncement(!showAddAnnouncement)}>
              {showAddAnnouncement ? <X size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
              {showAddAnnouncement ? '取消发布' : '发布新公告'}
            </Button>
          </div>

          {showAddAnnouncement && (
            <div className={`p-6 bg-blue-50/50 border-b border-gray-100 space-y-4 ${isEditorExpanded ? 'fixed inset-0 z-[60] bg-white overflow-y-auto' : ''}`}>
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-blue-800">
                    {isEditorExpanded ? '全屏编辑模式' : '发布新公告'}
                  </h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${isPreviewMode ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
                    >
                      {isPreviewMode ? '返回编辑' : '实时预览'}
                    </button>
                    <button 
                      onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                      className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600"
                      title={isEditorExpanded ? "退出全屏" : "全屏编辑"}
                    >
                      {isEditorExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                    {isEditorExpanded && (
                      <button onClick={() => setIsEditorExpanded(false)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><X size={20} /></button>
                    )}
                  </div>
               </div>

               {!isPreviewMode ? (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">公告标题</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="例如：2025期末更新"
                          value={newAnnouncement.title}
                          onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">公告类型</label>
                        <select 
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={newAnnouncement.type}
                          onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                        >
                          <option value="info">普通信息 (蓝色)</option>
                          <option value="warning">重要警告 (橙色)</option>
                          <option value="important">紧急通知 (红色)</option>
                        </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          公告图片 URL (可选)
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://example.com/image.jpg"
                            value={newAnnouncement.image_url}
                            onChange={e => setNewAnnouncement({...newAnnouncement, image_url: e.target.value})}
                          />
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="image-upload"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                            />
                            <label
                              htmlFor="image-upload"
                              className={`flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${isUploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                            >
                              {isUploading ? <RefreshCw size={18} className="animate-spin" /> : <Cloud size={18} />}
                              <span className="ml-2 text-sm font-bold whitespace-nowrap">
                                {isUploading ? '上传中...' : '上传图片'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">目标用户身份 (可选, 留空则全员可见)</label>
                        <select 
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          value={newAnnouncement.target_group}
                          onChange={e => setNewAnnouncement({...newAnnouncement, target_group: e.target.value})}
                        >
                          <option value="">全员可见</option>
                          <option value="MEMBER">普通成员 (MEMBER)</option>
                          <option value="VIP">高级用户 (VIP)</option>
                          <option value="ADMIN">管理员 (ADMIN)</option>
                        </select>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                        详细内容 (支持 Markdown)
                        <span className="text-[10px] text-gray-400">换行请按回车</span>
                      </label>
                      <textarea 
                        className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isEditorExpanded ? 'min-h-[500px]' : 'min-h-[200px]'}`}
                        placeholder="请输入公告的具体内容...可以使用 # 标题，**加粗** 等 Markdown 语法。"
                        value={newAnnouncement.content}
                        onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                      ></textarea>
                   </div>
                 </>
               ) : (
                 <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[300px]">
                       {newAnnouncement.image_url && (
                         <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 max-w-md mx-auto">
                           <img src={newAnnouncement.image_url} alt="Preview" className="w-full h-auto object-cover" />
                         </div>
                       )}
                       <h2 className="text-2xl font-bold mb-4">{newAnnouncement.title || '（暂无标题）'}</h2>
                       <div className="prose prose-blue max-w-none overflow-x-auto">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({node, ...props}) => <table className="border-collapse border border-gray-300 my-4 w-full text-sm" {...props} />,
                              thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                              th: ({node, ...props}) => <th className="border border-gray-300 px-3 py-2 font-bold text-left" {...props} />,
                              td: ({node, ...props}) => <td className="border border-gray-300 px-3 py-2" {...props} />,
                            }}
                          >
                            {newAnnouncement.content || '（暂无内容）'}
                          </ReactMarkdown>
                       </div>
                    </div>
                 </div>
               )}

               <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  {isEditorExpanded && <Button variant="outline" onClick={() => setIsEditorExpanded(false)}>关闭全屏</Button>}
                  <Button onClick={handleAddAnnouncement}>确认发布公告</Button>
               </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="px-6 py-4 font-medium">标题</th>
                  <th className="px-6 py-4 font-medium">类型</th>
                  <th className="px-6 py-4 font-medium">目标分组</th>
                  <th className="px-6 py-4 font-medium">内容摘要</th>
                  <th className="px-6 py-4 font-medium">日期</th>
                  <th className="px-6 py-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">
                      暂无公告，点击右上角发布您的第一条公告。
                    </td>
                  </tr>
                ) : (
                  announcements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {ann.title}
                        {ann.image_url && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500" title="包含图片"></span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${ann.type === 'important' ? 'bg-red-100 text-red-700' : ann.type === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {ann.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ann.target_group ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded border border-gray-200">
                            {ann.target_group}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">全员</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{ann.content}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{ann.date}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="删除公告"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Question Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
            <div className="flex items-center gap-2">
              <Database className="text-indigo-600" size={20} />
              <h3 className="font-bold text-gray-800">题库管理 (云端动态更新)</h3>
            </div>
            <Button size="sm" variant="outline" onClick={handleSyncExams} disabled={isSyncing} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              {isSyncing ? <RefreshCw className="animate-spin mr-1" size={16} /> : <Cloud className="mr-1" size={16} />}同步本地题库
            </Button>
          </div>
          <div className="px-6 py-2 bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-2">
            <Info size={14} />
            <span>提醒：在云端修正答案后，请执行下方“一键发布”流程以同步给全球用户。</span>
          </div>
          
          {/* Local Sync Helper Console */}
          <div className="mx-6 mt-6 p-5 rounded-2xl bg-slate-900 text-white shadow-xl relative border border-slate-700 overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <RefreshCw size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${syncServiceStatus === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                    <h4 className="text-lg font-bold">本地同步助手 (Local Sync Console)</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    {syncServiceStatus === 'online' 
                      ? '已连接本地服务。点击下方按钮直接将云端最新题库写入源码。' 
                      : '未检测到本地服务。请在项目根目录运行: node sync_to_source.js'}
                  </p>
                </div>
                {syncServiceStatus === 'online' && (
                  <Button 
                    onClick={handleLocalSync} 
                    disabled={isLocalSyncing}
                    className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20 py-6 px-8 rounded-xl"
                  >
                    {isLocalSyncing ? <RefreshCw className="animate-spin mr-2" /> : <Database className="mr-2" />}
                    {isLocalSyncing ? '正在抓取云端并保存...' : '立即拉取最新题库'}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">固化的源码位置</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm font-mono text-blue-300 outline-none focus:border-blue-500"
                      value={syncConfig.targetPath}
                      onChange={e => setSyncConfig({...syncConfig, targetPath: e.target.value})}
                      placeholder="E:/path/to/cloud_data.ts"
                    />
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={saveSyncConfig}>
                      固化位置
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">一旦填入，下次启动将自动识别此路径。</p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h5 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1">
                    <Info size={14} className="text-blue-400" /> 同步逻辑说明
                  </h5>
                  <ul className="text-[10px] text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>该操作将直接修改本地磁盘上的 <span className="text-blue-300">cloud_data.ts</span> 文件。</li>
                    <li>同步完成后，刷新首页即可看到最新的题库内容（无需等待 API）。</li>
                    <li>若要让全球用户生效，仍需进行常规的 <span className="text-white font-bold">git push</span>。</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">选择要编辑的题库章节</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={selectedExamId}
                  onChange={(e) => loadQuestions(e.target.value)}
                >
                  <option value="">-- 请选择章节 --</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title} ({ex.questionCount}题)</option>
                  ))}
                </select>
              </div>
              <div className="pt-5">
                <p className="text-xs text-gray-400">选择章节后，下方将显示该章节所有题目，您可以直接修改标准答案并保存。</p>
              </div>
            </div>

            {questions.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="text-gray-500 text-xs border-b border-gray-200">
                        <th className="px-4 py-3 font-bold w-16">题号</th>
                        <th className="px-4 py-3 font-bold">题目文本 (预览)</th>
                        <th className="px-4 py-3 font-bold w-48 text-center">当前标准答案</th>
                        <th className="px-4 py-3 font-bold w-32 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {questions.map((q, idx) => (
                        <tr key={q.id} className="hover:bg-indigo-50/20 transition-colors text-sm">
                          <td className="px-4 py-4 text-gray-400 font-mono">{idx + 1}</td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900 line-clamp-2" title={q.text}>{q.text}</div>
                            <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{q.type}</div>
                          </td>
                        <td className="px-4 py-3 text-center">
                          {editingQuestionId === q.id ? (
                            <div className="flex justify-center gap-1">
                              {q.type === 'SHORT_ANSWER' ? (
                                <span className="text-xs text-gray-400 italic">简答题需在解析界面修改</span>
                              ) : (
                                q.options.map((_, i) => (
                                  <button key={i} onClick={() => toggleTempAnswer(i, q.type.includes('SINGLE') || q.type.includes('TRUE'))} className={`w-6 h-6 rounded text-[10px] font-bold ${tempAnswers.includes(i) ? 'bg-green-600 text-white' : 'bg-white border text-gray-400'}`}>{String.fromCharCode(65+i)}</button>
                                ))
                              )}
                            </div>
                          ) : (
                            <span className="text-green-600 font-bold">
                              {q.type === 'SHORT_ANSWER' ? 'SA' : q.correctAnswers.map(i => String.fromCharCode(65+i)).join('')}
                            </span>
                          )}
                        </td>
                          <td className="px-4 py-4 text-right">
                            {editingQuestionId === q.id ? (
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => saveNewAnswer(q.id)}
                                  className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                                  title="保存修改"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => setEditingQuestionId(null)}
                                  className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                  title="取消"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleEditAnswer(q)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                title="修改答案"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

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
                  <th className="px-6 py-4 font-medium">邀请人</th>
                  <th className="px-6 py-4 font-medium">身份权限</th>
                  <th className="px-6 py-4 font-medium text-center">AI 解析权限</th>
                  <th className="px-6 py-4 font-medium text-center">AI 模型配置</th>
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
                      <div className="text-sm text-gray-500">{user.invitedBy || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.username, e.target.value)}
                        className={`inline-flex items-center px-2 py-1 rounded border text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white ${user.role === 'ADMIN' ? 'text-blue-700 border-blue-200 bg-blue-50' : user.role === 'VIP' ? 'text-purple-700 border-purple-200 bg-purple-50' : 'text-green-700 border-green-200 bg-green-50'}`}
                      >
                        <option value="ADMIN">管理员</option>
                        <option value="VIP">高级用户</option>
                        <option value="MEMBER">普通成员</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleAi(user)}
                        className={`flex items-center gap-1 mx-auto px-3 py-1 rounded-full text-xs font-medium transition-colors ${user.aiEnabled ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        title={user.aiEnabled ? "点击关闭 AI 解析" : "点击开启 AI 解析"}
                      >
                         <Sparkles size={12} />
                         {user.aiEnabled ? '已开启' : '已关闭'}
                         {user.aiEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        value={user.aiModel || 'gemini-2.5-pro'}
                        disabled={!user.aiEnabled}
                        onChange={(e) => handleUpdateAiModel(user.username, e.target.value)}
                        className={`px-2 py-1 rounded border text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white ${!user.aiEnabled ? 'opacity-50 grayscale' : ''}`}
                      >
                        <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="qwen3-coder-plus">Qwen 3 Coder</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-gray-700">
                        {examCounts[user.id || ''] || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2"
                          onClick={() => handleEditPassword(user)}
                          title="修改密码"
                        >
                          <Key size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                          onClick={() => handleDeleteUser(user.username)}
                          title="永久删除用户"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
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