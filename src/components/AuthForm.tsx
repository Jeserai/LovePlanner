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
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
    role: 'cat' as 'cat' | 'cow'
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

  // 获取用户图标
  const getUserIcon = (role: 'cat' | 'cow', size: 'sm' | 'md' | 'lg' = 'md') => {
    if (theme === 'pixel' || theme === 'lightPixel') {
      const colorClass = theme === 'lightPixel' 
        ? (role === 'cat' ? 'text-lightPixel-warning' : 'text-lightPixel-info')
        : (role === 'cat' ? 'text-pixel-warning' : 'text-pixel-info');
      
      return (
        <PixelIcon 
          name="user" 
          className={colorClass}
          size={size}
        />
      );
    } else {
      return (
        <UserIcon className={`${
          size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
        } ${role === 'cat' ? 'text-primary-500' : 'text-blue-500'}`} />
      );
    }
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

  // 注册处理（已禁用，只支持预设用户）
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('注册功能已禁用，LovePlanner只支持Cat和Cow两个预设用户 🐱🐄');
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

  if (theme === 'lightPixel') {
    return (
      <div className="lightPixel-theme">
        <div className="min-h-screen lightPixel-main flex items-center justify-center p-4 font-retro">
          {/* 浅色像素风背景效果 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-2 h-2 lightPixel-accent-dot rounded-pixel animate-pixel-pulse"></div>
            <div className="absolute top-20 right-20 w-2 h-2 lightPixel-success-dot rounded-pixel animate-pixel-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-20 left-20 w-2 h-2 lightPixel-warning-dot rounded-pixel animate-pixel-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-10 right-10 w-2 h-2 lightPixel-info-dot rounded-pixel animate-pixel-pulse" style={{animationDelay: '1.5s'}}></div>
            
            {/* 网格背景 */}
            <div className="absolute inset-0 lightPixel-grid"></div>
          </div>

          <div className="relative w-full max-w-md z-10">
            <div className="lightPixel-panel border-4 lightPixel-border-dark rounded-pixel p-8 relative overflow-hidden">
              {/* 顶部装饰条 */}
              <div className="absolute top-0 left-0 w-full h-4 lightPixel-top-bar border-b-2"></div>
              
              {/* Logo和标题 */}
              <div className="text-center mb-8 mt-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-6 h-6 lightPixel-accent-dot border-2 lightPixel-border-dark rounded-pixel flex items-center justify-center">
                    <PixelIcon name="pixel-heart" size="md" className="text-white" />
                  </div>
                  <div className="w-8 h-8 lightPixel-info-dot border-2 lightPixel-border-dark rounded-pixel flex items-center justify-center">
                    <PixelIcon name="pixel-heart" size="lg" className="text-white" />
                  </div>
                  <div className="w-6 h-6 lightPixel-warning-dot border-2 lightPixel-border-dark rounded-pixel flex items-center justify-center">
                    <PixelIcon name="pixel-star" size="md" className="text-white" />
                  </div>
                  <div className="w-8 h-8 lightPixel-accent-dot border-2 lightPixel-border-dark rounded-pixel flex items-center justify-center">
                    <PixelIcon name="pixel-heart" size="lg" className="text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-retro font-bold lightPixel-text mb-2 tracking-wider uppercase">
                  LOVE_PLANNER.EXE
                </h1>
                <div className="lightPixel-card border-2 lightPixel-border rounded-pixel p-2 mb-2">
                  <p className="lightPixel-text-info text-sm font-mono">
                    LOGIN TO YOUR LOVE QUEST!
                  </p>
                </div>
                <div className="bg-lightPixel-purple border-2 lightPixel-border-dark rounded-pixel p-2 mb-2">
                  <p className="text-white text-xs font-mono font-bold text-center uppercase">
                    {isDemoMode ? 'DEMO MODE - ONLY CAT & COW USERS' : 'PRESET USERS: CAT 🐱 & COW 🐄'}
                  </p>
                </div>
              </div>

              {/* 登录模式提示 */}
              <div className="mb-6 lightPixel-card border-2 lightPixel-border rounded-pixel p-3">
                <p className="lightPixel-text-info text-sm font-mono text-center uppercase tracking-wide">
                  &gt;&gt;&gt; LOGIN ONLY MODE &lt;&lt;&lt;
                </p>
              </div>

              {/* 快速登录选项 */}
              <div className="space-y-3 mb-6">
                <div className="lightPixel-card border-2 lightPixel-border rounded-pixel p-3">
                  <p className="text-sm font-mono lightPixel-text text-center mb-3 uppercase tracking-wide">
                    &gt;&gt;&gt; QUICK LOGIN &lt;&lt;&lt;
                  </p>
                  {quickLogins.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => handleQuickLogin(user)}
                      disabled={isLoading}
                      className={`w-full p-4 mb-2 border-4 transition-all duration-200 flex items-center space-x-4 rounded-pixel ${
                        user.role === 'cat'
                          ? 'lightPixel-btn-cat lightPixel-border-dark'
                          : 'lightPixel-btn-cow lightPixel-border-dark'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:translate-y-[-2px]'}`}
                    >
                      <div className={`w-12 h-12 border-2 lightPixel-border-dark rounded-pixel flex items-center justify-center text-2xl ${
                        user.role === 'cat' ? 'lightPixel-btn-cat' : 'lightPixel-btn-cow'
                      }`}>
                        {getUserIcon(user.role, 'sm')}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-mono lightPixel-text uppercase tracking-wide font-bold">
                          {user.displayName.toUpperCase()}
                        </div>
                        <div className="text-xs lightPixel-text-muted font-mono">
                          [PRESS TO LOGIN]
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <div className="px-3 lightPixel-panel">
                  <span className="text-xs font-mono lightPixel-text-muted uppercase">OR MANUAL INPUT</span>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              {/* 登录表单 */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* 邮箱输入 */}
                <div>
                  <label className="block text-sm font-mono lightPixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                    <PixelIcon name="mail" className="lightPixel-text-info" />
                    <span>&gt; EMAIL:</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 lightPixel-input border-2 lightPixel-border rounded-pixel font-mono lightPixel-text focus:outline-none transition-colors"
                    placeholder="ENTER_YOUR_EMAIL.exe"
                    required
                  />
                </div>

                {/* 密码输入 */}
                <div>
                  <label className="block text-sm font-mono lightPixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                    <PixelIcon name="lock" className="lightPixel-text-warning" />
                    <span>&gt; PASSWORD:</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 lightPixel-input border-2 lightPixel-border rounded-pixel font-mono lightPixel-text focus:outline-none transition-colors pr-12"
                      placeholder="ENTER_SECRET_CODE"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 lightPixel-text-muted hover:lightPixel-text-accent transition-colors"
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
                  <div className="lightPixel-error border-2 rounded-pixel p-3">
                    <div className="flex items-center space-x-2">
                      <PixelIcon name="warning" className="text-red-600" />
                      <p className="text-red-600 text-sm font-mono font-bold uppercase">[ERROR]: {error}</p>
                    </div>
                  </div>
                )}

                {/* 登录按钮 */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 px-6 lightPixel-btn-accent text-white font-mono font-bold uppercase tracking-wide rounded-pixel border-4 lightPixel-border-dark transition-all duration-200 ${
                    isLoading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:translate-y-[-2px] active:translate-y-[1px]'
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
      </div>
    );
  }

  if (theme === 'pixel') {
    return (
      <div className="min-h-screen bg-pixel-bg flex items-center justify-center p-4 font-retro pixel-scanlines crt-screen">
        {/* 像素风背景效果 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-pixel-accent rounded-pixel animate-pixel-pulse neon-border"></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-pixel-success rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 left-20 w-2 h-2 bg-pixel-warning rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-pixel-purple rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '1.5s'}}></div>
          
          <div className="data-stream absolute top-1/4 w-full h-px"></div>
          <div className="data-stream absolute top-2/4 w-full h-px" style={{animationDelay: '2s'}}></div>
          <div className="data-stream absolute top-3/4 w-full h-px" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative w-full max-w-md z-10">
          <div className="bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-8 relative overflow-hidden neon-border pixel-matrix">
            {/* 顶部装饰条 */}
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-pixel-accent via-pixel-cyan to-pixel-lime border-b-4 border-black"></div>
            
            {/* Logo和标题 */}
            <div className="text-center mb-8 mt-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-pixel-accent border-2 border-white rounded-pixel flex items-center justify-center neon-border">
                  <PixelIcon name="pixel-heart" size="lg" className="text-white" glow />
                </div>
                <div className="w-6 h-6 bg-pixel-warning border-2 border-white rounded-pixel flex items-center justify-center neon-border">
                  <PixelIcon name="pixel-star" size="md" className="text-black" glow />
                </div>
                <div className="w-8 h-8 bg-pixel-accent border-2 border-white rounded-pixel flex items-center justify-center neon-border">
                  <PixelIcon name="pixel-heart" size="lg" className="text-white" glow />
                </div>
              </div>
              <h1 className="text-2xl font-retro font-bold text-pixel-text mb-2 tracking-wider uppercase neon-text cyber-glitch" data-text="LOVE_PLANNER.EXE">
                LOVE_PLANNER.EXE
              </h1>
              <div className="bg-pixel-card border-2 border-pixel-cyan rounded-pixel p-2 mb-2 neon-border">
                <p className="text-pixel-cyan text-sm font-mono neon-text">
                  LOGIN TO YOUR LOVE QUEST!
                </p>
              </div>
              <div className="bg-pixel-purple border-2 border-white rounded-pixel p-2 mb-2 neon-border">
                <p className="text-white text-xs font-mono font-bold text-center uppercase">
                  {isDemoMode ? 'DEMO MODE - ONLY CAT & COW USERS' : 'PRESET USERS: CAT 🐱 & COW 🐄'}
                </p>
              </div>
            </div>

            {/* 登录模式提示 */}
            <div className="mb-6 bg-pixel-card border-2 border-pixel-border rounded-pixel p-3 neon-border">
              <p className="text-pixel-cyan text-sm font-mono text-center uppercase tracking-wide">
                &gt;&gt;&gt; LOGIN ONLY MODE &lt;&lt;&lt;
              </p>
            </div>

            {/* 快速登录选项 */}
            <div className="space-y-3 mb-6">
              <div className="bg-pixel-card border-2 border-pixel-border rounded-pixel p-3">
                <p className="text-sm font-mono text-pixel-text text-center mb-3 uppercase tracking-wide neon-text">
                  &gt;&gt;&gt; QUICK LOGIN &lt;&lt;&lt;
                </p>
                {quickLogins.map((user, index) => (
                  <button
                    key={user.email}
                    onClick={() => handleQuickLogin(user)}
                    disabled={isLoading}
                    className={`w-full p-4 mb-2 border-4 transition-all duration-200 flex items-center space-x-4 rounded-pixel ${
                      user.role === 'cat'
                        ? 'border-pixel-warning bg-pixel-panel hover:bg-pixel-card neon-border'
                        : 'border-pixel-info bg-pixel-panel hover:bg-pixel-card neon-border'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-pixel-neon hover:translate-y-[-2px] pixel-btn-neon'}`}
                  >
                    <div className={`w-12 h-12 border-2 border-white rounded-pixel flex items-center justify-center text-2xl ${
                      user.role === 'cat' ? 'bg-pixel-warning' : 'bg-pixel-info'
                    } neon-border`}>
                      {getUserIcon(user.role, 'sm')}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-mono text-pixel-text uppercase tracking-wide font-bold neon-text">
                        {user.displayName.toUpperCase()}
                      </div>
                      <div className="text-xs text-pixel-cyan font-mono">
                        [PRESS TO LOGIN]
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center my-6">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-pixel-cyan to-transparent"></div>
              <div className="px-3 bg-pixel-panel">
                <span className="text-xs font-mono text-pixel-cyan uppercase neon-text">OR MANUAL INPUT</span>
              </div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-pixel-cyan to-transparent"></div>
            </div>

            {/* 登录表单 */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* 邮箱输入 */}
              <div>
                <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                  <PixelIcon name="mail" className="text-pixel-cyan" />
                  <span>&gt; EMAIL:</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pixel-input-glow rounded-pixel px-4 py-3 font-mono text-pixel-text placeholder-pixel-textMuted transition-all duration-200"
                  placeholder="ENTER_EMAIL..."
                  required
                  disabled={isLoading}
                />
              </div>

              {/* 注册模式额外字段 */}
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                      <PixelIcon name="user" className="text-pixel-cyan" />
                      <span>&gt; USERNAME:</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pixel-input-glow rounded-pixel px-4 py-3 font-mono text-pixel-text placeholder-pixel-textMuted transition-all duration-200"
                      placeholder="ENTER_USERNAME..."
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                      <PixelIcon name="pixel-star" className="text-pixel-cyan" />
                      <span>&gt; DISPLAY_NAME:</span>
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full pixel-input-glow rounded-pixel px-4 py-3 font-mono text-pixel-text placeholder-pixel-textMuted transition-all duration-200"
                      placeholder="ENTER_DISPLAY_NAME..."
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide">
                      &gt; SELECT_ROLE:
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'cat' })}
                        className={`flex-1 p-3 border-4 rounded-pixel flex items-center justify-center space-x-2 transition-all ${
                          formData.role === 'cat'
                            ? 'border-pixel-warning bg-pixel-warning text-black neon-border'
                            : 'border-pixel-border bg-pixel-card text-pixel-cyan hover:border-pixel-warning'
                        }`}
                        disabled={isLoading}
                      >
                        {getUserIcon('cat', 'sm')}
                        <span className="font-mono font-bold">CAT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'cow' })}
                        className={`flex-1 p-3 border-4 rounded-pixel flex items-center justify-center space-x-2 transition-all ${
                          formData.role === 'cow'
                            ? 'border-pixel-info bg-pixel-info text-black neon-border'
                            : 'border-pixel-border bg-pixel-card text-pixel-cyan hover:border-pixel-info'
                        }`}
                        disabled={isLoading}
                      >
                        {getUserIcon('cow', 'sm')}
                        <span className="font-mono font-bold">COW</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 密码输入 */}
              <div>
                <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                  <PixelIcon name="lock" className="text-pixel-cyan" />
                  <span>&gt; PASSWORD:</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pixel-input-glow rounded-pixel px-4 py-3 pr-12 font-mono text-pixel-text placeholder-pixel-textMuted transition-all duration-200"
                    placeholder="ENTER_PASSWORD..."
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-pixel-card border-2 border-pixel-border rounded-pixel flex items-center justify-center text-pixel-cyan hover:text-pixel-accent transition-colors neon-border"
                    disabled={isLoading}
                  >
                    <PixelIcon name={showPassword ? 'eye' : 'eye-slash'} glow />
                  </button>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className={`p-3 border-4 rounded-pixel neon-border animate-neon-flicker ${
                  error.includes('成功') 
                    ? 'bg-pixel-success border-white' 
                    : 'bg-pixel-accent border-white'
                }`}>
                  <p className={`text-sm font-mono font-bold text-center uppercase ${
                    error.includes('成功') ? 'text-black' : 'text-white'
                  }`}>
                    {error}
                  </p>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password || (mode === 'register' && (!formData.username || !formData.displayName))}
                className={`w-full py-4 px-6 rounded-pixel font-mono font-bold transition-all duration-200 flex items-center justify-center space-x-2 uppercase tracking-wider border-4 ${
                  isLoading || !formData.email || !formData.password || (mode === 'register' && (!formData.username || !formData.displayName))
                    ? 'bg-pixel-border text-pixel-textMuted cursor-not-allowed border-pixel-border'
                    : 'pixel-btn-neon text-white shadow-pixel-neon hover:shadow-pixel-neon-strong'
                }`}
              >
                {isLoading ? (
                  <>
                    <PixelIcon name="loading" className="animate-spin text-current" />
                    <span>[PROCESSING...]</span>
                  </>
                ) : (
                  <>
                    <PixelIcon name="pixel-heart" className="text-current" glow />
                    <span>{mode === 'login' ? 'LOGIN' : 'CREATE_ACCOUNT'}</span>
                    <PixelIcon name="pixel-arrow" className="text-current" glow />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 底部装饰文字 */}
          <div className="text-center mt-6">
            <div className="bg-pixel-panel border-4 border-pixel-border rounded-pixel p-3 neon-border">
              <p className="text-sm text-pixel-text font-mono uppercase tracking-wide cyber-glitch neon-text">
                &gt;&gt; SECURE LOVE DATABASE ACCESS &lt;&lt;
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 默认使用深色像素风主题（兼容性保证）
  return <div>
    <p style={{textAlign: 'center', padding: '20px', color: 'white', backgroundColor: '#1a1a2e'}}>
      主题系统已简化，请刷新页面使用像素风主题
    </p>
  </div>;
};

export default AuthForm;
