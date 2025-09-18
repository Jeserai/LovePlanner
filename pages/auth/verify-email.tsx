import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext';
import { ThemeCard, ThemeButton } from '../../src/components/ui/Components';
import { useTranslation } from '../../src/utils/i18n';
import LanguageToggle from '../../src/components/ui/LanguageToggle';
import { registrationService } from '../../src/services/registrationService';
import { supabase } from '../../src/lib/supabase';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired';

const VerifyEmailContent: React.FC = () => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  const router = useRouter();
  
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<{ user: any; profile: any } | null>(null);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // 处理 URL 中的认证参数
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('获取会话失败:', error);
          setStatus('error');
          setError(t('verification_session_error'));
          return;
        }

        if (!data.session) {
          setStatus('error');
          setError(t('verification_no_session'));
          return;
        }

        const user = data.session.user;
        
        if (!user.email_confirmed) {
          setStatus('error');
          setError(t('email_not_verified'));
          return;
        }

        // 获取或创建用户档案
        const result = await registrationService.handleEmailVerification();
        setUserData(result);
        setStatus('success');

      } catch (err: any) {
        console.error('邮箱验证处理错误:', err);
        setStatus('error');
        setError(err.message || t('verification_failed'));
      }
    };

    // 延迟一点时间以显示验证过程
    const timer = setTimeout(handleEmailVerification, 1500);
    return () => clearTimeout(timer);
  }, [t]);

  const handleContinue = () => {
    if (userData) {
      // 将用户数据传递给主应用
      localStorage.setItem('temp_verified_user', JSON.stringify(userData));
      router.push('/');
    }
  };

  const handleBackToLogin = () => {
    router.push('/');
  };

  // 根据主题获取颜色配置
  const getThemeColors = () => {
    if (false) {
      return {
        bg: '#f8fafc',
        panel: '#ffffff',
        text: '#1e293b',
        textMuted: '#64748b',
        border: '#e2e8f0',
        accent: '#10b981',
        success: '#059669',
        warning: '#d97706',
        info: '#0284c7',
      };
    }
    // 默认像素风（深色）
    return {
      bg: '#1a1a2e',
      panel: '#2a2a40',
      text: '#ffffff',
      textMuted: '#aaaacc',
      border: '#4a4a66',
      accent: '#ff0080',
      success: '#00ff88',
      warning: '#ffff00',
      info: '#00d4ff',
    };
  };

  const colors = getThemeColors();

  // 渲染验证中状态
  const renderVerifying = () => (
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
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckIcon className="w-8 h-8 text-green-600" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {t('email_verified_success')}
        </h2>
        <p className="text-muted-foreground">
          {t('verification_success_message')}
        </p>
        {userData?.profile && (
          <p className="text-sm text-muted-foreground">
            {t('welcome_user')} {userData.profile.display_name}!
          </p>
        )}
      </div>

      <div className="space-y-3">
        <ThemeButton onClick={handleContinue} className="w-full" size="lg">
          {t('continue_to_app')}
        </ThemeButton>
      </div>
    </div>
  );

  // 渲染错误状态
  const renderError = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        <XMarkIcon className="w-8 h-8 text-red-600" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {t('verification_failed')}
        </h2>
        <p className="text-muted-foreground">
          {error || t('verification_error_message')}
        </p>
      </div>

      <div className="space-y-3">
        <ThemeButton onClick={handleBackToLogin} className="w-full" size="lg">
          {t('back_to_login')}
        </ThemeButton>
      </div>
    </div>
  );

  // 现代主题渲染
  if (theme === 'modern') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* 背景网格 */}
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
        
        {/* 语言切换按钮 - 右上角 */}
        <div className="absolute top-4 right-4 z-50">
          <LanguageToggle />
        </div>
        
        <div className="relative w-full max-w-md">
          <ThemeCard className="p-8 space-y-6">
            {/* Logo和标题 */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-12 h-12 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-2xl">💕</span>
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Love Planner
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t('email_verification')}
                </p>
              </div>
            </div>

            {/* 根据状态渲染不同内容 */}
            {status === 'verifying' && renderVerifying()}
            {status === 'success' && renderSuccess()}
            {status === 'error' && renderError()}
          </ThemeCard>
        </div>
      </div>
    );
  }

  // 像素风主题渲染
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 font-retro pixel-scanlines crt-screen"
      style={{ background: colors.bg }}
    >
      {/* 像素风背景效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 rounded-pixel animate-pixel-pulse" style={{background: colors.accent}}></div>
        <div className="absolute top-20 right-20 w-2 h-2 rounded-pixel animate-pixel-pulse" style={{background: colors.success, animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 rounded-pixel animate-pixel-pulse" style={{background: colors.warning, animationDelay: '1s'}}></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 rounded-pixel animate-pixel-pulse" style={{background: colors.info, animationDelay: '1.5s'}}></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        <div 
          className="border-4 border-black rounded-pixel p-8 relative overflow-hidden"
          style={{ 
            background: colors.panel,
            boxShadow: '4px 4px 0 #000, 0 6px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* 顶部装饰条 */}
          <div className="absolute top-0 left-0 w-full h-4 border-b-2 border-black" style={{background: colors.accent}}></div>

          {/* Logo和标题 */}
          <div className="text-center mb-8 mt-4">
            <h1 className="text-xl font-retro font-bold mb-2 tracking-wider uppercase" style={{ color: colors.text }}>
              EMAIL_VERIFY.EXE
            </h1>
            <div className="border-2 rounded-pixel p-2 mb-2" style={{ background: colors.panel, borderColor: colors.border }}>
              <p className="text-sm font-mono" style={{ color: colors.info }}>
                &gt; VERIFYING EMAIL ADDRESS
              </p>
            </div>
          </div>

          {/* 根据状态渲染不同内容 */}
          {status === 'verifying' && renderVerifying()}
          {status === 'success' && renderSuccess()}
          {status === 'error' && renderError()}
        </div>
      </div>
    </div>
  );
};

const VerifyEmailPage: React.FC = () => {
  return (
    <ThemeProvider>
      <VerifyEmailContent />
    </ThemeProvider>
  );
};

export default VerifyEmailPage;
