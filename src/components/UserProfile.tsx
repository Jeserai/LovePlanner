import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { UserIcon, CalendarIcon, EnvelopeIcon, AtSymbolIcon, GiftIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import LoadingSpinner from './ui/LoadingSpinner';
import { getUserDisplayInfo } from '../services/authService';
import { useTranslation } from '../utils/i18n';

// 本地使用的UserProfile类型（与UserContext中的保持一致）
interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  birthday: string;
  points: number;
  timezone: string;
}



const UserProfile: React.FC = () => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  const { userProfile: profile, loading, updateUserProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  
  // 调试信息
  console.log('👤 UserProfile 全局状态:', { loading, profile: !!profile });

  // 获取当前用户UI主题（仅用于头部图标显示）
  const currentUserInfo = profile ? getUserDisplayInfo(profile) : null;
  const currentUserType = currentUserInfo?.uiTheme === 'cow' ? 'cow' : (currentUserInfo?.uiTheme === 'cat' ? 'cat' : null);

  // 当全局用户资料加载完成时，初始化编辑表单
  React.useEffect(() => {
    if (profile) {
      setEditForm(profile);
    }
  }, [profile]);

  // 保存资料
  const handleSave = async () => {
    if (!profile || !editForm) return;

    try {
      // 使用全局状态的更新方法 (不再更新用户名)
      await updateUserProfile({
        display_name: editForm.display_name,
        birthday: editForm.birthday
      });

      setIsEditing(false);
      console.log('✅ 用户资料更新成功');
    } catch (error) {
      console.error('保存用户资料时出错:', error);
      alert(t('save_failed_retry'));
    }
  };

  // 移除了年龄计算函数，因为不再需要显示年龄

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
    } else if (false) {
      const emoji = userType === 'cat' ? '🐱' : '🐮';
      const color = userType === 'cat' ? '#06b6d4' : '#8b5cf6';
      const sizeMap = { sm: '1.5rem', md: '2rem', lg: '2.5rem' };
      return (
        <div 
          className="inline-flex items-center justify-center "
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
      <LoadingSpinner
        size="lg"
        title={theme === 'pixel' ? 'LOADING PROFILE...' : theme === 'modern' ? t('loading_profile') : t('loading_profile')}
        subtitle={theme === 'pixel' ? 'PLEASE WAIT...' : theme === 'modern' ? t('loading_profile_subtitle') : t('loading_profile_subtitle')}
        className="min-h-[400px]"
      />
    );
  }

  // 如果没有profile且确实完成了加载，才显示错误信息
  if (!profile && !loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${
        theme === 'pixel' ? 'text-pixel-text' : false ? '' : 'text-gray-600'
      }`}>
        <div className="text-center">
          <div className="text-lg mb-2">未找到用户资料</div>
          <div className="text-sm opacity-75">请重新登录</div>
        </div>
      </div>
    );
  }

  // 如果仍在加载或profile为null，继续显示加载状态
  if (!profile) {
    return (
      <LoadingSpinner
        size="lg"
        title={theme === 'pixel' ? 'LOADING PROFILE...' : theme === 'modern' ? t('loading_profile') : t('loading_profile')}
        subtitle={theme === 'pixel' ? 'PLEASE WAIT...' : theme === 'modern' ? t('loading_profile_subtitle') : t('loading_profile_subtitle')}
        className="min-h-[400px]"
      />
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
                {profile?.display_name}
              </h2>
              <p className="text-pixel-textMuted font-mono text-sm">
                @{profile?.username}
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
                  {profile?.display_name}
                </div>
              )}
            </div>

            {/* 用户名 (只读) */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Username</label>
              <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-textMuted rounded-pixel px-4 py-3 font-mono">
                @{profile?.username}
              </div>
              <p className="text-xs text-pixel-textMuted font-mono mt-1">用户名不可更改</p>
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Email</label>
              <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-textMuted rounded-pixel px-4 py-3 font-mono">
                {profile?.email}
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
                  {profile?.birthday}
                </div>
              )}
            </div>

            {/* 积分 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Points</label>
              <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono">
                {profile?.points} PTS
              </div>
            </div>

            {/* 时区 */}
            <div>
              <label className="block text-pixel-cyan font-mono text-sm mb-2 uppercase">Timezone</label>
              <div className="w-full border-4 border-pixel-border bg-pixel-card text-pixel-text rounded-pixel px-4 py-3 font-mono">
                {profile?.timezone}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 清新主题渲染
  if (false) {
    return (
      <div className="space-y-6">
        {/* 头部信息 */}
        <div className=" border   shadow-fresh p-6">
          <div className="flex items-center space-x-4 mb-6">
            {getUserTypeIcon(currentUserType, 'lg')}
            <div>
              <h2 className="text-2xl font-bold  ">
                {profile?.display_name}
              </h2>
              <p className="">
                @{profile?.username}
              </p>
            </div>
          </div>

          {/* 编辑按钮 */}
          <div className="flex justify-end">
            {isEditing ? (
              <div className="space-x-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2  text-white rounded-fresh font-medium hover: transition-all"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) setEditForm(profile);
                  }}
                  className="px-4 py-2  text-white font-medium hover: transition-all"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2  text-white rounded-fresh font-medium hover: transition-all"
              >
                编辑资料
              </button>
            )}
          </div>
        </div>

        {/* 详细信息 */}
        <div className=" border   shadow-fresh p-6">
          <h3 className="text-xl font-bold  mb-6 pb-3 border-b ">
            个人信息
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 显示名称 */}
            <div>
              <label className="block  font-medium mb-2">显示名称</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.display_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full border  bg-white  rounded-fresh px-4 py-3 focus: focus:outline-none focus:ring-2 focus:ring-fresh-accent/20"
                />
              ) : (
                <div className="w-full border    rounded-fresh px-4 py-3">
                  {profile?.display_name}
                </div>
              )}
            </div>

            {/* 用户名 (只读) */}
            <div>
              <label className="block  font-medium mb-2">用户名</label>
              <div className="w-full border    rounded-fresh px-4 py-3">
                @{profile?.username}
              </div>
              <p className="text-xs  mt-1">用户名不可更改</p>
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block  font-medium mb-2">邮箱地址</label>
              <div className="w-full border    rounded-fresh px-4 py-3">
                {profile?.email}
              </div>
            </div>

            {/* 生日 */}
            <div>
              <label className="block  font-medium mb-2">生日</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.birthday || ''}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className="w-full border  bg-white  rounded-fresh px-4 py-3 focus: focus:outline-none focus:ring-2 focus:ring-fresh-accent/20"
                />
              ) : (
                <div className="w-full border    rounded-fresh px-4 py-3">
                  {profile?.birthday}
                </div>
              )}
            </div>

            {/* 积分 */}
            <div>
              <label className="block  font-medium mb-2">积分</label>
              <div className="w-full border    rounded-fresh px-4 py-3">
                <span className="font-bold ">{profile?.points}</span> 分
              </div>
            </div>
          </div>

          {/* 时区 */}
          <div className="mt-6">
            <label className="block  font-medium mb-2">时区</label>
            <div className="w-full border    rounded-fresh px-4 py-3">
              {profile?.timezone}
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
              {profile?.display_name}
            </h2>
            <p className="text-gray-600">
              @{profile?.username}
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
                {profile?.display_name}
              </div>
            )}
          </div>

            {/* 用户名 (只读) */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">用户名</label>
              <div className="w-full border border-gray-300 bg-gray-50 text-gray-600 rounded-lg px-4 py-3">
                @{profile?.username}
              </div>
              <p className="text-xs text-gray-500 mt-1">用户名不可更改</p>
            </div>

          {/* 邮箱 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">邮箱地址</label>
            <div className="w-full border border-gray-300 bg-gray-50 text-gray-600 rounded-lg px-4 py-3">
              {profile?.email}
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
                {profile?.birthday}
              </div>
            )}
          </div>

          {/* 积分 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">积分</label>
            <div className="w-full border border-gray-300 bg-gray-50 text-gray-800 rounded-lg px-4 py-3">
              <span className="font-bold text-blue-600">{profile?.points}</span> 分
            </div>
          </div>
        </div>

        {/* 时区 */}
        <div className="mt-6">
          <label className="block text-gray-700 font-medium mb-2">时区</label>
          <div className="w-full border border-gray-300 bg-gray-50 text-gray-800 rounded-lg px-4 py-3">
            {profile?.timezone}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;