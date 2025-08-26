import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import { authService, PRESET_USERS, getUserDisplayInfo } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';

// 检查是否为演示模式（Supabase未配置）
const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co' ||
                   !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                   process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url';

interface AuthFormProps {
  onAuthSuccess: (user: any, profile: any) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 根据主题获取颜色配置
  const getThemeColors = () => {
    if (theme === 'romantic') {
      return {
        bg: '#fdf2f8',
        panel: '#ffffff',
        text: '#2d1b2e',
        textMuted: '#6b5b73',
        border: '#fce7f3',
        accent: '#e91e63',
        success: '#10b981',
        warning: '#f59e0b',
        info: '#3b82f6',
        heart: '#ff69b4',
        cherry: '#ff1493',
      };
    } else if (theme === 'fresh') {
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
        catColor: '#06b6d4',
        cowColor: '#8b5cf6',
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

  // 预设用户选项
  const quickLogins = [
    {
      ...PRESET_USERS.cat,
      displayName: PRESET_USERS.cat.displayName
    },
    {
      ...PRESET_USERS.cow,
      displayName: PRESET_USERS.cow.displayName
    }
  ];

  // 获取预设用户的UI主题（仅用于显示）
  const getPresetUserUITheme = (presetUser: any): 'cat' | 'cow' => {
    const userInfo = getUserDisplayInfo(presetUser);
    return userInfo?.uiTheme === 'cow' ? 'cow' : 'cat';
  };

  // 获取用户图标，根据主题和用户类型区分
  const getUserIcon = (userType: 'cat' | 'cow', size: 'sm' | 'md' | 'lg' = 'md') => {
    if (theme === 'romantic') {
      // 浪漫主题使用emoji风格
      const emoji = userType === 'cat' ? '🐱' : '🐮';
      const sizeMap = { sm: '1.5rem', md: '2rem', lg: '2.5rem' };
      return (
        <span 
          style={{ 
            fontSize: sizeMap[size],
            filter: `drop-shadow(0 2px 4px ${colors.accent}40)`
          }}
          className="inline-block animate-romantic-float"
        >
          {emoji}
        </span>
      );
    } else if (theme === 'fresh') {
      // 清新主题使用简约图标和用户专属颜色
      const emoji = userType === 'cat' ? '🐱' : '🐮';
      const color = userType === 'cat' ? (colors as any).catColor : (colors as any).cowColor;
      const sizeMap = { sm: '1.5rem', md: '2rem', lg: '2.5rem' };
      return (
        <div 
          className="inline-flex items-center justify-center rounded-fresh-full animate-fresh-breathe"
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
      onAuthSuccess(user, profile);

    } catch (err: any) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  };

  // 快速登录
  const handleQuickLogin = async (user: typeof quickLogins[0]) => {
    setFormData(prev => ({ ...prev, email: user.email, password: user.password }));
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 600)); // 模拟网络延迟

      // 直接从用户预设数据判断类型（用于快速登录）
      const userInfo = getUserDisplayInfo(user);
      const userType = userInfo?.uiTheme === 'cow' ? 'cow' : 'cat';
      const { user: authUser, profile } = await authService.quickLogin(userType);
      onAuthSuccess(authUser, profile);

    } catch (err: any) {
      setError(err.message || '快速登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 根据主题渲染不同风格
  if (theme === 'romantic') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{ background: colors.bg }}
      >
        {/* 浪漫背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 text-4xl animate-romantic-float opacity-60">🌸</div>
          <div className="absolute top-32 right-32 text-3xl animate-romantic-sparkle opacity-50">✨</div>
          <div className="absolute bottom-40 left-40 text-5xl animate-romantic-heartbeat opacity-40">💖</div>
          <div className="absolute bottom-20 right-20 text-3xl animate-romantic-float opacity-50" style={{animationDelay: '1s'}}>🦋</div>
          <div className="absolute top-1/2 right-16 text-2xl animate-romantic-sparkle opacity-30" style={{animationDelay: '2s'}}>🌟</div>
        </div>

        <div className="relative w-full max-w-md z-10">
          <div 
            className="rounded-romantic-lg p-8 relative overflow-hidden romantic-sparkle"
            style={{ 
              background: colors.panel,
              border: `2px solid ${colors.border}`,
              boxShadow: '0 8px 32px rgba(233, 30, 99, 0.08), 0 4px 16px rgba(248, 187, 217, 0.12)'
            }}
          >
            {/* Logo和标题 */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <span className="text-4xl animate-romantic-heartbeat">💕</span>
                <span className="text-3xl animate-romantic-float">🌹</span>
                <span className="text-4xl animate-romantic-heartbeat" style={{animationDelay: '0.5s'}}>💕</span>
              </div>
              
              <h1 className="text-3xl font-bold mb-2 romantic-gradient-text">
                Love Planner
              </h1>
              <p className="font-medium" style={{color: colors.textMuted}}>
                情侣任务管理系统
              </p>
            </div>

            {/* 错误提示 */}
            {error && (
              <div 
                className="p-4 rounded-romantic mb-6 border-l-4 text-sm"
                style={{
                  background: '#fef2f2',
                  borderLeftColor: colors.accent,
                  color: '#dc2626'
                }}
              >
                {error}
              </div>
            )}

            {/* 快速登录按钮 */}
            <div className="space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-center" style={{color: colors.text}}>
                选择你的身份
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {quickLogins.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    disabled={isLoading}
                    className="p-4 rounded-romantic-lg border-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 romantic-glow-effect"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent}10, ${(colors as any).heart || colors.accent}10)`,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {getUserIcon(getPresetUserUITheme(user), 'lg')}
                      <span className="font-semibold">{user.displayName}</span>
                      <span className="text-sm" style={{color: colors.textMuted}}>
                        {getPresetUserUITheme(user) === 'cat' ? '可爱猫咪' : '温柔奶牛'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 表单分割线 */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px" style={{background: colors.border}}></div>
              <span className="px-4 text-sm" style={{color: colors.textMuted}}>或者</span>
              <div className="flex-1 h-px" style={{background: colors.border}}></div>
            </div>

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
                  className="w-full px-4 py-3 rounded-romantic border-2 transition-all duration-300 focus:scale-[1.02] focus:shadow-romantic"
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
                    className="w-full px-4 py-3 pr-12 rounded-romantic border-2 transition-all duration-300 focus:scale-[1.02] focus:shadow-romantic"
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-romantic-sm transition-colors"
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
                className="w-full py-3 px-6 rounded-romantic-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-romantic-lg hover:shadow-romantic-glow"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${(colors as any).heart || colors.accent})`,
                  color: 'white'
                }}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>

