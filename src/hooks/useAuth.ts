import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authService } from '../services/authService'
import { getCurrentEnvironment } from '../config/environment'
import userAwareStorage from '../services/userAwareStorageService'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let supabaseAuthSubscription: any = null;
    
    const initializeAuth = async () => {
      const currentEnv = getCurrentEnvironment();
      console.log('🔐 初始化认证状态，当前环境:', currentEnv);
      
      try {
        if (currentEnv === 'production') {
          // 生产环境：使用 Supabase 认证
          console.log('🌐 生产环境：使用 Supabase 认证');
          
          // 获取当前会话
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ 获取 Supabase 会话失败:', error);
          } else if (session?.user) {
            console.log('✅ 发现现有 Supabase 会话:', session.user.email);
            // 设置用户感知存储的当前用户ID
            userAwareStorage.setCurrentUserId(session.user.id);
            setUser(session.user);
          } else {
            console.log('ℹ️ 没有现有的 Supabase 会话');
          }
          
          // 监听 Supabase 认证状态变化
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Supabase Auth 状态变化:', event, session?.user?.email);
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('🎉 用户登录:', session.user.email);
              // 设置用户感知存储的当前用户ID
              userAwareStorage.setCurrentUserId(session.user.id);
              setUser(session.user);
            } else if (event === 'SIGNED_OUT') {
              console.log('👋 用户登出');
              // 清理用户感知存储
              userAwareStorage.clearCurrentUserId();
              setUser(null);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              console.log('🔄 Token 刷新:', session.user.email);
              // 确保用户感知存储的用户ID是最新的
              userAwareStorage.setCurrentUserId(session.user.id);
              setUser(session.user);
            }
          });
          
          supabaseAuthSubscription = subscription;
          
        } else {
          // 测试环境：使用预设用户模式
          console.log('🧪 测试环境：使用预设用户模式');
          
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            console.log('✅ 发现预设用户:', currentUser.email);
            // 设置用户感知存储的当前用户ID
            userAwareStorage.setCurrentUserId(currentUser.id);
            setUser(currentUser);
          }
        }
        
      } catch (error) {
        console.error('❌ 初始化认证状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 监听预设用户状态变化（测试环境）
    const handlePresetAuthChange = (event: any) => {
      console.log('🔄 预设用户状态变化:', event.detail?.user?.email);
      if (event.detail) {
        // 设置用户感知存储的当前用户ID
        userAwareStorage.setCurrentUserId(event.detail.user.id);
        setUser(event.detail.user);
      } else {
        // 清理用户感知存储
        userAwareStorage.clearCurrentUserId();
        setUser(null);
      }
    };

    // 监听自定义事件
    if (typeof window !== 'undefined') {
      window.addEventListener('presetAuthChange', handlePresetAuthChange);
    }

    return () => {
      // 清理 Supabase 订阅
      if (supabaseAuthSubscription) {
        supabaseAuthSubscription.unsubscribe();
      }
      
      // 清理预设用户事件监听器
      if (typeof window !== 'undefined') {
        window.removeEventListener('presetAuthChange', handlePresetAuthChange);
      }
    };
  }, [])

  const signOut = async () => {
    const currentEnv = getCurrentEnvironment();
    console.log('🚪 开始登出，当前环境:', currentEnv);
    
    try {
      // 只清理当前用户会话，保留用户数据
      console.log('🧹 清理当前用户会话（保留用户数据）');
      userAwareStorage.clearSession();
      
      if (currentEnv === 'production') {
        // 生产环境：使用 Supabase 登出
        console.log('🌐 生产环境：使用 Supabase 登出');
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('❌ Supabase 登出失败:', error);
          throw error;
        }
        console.log('✅ Supabase 登出成功');
      } else {
        // 测试环境：使用预设用户登出
        console.log('🧪 测试环境：使用预设用户登出');
        await authService.logout();
        console.log('✅ 预设用户登出成功');
      }
      
      // 清除用户状态
      setUser(null);
      
    } catch (error) {
      console.error('❌ 登出过程中发生错误:', error);
      // 即使登出失败，也要清除本地状态
      setUser(null);
      throw error;
    }
  }

  return {
    user,
    loading,
    signOut,
  }
}
