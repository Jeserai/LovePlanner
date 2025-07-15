import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { EyeIcon, EyeSlashIcon, UserIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';
import PixelIcon from './PixelIcon';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { theme } = useTheme();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 快速登录选项
  const quickLogins = [
    { username: 'whimsical cat', password: '0521', color: 'primary' },
    { username: 'whimsical cow', password: '0223', color: 'blue' }
  ];

  // 获取用户图标
  const getUserIcon = (username: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const userType = username.toLowerCase().includes('cat') ? 'cat' : 'cow';
    
    if (theme === 'pixel') {
      return (
        <PixelIcon 
          name="user" 
          className={userType === 'cat' ? 'text-pixel-warning' : 'text-pixel-info'}
          size={size}
        />
      );
    } else {
      return (
        <UserIcon className={`${
          size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
        } ${userType === 'cat' ? 'text-primary-500' : 'text-blue-500'}`} />
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = quickLogins.find(u => 
      u.username.toLowerCase() === loginData.username.toLowerCase() && 
      u.password === loginData.password
    );

    if (user) {
      onLogin(user.username);
    } else {
      setError(theme === 'pixel' ? 'ACCESS DENIED! INVALID CREDENTIALS!' : '用户名或密码错误，请重试！');
    }
    
    setIsLoading(false);
  };

  const handleQuickLogin = async (user: { username: string; password: string }) => {
    setLoginData({ username: user.username, password: user.password });
    setError('');
    setIsLoading(true);

    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onLogin(user.username);
    setIsLoading(false);
  };

  if (theme === 'pixel') {
    return (
      <div className="min-h-screen bg-pixel-bg flex items-center justify-center p-4 font-retro pixel-scanlines crt-screen">
        {/* 像素风背景效果增强 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 霓虹粒子效果 */}
          <div className="absolute top-10 left-10 w-2 h-2 bg-pixel-accent rounded-pixel animate-pixel-pulse neon-border"></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-pixel-success rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 left-20 w-2 h-2 bg-pixel-warning rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-pixel-purple rounded-pixel animate-pixel-pulse neon-border" style={{animationDelay: '1.5s'}}></div>
          
          {/* 浮动装饰元素 */}
          <div className="absolute top-32 left-32 w-4 h-4 bg-pixel-cyan rounded-pixel border-2 border-white animate-pixel-bounce"></div>
          <div className="absolute top-40 right-40 w-6 h-6 bg-pixel-lime rounded-pixel border-2 border-white animate-neon-flicker"></div>
          <div className="absolute bottom-32 left-40 w-3 h-3 bg-pixel-orange rounded-pixel border-2 border-white animate-cyberpunk-slide"></div>
          
          {/* 数据流背景 */}
          <div className="data-stream absolute top-1/4 w-full h-px"></div>
          <div className="data-stream absolute top-2/4 w-full h-px" style={{animationDelay: '2s'}}></div>
          <div className="data-stream absolute top-3/4 w-full h-px" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative w-full max-w-md z-10">
          {/* 像素风主登录框 */}
          <div className="bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-8 relative overflow-hidden neon-border pixel-matrix">
            {/* 顶部装饰条 - 增强版 */}
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-pixel-accent via-pixel-cyan to-pixel-lime border-b-4 border-black"></div>
            <div className="absolute top-1 left-1 w-4 h-2 bg-pixel-warning border-2 border-black rounded-pixel animate-neon-flicker"></div>
            <div className="absolute top-1 left-7 w-4 h-2 bg-pixel-success border-2 border-black rounded-pixel animate-neon-flicker" style={{animationDelay: '0.1s'}}></div>
            <div className="absolute top-1 left-13 w-4 h-2 bg-pixel-info border-2 border-black rounded-pixel animate-neon-flicker" style={{animationDelay: '0.2s'}}></div>
            
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
                  WELCOME TO YOUR LOVE QUEST!
                </p>
              </div>
              <div className="text-pixel-success text-xs font-mono neon-text animate-neon-glow">
                [SYSTEM READY] PLEASE SELECT PLAYER
              </div>
            </div>

            {/* 像素风玩家选择 */}
            <div className="space-y-3 mb-6">
              <div className="bg-pixel-card border-2 border-pixel-border rounded-pixel p-3 data-stream">
                <p className="text-sm font-mono text-pixel-text text-center mb-3 uppercase tracking-wide neon-text">
                  &gt;&gt;&gt; SELECT PLAYER &lt;&lt;&lt;
                </p>
                {quickLogins.map((user, index) => (
                  <button
                    key={user.username}
                    onClick={() => handleQuickLogin(user)}
                    disabled={isLoading}
                    className={`w-full p-4 mb-2 border-4 transition-all duration-200 flex items-center space-x-4 rounded-pixel ${
                      user.color === 'primary'
                        ? 'border-pixel-warning bg-pixel-panel hover:bg-pixel-card neon-border'
                        : 'border-pixel-info bg-pixel-panel hover:bg-pixel-card neon-border'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-pixel-neon hover:translate-y-[-2px] pixel-btn-neon'}`}
                  >
                    <div className={`w-12 h-12 border-2 border-white rounded-pixel flex items-center justify-center text-2xl ${
                      user.color === 'primary' ? 'bg-pixel-warning' : 'bg-pixel-info'
                    } neon-border`}>
                      {getUserIcon(user.username, 'sm')}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-mono text-pixel-text uppercase tracking-wide font-bold neon-text">
                        PLAYER_{user.username.split(' ')[1].toUpperCase()}
                      </div>
                      <div className="text-xs text-pixel-cyan font-mono">
                        [PRESS TO START GAME]
                      </div>
                    </div>
                    <div className="text-pixel-accent font-mono text-lg">
                      {isLoading ? (
                        <PixelIcon name="loading" className="animate-spin text-pixel-warning" glow />
                      ) : (
                        <PixelIcon name="pixel-arrow" className="text-pixel-accent" glow />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 像素风分割线 */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-pixel-cyan to-transparent"></div>
              <div className="px-3 bg-pixel-panel">
                <span className="text-xs font-mono text-pixel-cyan uppercase neon-text">OR MANUAL INPUT</span>
              </div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-pixel-cyan to-transparent"></div>
            </div>

            {/* 像素风登录表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 用户名输入 */}
              <div>
                <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                  {getUserIcon('whimsical cat')}
                  <span>&gt; USERNAME:</span>
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  className="w-full pixel-input-glow rounded-pixel px-4 py-3 font-mono text-pixel-text placeholder-pixel-textMuted uppercase transition-all duration-200"
                  placeholder="ENTER_USERNAME..."
                  required
                  disabled={isLoading}
                />
              </div>

              {/* 密码输入 */}
              <div>
                <label className="block text-sm font-mono text-pixel-text mb-2 uppercase tracking-wide flex items-center space-x-2">
                  <PixelIcon name="lock" className="text-pixel-cyan" />
                  <span>&gt; PASSWORD:</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full pixel-input-glow rounded-pixel px-4 py-3 pr-12 font-mono text-pixel-text placeholder-pixel-textMuted transition-all duration-200"
                    placeholder="ENTER_PASSWORD..."
                    required
                    disabled={isLoading}
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
                <div className="p-3 bg-pixel-accent border-4 border-white rounded-pixel neon-border animate-neon-flicker">
                  <p className="text-sm text-white font-mono font-bold text-center uppercase cyber-glitch" data-text={error}>
                    {error}
                  </p>
                </div>
              )}

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading || !loginData.username || !loginData.password}
                className={`w-full py-4 px-6 rounded-pixel font-mono font-bold transition-all duration-200 flex items-center justify-center space-x-2 uppercase tracking-wider border-4 ${
                  isLoading || !loginData.username || !loginData.password
                    ? 'bg-pixel-border text-pixel-textMuted cursor-not-allowed border-pixel-border'
                    : 'pixel-btn-neon text-white shadow-pixel-neon hover:shadow-pixel-neon-strong'
                }`}
              >
                {isLoading ? (
                  <>
                    <PixelIcon name="loading" className="animate-spin text-current" />
                    <span>[LOADING...]</span>
                  </>
                ) : (
                  <>
                    <PixelIcon name="pixel-heart" className="text-current" glow />
                    <span>START GAME</span>
                    <PixelIcon name="pixel-arrow" className="text-current" glow />
                  </>
                )}
              </button>
            </form>

            {/* 底部提示 */}
            <div className="mt-6 text-center">
              <div className="bg-pixel-card border-2 border-pixel-border rounded-pixel p-2 neon-border">
                <p className="text-xs text-pixel-cyan font-mono neon-text">
                  TIP: CLICK PLAYER ICONS FOR QUICK START!
                </p>
              </div>
            </div>
          </div>

          {/* 底部装饰文字 */}
          <div className="text-center mt-6">
            <div className="bg-pixel-panel border-4 border-pixel-border rounded-pixel p-3 neon-border">
              <p className="text-sm text-pixel-text font-mono uppercase tracking-wide cyber-glitch neon-text" data-text="&gt;&gt; RETRO LOVE ADVENTURE ✦ CYBERPUNK EDITION &lt;&lt;">
                &gt;&gt; RETRO LOVE ADVENTURE ✦ CYBERPUNK EDITION &lt;&lt;
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 莫奈主题的原始样式
  return (
    <div className="min-h-screen bg-monet-gradient flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-20 h-20 bg-secondary-200/15 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-32 w-32 h-32 bg-primary-200/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-40 w-24 h-24 bg-blue-200/15 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-lavender-200/10 rounded-full blur-lg"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* 主登录卡片 */}
        <div className="card-cutesy p-8 relative overflow-hidden backdrop-blur-md bg-white/60 shadow-dream">
          {/* 顶部装饰 */}
          <div className="absolute top-0 left-0 w-full h-2 bg-water-lily opacity-60"></div>
          
          {/* Logo和标题 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <HeartIcon className="w-8 h-8 text-secondary-500" />
              <SparklesIcon className="w-6 h-6 text-lavender-400" />
              <HeartIcon className="w-8 h-8 text-secondary-500" />
            </div>
            <h1 className="text-3xl font-display font-bold bg-water-lily bg-clip-text text-transparent mb-2">
              爱情规划师
            </h1>
            <p className="text-sage-600 text-sm">
              欢迎回到你们的甜蜜小天地
            </p>
          </div>

          {/* 快速登录按钮 */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-sage-700 text-center mb-3">快速登录</p>
            {quickLogins.map((user) => (
              <button
                key={user.username}
                onClick={() => handleQuickLogin(user)}
                disabled={isLoading}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center space-x-4 hover:scale-[1.02] backdrop-blur-md ${
                  user.color === 'primary'
                    ? 'border-primary-200/40 bg-primary-100/30 hover:border-primary-300/50 hover:bg-primary-200/40'
                    : 'border-blue-200/40 bg-blue-100/30 hover:border-blue-300/50 hover:bg-blue-200/40'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-dream'}`}
              >
                <div className="text-3xl">{getUserIcon(user.username, 'lg')}</div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sage-700 capitalize">
                    {user.username}
                  </div>
                  <div className="text-sm text-sage-500">
                    点击快速登录
                  </div>
                </div>
                {isLoading && (
                  <div className="w-6 h-6 border-2 border-sage-300 border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
            ))}
          </div>

          {/* 分割线 */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-sage-200/50"></div>
            <span className="px-3 text-sm text-sage-500">或手动输入</span>
            <div className="flex-1 h-px bg-sage-200/50"></div>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                className="input-cutesy w-full"
                placeholder="输入用户名..."
                required
                disabled={isLoading}
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="input-cutesy w-full pr-12"
                  placeholder="输入密码..."
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-400 hover:text-sage-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-orange-50/50 border border-orange-200/40 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-orange-600 text-center">{error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading || !loginData.username || !loginData.password}
              className={`w-full py-3 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                isLoading || !loginData.username || !loginData.password
                  ? 'bg-sage-200 text-sage-500 cursor-not-allowed'
                  : 'bg-water-lily text-white hover:scale-[1.02] shadow-dream hover:shadow-monet'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <HeartIcon className="w-5 h-5" />
                  <span>进入爱情规划师</span>
                </>
              )}
            </button>
          </form>

          {/* 底部提示 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-sage-500">
              💡 提示：点击上方角色头像可快速登录
            </p>
          </div>
        </div>

        {/* 底部装饰文字 */}
        <div className="text-center mt-6">
          <p className="text-sm text-sage-600">
            用爱记录每一个美好瞬间
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 