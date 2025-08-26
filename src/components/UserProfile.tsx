import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { UserIcon, CalendarIcon, EnvelopeIcon, AtSymbolIcon, GiftIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import { getUserDisplayInfo } from '../services/authService';

// 用户资料接口
interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  birthday: string;
  points: number;
  timezone: string;
}

// 获取当前用户资料的Mock函数
const getCurrentUserProfile = (): UserProfile | null => {
  try {
    // 从localStorage获取用户数据
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      const user = JSON.parse(demoUser);
      // 返回模拟的用户资料
      const userInfo = getUserDisplayInfo(user);
      return {
        id: user.id,
        username: user.user_metadata?.username || 'unknown_user',
        display_name: user.user_metadata?.displayName || 'Unknown User',
        email: user.email,
        birthday: user.user_metadata?.birthday || '1990-01-01',
        points: userInfo?.uiTheme === 'cat' ? 150 : 300,
        timezone: userInfo?.uiTheme === 'cat' ? 'Asia/Shanghai' : 'America/New_York'
      };
    }
    return null;
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return null;
  }
};

const UserProfile: React.FC = () => {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);

  // 获取当前用户UI主题
  const currentUserInfo = profile ? getUserDisplayInfo(profile) : null;
  const currentUserType = currentUserInfo?.uiTheme === 'cow' ? 'cow' : (currentUserInfo?.uiTheme === 'cat' ? 'cat' : null);

  // 加载用户资料
  useEffect(() => {
    const userProfile = getCurrentUserProfile();
    if (userProfile) {
      setProfile(userProfile);
      setEditForm(userProfile);
    }
    setLoading(false);
  }, []);

  // 保存资料
  const handleSave = async () => {
    if (!profile || !editForm) return;

    try {
      // 在实际应用中，这里应该调用API更新数据库
      // 现在只是更新本地状态
      const updatedProfile = { ...profile, ...editForm };
      setProfile(updatedProfile);
      
      // 更新localStorage中的用户数据
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        const user = JSON.parse(demoUser);
        user.user_metadata = {
          ...user.user_metadata,
          username: updatedProfile.username,
          displayName: updatedProfile.display_name,
          birthday: updatedProfile.birthday
        };
        localStorage.setItem('demo_user', JSON.stringify(user));
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('保存用户资料失败:', error);
    }
  };

  // 计算年龄
  const calculateAge = (birthday: string): number => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // 获取用户类型图标
  const getUserTypeIcon = (userType: 'cat' | 'cow' | null, size: 'sm' | 'md' | 'lg' = 'md') => {
    if (!userType) return null;
    if (theme === 'pixel') {
      return (
        <PixelIcon 
          name="user" 
          className={userType === 'cat' ? 'text-pixel-warning' : 'text-pixel-info'}
          size={size}
        />
      );
    } else if (theme === 'fresh') {
      const emoji = userType === 'cat' ? '🐱' : '🐮';
      const color = userType === 'cat' ? '#06b6d4' : '#8b5cf6';
      const sizeMap = { sm: '1.5rem', md: '2rem', lg: '2.5rem' };
      return (
        <div 
          className="inline-flex items-center justify-center rounded-fresh-full"
          style={{ 
            width: sizeMap[size],
            height: sizeMap[size],
            backgroundColor: `${color}20`,
            border: `2px solid ${color}`,
            color: color,
            fontSize: '1rem'
          }}
        >
          {emoji}
        </div>
      );
    } else if (theme === 'romantic') {
      const emoji = userType === 'cat' ? '🐱' : '🐮';
      const sizeMap = { sm: '1.5rem', md: '2rem', lg: '2.5rem' };
      return (
        <span 
          style={{ 
            fontSize: sizeMap[size],
            filter: 'drop-shadow(0 2px 4px rgba(233, 30, 99, 0.4))'
          }}
          className="inline-block animate-romantic-float"
        >
          {emoji}
        </span>
      );
    } else {
      return (
        <UserIcon className={`${
          size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
        } ${userType === 'cat' ? 'text-primary-500' : 'text-blue-500'}`} />
      );
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${
        theme === 'pixel' ? 'text-pixel-text' : theme === 'fresh' ? 'text-fresh-text' : theme === 'romantic' ? 'text-romantic-text' : 'text-gray-600'
      }`}>
        <div className="text-center">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`flex items-center justify-center p-8 ${
        theme === 'pixel' ? 'text-pixel-text' : theme === 'fresh' ? 'text-fresh-text' : theme === 'romantic' ? 'text-romantic-text' : 'text-gray-600'
      }`}>
        <div className="text-center">
          <div className="text-lg mb-2">未找到用户资料</div>
          <div className="text-sm opacity-75">请重新登录</div>
        </div>
      </div>
    );
  }

  // 像素风主题渲染
  if (theme === 'pixel') {
    return (
      <div className="space-y-6">
        {/* 头部信息 */}
        <div className="bg-pixel-panel border-4 border-pixel-border rounded-pixel shadow-pixel-lg p-6 neon-border">
          <div className="flex items-center space-x-4 mb-6">
            {getUserTypeIcon(currentUserType, 'lg')}
            <div>
              <h2 className="text-xl font-retro text-pixel-text uppercase tracking-wider">
                {profile.display_name}
              </h2>
              <p className="text-pixel-textMuted font-mono text-sm">
                @{profile.username}
              </p>
            </div>
          </div>

          {/* 编辑按钮 */}
          <div className="flex justify-end">
            {isEditing ? (
              <div className="space-x-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-pixel-success text-black border-2 border-black rounded-pixel font-mono uppercase hover:shadow-pixel-neon transition-all"
                >
                  SAVE
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(profile);
                  }}
                  className="px-4 py-2 bg-pixel-textMuted text-white border-2 border-black rounded-pixel font-mono uppercase hover:shadow-pixel transition-all"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-pixel-accent text-black border-2 border-black rounded-pixel font-mono uppercase hover:shadow-pixel-neon transition-all"
              >
                EDIT
              </button>
            )}
          </div>
        </div>

        {/* 详细信息 */}
        <div className="bg-pixel-panel border-4 border-pixel-border rounded-pixel shadow-pixel-lg p-6">
          <h3 className="text-lg font-retro text-pixel-text uppercase tracking-wider mb-4 border-b-2 border-pixel-border pb-2">
            PROFILE_DATA
          </h3>

          <div className="space-y-4">
            {/* 显示名称 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Display Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.display_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono focus:border-pixel-accent focus:outline-none"
                />
              ) : (
                <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono">
                  {profile.display_name}
                </div>
              )}
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Username</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono focus:border-pixel-accent focus:outline-none"
                />
              ) : (
                <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono">
                  @{profile.username}
                </div>
              )}
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Email</label>
              <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-textMuted rounded-pixel px-4 py-3 font-mono">
                {profile.email}
              </div>
            </div>

            {/* 生日 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Birthday</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.birthday || ''}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono focus:border-pixel-accent focus:outline-none"
                />
              ) : (
                <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono">
                  {profile.birthday} (年龄: {calculateAge(profile.birthday)})
                </div>
              )}
            </div>

            {/* 用户类型 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Type</label>
              <div className={`w-full border-4 rounded-pixel px-4 py-3 flex items-center space-x-3 ${
                currentUserType === 'cat'
                  ? 'border-pixel-warning bg-pixel-warning text-black'
                  : 'border-pixel-info bg-pixel-info text-black'
              }`}>
                {getUserTypeIcon(currentUserType, 'md')}
                <span className="font-mono uppercase font-bold">
                  {currentUserType} {currentUserType === 'cat' ? '🐱' : '🐄'}
                </span>
              </div>
            </div>

            {/* 积分 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Points</label>
              <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono">
                {profile.points} PTS
              </div>
            </div>

            {/* 时区 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Timezone</label>
              <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono">
                {profile.timezone}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 清新主题渲染
  if (theme === 'fresh') {
    return (
      <div className="space-y-6">
        {/* 头部信息 */}
        <div className="bg-fresh-card border border-fresh-border rounded-fresh-lg shadow-fresh p-6">
          <div className="flex items-center space-x-4 mb-6">
            {getUserTypeIcon(currentUserType, 'lg')}
            <div>
              <h2 className="text-2xl font-bold text-fresh-text fresh-gradient-text">
                {profile.display_name}
              </h2>
              <p className="text-fresh-textMuted">
                @{profile.username}
              </p>
            </div>
          </div>

          {/* 编辑按钮 */}
          <div className="flex justify-end">
            {isEditing ? (
              <div className="space-x-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-fresh-accent text-white rounded-fresh font-medium hover:shadow-fresh-sm transition-all"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(profile);
                  }}
                  className="px-4 py-2 bg-fresh-textMuted text-white rounded-fresh font-medium hover:shadow-fresh-sm transition-all"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-fresh-accent text-white rounded-fresh font-medium hover:shadow-fresh-sm transition-all"
              >
                编辑资料
              </button>
            )}
          </div>
        </div>

        {/* 详细信息 */}
        <div className="bg-fresh-card border border-fresh-border rounded-fresh-lg shadow-fresh p-6">
          <h3 className="text-xl font-bold text-fresh-text mb-6 pb-3 border-b border-fresh-border">
            个人信息 🌿
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 显示名称 */}
            <div>
              <label className="block text-fresh-text font-medium mb-2">显示名称</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.display_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full border border-fresh-border bg-white text-fresh-text rounded-fresh px-4 py-3 focus:border-fresh-accent focus:outline-none focus:ring-2 focus:ring-fresh-accent/20"
                />
              ) : (
                <div className="w-full border border-fresh-border bg-fresh-panel text-fresh-text rounded-fresh px-4 py-3">
                  {profile.display_name}
                </div>
              )}
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-fresh-text font-medium mb-2">用户名</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full border border-fresh-border bg-white text-fresh-text rounded-fresh px-4 py-3 focus:border-fresh-accent focus:outline-none focus:ring-2 focus:ring-fresh-accent/20"
                />
              ) : (
                <div className="w-full border border-fresh-border bg-fresh-panel text-fresh-text rounded-fresh px-4 py-3">
                  @{profile.username}
                </div>
              )}
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-fresh-text font-medium mb-2">邮箱地址</label>
              <div className="w-full border border-fresh-border bg-fresh-panel text-fresh-textMuted rounded-fresh px-4 py-3">
                {profile.email}
              </div>
            </div>

            {/* 生日 */}
            <div>
              <label className="block text-fresh-text font-medium mb-2">生日</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.birthday || ''}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className="w-full border border-fresh-border bg-white text-fresh-text rounded-fresh px-4 py-3 focus:border-fresh-accent focus:outline-none focus:ring-2 focus:ring-fresh-accent/20"
                />
              ) : (
                <div className="w-full border border-fresh-border bg-fresh-panel text-fresh-text rounded-fresh px-4 py-3">
                  {profile.birthday} <span className="text-fresh-textMuted">(年龄: {calculateAge(profile.birthday)})</span>
                </div>
              )}
            </div>

            {/* 用户类型 */}
            <div>
              <label className="block text-fresh-text font-medium mb-2">用户类型</label>
              <div 
                className="w-full border rounded-fresh-lg px-4 py-3 flex items-center space-x-3"
                style={{
                  borderColor: currentUserType === 'cat' ? '#06b6d4' : '#8b5cf6',
                  backgroundColor: currentUserType === 'cat' ? '#06b6d410' : '#8b5cf610'
                }}
              >
                {getUserTypeIcon(currentUserType, 'md')}
                <span className="font-medium" style={{
                  color: currentUserType === 'cat' ? '#06b6d4' : '#8b5cf6'
                }}>
                  {currentUserType === 'cat' ? '清新小猫 🐱' : '简约小牛 🐮'}
                </span>
              </div>
            </div>

            {/* 积分 */}
            <div>
              <label className="block text-fresh-text font-medium mb-2">积分</label>
              <div className="w-full border border-fresh-border bg-fresh-panel text-fresh-text rounded-fresh px-4 py-3">
                <span className="font-bold text-fresh-accent">{profile.points}</span> 分
              </div>
            </div>
          </div>

          {/* 时区 */}
          <div className="mt-6">
            <label className="block text-fresh-text font-medium mb-2">时区</label>
            <div className="w-full border border-fresh-border bg-fresh-panel text-fresh-text rounded-fresh px-4 py-3">
              {profile.timezone}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 浪漫主题渲染
  if (theme === 'romantic') {
    return (
      <div className="space-y-6">
        {/* 头部信息 */}
        <div className="bg-romantic-card border-2 border-romantic-border rounded-romantic-lg shadow-romantic p-6 romantic-sparkle">
          <div className="flex items-center space-x-4 mb-6">
            {getUserTypeIcon(currentUserType, 'lg')}
            <div>
              <h2 className="text-2xl font-bold text-romantic-text romantic-gradient-text">
                {profile.display_name} ✨
              </h2>
              <p className="text-romantic-textMuted">
                @{profile.username}
              </p>
            </div>
          </div>

          {/* 编辑按钮 */}
          <div className="flex justify-end">
            {isEditing ? (
              <div className="space-x-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-romantic-accent text-white rounded-romantic font-medium hover:shadow-romantic-sm transition-all hover:scale-105"
                >
                  保存 💕
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(profile);
                  }}
                  className="px-4 py-2 bg-romantic-textMuted text-white rounded-romantic font-medium hover:shadow-romantic-sm transition-all"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-romantic-accent text-white rounded-romantic font-medium hover:shadow-romantic-sm transition-all hover:scale-105"
              >
                编辑资料 ✨
              </button>
            )}
          </div>
        </div>

        {/* 详细信息 */}
        <div className="bg-romantic-card border-2 border-romantic-border rounded-romantic-lg shadow-romantic p-6">
          <h3 className="text-xl font-bold text-romantic-text mb-6 pb-3 border-b-2 border-romantic-border">
            个人信息 💖
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 显示名称 */}
            <div>
              <label className="block text-romantic-text font-medium mb-2">显示名称</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.display_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full border-2 border-romantic-border bg-white text-romantic-text rounded-romantic px-4 py-3 focus:border-romantic-accent focus:outline-none"
                />
              ) : (
                <div className="w-full border-2 border-romantic-border bg-romantic-panel text-romantic-text rounded-romantic px-4 py-3">
                  {profile.display_name}
                </div>
              )}
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-romantic-text font-medium mb-2">用户名</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full border-2 border-romantic-border bg-white text-romantic-text rounded-romantic px-4 py-3 focus:border-romantic-accent focus:outline-none"
                />
              ) : (
                <div className="w-full border-2 border-romantic-border bg-romantic-panel text-romantic-text rounded-romantic px-4 py-3">
                  @{profile.username}
                </div>
              )}
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-romantic-text font-medium mb-2">邮箱地址</label>
              <div className="w-full border-2 border-romantic-border bg-romantic-panel text-romantic-textMuted rounded-romantic px-4 py-3">
                {profile.email}
              </div>
            </div>

            {/* 生日 */}
            <div>
              <label className="block text-romantic-text font-medium mb-2">生日 🎂</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.birthday || ''}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className="w-full border-2 border-romantic-border bg-white text-romantic-text rounded-romantic px-4 py-3 focus:border-romantic-accent focus:outline-none"
                />
              ) : (
                <div className="w-full border-2 border-romantic-border bg-romantic-panel text-romantic-text rounded-romantic px-4 py-3">
                  {profile.birthday} <span className="text-romantic-textMuted">(年龄: {calculateAge(profile.birthday)})</span>
                </div>
              )}
            </div>

            {/* 用户类型 */}
            <div>
              <label className="block text-romantic-text font-medium mb-2">用户类型</label>
              <div className="w-full border-2 border-romantic-border bg-romantic-primary text-romantic-text rounded-romantic px-4 py-3 flex items-center space-x-3">
                {getUserTypeIcon(currentUserType, 'md')}
                <span className="font-medium">
                  {currentUserType === 'cat' ? '可爱猫咪 🐱' : '温柔奶牛 🐮'}
                </span>
              </div>
            </div>

            {/* 积分 */}
            <div>
              <label className="block text-romantic-text font-medium mb-2">积分</label>
              <div className="w-full border-2 border-romantic-border bg-romantic-panel text-romantic-text rounded-romantic px-4 py-3">
                <span className="font-bold text-romantic-accent">{profile.points}</span> 分 ✨
              </div>
            </div>
          </div>

          {/* 时区 */}
          <div className="mt-6">
            <label className="block text-romantic-text font-medium mb-2">时区</label>
            <div className="w-full border-2 border-romantic-border bg-romantic-panel text-romantic-text rounded-romantic px-4 py-3">
              {profile.timezone}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 默认主题渲染
  return (
    <div className="space-y-6">
              {/* 头部信息 */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-200">
          <div className="flex items-center space-x-4 mb-6">
            {getUserTypeIcon(currentUserType, 'lg')}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {profile.display_name}
            </h2>
            <p className="text-gray-600">
              @{profile.username}
            </p>
          </div>
        </div>

        {/* 编辑按钮 */}
        <div className="flex justify-end">
          {isEditing ? (
            <div className="space-x-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(profile);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              编辑资料
            </button>
          )}
        </div>
      </div>

      {/* 详细信息 */}
      <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
          个人信息
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 显示名称 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">显示名称</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.display_name || ''}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full border border-gray-300 bg-white text-gray-800 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            ) : (
              <div className="w-full border border-gray-300 bg-gray-50 text-gray-800 rounded-lg px-4 py-3">
                {profile.display_name}
              </div>
            )}
          </div>

          {/* 用户名 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">用户名</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.username || ''}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="w-full border border-gray-300 bg-white text-gray-800 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            ) : (
              <div className="w-full border border-gray-300 bg-gray-50 text-gray-800 rounded-lg px-4 py-3">
                @{profile.username}
              </div>
            )}
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">邮箱地址</label>
            <div className="w-full border border-gray-300 bg-gray-50 text-gray-600 rounded-lg px-4 py-3">
              {profile.email}
            </div>
          </div>

          {/* 生日 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">生日</label>
            {isEditing ? (
              <input
                type="date"
                value={editForm.birthday || ''}
                onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                className="w-full border border-gray-300 bg-white text-gray-800 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            ) : (
              <div className="w-full border border-gray-300 bg-gray-50 text-gray-800 rounded-lg px-4 py-3">
                {profile.birthday} <span className="text-gray-600">(年龄: {calculateAge(profile.birthday)})</span>
              </div>
            )}
          </div>

          {/* 用户类型 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">用户类型</label>
            <div className={`w-full border rounded-lg px-4 py-3 flex items-center space-x-3 ${
              currentUserType === 'cat'
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-purple-300 bg-purple-50 text-purple-700'
            }`}>
              {getUserTypeIcon(currentUserType, 'md')}
              <span className="font-medium">
                {currentUserType === 'cat' ? 'Cat 🐱' : 'Cow 🐮'}
              </span>
            </div>
          </div>

          {/* 积分 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">积分</label>
            <div className="w-full border border-gray-300 bg-gray-50 text-gray-800 rounded-lg px-4 py-3">
              <span className="font-bold text-blue-600">{profile.points}</span> 分
            </div>
          </div>
        </div>

        {/* 时区 */}
        <div className="mt-6">
          <label className="block text-gray-700 font-medium mb-2">时区</label>
          <div className="w-full border border-gray-300 bg-gray-50 text-gray-800 rounded-lg px-4 py-3">
            {profile.timezone}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;