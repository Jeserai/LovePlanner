/**
 * Session 监控组件
 * 显示当前会话状态和过期倒计时（仅测试环境）
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { enableDebugFeatures } from '../../config/environment';
import { useTranslation } from '../../utils/i18n';
import { useTheme } from '../../contexts/ThemeContext';

interface SessionInfo {
  isLoggedIn: boolean;
  email?: string;
  expiresAt?: number;
  refreshToken?: string;
  accessToken?: string;
}

const SessionMonitor: React.FC = () => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({ isLoggedIn: false });
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 格式化剩余时间
  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return '已过期';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  // 获取会话状态颜色
  const getStatusColor = (): string => {
    if (!sessionInfo.isLoggedIn) return 'text-red-500';
    
    const now = Date.now() / 1000;
    const timeUntilExpiry = (sessionInfo.expiresAt || 0) - now;
    
    if (timeUntilExpiry <= 0) return 'text-red-500';
    if (timeUntilExpiry <= 300) return 'text-orange-500'; // 5分钟内
    if (timeUntilExpiry <= 900) return 'text-yellow-500'; // 15分钟内
    return 'text-green-500';
  };

  // 手动刷新Token
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('手动刷新失败:', error);
      } else {
        console.log('✅ 手动刷新成功');
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('刷新过程出错:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 更新会话信息
  const updateSessionInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSessionInfo({
          isLoggedIn: true,
          email: session.user.email,
          expiresAt: session.expires_at,
          refreshToken: session.refresh_token?.substring(0, 10) + '...',
          accessToken: session.access_token.substring(0, 10) + '...'
        });
      } else {
        setSessionInfo({ isLoggedIn: false });
      }
    } catch (error) {
      console.error('获取会话信息失败:', error);
      setSessionInfo({ isLoggedIn: false });
    }
  };

  // 初始化和监听会话变化
  useEffect(() => {
    updateSessionInfo();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth State Change:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        setLastRefresh(new Date());
        console.log('🔄 Token已自动刷新');
      }
      
      updateSessionInfo();
    });

    return () => subscription.unsubscribe();
  }, []);

  // 倒计时更新
  useEffect(() => {
    if (!sessionInfo.isLoggedIn || !sessionInfo.expiresAt) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now() / 1000;
      const timeUntilExpiry = sessionInfo.expiresAt! - now;
      setTimeLeft(formatTimeLeft(Math.max(0, Math.floor(timeUntilExpiry))));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo.expiresAt, sessionInfo.isLoggedIn]);

  // 仅在调试模式下显示
  if (!enableDebugFeatures) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 ${
        theme === 'pixel' 
          ? 'bg-pixel-panel border-pixel-border border-2' 
          : 'bg-background/90 border-border'
      }`}>
        <div className="space-y-2 text-xs">
          {/* 标题 */}
          <div className={`font-bold text-center ${
            theme === 'pixel' ? 'font-mono uppercase tracking-wider text-pixel-accent' : 'text-foreground'
          }`}>
            {theme === 'pixel' ? '>>> SESSION STATUS <<<' : '🔐 Session Monitor'}
          </div>

          {/* 登录状态 */}
          <div className="flex items-center justify-between">
            <span className={theme === 'pixel' ? 'font-mono' : ''}>状态:</span>
            <span className={`font-semibold ${getStatusColor()}`}>
              {sessionInfo.isLoggedIn ? '已登录' : '未登录'}
            </span>
          </div>

          {sessionInfo.isLoggedIn && (
            <>
              {/* 用户邮箱 */}
              <div className="flex items-center justify-between">
                <span className={theme === 'pixel' ? 'font-mono' : ''}>用户:</span>
                <span className="text-muted-foreground text-[10px]">
                  {sessionInfo.email}
                </span>
              </div>

              {/* 过期倒计时 */}
              <div className="flex items-center justify-between">
                <span className={theme === 'pixel' ? 'font-mono' : ''}>过期:</span>
                <span className={`font-mono ${getStatusColor()}`}>
                  {timeLeft}
                </span>
              </div>

              {/* Token信息 */}
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`${theme === 'pixel' ? 'font-mono' : ''} text-[10px]`}>Access:</span>
                  <span className="text-muted-foreground text-[9px] font-mono">
                    {sessionInfo.accessToken}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${theme === 'pixel' ? 'font-mono' : ''} text-[10px]`}>Refresh:</span>
                  <span className="text-muted-foreground text-[9px] font-mono">
                    {sessionInfo.refreshToken}
                  </span>
                </div>
              </div>

              {/* 最后刷新时间 */}
              {lastRefresh && (
                <div className="flex items-center justify-between">
                  <span className={`${theme === 'pixel' ? 'font-mono' : ''} text-[10px]`}>刷新:</span>
                  <span className="text-green-500 text-[9px]">
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              )}

              {/* 手动刷新按钮 */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`w-full mt-2 px-2 py-1 text-[10px] rounded transition-colors ${
                  theme === 'pixel' 
                    ? 'bg-pixel-accent text-pixel-bg hover:bg-pixel-accentLight font-mono uppercase border border-black' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRefreshing ? (
                  <span className="flex items-center justify-center space-x-1">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>{theme === 'pixel' ? 'REFRESHING...' : '刷新中...'}</span>
                  </span>
                ) : (
                  theme === 'pixel' ? 'MANUAL REFRESH' : '🔄 手动刷新'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionMonitor;
