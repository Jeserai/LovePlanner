import React, { useState } from 'react';
import { supabase } from '../../src/lib/supabase';

const EmailTestPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const testEmailSending = async () => {
    if (!email) {
      setResult({ type: 'error', message: '请输入邮箱地址' });
      return;
    }

    if (!isValidEmail(email)) {
      setResult({ type: 'error', message: '请输入有效的邮箱地址' });
      return;
    }

    setIsLoading(true);
    setResult({ type: null, message: '' });

    try {
      // 测试重发验证邮件
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }

      setResult({ 
        type: 'success', 
        message: `✅ 测试邮件已发送到 ${email}\n\n请检查您的邮箱（包括垃圾邮件文件夹）\n如果5分钟内没有收到，请联系开发者检查Supabase配置` 
      });

    } catch (error: any) {
      console.error('邮件发送失败:', error);
      setResult({ 
        type: 'error', 
        message: `❌ 发送失败: ${error.message}\n\n可能的原因：\n1. 该邮箱没有注册过\n2. Supabase邮件配置问题\n3. 邮件发送额度限制\n4. 网络连接问题` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      testEmailSending();
    }
  };

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '600px',
      margin: '50px auto',
      padding: '20px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
          📧 邮箱验证测试工具
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 500, 
            color: '#555' 
          }}>
            邮箱地址：
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入您注册时使用的邮箱地址"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <button
          onClick={testEmailSending}
          disabled={isLoading}
          style={{
            background: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            marginBottom: '20px'
          }}
        >
          {isLoading ? '发送中...' : '发送测试验证邮件'}
        </button>
        
        {result.type && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            borderRadius: '8px',
            whiteSpace: 'pre-line',
            background: result.type === 'success' ? '#d4edda' : '#f8d7da',
            color: result.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${result.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {result.message}
          </div>
        )}
        
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>💡 使用说明：</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
            <li style={{ marginBottom: '5px' }}>输入您在注册时使用的邮箱地址</li>
            <li style={{ marginBottom: '5px' }}>点击"发送测试验证邮件"按钮</li>
            <li style={{ marginBottom: '5px' }}>检查邮箱（包括垃圾邮件文件夹）</li>
            <li style={{ marginBottom: '5px' }}>如果收到邮件，说明邮件服务正常</li>
            <li style={{ marginBottom: '5px' }}>如果没收到，请联系开发者检查配置</li>
          </ul>
        </div>
        
        <div style={{
          background: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '15px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>🔍 常见问题排查：</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#004085' }}>
            <li style={{ marginBottom: '5px' }}><strong>检查垃圾邮件文件夹</strong> - 最常见的原因</li>
            <li style={{ marginBottom: '5px' }}><strong>等待5-10分钟</strong> - 某些邮箱有延迟</li>
            <li style={{ marginBottom: '5px' }}><strong>确认邮箱地址正确</strong> - 没有拼写错误</li>
            <li style={{ marginBottom: '5px' }}><strong>尝试其他邮箱</strong> - 如Gmail、QQ邮箱等</li>
            <li style={{ marginBottom: '5px' }}><strong>检查邮箱设置</strong> - 确保没有屏蔽外部邮件</li>
          </ul>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          color: '#666'
        }}>
          <p>完成测试后请返回应用继续注册流程</p>
          <a 
            href="/"
            style={{
              color: '#007bff',
              textDecoration: 'none',
              padding: '8px 16px',
              border: '1px solid #007bff',
              borderRadius: '6px',
              display: 'inline-block'
            }}
          >
            返回主应用
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmailTestPage;