            {/* 底部装饰 */}
            <div className="text-center mt-8">
              <div className="flex justify-center space-x-2 text-2xl opacity-60">
                <span className="animate-romantic-sparkle">✨</span>
                <span className="animate-romantic-heartbeat">💖</span>
                <span className="animate-romantic-sparkle" style={{animationDelay: '1s'}}>✨</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (theme === 'fresh') {
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
            className="rounded-fresh-lg p-8 relative overflow-hidden fresh-minimal"
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
              
              <h1 className="text-3xl font-bold mb-2 fresh-gradient-text">
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

            {/* 快速登录按钮 */}
            <div className="space-y-4 mb-6">
              <h2 className="text-lg font-medium text-center" style={{color: colors.text}}>
                选择你的身份
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {quickLogins.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    disabled={isLoading}
                    className="p-4 rounded-fresh-lg border transition-all duration-300 hover:scale-102 disabled:opacity-50 fresh-glow-effect"
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

            {/* 表单分割线 */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px" style={{background: colors.border}}></div>
              <span className="px-4 text-sm" style={{color: colors.textMuted}}>或者</span>
              <div className="flex-1 h-px" style={{background: colors.border}}></div>
            </div>

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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-fresh-sm transition-colors"
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
                className="w-full py-3 px-6 rounded-fresh-lg font-medium transition-all duration-300 hover:scale-102 disabled:opacity-50"
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
                {isDemoMode ? 'DEMO MODE - ONLY CAT & COW USERS' : 'PRESET USERS: CAT 🐱 & COW 🐄'}
              </p>
            </div>
          </div>

          {/* 登录模式提示 */}
          <div className="mb-6 border-2 rounded-pixel p-3" style={{ background: colors.panel, borderColor: colors.border }}>
            <p className="text-sm font-mono text-center uppercase tracking-wide" style={{ color: colors.info }}>
              &gt;&gt;&gt; LOGIN ONLY MODE &lt;&lt;&lt;
            </p>
          </div>

          {/* 快速登录选项 */}
          <div className="space-y-3 mb-6">
            <div className="border-2 rounded-pixel p-3" style={{ background: colors.panel, borderColor: colors.border }}>
              <p className="text-sm font-mono text-center mb-3 uppercase tracking-wide" style={{ color: colors.text }}>
                &gt;&gt;&gt; QUICK LOGIN &lt;&lt;&lt;
              </p>
              {quickLogins.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleQuickLogin(user)}
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

          <div className="flex items-center my-6">
            <div className="flex-1 h-0.5" style={{ background: colors.border }}></div>
            <div className="px-3" style={{ background: colors.panel }}>
              <span className="text-xs font-mono uppercase" style={{ color: colors.textMuted }}>OR MANUAL INPUT</span>
            </div>
            <div className="flex-1 h-0.5" style={{ background: colors.border }}></div>
          </div>

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
