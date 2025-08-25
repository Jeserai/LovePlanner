import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { UserIcon, EnvelopeIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/database';

const UserProfile: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({
    username: '',
    displayName: '',
    role: 'cat' as 'cat' | 'cow',
    timezone: 'Asia/Shanghai'
  });

  // 加载用户档案
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const userProfile = await userService.getProfile(user.id);
          if (userProfile) {
            setProfile(userProfile);
            setEditForm({
              username: userProfile.username || '',
              displayName: userProfile.display_name || '',
              role: userProfile.role || 'cat',
              timezone: userProfile.timezone || 'Asia/Shanghai'
            });
          }
        } catch (error) {
          console.error('加载用户档案失败:', error);
          setError('加载用户档案失败');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
  }, [user]);

  // 保存档案
  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    setError('');

    try {
      const success = await userService.updateProfile(user.id, {
        username: editForm.username,
        display_name: editForm.displayName,
        role: editForm.role,
        timezone: editForm.timezone
      });

      if (success) {
        // 重新加载档案
        const updatedProfile = await userService.getProfile(user.id);
        if (updatedProfile) {
          setProfile(updatedProfile);
          setIsEditing(false);
        }
      } else {
        setError('保存失败，请重试');
      }
    } catch (error: any) {
      setError(error.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        displayName: profile.display_name || '',
        role: profile.role || 'cat',
        timezone: profile.timezone || 'Asia/Shanghai'
      });
    }
    setIsEditing(false);
    setError('');
  };

  // 获取角色图标
  const getRoleIcon = (role: 'cat' | 'cow', size: 'sm' | 'md' | 'lg' = 'md') => {
    if (theme === 'pixel') {
      return (
        <PixelIcon 
          name="user" 
          className={role === 'cat' ? 'text-pixel-warning' : 'text-pixel-info'}
          size={size}
        />
      );
    } else {
      return (
        <UserIcon className={`${
          size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
        } ${role === 'cat' ? 'text-primary-500' : 'text-blue-500'}`} />
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className={theme === 'pixel' ? 'pixel-spinner' : 'spinner'}>
          {theme === 'pixel' ? (
            <PixelIcon name="loading" className="animate-spin text-pixel-accent" size="lg" />
          ) : (
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          )}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className={theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-sage-600'}>
          未找到用户档案
        </p>
      </div>
    );
  }

  if (theme === 'pixel') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-8 relative overflow-hidden neon-border pixel-matrix">
          {/* 顶部装饰条 */}
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-pixel-accent via-pixel-cyan to-pixel-lime border-b-4 border-black"></div>
          
          {/* 标题 */}
          <div className="text-center mb-8 mt-4">
            <h2 className="text-2xl font-retro font-bold text-pixel-text mb-2 tracking-wider uppercase neon-text cyber-glitch" data-text="USER_PROFILE.EXE">
              USER_PROFILE.EXE
            </h2>
            <div className="bg-pixel-card border-2 border-pixel-cyan rounded-pixel p-2 neon-border">
              <p className="text-pixel-cyan text-sm font-mono neon-text">
                {isEditing ? 'EDIT MODE ACTIVATED' : 'VIEW MODE'}
              </p>
            </div>
          </div>

          {/* 档案信息 */}
          <div className="space-y-6">
            {/* 邮箱（只读） */}
            <div>
              <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                <PixelIcon name="mail" className="text-pixel-cyan" />
                <span>&gt; EMAIL:</span>
              </label>
              <div className="w-full bg-pixel-card border-4 border-pixel-border rounded-pixel px-4 py-3 font-mono text-pixel-textMuted">
                {user?.email}
              </div>
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                <PixelIcon name="user" className="text-pixel-cyan" />
                <span>&gt; USERNAME:</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full pixel-input-glow rounded-pixel px-4 py-3 font-mono text-pixel-text"
                  disabled={isSaving}
                />
              ) : (
                <div className="w-full bg-pixel-card border-4 border-pixel-border rounded-pixel px-4 py-3 font-mono text-pixel-text">
                  {profile.username}
                </div>
              )}
            </div>

            {/* 显示名称 */}
            <div>
              <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                <PixelIcon name="pixel-star" className="text-pixel-cyan" />
                <span>&gt; DISPLAY_NAME:</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full pixel-input-glow rounded-pixel px-4 py-3 font-mono text-pixel-text"
                  disabled={isSaving}
                />
              ) : (
                <div className="w-full bg-pixel-card border-4 border-pixel-border rounded-pixel px-4 py-3 font-mono text-pixel-text">
                  {profile.display_name}
                </div>
              )}
            </div>

            {/* 角色 */}
            <div>
              <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide">
                &gt; ROLE:
              </label>
              {isEditing ? (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, role: 'cat' })}
                    className={`flex-1 p-3 border-4 rounded-pixel flex items-center justify-center space-x-2 transition-all ${
                      editForm.role === 'cat'
                        ? 'border-pixel-warning bg-pixel-warning text-black neon-border'
                        : 'border-pixel-border bg-pixel-card text-pixel-cyan hover:border-pixel-warning'
                    }`}
                    disabled={isSaving}
                  >
                    {getRoleIcon('cat', 'sm')}
                    <span className="font-mono font-bold">CAT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, role: 'cow' })}
                    className={`flex-1 p-3 border-4 rounded-pixel flex items-center justify-center space-x-2 transition-all ${
                      editForm.role === 'cow'
                        ? 'border-pixel-info bg-pixel-info text-black neon-border'
                        : 'border-pixel-border bg-pixel-card text-pixel-cyan hover:border-pixel-info'
                    }`}
                    disabled={isSaving}
                  >
                    {getRoleIcon('cow', 'sm')}
                    <span className="font-mono font-bold">COW</span>
                  </button>
                </div>
              ) : (
                <div className={`w-full border-4 rounded-pixel px-4 py-3 flex items-center space-x-3 ${
                  profile.role === 'cat'
                    ? 'border-pixel-warning bg-pixel-warning text-black'
                    : 'border-pixel-info bg-pixel-info text-black'
                }`}>
                  {getRoleIcon(profile.role, 'md')}
                  <span className="font-mono font-bold uppercase">{profile.role}</span>
                </div>
              )}
            </div>

            {/* 积分 */}
            <div>
              <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                <PixelIcon name="star" className="text-pixel-cyan" />
                <span>&gt; POINTS:</span>
              </label>
              <div className="w-full bg-pixel-card border-4 border-pixel-border rounded-pixel px-4 py-3 font-mono text-pixel-accent text-xl font-bold">
                {profile.points || 0}
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-pixel-accent border-4 border-white rounded-pixel neon-border animate-neon-flicker">
                <p className="text-sm text-white font-mono font-bold text-center uppercase">
                  {error}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !editForm.username || !editForm.displayName}
                    className={`flex-1 py-3 px-6 rounded-pixel font-mono font-bold transition-all duration-200 flex items-center justify-center space-x-2 uppercase tracking-wider border-4 ${
                      isSaving || !editForm.username || !editForm.displayName
                        ? 'bg-pixel-border text-pixel-textMuted cursor-not-allowed border-pixel-border'
                        : 'pixel-btn-neon text-white shadow-pixel-neon hover:shadow-pixel-neon-strong border-pixel-success bg-pixel-success'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <PixelIcon name="loading" className="animate-spin text-current" />
                        <span>[SAVING...]</span>
                      </>
                    ) : (
                      <>
                        <PixelIcon name="check" className="text-current" glow />
                        <span>SAVE</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 py-3 px-6 rounded-pixel font-mono font-bold transition-all duration-200 flex items-center justify-center space-x-2 uppercase tracking-wider border-4 border-pixel-accent bg-pixel-accent text-white hover:shadow-pixel-neon"
                  >
                    <PixelIcon name="x" className="text-current" glow />
                    <span>CANCEL</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 px-6 rounded-pixel font-mono font-bold transition-all duration-200 flex items-center justify-center space-x-2 uppercase tracking-wider border-4 pixel-btn-neon text-white shadow-pixel-neon hover:shadow-pixel-neon-strong"
                >
                  <PixelIcon name="edit" className="text-current" glow />
                  <span>EDIT_PROFILE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cute 主题
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card-cutesy p-8 backdrop-blur-md bg-white/60 shadow-dream">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold bg-water-lily bg-clip-text text-transparent mb-2">
            个人档案
          </h2>
          <p className="text-sage-600 text-sm">
            {isEditing ? '编辑你的个人信息' : '查看你的个人信息'}
          </p>
        </div>

        {/* 档案信息 */}
        <div className="space-y-6">
          {/* 邮箱（只读） */}
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2 flex items-center space-x-2">
              <EnvelopeIcon className="w-4 h-4" />
              <span>邮箱地址</span>
            </label>
            <div className="w-full input-cutesy bg-gray-50 text-gray-500 cursor-not-allowed">
              {user?.email}
            </div>
          </div>

          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2 flex items-center space-x-2">
              <UserIcon className="w-4 h-4" />
              <span>用户名</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="input-cutesy w-full"
                disabled={isSaving}
              />
            ) : (
              <div className="w-full input-cutesy bg-gray-50 text-gray-700">
                {profile.username}
              </div>
            )}
          </div>

          {/* 显示名称 */}
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              显示名称
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                className="input-cutesy w-full"
                disabled={isSaving}
              />
            ) : (
              <div className="w-full input-cutesy bg-gray-50 text-gray-700">
                {profile.display_name}
              </div>
            )}
          </div>

          {/* 角色 */}
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">角色</label>
            {isEditing ? (
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, role: 'cat' })}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center space-x-2 ${
                    editForm.role === 'cat'
                      ? 'border-primary-300 bg-primary-100/50 text-primary-700'
                      : 'border-sage-200/40 bg-white/30 text-sage-600 hover:border-primary-200'
                  }`}
                  disabled={isSaving}
                >
                  {getRoleIcon('cat', 'sm')}
                  <span className="font-medium">Cat 🐱</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, role: 'cow' })}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center space-x-2 ${
                    editForm.role === 'cow'
                      ? 'border-blue-300 bg-blue-100/50 text-blue-700'
                      : 'border-sage-200/40 bg-white/30 text-sage-600 hover:border-blue-200'
                  }`}
                  disabled={isSaving}
                >
                  {getRoleIcon('cow', 'sm')}
                  <span className="font-medium">Cow 🐄</span>
                </button>
              </div>
            ) : (
              <div className={`w-full p-4 rounded-2xl border-2 flex items-center space-x-3 ${
                profile.role === 'cat'
                  ? 'border-primary-200 bg-primary-100/30 text-primary-700'
                  : 'border-blue-200 bg-blue-100/30 text-blue-700'
              }`}>
                {getRoleIcon(profile.role, 'md')}
                <span className="font-medium capitalize">{profile.role} {profile.role === 'cat' ? '🐱' : '🐄'}</span>
              </div>
            )}
          </div>

          {/* 积分 */}
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              当前积分
            </label>
            <div className="w-full input-cutesy bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-600 font-bold text-xl">
              {profile.points || 0} 分
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-orange-50/50 border border-orange-200/40 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-orange-600 text-center">{error}</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-3 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editForm.username || !editForm.displayName}
                  className={`flex-1 py-3 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                    isSaving || !editForm.username || !editForm.displayName
                      ? 'bg-sage-200 text-sage-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:scale-[1.02] shadow-dream hover:shadow-monet'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      <span>保存</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 py-3 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 bg-gray-500 text-white hover:scale-[1.02] shadow-dream"
                >
                  <XMarkIcon className="w-5 h-5" />
                  <span>取消</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 bg-water-lily text-white hover:scale-[1.02] shadow-dream hover:shadow-monet"
              >
                <PencilIcon className="w-5 h-5" />
                <span>编辑档案</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
