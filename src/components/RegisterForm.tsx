import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import { registrationService } from '../services/registrationService';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeCard, ThemeFormField, ThemeInput, ThemeButton } from './ui/Components';
import { Spinner } from './ui/spinner';
import { useTranslation } from '../utils/i18n';
import LanguageToggle from './ui/LanguageToggle';

interface RegisterFormProps {
  onRegisterSuccess: (user: any, profile: any) => void;
  onBackToLogin: () => void;
}

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  displayName: string;
  birthday: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onBackToLogin }) => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    birthday: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'account' | 'profile' | 'verification'>('account');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const lastCheckedUsername = useRef<string>('');
  const lastCheckedEmail = useRef<string>('');

  // 用户名格式验证（不依赖于任何变化的引用）
  const validateUsername = useCallback((username: string) => {
    if (!username) return { isValid: false, error: '' };
    
    if (username.length < 3) {
      return { isValid: false, error: t('username_too_short') };
    }

    if (username.length > 20) {
      return { isValid: false, error: t('username_too_long') };
    }

    // 检查是否包含空格
    if (/\s/.test(username)) {
      return { isValid: false, error: t('username_no_spaces') };
    }

    // 检查是否只包含允许的字符：字母、数字、下划线、连字符
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { isValid: false, error: t('username_invalid_characters') };
    }

    // 不能以数字、下划线或连字符开头
    if (/^[0-9_-]/.test(username)) {
      return { isValid: false, error: t('username_invalid_start') };
    }

    return { isValid: true, error: '' };
  }, [t]);

  // 邮箱格式验证
  const validateEmail = useCallback((email: string) => {
    if (!email) return { isValid: false, error: '' };
    
    // 基本邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: t('invalid_email_format') };
    }

    return { isValid: true, error: '' };
  }, [t]);

  // 用户名输入防抖处理（只在用户名真正变化时检查）
  useEffect(() => {
    const username = formData.username.trim();
    
    // 如果用户名为空，重置状态
    if (!username) {
      setUsernameStatus('idle');
      lastCheckedUsername.current = '';
      return;
    }

    // 如果与上次检查的相同，不进行检查
    if (username === lastCheckedUsername.current) {
      return;
    }

    // 首先进行格式验证
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setUsernameStatus('idle');
      lastCheckedUsername.current = '';
      return;
    }

    // 设置防抖计时器
    const timeoutId = setTimeout(async () => {
      // 再次检查用户名是否发生了变化（防止在防抖期间用户名又被修改）
      if (username !== formData.username.trim()) {
        return;
      }

      // 如果与上次检查的用户名相同，不重复检查
      if (username === lastCheckedUsername.current) {
        return;
      }

      setUsernameStatus('checking');
      lastCheckedUsername.current = username;
      
      try {
        const isAvailable = await registrationService.checkUsernameAvailability(username);
        
        // 检查完成后再次确认用户名没有变化
        if (username === formData.username.trim()) {
          setUsernameStatus(isAvailable ? 'available' : 'taken');
        }
      } catch (error) {
        console.error('检查用户名可用性时出错:', error);
        if (username === formData.username.trim()) {
          setUsernameStatus('idle');
        }
        lastCheckedUsername.current = '';
      }
    }, 500); // 500ms 防抖

    return () => clearTimeout(timeoutId);
  }, [formData.username, validateUsername]);

  // 邮箱输入防抖处理（只在邮箱真正变化时检查）
  useEffect(() => {
    const email = formData.email.trim();
    
    // 如果邮箱为空，重置状态
    if (!email) {
      setEmailStatus('idle');
      lastCheckedEmail.current = '';
      return;
    }

    // 如果与上次检查的相同，不进行检查
    if (email === lastCheckedEmail.current) {
      return;
    }

    // 验证邮箱格式
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailStatus('idle');
      return;
    }

    // 防抖处理：500ms 后检查
    const timer = setTimeout(async () => {
      // 再次检查邮箱是否发生变化（防抖期间用户又输入了新内容）
      if (formData.email.trim() !== email) {
        return;
      }

      setEmailStatus('checking');
      
      try {
        const isRegistered = await registrationService.checkEmailRegistered(email);
        
        // 最后一次检查邮箱是否变化
        if (formData.email.trim() !== email) {
          return;
        }
        
        lastCheckedEmail.current = email;
        setEmailStatus(isRegistered ? 'taken' : 'available');
        
      } catch (error) {
        console.error('检查邮箱可用性失败:', error);
        setEmailStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, validateEmail]);

  // 邮箱输入处理
  const handleEmailChange = (value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
    
    // 如果邮箱值与上次检查的不同，重置状态
    if (value.trim() !== lastCheckedEmail.current) {
      setEmailStatus('idle');
    }
  };

  // 表单验证
  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('please_fill_required_fields'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwords_not_match'));
      return false;
    }

    if (formData.password.length < 6) {
      setError(t('password_too_short'));
      return false;
    }

    // 使用 validateEmail 函数进行格式验证
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return false;
    }

    // 检查邮箱可用性状态
    if (emailStatus === 'taken') {
      setError(t('email_already_registered'));
      return false;
    }

    if (emailStatus === 'checking') {
      setError(t('please_wait_email_check'));
      return false;
    }

    return true;
  };

  // 处理账户信息步骤提交
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError('');
    setStep('profile');
  };

  // 处理个人资料步骤提交
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.displayName) {
      setError(t('please_fill_required_fields'));
      return;
    }

    // 验证用户名格式
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      setError(usernameValidation.error);
      return;
    }

    if (usernameStatus === 'taken') {
      setError(t('username_already_taken'));
      return;
    }

    if (usernameStatus === 'checking') {
      setError(t('please_wait_username_check'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // 模拟网络延迟

      const { user, profile } = await registrationService.registerUser({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        displayName: formData.displayName,
        birthday: formData.birthday || null,
      });
      
      // 如果需要邮箱验证，转到验证步骤
      if (user && !user.email_confirmed) {
        setStep('verification');
      } else {
        // 直接成功
        onRegisterSuccess(user, profile);
      }

    } catch (err: any) {
      setError(err.message || t('registration_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 重新发送验证邮件
  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      await registrationService.resendVerificationEmail(formData.email);
      setError('');
      alert(t('verification_email_sent'));
    } catch (err: any) {
      setError(err.message || t('send_verification_failed'));
    } finally {
      setIsLoading(false);
    }
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

  // 渲染账户信息步骤
  const renderAccountStep = () => (
    <form onSubmit={handleAccountSubmit} className="space-y-4">
      <ThemeFormField label={t('email_address')} required>
        <div className="relative">
          <ThemeInput
            type="email"
            value={formData.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder={t('enter_email')}
            disabled={isLoading}
            error={!!error}
          />
          {/* 邮箱状态指示器 */}
          {formData.email && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {emailStatus === 'checking' && (
                <Spinner className="w-4 h-4 text-muted-foreground" />
              )}
              {emailStatus === 'available' && validateEmail(formData.email).isValid && (
                <CheckIcon className="w-4 h-4 text-green-500" />
              )}
              {emailStatus === 'taken' && (
                <XMarkIcon className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {/* 邮箱状态提示文字 */}
        {formData.email && emailStatus !== 'idle' && (
          <div className="mt-1 text-xs">
            {emailStatus === 'checking' && (
              <span className="text-muted-foreground">{t('checking_email_availability')}</span>
            )}
            {emailStatus === 'available' && validateEmail(formData.email).isValid && (
              <span className="text-green-600">{t('email_available')}</span>
            )}
            {emailStatus === 'taken' && (
              <span className="text-red-600">{t('email_already_registered')}</span>
            )}
          </div>
        )}
      </ThemeFormField>

      <ThemeFormField label={t('password')} required>
        <div className="relative">
          <ThemeInput
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={t('enter_password')}
            disabled={isLoading}
            error={!!error}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </ThemeFormField>

      <ThemeFormField label={t('confirm_password')} required>
        <div className="relative">
          <ThemeInput
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder={t('confirm_password')}
            disabled={isLoading}
            error={!!error}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </ThemeFormField>

      <div className="space-y-3">
        <ThemeButton
          type="submit"
          disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword}
          className="w-full"
          size="lg"
        >
          {t('next_step')}
        </ThemeButton>

        <ThemeButton
          type="button"
          variant="outline"
          onClick={onBackToLogin}
          className="w-full"
          size="lg"
        >
          {t('back_to_login')}
        </ThemeButton>
      </div>
    </form>
  );

  // 渲染个人资料步骤
  const renderProfileStep = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-4">
      <ThemeFormField label={t('username')} required>
        <div className="relative">
          <ThemeInput
            type="text"
            value={formData.username}
            onChange={(e) => {
              setFormData({ ...formData, username: e.target.value });
              setError(''); // 清除错误信息
              // 如果用户正在输入，暂时重置用户名状态为idle（直到防抖完成）
              if (e.target.value.trim() !== lastCheckedUsername.current) {
                setUsernameStatus('idle');
              }
            }}
            placeholder={t('enter_username')}
            disabled={isLoading}
            error={!!error}
            className="pr-10"
          />
          {/* 用户名状态指示器 */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {usernameStatus === 'checking' && (
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            )}
            {usernameStatus === 'available' && formData.username && (
              <CheckIcon className="w-4 h-4 text-green-500" />
            )}
            {usernameStatus === 'taken' && formData.username && (
              <XMarkIcon className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        <div className="mt-1 space-y-1">
          <p className="text-xs text-muted-foreground">{t('username_tip')}</p>
          
          {/* 实时格式验证提示 */}
          {formData.username && (() => {
            const validation = validateUsername(formData.username);
            if (!validation.isValid) {
              return <p className="text-xs text-red-600">{validation.error}</p>;
            }
            return null;
          })()}
          
          {/* 可用性检查结果 */}
          {usernameStatus === 'available' && formData.username && validateUsername(formData.username).isValid && (
            <p className="text-xs text-green-600">{t('username_available')}</p>
          )}
          {usernameStatus === 'taken' && formData.username && (
            <p className="text-xs text-red-600">{t('username_already_taken')}</p>
          )}
        </div>
      </ThemeFormField>

      <ThemeFormField label={t('display_name')} required>
        <ThemeInput
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder={t('enter_display_name')}
          disabled={isLoading}
          error={!!error}
        />
        <p className="text-xs text-muted-foreground mt-1">{t('display_name_tip')}</p>
      </ThemeFormField>

      <ThemeFormField label={t('birthday')}>
        <ThemeInput
          type="date"
          value={formData.birthday}
          onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
          disabled={isLoading}
          error={!!error}
        />
        <p className="text-xs text-muted-foreground mt-1">{t('birthday_optional')}</p>
      </ThemeFormField>

      <div className="space-y-3">
        <ThemeButton
          type="submit"
          disabled={isLoading || !formData.username || !formData.displayName}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>{t('creating_account')}</span>
            </div>
          ) : (
            <span>{t('create_account')}</span>
          )}
        </ThemeButton>

        <ThemeButton
          type="button"
          variant="outline"
          onClick={() => setStep('account')}
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          {t('previous_step')}
        </ThemeButton>
      </div>
    </form>
  );

  // 渲染邮箱验证步骤
  const renderVerificationStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
        <span className="text-2xl">📧</span>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{t('verify_your_email')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('verification_email_sent_to')} <strong>{formData.email}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          {t('click_verification_link')}
        </p>
      </div>

      <div className="space-y-3">
        <ThemeButton
          onClick={handleResendVerification}
          variant="outline"
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? t('sending') : t('resend_verification')}
        </ThemeButton>

        <ThemeButton
          onClick={onBackToLogin}
          variant="outline"
          className="w-full"
          size="lg"
        >
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
                <h1 className="text-3xl font-bold text-foreground">
                  {step === 'account' && t('create_new_account')}
                  {step === 'profile' && t('complete_your_profile')}
                  {step === 'verification' && t('verify_email')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {step === 'account' && t('join_love_planner')}
                  {step === 'profile' && t('tell_us_about_yourself')}
                  {step === 'verification' && t('almost_done')}
                </p>
              </div>
            </div>

            {/* 步骤指示器 */}
            {step !== 'verification' && (
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${step === 'account' ? 'bg-primary' : 'bg-primary/30'}`} />
                <div className={`w-8 h-0.5 ${step === 'profile' ? 'bg-primary' : 'bg-border'}`} />
                <div className={`w-2 h-2 rounded-full ${step === 'profile' ? 'bg-primary' : 'bg-primary/30'}`} />
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-md">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {/* 根据步骤渲染不同内容 */}
            {step === 'account' && renderAccountStep()}
            {step === 'profile' && renderProfileStep()}
            {step === 'verification' && renderVerificationStep()}
          </ThemeCard>

          {/* 底部装饰文字 */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              {t('start_your_love_journey')}
            </p>
          </div>
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
            <h1 className="text-2xl font-retro font-bold mb-2 tracking-wider uppercase" style={{ color: colors.text }}>
              {step === 'account' && 'CREATE_ACCOUNT.EXE'}
              {step === 'profile' && 'USER_PROFILE.EXE'}
              {step === 'verification' && 'EMAIL_VERIFY.EXE'}
            </h1>
            <div className="border-2 rounded-pixel p-2 mb-2" style={{ background: colors.panel, borderColor: colors.border }}>
              <p className="text-sm font-mono" style={{ color: colors.info }}>
                {step === 'account' && '> INPUT ACCOUNT DATA'}
                {step === 'profile' && '> SETUP USER PROFILE'}
                {step === 'verification' && '> VERIFY EMAIL ADDRESS'}
              </p>
            </div>
          </div>

          {/* 错误消息 */}
          {error && (
            <div className="border-2 border-red-600 rounded-pixel p-3 mb-4" style={{ background: 'rgba(220, 20, 60, 0.1)' }}>
              <div className="flex items-center space-x-2">
                <PixelIcon name="warning" className="text-red-400" />
                <p className="text-red-400 text-sm font-mono font-bold uppercase">[ERROR]: {error}</p>
              </div>
            </div>
          )}

          {/* 根据步骤渲染不同内容 */}
          {step === 'account' && renderAccountStep()}
          {step === 'profile' && renderProfileStep()}
          {step === 'verification' && renderVerificationStep()}
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
