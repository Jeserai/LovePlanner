import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../src/contexts/UserContext';
import userAwareStorage from '../../src/services/userAwareStorageService';

const StorageIsolationDebugPage: React.FC = () => {
  const router = useRouter();
  const { userProfile } = useUser();
  const [storageStats, setStorageStats] = useState<{ [userId: string]: number }>({});
  const [userKeys, setUserKeys] = useState<string[]>([]);
  const [testData, setTestData] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const refreshStorageInfo = () => {
    const stats = userAwareStorage.getStorageStats();
    setStorageStats(stats);
    
    if (userProfile?.id) {
      const keys = userAwareStorage.getAllUserKeys();
      setUserKeys(keys);
      addLog(`当前用户 ${userProfile.display_name} 有 ${keys.length} 条存储数据`);
    }
  };

  useEffect(() => {
    refreshStorageInfo();
  }, [userProfile?.id]);

  const testSetData = () => {
    if (!userProfile?.id) {
      addLog('❌ 用户未登录，无法设置数据');
      return;
    }

    if (!testData) {
      addLog('❌ 请输入测试数据');
      return;
    }

    const key = 'test-data';
    userAwareStorage.setItem(key, testData);
    addLog(`✅ 已保存数据到用户专属存储: ${key} = ${testData}`);
    refreshStorageInfo();
  };

  const testGetData = () => {
    if (!userProfile?.id) {
      addLog('❌ 用户未登录，无法获取数据');
      return;
    }

    const key = 'test-data';
    const value = userAwareStorage.getItem(key);
    if (value) {
      addLog(`✅ 从用户专属存储读取: ${key} = ${value}`);
    } else {
      addLog(`ℹ️ 用户专属存储中没有找到: ${key}`);
    }
  };

  const clearUserData = () => {
    if (!userProfile?.id) {
      addLog('❌ 用户未登录，无法清理数据');
      return;
    }

    if (!confirm('⚠️ 警告：这将永久删除当前用户的所有数据！确定要继续吗？')) {
      return;
    }

    const keysBefore = userAwareStorage.getAllUserKeys().length;
    userAwareStorage.clearUserData();
    addLog(`🧹 已永久删除当前用户的 ${keysBefore} 条存储数据`);
    refreshStorageInfo();
  };

  const clearSession = () => {
    if (!userProfile?.id) {
      addLog('❌ 用户未登录，无法清理会话');
      return;
    }

    userAwareStorage.clearSession();
    addLog('🔄 已清理当前会话（保留用户数据）');
    refreshStorageInfo();
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const goBack = () => {
    router.push('/');
  };

  const inspectLocalStorage = () => {
    if (typeof window === 'undefined') return [];
    
    const allItems: { key: string; value: string; type: string }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        let type = 'unknown';
        
        if (key.startsWith('user_')) {
          type = 'user-specific';
        } else if (key.startsWith('global_')) {
          type = 'global';
        } else if (key.includes('todo') || key.includes('task')) {
          type = 'legacy';
        } else {
          type = 'other';
        }
        
        allItems.push({
          key,
          value: value || '',
          type
        });
      }
    }
    
    return allItems.sort((a, b) => a.key.localeCompare(b.key));
  };

  const allStorageItems = inspectLocalStorage();

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#00ffff', marginBottom: '20px' }}>🔐 存储隔离调试工具</h1>
      
      {/* 当前用户信息 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #ffff00' }}>
        <h3 style={{ color: '#ffff00' }}>当前用户信息</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          {userProfile ? (
            <>
              <p><strong>用户ID:</strong> {userProfile.id}</p>
              <p><strong>显示名称:</strong> {userProfile.display_name}</p>
              <p><strong>邮箱:</strong> {userProfile.email}</p>
              <p><strong>存储前缀:</strong> <code>user_{userProfile.id}_</code></p>
            </>
          ) : (
            <p style={{ color: '#ff6666' }}>❌ 用户未登录</p>
          )}
        </div>
      </div>

      {/* 存储统计 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>存储统计</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          <p><strong>所有用户数据统计:</strong></p>
          {Object.keys(storageStats).length > 0 ? (
            <ul>
              {Object.entries(storageStats).map(([userId, count]) => (
                <li key={userId} style={{ 
                  color: userId === userProfile?.id ? '#00ff00' : '#cccccc' 
                }}>
                  用户 {userId}: {count} 条数据
                  {userId === userProfile?.id && ' (当前用户)'}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#888' }}>没有找到用户专属数据</p>
          )}
          
          <p style={{ marginTop: '10px' }}><strong>当前用户存储键:</strong></p>
          {userKeys.length > 0 ? (
            <ul style={{ fontSize: '12px' }}>
              {userKeys.map(key => (
                <li key={key} style={{ color: '#88ffaa' }}>{key}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#888' }}>当前用户没有存储数据</p>
          )}
        </div>
      </div>

      {/* 测试功能 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>测试功能</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder="输入测试数据"
              style={{
                padding: '8px',
                marginRight: '10px',
                backgroundColor: '#444',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: '4px',
                width: '200px'
              }}
            />
            <button onClick={testSetData} style={buttonStyle}>保存数据</button>
            <button onClick={testGetData} style={buttonStyle}>读取数据</button>
          </div>
          
          <div>
            <button onClick={clearSession} style={{ ...buttonStyle, backgroundColor: '#0066cc' }}>
              清理会话（保留数据）
            </button>
            <button onClick={clearUserData} style={{ ...buttonStyle, backgroundColor: '#cc3333' }}>
              永久删除用户数据
            </button>
            <button onClick={refreshStorageInfo} style={buttonStyle}>刷新信息</button>
            <button onClick={clearLogs} style={buttonStyle}>清除日志</button>
            <button onClick={goBack} style={buttonStyle}>返回主应用</button>
          </div>
        </div>
      </div>

      {/* 完整存储检查 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>完整 localStorage 检查</h3>
        <div style={{ 
          maxHeight: '200px', 
          overflowY: 'auto', 
          border: '1px solid #555', 
          padding: '10px',
          backgroundColor: '#000',
          fontSize: '12px'
        }}>
          {allStorageItems.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #555' }}>
                  <th style={{ color: '#ffff88', textAlign: 'left', padding: '5px' }}>键名</th>
                  <th style={{ color: '#ffff88', textAlign: 'left', padding: '5px' }}>类型</th>
                  <th style={{ color: '#ffff88', textAlign: 'left', padding: '5px' }}>值（前50字符）</th>
                </tr>
              </thead>
              <tbody>
                {allStorageItems.map(item => (
                  <tr key={item.key} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ 
                      padding: '3px 5px', 
                      color: item.type === 'user-specific' ? '#00ff88' : 
                             item.type === 'legacy' ? '#ff8800' : '#cccccc'
                    }}>
                      {item.key}
                    </td>
                    <td style={{ 
                      padding: '3px 5px',
                      color: item.type === 'user-specific' ? '#00ff88' : 
                             item.type === 'legacy' ? '#ff8800' : '#cccccc'
                    }}>
                      {item.type}
                    </td>
                    <td style={{ padding: '3px 5px', color: '#aaaaaa' }}>
                      {item.value.substring(0, 50)}{item.value.length > 50 ? '...' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>localStorage 为空</p>
          )}
        </div>
      </div>

      {/* 操作日志 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>操作日志</h3>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto', 
          border: '1px solid #555', 
          padding: '10px',
          backgroundColor: '#000',
          fontSize: '12px'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '3px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #00ff00' }}>
        <h3 style={{ color: '#00ff00' }}>✅ 存储隔离说明</h3>
        <ul style={{ color: '#ffffff' }}>
          <li><strong style={{ color: '#00ff88' }}>用户专属存储:</strong> 每个用户的数据都有独立的前缀 <code>user_[用户ID]_</code></li>
          <li><strong style={{ color: '#ff8800' }}>历史数据:</strong> 旧的全局存储数据会自动迁移到当前用户</li>
          <li><strong style={{ color: '#ffff88' }}>数据隔离:</strong> 不同用户在同一台电脑上无法看到彼此的数据</li>
          <li><strong style={{ color: '#0088ff' }}>登出行为:</strong> 现在登出时只清理会话，<strong>保留用户数据</strong></li>
        </ul>
        
        <h4 style={{ color: '#ffff00', marginTop: '15px' }}>🔧 重要修复：</h4>
        <div style={{ color: '#ffffff', backgroundColor: '#333', padding: '10px', borderRadius: '5px' }}>
          <p><strong>问题：</strong> 之前登出时错误地删除了用户数据，导致重新登录后待办事项丢失。</p>
          <p><strong>修复：</strong> 现在登出时只清理会话ID，保留所有用户数据。重新登录后会自动恢复。</p>
          <p><strong>数据恢复：</strong> 如果数据已丢失，请访问 <code>/debug/data-recovery</code> 尝试恢复。</p>
        </div>
        
        <h4 style={{ color: '#ffff00', marginTop: '15px' }}>🎯 按钮说明：</h4>
        <ul style={{ color: '#ffffff' }}>
          <li><strong style={{ color: '#0088ff' }}>清理会话（保留数据）:</strong> 模拟正确的登出行为</li>
          <li><strong style={{ color: '#ff6666' }}>永久删除用户数据:</strong> ⚠️ 危险操作，会删除所有用户数据</li>
        </ul>
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
  fontFamily: 'monospace',
  fontSize: '12px'
};

export default StorageIsolationDebugPage;
