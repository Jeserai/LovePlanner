import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';

const SupabaseConfigCheckPage: React.FC = () => {
  const router = useRouter();
  const [config, setConfig] = useState<any>({});
  const [testEmail, setTestEmail] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    // 检查当前页面 URL 信息
    if (typeof window !== 'undefined') {
      addLog(`当前页面 URL: ${window.location.href}`);
      addLog(`当前域名: ${window.location.origin}`);
      
      // 检查 Supabase 配置
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      setConfig({
        supabaseUrl,
        supabaseKeyPrefix: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Missing',
        currentDomain: window.location.origin,
        expectedRedirectUrls: [
          `${window.location.origin}/auth/verify-email`,
          'https://your-production-domain.com/auth/verify-email'
        ]
      });
      
      addLog(`Supabase URL: ${supabaseUrl}`);
      addLog(`Supabase Key: ${supabaseKey ? 'Present' : 'Missing'}`);
    }
  }, []);

  const testResendEmail = async () => {
    if (!testEmail) {
      addLog('❌ 请输入邮箱地址');
      return;
    }

    addLog(`🔄 尝试重发验证邮件到: ${testEmail}`);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
      });

      if (error) {
        addLog(`❌ 重发失败: ${error.message}`);
      } else {
        addLog(`✅ 验证邮件已发送到: ${testEmail}`);
        addLog(`📧 请检查邮件并点击验证链接`);
        addLog(`🎯 验证链接应该跳转到: ${window.location.origin}/auth/verify-email`);
      }
    } catch (err: any) {
      addLog(`❌ 发送过程中出错: ${err.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
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
      <h1 style={{ color: '#00ffff', marginBottom: '20px' }}>🔧 Supabase 配置检查工具</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>当前配置信息</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          <p><strong>Supabase URL:</strong> {config.supabaseUrl || 'Not found'}</p>
          <p><strong>Supabase Key:</strong> {config.supabaseKeyPrefix || 'Not found'}</p>
          <p><strong>当前域名:</strong> {config.currentDomain}</p>
          <p><strong>期望的重定向 URLs:</strong></p>
          <ul>
            {config.expectedRedirectUrls?.map((url: string, index: number) => (
              <li key={index} style={{ color: '#ffff88' }}>{url}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #ff6600' }}>
        <h3 style={{ color: '#ff6600' }}>⚠️ 重要配置步骤</h3>
        <ol style={{ color: '#ffffff' }}>
          <li><strong>登录 Supabase Dashboard</strong></li>
          <li><strong>进入你的项目</strong></li>
          <li><strong>导航到 Authentication → URL Configuration</strong></li>
          <li><strong>在 "Redirect URLs" 中添加：</strong>
            <div style={{ backgroundColor: '#444', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
              <code style={{ color: '#00ff00' }}>{config.currentDomain}/auth/verify-email</code>
            </div>
          </li>
          <li><strong>确保 "Site URL" 设置为：</strong>
            <div style={{ backgroundColor: '#444', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
              <code style={{ color: '#00ff00' }}>{config.currentDomain}</code>
            </div>
          </li>
          <li><strong>检查邮件模板：</strong>
            <br />Authentication → Email Templates → Confirm signup
            <br />确保使用 <code style={{ color: '#00ff00' }}>{'{{ .ConfirmationURL }}'}</code>
          </li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>测试验证邮件</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="输入已注册的邮箱地址"
            style={{
              padding: '8px',
              marginRight: '10px',
              backgroundColor: '#444',
              color: '#fff',
              border: '1px solid #666',
              borderRadius: '4px',
              width: '300px'
            }}
          />
          <button onClick={testResendEmail} style={buttonStyle}>
            重发验证邮件
          </button>
        </div>
        <p style={{ color: '#888', fontSize: '12px' }}>
          * 只能对已注册但未验证的邮箱重发验证邮件
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>导航测试</h3>
        <button onClick={goToVerificationPage} style={buttonStyle}>
          测试验证页面
        </button>
        <button onClick={goToMainApp} style={buttonStyle}>
          返回主应用
        </button>
        <button onClick={clearLogs} style={buttonStyle}>
          清除日志
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>操作日志</h3>
        <div style={{ 
          maxHeight: '300px', 
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

      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #00ff00' }}>
        <h3 style={{ color: '#00ff00' }}>✅ 正确的验证流程</h3>
        <ol style={{ color: '#ffffff' }}>
          <li>用户注册 → 显示"请查看邮箱"页面</li>
          <li>点击邮件中的验证链接 → 跳转到专门的验证页面 (<code>/auth/verify-email</code>)</li>
          <li>验证页面显示验证过程 → "邮箱验证成功" → "进入应用"按钮</li>
          <li>用户主动点击"进入应用" → 跳转到主应用</li>
        </ol>
        
        <h4 style={{ color: '#ff6600', marginTop: '15px' }}>❌ 当前的问题</h4>
        <p style={{ color: '#ffffff' }}>
          如果点击验证邮件后跳转到登录页面（而不是验证页面），说明 Supabase 
          的重定向 URL 配置不正确。请按照上面的步骤重新配置。
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

export default SupabaseConfigCheckPage;
