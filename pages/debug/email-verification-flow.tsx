import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/hooks/useAuth';
import { useUser } from '../../src/contexts/UserContext';

const EmailVerificationFlowDebugPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: userLoading } = useUser();
  const [logs, setLogs] = useState<string[]>([]);
  const [urlInfo, setUrlInfo] = useState<any>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    // 检查页面URL信息
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlFragment = window.location.hash;
      
      const info = {
        currentUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: urlFragment,
        params: Object.fromEntries(urlParams),
        hasAccessToken: urlFragment.includes('access_token') || urlParams.has('access_token'),
        hasRefreshToken: urlFragment.includes('refresh_token') || urlParams.has('refresh_token'),
        hasType: urlParams.has('type'),
        type: urlParams.get('type')
      };
      
      setUrlInfo(info);
      addLog(`页面初始化: ${window.location.pathname}`);
      
      if (info.hasAccessToken) {
        addLog('✅ 检测到 access_token');
      }
      if (info.hasRefreshToken) {
        addLog('✅ 检测到 refresh_token');
      }
      if (info.hasType) {
        addLog(`✅ 检测到 type: ${info.type}`);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      addLog('🔄 认证状态加载中...');
    } else {
      if (user) {
        addLog(`✅ 认证成功: ${user.email}`);
        addLog(`邮箱确认状态: ${user.email_confirmed_at ? '已确认' : '未确认'}`);
      } else {
        addLog('❌ 没有认证用户');
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (userLoading) {
      addLog('🔄 用户档案加载中...');
    } else {
      if (userProfile) {
        addLog(`✅ 用户档案加载成功: ${userProfile.display_name}`);
      } else if (!authLoading && user) {
        addLog('❌ 用户档案加载失败');
      }
    }
  }, [userProfile, userLoading, user, authLoading]);

  const clearLogs = () => {
    setLogs([]);
  };

  const goToMainApp = () => {
    router.push('/');
  };

  const goToVerificationPage = () => {
    router.push('/auth/verify-email');
  };

  const testVerificationFlow = () => {
    addLog('🧪 开始测试验证流程');
    
    // 模拟点击验证邮件的URL参数
    const testUrl = `/auth/verify-email?type=signup#access_token=test_token&refresh_token=test_refresh&expires_in=3600`;
    addLog(`测试URL: ${testUrl}`);
    
    // 检查当前配置
    const expectedRedirectUrl = `${window.location.origin}/auth/verify-email`;
    addLog(`期望的重定向URL: ${expectedRedirectUrl}`);
    
    addLog('请确保在Supabase Dashboard中配置了正确的重定向URL');
  };

  const getFlowStatus = () => {
    if (authLoading || userLoading) {
      return { status: 'loading', message: '检查认证状态中...', color: '#ffaa00' };
    }
    
    if (user && user.email_confirmed_at && userProfile) {
      return { status: 'success', message: '✅ 验证流程完整成功', color: '#00ff88' };
    }
    
    if (user && user.email_confirmed_at && !userProfile) {
      return { status: 'partial', message: '⚠️ 用户已验证但档案缺失', color: '#ff8800' };
    }
    
    if (user && !user.email_confirmed_at) {
      return { status: 'unverified', message: '❌ 用户未验证邮箱', color: '#ff6666' };
    }
    
    return { status: 'no_user', message: '❌ 没有用户数据', color: '#ff6666' };
  };

  const flowStatus = getFlowStatus();

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#00ffff', marginBottom: '20px' }}>📧 邮箱验证流程调试工具</h1>
      
      {/* 流程状态 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        border: `2px solid ${flowStatus.color}`,
        backgroundColor: '#333'
      }}>
        <h3 style={{ color: flowStatus.color }}>当前流程状态</h3>
        <p style={{ color: flowStatus.color, fontSize: '18px', margin: '10px 0' }}>
          {flowStatus.message}
        </p>
      </div>

      {/* URL 信息 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>URL 信息分析</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          <p><strong>当前页面:</strong> {urlInfo.pathname}</p>
          <p><strong>完整URL:</strong> {urlInfo.currentUrl}</p>
          <p><strong>Query参数:</strong> {urlInfo.search || '无'}</p>
          <p><strong>Hash参数:</strong> {urlInfo.hash || '无'}</p>
          <p><strong>解析的参数:</strong></p>
          <ul style={{ marginLeft: '20px' }}>
            {Object.keys(urlInfo.params || {}).map(key => (
              <li key={key}>{key}: {urlInfo.params[key]}</li>
            ))}
          </ul>
          
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ color: '#ffff88' }}>Supabase 认证参数检测:</h4>
            <p style={{ color: urlInfo.hasAccessToken ? '#00ff88' : '#ff6666' }}>
              Access Token: {urlInfo.hasAccessToken ? '✅ 存在' : '❌ 不存在'}
            </p>
            <p style={{ color: urlInfo.hasRefreshToken ? '#00ff88' : '#ff6666' }}>
              Refresh Token: {urlInfo.hasRefreshToken ? '✅ 存在' : '❌ 不存在'}
            </p>
            <p style={{ color: urlInfo.hasType ? '#00ff88' : '#ff6666' }}>
              Type 参数: {urlInfo.hasType ? `✅ ${urlInfo.type}` : '❌ 不存在'}
            </p>
          </div>
        </div>
      </div>

      {/* 认证状态 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>认证状态</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          <p><strong>认证加载中:</strong> {authLoading ? '是' : '否'}</p>
          <p><strong>用户邮箱:</strong> {user?.email || '无'}</p>
          <p><strong>邮箱确认时间:</strong> {user?.email_confirmed_at || '未确认'}</p>
          <p><strong>用户档案加载中:</strong> {userLoading ? '是' : '否'}</p>
          <p><strong>档案显示名称:</strong> {userProfile?.display_name || '无'}</p>
          <p><strong>档案用户名:</strong> {userProfile?.username || '无'}</p>
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>测试功能</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          <button onClick={testVerificationFlow} style={buttonStyle}>
            测试验证流程
          </button>
          <button onClick={goToVerificationPage} style={buttonStyle}>
            跳转到验证页面
          </button>
          <button onClick={goToMainApp} style={buttonStyle}>
            返回主应用
          </button>
          <button onClick={clearLogs} style={buttonStyle}>
            清除日志
          </button>
        </div>
      </div>

      {/* 操作日志 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>实时日志</h3>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto', 
          border: '1px solid #555', 
          padding: '10px',
          backgroundColor: '#000'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', fontSize: '12px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* 修复指南 */}
      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #00ff00' }}>
        <h3 style={{ color: '#00ff00' }}>✅ 正确的验证流程</h3>
        <ol style={{ color: '#ffffff' }}>
          <li>用户注册 → 显示"请查看邮箱"页面</li>
          <li>点击验证邮件 → <strong style={{ color: '#00ff88' }}>直接跳转到 /auth/verify-email</strong></li>
          <li>验证页面显示检查中 → 2秒内完成验证</li>
          <li>显示注册成功庆祝页面 → 用户主动点击"开始爱情之旅"</li>
          <li>进入应用 → 完整的用户体验</li>
        </ol>
        
        <h4 style={{ color: '#ff6600', marginTop: '15px' }}>❌ 如果流程有问题</h4>
        <ul style={{ color: '#ffffff' }}>
          <li>验证邮件跳转到主页 → Supabase重定向URL配置错误</li>
          <li>显示"验证失败" → 检查邮件链接是否过期</li>
          <li>一直显示加载中 → 检查认证状态和用户档案</li>
          <li>跳转来跳转去 → 已修复，不再有冲突逻辑</li>
        </ul>
        
        <h4 style={{ color: '#ffff88', marginTop: '15px' }}>🔧 配置检查</h4>
        <p style={{ color: '#ffffff' }}>
          访问 <code>/debug/supabase-config-check</code> 检查Supabase配置
        </p>
      </div>
    </div>
  );
};

const buttonStyle = {
  margin: '5px',
  padding: '8px 15px',
  backgroundColor: '#333',
  color: '#00ff00',
  border: '1px solid #00ff00',
  borderRadius: '4px',
  cursor: 'pointer',
  fontFamily: 'monospace'
};

export default EmailVerificationFlowDebugPage;
