import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { EyeIcon, EyeSlashIcon, UserIcon, HeartIcon, SparklesIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';
import { authService, PRESET_USERS } from '../services/authService';

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

  // 获取用户图标（统一像素风图标，颜色根据角色区分）
  const getUserIcon = (role: 'cat' | 'cow', size: 'sm' | 'md' | 'lg' = 'md') => {
    // 统一使用像素风图标，颜色根据角色区分（主题无关）
    const colorClass = role === 'cat' ? 'text-pixel-warning' : 'text-pixel-info';
    
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

      const userType = user.role as 'cat' | 'cow';
      const { user: authUser, profile } = await authService.quickLogin(userType);
      onAuthSuccess(authUser, profile);

    } catch (err: any) {
      setError(err.message || '快速登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 统一像素风主题渲染（深色/浅色主题使用相同结构，只通过CSS类控制颜色）
  return (
    <div className="min-h-screen bg-pixel-bg flex items-center justify-center p-4 font-retro pixel-scanlines crt-screen">
      {/* 像素风背景效果（主题无关） */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-pixel-accent rounded-pixel animate-pixel-pulse neon-border"></div>
        <div className="absolute top-20 right-20 w-2 h-2 bg-pixel-success rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-pixel-warning rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-pixel-info rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '1.5s'}}></div>
        
        {/* 数据流效果 */}
        <div className="data-stream absolute top-1/4 w-full h-px"></div>
        <div className="data-stream absolute top-2/4 w-full h-px" style={{animationDelay: '2s'}}></div>
        <div className="data-stream absolute top-3/4 w-full h-px" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-8 relative overflow-hidden neon-border pixel-matrix">
          {/* 顶部装饰条 */}
          <div className="absolute top-0 left-0 w-full h-4 bg-pixel-accent border-b-2 border-black"></div>

          {/* Logo和标题 */}
          <div className="text-center mb-8 mt-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-pixel-accent border-2 border-black rounded-pixel flex items-center justify-center">
                <PixelIcon name="pixel-heart" size="md" className="text-white" />
              </div>
              <div className="w-8 h-8 bg-pixel-info border-2 border-black rounded-pixel flex items-center justify-center">
                <PixelIcon name="pixel-heart" size="lg" className="text-white" />
              </div>
              <div className="w-6 h-6 bg-pixel-warning border-2 border-black rounded-pixel flex items-center justify-center">
                <PixelIcon name="pixel-star" size="md" className="text-white" />
              </div>
              <div className="w-8 h-8 bg-pixel-accent border-2 border-black rounded-pixel flex items-center justify-center">
                <PixelIcon name="pixel-heart" size="lg" className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-retro font-bold text-pixel-text mb-2 tracking-wider uppercase">
              LOVE_PLANNER.EXE
            </h1>
            <div className="bg-pixel-card border-2 border-pixel-border rounded-pixel p-2 mb-2">
              <p className="text-pixel-info text-sm font-mono">
                LOGIN TO YOUR LOVE QUEST!
              </p>
            </div>
            <div className="bg-pixel-purple border-2 border-black rounded-pixel p-2 mb-2">
              <p className="text-white text-xs font-mono font-bold text-center uppercase">
                {isDemoMode ? 'DEMO MODE - ONLY CAT & COW USERS' : 'PRESET USERS: CAT 🐱 & COW 🐄'}
              </p>
            </div>
          </div>

          {/* 登录模式提示 */}
          <div className="mb-6 bg-pixel-card border-2 border-pixel-border rounded-pixel p-3">
            <p className="text-pixel-info text-sm font-mono text-center uppercase tracking-wide">
              &gt;&gt;&gt; LOGIN ONLY MODE &lt;&lt;&lt;
            </p>
          </div>

          {/* 快速登录选项 */}
          <div className="space-y-3 mb-6">
            <div className="bg-pixel-card border-2 border-pixel-border rounded-pixel p-3">
              <p className="text-sm font-mono text-pixel-text text-center mb-3 uppercase tracking-wide">
                &gt;&gt;&gt; QUICK LOGIN &lt;&lt;&lt;
              </p>
              {quickLogins.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleQuickLogin(user)}
                  disabled={isLoading}
                  className={`w-full p-4 mb-2 border-4 transition-all duration-200 flex items-center space-x-4 rounded-pixel ${
                    user.role === 'cat'
                      ? 'bg-pixel-warning text-black border-black'
                      : 'bg-pixel-info text-white border-black'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:translate-y-[-2px] hover:shadow-pixel-lg'}`}
                >
                  <div className={`w-12 h-12 border-2 border-black rounded-pixel flex items-center justify-center text-2xl ${
                    user.role === 'cat' ? 'bg-pixel-warning' : 'bg-pixel-info'
                  }`}>
                    {getUserIcon(user.role, 'sm')}
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
            <div className="flex-1 h-0.5 bg-pixel-border"></div>
            <div className="px-3 bg-pixel-panel">
              <span className="text-xs font-mono text-pixel-textMuted uppercase">OR MANUAL INPUT</span>
            </div>
            <div className="flex-1 h-0.5 bg-pixel-border"></div>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                <PixelIcon name="mail" className="text-pixel-info" />
                <span>&gt; EMAIL:</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-pixel-panel border-2 border-pixel-border rounded-pixel font-mono text-pixel-text focus:outline-none focus:border-pixel-accent transition-colors"
                placeholder="ENTER_YOUR_EMAIL.exe"
                required
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                <PixelIcon name="lock" className="text-pixel-warning" />
                <span>&gt; PASSWORD:</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-pixel-panel border-2 border-pixel-border rounded-pixel font-mono text-pixel-text focus:outline-none focus:border-pixel-accent transition-colors pr-12"
                  placeholder="ENTER_SECRET_CODE"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pixel-textMuted hover:text-pixel-accent transition-colors"
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
              <div className="bg-red-900/80 border-2 border-red-600 rounded-pixel p-3">
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
              className={`w-full py-4 px-6 bg-pixel-accent text-white font-mono font-bold uppercase tracking-wide rounded-pixel border-4 border-black transition-all duration-200 ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:translate-y-[-2px] hover:shadow-pixel-lg active:translate-y-[1px]'
              }`}
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
