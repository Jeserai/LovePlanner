import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

const EmailVerificationDebugPage: React.FC = () => {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [authEvents, setAuthEvents] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      addLog(`页面加载，URL: ${window.location.href}`);
      
      // 检查 URL 参数
      const urlParams = new URLSearchParams(window.location.search);
      const fragment = window.location.hash;
      
      addLog(`URL 参数: ${JSON.stringify(Object.fromEntries(urlParams))}`);
      addLog(`URL Fragment: ${fragment}`);
      
      // 检查是否有 access_token
      if (fragment.includes('access_token')) {
        addLog('✅ URL 中包含 access_token');
      } else {
        addLog('❌ URL 中没有 access_token');
      }
    }
  }, []);

  useEffect(() => {
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const eventLog = `Auth Event: ${event} - User: ${session?.user?.email || 'None'} - Confirmed: ${session?.user?.email_confirmed || 'N/A'}`;
      addLog(eventLog);
      setAuthEvents(prev => [...prev, eventLog]);
      
      if (session) {
        setSessionInfo({
          user_id: session.user.id,
          email: session.user.email,
          email_confirmed: session.user.email_confirmed,
          created_at: session.user.created_at,
          access_token: session.access_token ? 'Present' : 'Missing',
          refresh_token: session.refresh_token ? 'Present' : 'Missing',
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkCurrentSession = async () => {
    addLog('检查当前会话...');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`❌ 获取会话失败: ${error.message}`);
      } else if (data.session) {
        addLog(`✅ 当前会话存在: ${data.session.user.email}`);
        addLog(`✅ 邮箱验证状态: ${data.session.user.email_confirmed}`);
      } else {
        addLog('❌ 当前没有活跃会话');
      }
    } catch (err: any) {
      addLog(`❌ 检查会话时发生错误: ${err.message}`);
    }
  };

  const testEmailVerification = async () => {
    addLog('测试邮箱验证流程...');
    
    try {
      // 模拟验证页面的逻辑
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addLog(`❌ 会话错误: ${sessionError.message}`);
        return;
      }

      if (!sessionData.session) {
        addLog('❌ 没有当前会话，等待 auth state 变化...');
        
        setTimeout(() => {
          addLog('⏰ 5秒内没有认证状态变化');
        }, 5000);
        
        return;
      }

      const user = sessionData.session.user;
      addLog(`✅ 用户: ${user.email}`);
      addLog(`✅ 验证状态: ${user.email_confirmed}`);
      
      if (!user.email_confirmed) {
        addLog('❌ 邮箱尚未验证');
        return;
      }

      addLog('✅ 邮箱验证成功！');
      
    } catch (err: any) {
      addLog(`❌ 测试过程中发生错误: ${err.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setAuthEvents([]);
  };

  const goToMainApp = () => {
    router.push('/');
  };

  const goToVerificationPage = () => {
    router.push('/auth/verify-email');
  };

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#00ffff', marginBottom: '20px' }}>📧 邮箱验证调试工具</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>当前页面信息</h3>
        <p><strong>URL:</strong> {currentUrl}</p>
        <button onClick={checkCurrentSession} style={buttonStyle}>
          检查当前会话
        </button>
        <button onClick={testEmailVerification} style={buttonStyle}>
          测试验证流程
        </button>
        <button onClick={clearLogs} style={buttonStyle}>
          清除日志
        </button>
      </div>

      {sessionInfo && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #00ff00' }}>
          <h3 style={{ color: '#ffff00' }}>当前会话信息</h3>
          <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>认证事件历史</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #555' }}>
          {authEvents.map((event, index) => (
            <div key={index} style={{ padding: '2px 5px', borderBottom: '1px solid #333' }}>
              {event}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>操作日志</h3>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          border: '1px solid #555', 
          padding: '10px',
          backgroundColor: '#000'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>导航</h3>
        <button onClick={goToVerificationPage} style={buttonStyle}>
          跳转到验证页面
        </button>
        <button onClick={goToMainApp} style={buttonStyle}>
          返回主应用
        </button>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ffff00' }}>
        <h3 style={{ color: '#ffff00' }}>📋 排查清单</h3>
        <ul style={{ color: '#ffffff' }}>
          <li>✅ 检查 URL 中是否包含 access_token</li>
          <li>✅ 检查 Supabase 认证状态变化事件</li>
          <li>✅ 检查当前会话状态</li>
          <li>✅ 检查用户邮箱验证状态</li>
          <li>❓ 检查 Supabase Dashboard 中的重定向 URL 配置</li>
          <li>❓ 检查邮件模板中的验证链接</li>
        </ul>
        
        <h4 style={{ color: '#ffff00', marginTop: '15px' }}>🔧 Supabase 配置检查</h4>
        <p style={{ color: '#ffffff' }}>请确保在 Supabase Dashboard 中：</p>
        <ol style={{ color: '#ffffff' }}>
          <li><strong>Authentication → URL Configuration → Redirect URLs</strong> 包含：
            <br />• http://localhost:3000/auth/verify-email
            <br />• 您的生产域名/auth/verify-email
          </li>
          <li><strong>Authentication → Email Templates → Confirm signup</strong> 
            <br />确认模板使用 {`{{ .ConfirmationURL }}`}
          </li>
        </ol>
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

export default EmailVerificationDebugPage;
