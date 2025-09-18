import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/hooks/useAuth';
import { useUser } from '../../src/contexts/UserContext';
import { supabase } from '../../src/lib/supabase';
import { getCurrentEnvironment } from '../../src/config/environment';

const AuthStatusDebugPage: React.FC = () => {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const { userProfile, loading: userLoading } = useUser();
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    const checkSupabaseSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          addLog(`❌ Supabase 会话错误: ${error.message}`);
        } else if (session) {
          addLog(`✅ Supabase 会话存在: ${session.user.email}`);
          setSupabaseSession(session);
        } else {
          addLog('ℹ️ 没有 Supabase 会话');
        }
      } catch (err: any) {
        addLog(`❌ 检查 Supabase 会话失败: ${err.message}`);
      }
    };

    checkSupabaseSession();
    addLog(`🔐 当前环境: ${getCurrentEnvironment()}`);
    addLog(`🔄 useAuth 加载状态: ${authLoading}`);
    addLog(`👤 useAuth 用户: ${authUser?.email || 'null'}`);
    addLog(`🔄 useUser 加载状态: ${userLoading}`);
    addLog(`📋 用户档案: ${userProfile?.display_name || 'null'}`);
  }, [authUser, authLoading, userProfile, userLoading]);

  const forceRefresh = () => {
    addLog('🔄 强制刷新页面...');
    window.location.reload();
  };

  const goToMainApp = () => {
    router.push('/');
  };

  const testLogin = () => {
    router.push('/');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#00ffff', marginBottom: '20px' }}>🔐 认证状态调试工具</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>当前状态</h3>
        <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px' }}>
          <p><strong>环境:</strong> {getCurrentEnvironment()}</p>
          <p><strong>useAuth 加载中:</strong> {authLoading ? '是' : '否'}</p>
          <p><strong>useAuth 用户:</strong> {authUser?.email || '未登录'}</p>
          <p><strong>useUser 加载中:</strong> {userLoading ? '是' : '否'}</p>
          <p><strong>用户档案:</strong> {userProfile?.display_name || '无'}</p>
        </div>
      </div>

      {supabaseSession && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#ffff00' }}>Supabase 会话信息</h3>
          <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px' }}>
            <p><strong>用户 ID:</strong> {supabaseSession.user.id}</p>
            <p><strong>邮箱:</strong> {supabaseSession.user.email}</p>
            <p><strong>邮箱已验证:</strong> {supabaseSession.user.email_confirmed ? '是' : '否'}</p>
            <p><strong>创建时间:</strong> {new Date(supabaseSession.user.created_at).toLocaleString()}</p>
            <p><strong>最后登录:</strong> {supabaseSession.user.last_sign_in_at ? new Date(supabaseSession.user.last_sign_in_at).toLocaleString() : '未知'}</p>
            <p><strong>会话过期时间:</strong> {new Date(supabaseSession.expires_at * 1000).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>操作</h3>
        <button onClick={forceRefresh} style={buttonStyle}>
          强制刷新页面
        </button>
        <button onClick={testLogin} style={buttonStyle}>
          测试登录状态
        </button>
        <button onClick={goToMainApp} style={buttonStyle}>
          返回主应用
        </button>
        <button onClick={clearLogs} style={buttonStyle}>
          清除日志
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>调试日志</h3>
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

      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ffff00' }}>
        <h3 style={{ color: '#ffff00' }}>📋 问题排查清单</h3>
        <ul style={{ color: '#ffffff' }}>
          <li>✅ 检查当前环境（生产/测试）</li>
          <li>✅ 检查 useAuth hook 状态</li>
          <li>✅ 检查 useUser hook 状态</li>
          <li>✅ 检查 Supabase 会话状态</li>
          <li>✅ 检查用户档案是否加载</li>
        </ul>
        
        <h4 style={{ color: '#ffff00', marginTop: '15px' }}>🔧 常见问题解决</h4>
        <ol style={{ color: '#ffffff' }}>
          <li><strong>登录成功但页面未跳转：</strong>
            <br />• 检查 useAuth 是否正确获取到用户状态
            <br />• 检查浏览器控制台是否有认证状态变化日志
            <br />• 尝试强制刷新页面
          </li>
          <li><strong>用户档案加载失败：</strong>
            <br />• 检查 Supabase 数据库中是否有对应的 user_profiles 记录
            <br />• 检查用户ID是否匹配
          </li>
          <li><strong>会话过期：</strong>
            <br />• 检查会话过期时间
            <br />• 重新登录
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

export default AuthStatusDebugPage;
