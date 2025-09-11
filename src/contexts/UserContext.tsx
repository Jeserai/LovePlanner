import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { getUserDisplayInfo } from '../services/authService';
import { globalEventService, GlobalEvents } from '../services/globalEventService';

// 用户资料接口
interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  birthday: string;
  points: number;
  timezone: string;
  couple_id?: string; // 情侣关系ID（可选）
}

// 用户上下文接口
interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 用户提供者组件
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载用户资料
  const loadUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 尝试获取用户档案
      let profile = await userService.getProfile(user.id);
      
      if (!profile) {
        // 如果没有档案，可能是新用户，等待触发器创建
        await new Promise(resolve => setTimeout(resolve, 1000));
        profile = await userService.getProfile(user.id);
      }

      if (profile) {
        // 获取用户的实际浏览器时区
        const actualTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // 获取情侣关系信息
        let coupleId: string | undefined = undefined;
        try {
          const coupleRelation = await userService.getCoupleRelation(profile.id);
          if (coupleRelation) {
            coupleId = coupleRelation.id;
            console.log(`💝 找到情侣关系: ${coupleId}`);
          } else {
            console.log(`💔 尚未建立情侣关系`);
          }
        } catch (error) {
          console.warn('⚠️ 获取情侣关系时出错:', error);
        }
        
        const formattedProfile: UserProfile = {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          email: profile.email,
          birthday: profile.birthday || '1990-01-01',
          points: profile.points || 0,
          timezone: actualTimezone, // 使用用户的实际时区而不是数据库中的值
          couple_id: coupleId // 添加情侣关系ID
        };
        
        setUserProfile(formattedProfile);
        const userInfo = getUserDisplayInfo(profile);
        console.log(`✅ 全局用户档案加载成功: ${profile.display_name} (${userInfo?.uiTheme})`, { couple_id: coupleId });
      } else {
        setError('未找到用户档案');
        console.warn('⚠️ 未找到用户档案，可能需要完善信息');
      }
    } catch (err) {
      console.error('❌ 加载用户档案时出错:', err);
      setError('加载用户档案失败');
    } finally {
      setLoading(false);
    }
  };

  // 刷新用户资料
  const refreshUserProfile = async () => {
    await loadUserProfile();
  };

  // 更新用户资料
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile || !user) {
      throw new Error('用户未登录或档案不存在');
    }

    try {
      // 更新数据库
      const success = await userService.updateProfile(user.id, updates);
      if (!success) {
        throw new Error('更新用户资料失败');
      }

      // 更新本地状态
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
      
      // 发布全局事件，通知其他组件用户资料已更新
      globalEventService.emit(GlobalEvents.USER_PROFILE_UPDATED);
      
      console.log('✅ 用户档案更新成功');
    } catch (err) {
      console.error('❌ 更新用户档案失败:', err);
      throw err;
    }
  };

  // 当认证状态变化时重新加载用户资料
  useEffect(() => {
    loadUserProfile();
  }, [user]);

  // 🎯 监听全局用户资料更新事件
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('🔄 收到用户资料更新事件，重新加载...');
      loadUserProfile();
    };

    const unsubscribe = globalEventService.subscribe(GlobalEvents.USER_PROFILE_UPDATED, handleProfileUpdate);
    
    return unsubscribe;
  }, [user]);

  const value: UserContextType = {
    userProfile,
    loading,
    error,
    refreshUserProfile,
    updateUserProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// 使用用户上下文的Hook
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
