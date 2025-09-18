import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import { authService, PRESET_USERS, getUserDisplayInfo } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeCard, ThemeFormField, ThemeInput, ThemeButton } from './ui/Components';
import { useTranslation } from '../utils/i18n';
import LanguageToggle from './ui/LanguageToggle';
import { enablePresetQuickLogin } from '../config/environment';
import { lastEmailService } from '../services/lastEmailService';



interface AuthFormProps {
  onAuthSuccess: (user: any, profile: any) => void;
  onSwitchToRegister?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess, onSwitchToRegister }) => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 加载最后登录的邮箱地址
  useEffect(() => {
    const lastEmail = lastEmailService.getLastEmail();
    if (lastEmail) {
      setFormData(prev => ({ ...prev, email: lastEmail }));
    }
  }, []);

  // 预设用户选项（仅测试环境）
  const presetUsers = enablePresetQuickLogin ? [
    {
      ...PRESET_USERS.cat,
      displayName: PRESET_USERS.cat.displayName
    },
    {
      ...PRESET_USERS.cow,
      displayName: PRESET_USERS.cow.displayName
    }
  ] : [];

  // 获取预设用户的UI主题
  const getPresetUserUITheme = (user: any): 'cat' | 'cow' => {
    if (user.email.includes('cat')) return 'cat';
    if (user.email.includes('cow')) return 'cow';
    return 'cat'; // 默认
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
        catColor: '#8b5cf6',
        cowColor: '#06b6d4',
        mint: '#6ee7b7',
        sky: '#0ea5e9',
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

  // 根据用户名/邮箱判断用户类型的辅助函数
  const getUserType = (identifier: string): 'cat' | 'cow' | null => {
    if (identifier.includes('cat')) return 'cat';
    if (identifier.includes('cow')) return 'cow';
    return null;
  };

  // 已保存的账号选项（用于快速登录）
  // 注意：现在 quickLogins 基于用户实际登录过的账号，而不是预设用户

  // 获取用户图标，根据主题和用户类型区分
  const getUserIcon = (userType: 'cat' | 'cow', size: 'sm' | 'md' | 'lg' = 'md') => {
    if (false) {
      // 清新主题使用简约图标和用户专属颜色
      const emoji = userType === 'cat' ? '🐱' : '🐮';
      const color = userType === 'cat' ? (colors as any).catColor : (colors as any).cowColor;
      const sizeMap = { sm: '1.5rem', md: '2rem', lg: '2.5rem' };
      return (
        <div 
          className="inline-flex items-center justify-center  animate-fresh-breathe"
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
    }
    
    // 像素风主题使用图标
    const colorClass = userType === 'cat' ? 'text-pixel-warning' : 'text-pixel-info';
    return (
      <PixelIcon
        name="user"
        className={colorClass}
        size={size}
      />
    );
  };

  // 登录处理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // 模拟网络延迟

      const { user, profile } = await authService.loginWithEmail(formData.email, formData.password);
      
      // 保存最后登录的邮箱地址（便于下次登录）
      lastEmailService.saveLastEmail(formData.email);
      
      onAuthSuccess(user, profile);

    } catch (err: any) {
      setError(err.message || t('login_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 预设用户快速登录（测试环境）
  const handlePresetQuickLogin = async (presetUser: any) => {
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 600)); // 模拟网络延迟

      const { user, profile } = await authService.loginWithEmail(presetUser.email, presetUser.password);
      onAuthSuccess(user, profile);

    } catch (err: any) {
      setError(err.message || t('quick_login_failed'));
    } finally {
      setIsLoading(false);
    }
  };


  // 根据主题渲染不同风格
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
                  {t('love_planner')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t('welcome_back')}
                </p>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-md">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {/* 预设用户快速登录 - 仅测试环境 */}
            {enablePresetQuickLogin && presetUsers.length > 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{t('quick_login')}</p>
                  <p className="text-xs text-muted-foreground">{t('choose_profile')}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {presetUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handlePresetQuickLogin(user)}
                      disabled={isLoading}
                      className="p-4 rounded-md border border-border transition-all duration-200 flex flex-col items-center space-y-2 hover:bg-accent hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
                        {getPresetUserUITheme(user) === 'cat' ? '🐱' : '🐮'}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground text-sm">{user.displayName}</div>
                      </div>
                      {isLoading && (
                        <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* 分割线 - 仅在显示快速登录时显示 */}
            {enablePresetQuickLogin && presetUsers.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('or')}
                  </span>
                </div>
              </div>
            )}

            {/* 登录表单 */}
            <form onSubmit={handleLogin} className="space-y-4">
              <ThemeFormField label={t('email_address')} required>
                <ThemeInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('enter_email')}
                  disabled={isLoading}
                  error={!!error}
                />
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

              <ThemeButton
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>{t('signing_in')}</span>
                  </div>
                ) : (
                  <span>{t('sign_in')}</span>
                )}
              </ThemeButton>
            </form>

            {/* 底部提示 */}
            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                {t('login_tip')}
              </p>
              
              {/* 注册链接 */}
              {onSwitchToRegister && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t('dont_have_account')}{' '}
                    <button
                      onClick={onSwitchToRegister}
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      {t('register')}
                    </button>
                  </p>
                </div>
              )}
            </div>
          </ThemeCard>

          {/* 底部装饰文字 */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              {t('plan_love_story')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (false) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{ background: colors.bg }}
      >
        {/* 清新背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-24 left-24 text-2xl animate-fresh-bounce opacity-40">🌿</div>
          <div className="absolute top-40 right-40 text-3xl animate-fresh-wave opacity-30">🍃</div>
          <div className="absolute bottom-32 left-32 text-2xl animate-fresh-breathe opacity-35">🌱</div>
          <div className="absolute bottom-24 right-24 text-3xl animate-fresh-bounce opacity-25" style={{animationDelay: '1s'}}>💧</div>
          <div className="absolute top-1/3 right-20 text-xl animate-fresh-wave opacity-20" style={{animationDelay: '2s'}}>✨</div>
        </div>

        <div className="relative w-full max-w-md z-10">
          <div 
            className=" p-8 relative overflow-hidden fresh-minimal"
            style={{ 
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 4px 24px rgba(16, 185, 129, 0.06), 0 2px 12px rgba(30, 41, 59, 0.04)'
            }}
          >
            {/* Logo和标题 */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <span className="text-2xl animate-fresh-bounce">🌿</span>
                <span className="text-3xl animate-fresh-breathe">💚</span>
                <span className="text-2xl animate-fresh-bounce" style={{animationDelay: '0.5s'}}>🌿</span>
              </div>
              
              <h1 className="text-3xl font-bold mb-2 ">
                Love Planner
              </h1>
              <p className="font-medium" style={{color: colors.textMuted}}>
                清新简约 · 情侣任务管理
              </p>
            </div>

            {/* 错误提示 */}
            {error && (
              <div 
                className="p-4 rounded-fresh mb-6 border-l-4 text-sm"
                style={{
                  background: '#fef2f2',
                  borderLeftColor: colors.accent,
                  color: '#dc2626'
                }}
              >
                {error}
              </div>
            )}

            {/* 预设用户快速登录 - 仅测试环境 */}
            {enablePresetQuickLogin && presetUsers.length > 0 && (
              <div className="space-y-4 mb-6">
                <h2 className="text-lg font-medium text-center" style={{color: colors.text}}>
                  选择你的身份
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {presetUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handlePresetQuickLogin(user)}
                      disabled={isLoading}
                      className="p-4  border transition-all duration-300 hover:scale-102 disabled:opacity-50 fresh-glow-effect"
                      style={{
                        background: `linear-gradient(135deg, ${colors.accent}08, ${(colors as any).mint || colors.accent}08)`,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        {getUserIcon(getPresetUserUITheme(user), 'lg')}
                        <span className="font-medium">{user.displayName}</span>
                        <span className="text-sm" style={{color: colors.textMuted}}>
                          {getPresetUserUITheme(user) === 'cat' ? '清新小猫' : '简约小牛'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* 表单分割线 - 仅在显示快速登录时显示 */}
            {enablePresetQuickLogin && presetUsers.length > 0 && (
              <div className="flex items-center my-6">
                <div className="flex-1 h-px" style={{background: colors.border}}></div>
                <span className="px-4 text-sm" style={{color: colors.textMuted}}>或者</span>
                <div className="flex-1 h-px" style={{background: colors.border}}></div>
              </div>
            )}

            {/* 登录表单 */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: colors.text}}>
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-fresh border transition-all duration-300 focus:scale-101"
                  style={{
                    background: colors.panel,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  placeholder="输入邮箱地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: colors.text}}>
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-fresh border transition-all duration-300 focus:scale-101"
                    style={{
                      background: colors.panel,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                    placeholder="输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1  transition-colors"
                    style={{color: colors.textMuted}}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6  font-medium transition-all duration-300 hover:scale-102 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${(colors as any).mint || colors.accent})`,
                  color: 'white',
                  boxShadow: '0 4px 24px rgba(16, 185, 129, 0.06), 0 2px 12px rgba(30, 41, 59, 0.04)'
                }}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>

            {/* 底部装饰 */}
            <div className="text-center mt-8">
              <div className="flex justify-center space-x-2 text-xl opacity-50">
                <span className="animate-fresh-wave">🌿</span>
                <span className="animate-fresh-breathe">💚</span>
                <span className="animate-fresh-wave" style={{animationDelay: '1s'}}>🌿</span>
              </div>
            </div>
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
      {/* 像素风背景效果（主题无关） */}
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
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 border-2 border-black rounded-pixel flex items-center justify-center" style={{background: colors.accent}}>
                <PixelIcon name="pixel-heart" size="md" className="text-white" />
              </div>
              <div className="w-8 h-8 border-2 border-black rounded-pixel flex items-center justify-center" style={{background: colors.info}}>
                <PixelIcon name="pixel-heart" size="lg" className="text-white" />
              </div>
              <div className="w-6 h-6 border-2 border-black rounded-pixel flex items-center justify-center" style={{background: colors.warning}}>
                <PixelIcon name="pixel-star" size="md" className="text-white" />
              </div>
              <div className="w-8 h-8 border-2 border-black rounded-pixel flex items-center justify-center" style={{background: colors.accent}}>
                <PixelIcon name="pixel-heart" size="lg" className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-retro font-bold mb-2 tracking-wider uppercase" style={{ color: colors.text }}>
              LOVE_PLANNER.EXE
            </h1>
            <div className="border-2 rounded-pixel p-2 mb-2" style={{ background: colors.panel, borderColor: colors.border }}>
              <p className="text-sm font-mono" style={{ color: colors.info }}>
                LOGIN TO YOUR LOVE QUEST!
              </p>
            </div>
            <div className="border-2 border-black rounded-pixel p-2 mb-2" style={{ background: colors.accent }}>
              <p className="text-white text-xs font-mono font-bold text-center uppercase">
                PRESET USERS: CAT 🐱 & COW 🐄
              </p>
            </div>
          </div>

          {/* 登录模式提示 */}
          <div className="mb-6 border-2 rounded-pixel p-3" style={{ background: colors.panel, borderColor: colors.border }}>
            <p className="text-sm font-mono text-center uppercase tracking-wide" style={{ color: colors.info }}>
              &gt;&gt;&gt; LOGIN ONLY MODE &lt;&lt;&lt;
            </p>
          </div>

          {/* 预设用户快速登录 - 仅测试环境 */}
          {enablePresetQuickLogin && presetUsers.length > 0 && (
            <div className="space-y-3 mb-6">
              <div className="border-2 rounded-pixel p-3" style={{ background: colors.panel, borderColor: colors.border }}>
                <p className="text-sm font-mono text-center mb-3 uppercase tracking-wide" style={{ color: colors.text }}>
                  &gt;&gt;&gt; QUICK LOGIN &lt;&lt;&lt;
                </p>
                {presetUsers.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => handlePresetQuickLogin(user)}
                    disabled={isLoading}
                    className={`w-full p-4 mb-2 border-4 border-black transition-all duration-200 flex items-center space-x-4 rounded-pixel ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:translate-y-[-2px]'
                    }`}
                    style={{
                      background: getPresetUserUITheme(user) === 'cat' ? colors.warning : colors.info,
                      color: 'white'
                    }}
                  >
                    <div className="w-12 h-12 border-2 border-black rounded-pixel flex items-center justify-center text-2xl" style={{
                      background: getPresetUserUITheme(user) === 'cat' ? colors.warning : colors.info
                    }}>
                      {getUserIcon(getPresetUserUITheme(user), 'sm')}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-mono text-current uppercase tracking-wide font-bold">
                        {user.displayName.toUpperCase()}
                      </div>
                      <div className="text-xs opacity-80 font-mono">
                        [PRESS TO LOGIN]
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* 分割线 - 仅在显示快速登录时显示 */}
          {enablePresetQuickLogin && presetUsers.length > 0 && (
            <div className="flex items-center my-6">
              <div className="flex-1 h-0.5" style={{ background: colors.border }}></div>
              <div className="px-3" style={{ background: colors.panel }}>
                <span className="text-xs font-mono uppercase" style={{ color: colors.textMuted }}>OR MANUAL INPUT</span>
              </div>
              <div className="flex-1 h-0.5" style={{ background: colors.border }}></div>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-mono mb-2 uppercase tracking-wide flex items-center space-x-2" style={{ color: colors.text }}>
                <PixelIcon name="mail" className="text-pixel-info" />
                <span>&gt; EMAIL:</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-black rounded-pixel font-mono focus:outline-none transition-colors"
                style={{
                  background: colors.panel,
                  color: colors.text,
                  borderColor: colors.border
                }}
                placeholder="ENTER_YOUR_EMAIL.exe"
                required
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-mono mb-2 uppercase tracking-wide flex items-center space-x-2" style={{ color: colors.text }}>
                <PixelIcon name="lock" className="text-pixel-warning" />
                <span>&gt; PASSWORD:</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border-2 border-black rounded-pixel font-mono focus:outline-none transition-colors"
                  style={{
                    background: colors.panel,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                  placeholder="ENTER_SECRET_CODE"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                  style={{ color: colors.textMuted }}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 错误消息 */}
            {error && (
              <div className="border-2 border-red-600 rounded-pixel p-3" style={{ background: 'rgba(220, 20, 60, 0.1)' }}>
                <div className="flex items-center space-x-2">
                  <PixelIcon name="warning" className="text-red-400" />
                  <p className="text-red-400 text-sm font-mono font-bold uppercase">[ERROR]: {error}</p>
                </div>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 text-white font-mono font-bold uppercase tracking-wide rounded-pixel border-4 border-black transition-all duration-200 ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:translate-y-[-2px] active:translate-y-[1px]'
              }`}
              style={{
                background: colors.accent,
                boxShadow: isLoading ? 'none' : '4px 4px 0 #000, 0 6px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <PixelIcon name="loading" className="animate-spin" />
                  <span>AUTHENTICATING...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <PixelIcon name="login" />
                  <span>&gt; LOGIN TO SYSTEM &lt;</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
