import React, { useState } from 'react';
import { Button } from './Button';
import { authService } from '../services/authService';
import { Key, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface ChangePasswordViewProps {
  currentUser: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ currentUser, onSuccess, onCancel }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 3) {
      setError('新密码长度至少需要3位');
      return;
    }

    // Verify old password
    if (!(await authService.verifyPassword(currentUser.username, currentPassword))) {
      setError('当前密码错误');
      return;
    }

    // Update
    const result = await authService.updatePassword(currentUser.username, newPassword);
    if (result) {
      setSuccess('密码修改成功！');
      setTimeout(onSuccess, 1500);
    } else {
      setError('修改失败，请重试');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <Key className="h-6 w-6 text-yellow-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            修改密码
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            为了账号安全，请定期更换密码
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          <div className="flex gap-4">
             <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
               <ArrowLeft size={16} className="mr-2" />
               返回
             </Button>
             <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">确认修改</Button>
          </div>
        </form>
      </div>
    </div>
  );
};