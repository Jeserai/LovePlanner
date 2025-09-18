import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { useUser } from '../../src/contexts/UserContext';
import { ThemeCard, ThemeButton, Spinner } from '../../src/components/ui/Components';
import { useTranslation } from '../../src/utils/i18n';
import PixelIcon from '../../src/components/PixelIcon';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

type VerificationStatus = 'checking' | 'success' | 'failed';

const VerifyEmailPage: React.FC = () => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: userLoading } = useUser();
  
  const [status, setStatus] = useState<VerificationStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    console.log('📧 邮箱验证页面初始化');
    console.log('当前URL:', window.location.href);
    console.log('认证状态:', { user: user?.email, authLoading, userProfile: userProfile?.display_name, userLoading });

    // 给Supabase一些时间处理URL中的token
    const checkTimer = setTimeout(() => {
      if (!authLoading) {
        if (user && user.email_confirmed_at) {
          console.log('✅ 用户已验证:', user.email);
          setStatus('success');
        } else if (user && !user.email_confirmed_at) {
          console.log('❌ 用户未验证:', user.email);
          setStatus('failed');
          setErrorMessage(t('email_not_confirmed'));
        } else {
          console.log('❌ 没有用户数据');
          setStatus('failed');
          setErrorMessage(t('verification_session_error'));
        }
      }
    }, 2000); // 给足够时间让useAuth处理认证

    return () => clearTimeout(checkTimer);
  }, [user, authLoading, userProfile, userLoading, t]);

  const handleContinue = () => {
    console.log('🚀 用户点击进入应用');
    router.push('/');
  };

  const handleBackToLogin = () => {
    console.log('🔙 用户返回登录');
    router.push('/');
  };

  // 渲染检查中状态
  const renderChecking = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {t('verifying_email')}
        </h2>
        <p className="text-muted-foreground">
          {t('please_wait_verification')}
        </p>
      </div>
    </div>
  );

  // 渲染成功状态
  const renderSuccess = () => (
    <div className="text-center space-y-6">
      {/* 成功图标和庆祝效果 */}
      <div className="relative">
        <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shadow-lg">
          <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        {/* 庆祝粒子效果 */}
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="absolute -top-1 -right-3 w-4 h-4 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute -bottom-2 -left-3 w-5 h-5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-1 -right-2 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      <div className="space-y-3">
        {/* 主标题 - 注册成功 */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">
            🎉 {t('registration_success')}
          </h1>
          <h2 className="text-xl font-semibold text-foreground">
            {t('email_verified_success')}
          </h2>
        </div>
        
        {/* 用户欢迎信息 */}
        {userProfile && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-lg font-medium text-green-800 dark:text-green-200">
              {t('welcome_to_love_planner')} {userProfile.display_name}! 
            </p>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">
              {t('account_created_successfully')}
            </p>
          </div>
        )}
        
        {/* 详细说明 */}
        <p className="text-muted-foreground">
          {t('verification_success_message')}
        </p>
      </div>

      <div className="space-y-3">
        <ThemeButton onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
          🚀 {t('start_your_love_journey')}
        </ThemeButton>
        <p className="text-xs text-muted-foreground">
          {t('redirecting_to_app')}
        </p>
      </div>
    </div>
  );

  // 渲染失败状态
  const renderFailed = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <XMarkIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {t('verification_failed')}
        </h2>
        <p className="text-muted-foreground">
          {errorMessage || t('verification_error_message')}
        </p>
      </div>

      <div className="space-y-3">
        <ThemeButton onClick={handleBackToLogin} className="w-full" variant="outline">
          {t('back_to_login')}
        </ThemeButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <ThemeCard className="p-8">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {theme === 'pixel' ? (
                <PixelIcon 
                  icon="email" 
                  size={48} 
                  className="text-primary" 
                />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 text-primary">📧</div>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('email_verification')}
            </h1>
          </div>

          {/* 根据状态渲染不同内容 */}
          {status === 'checking' && renderChecking()}
          {status === 'success' && renderSuccess()}
          {status === 'failed' && renderFailed()}
        </ThemeCard>
      </div>
    </div>
  );
};

export default VerifyEmailPage;