import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../src/contexts/UserContext';
import userAwareStorage from '../../src/services/userAwareStorageService';

const DataRecoveryDebugPage: React.FC = () => {
  const router = useRouter();
  const { userProfile } = useUser();
  const [logs, setLogs] = useState<string[]>([]);
  const [recoveryData, setRecoveryData] = useState<any>({});
  const [isRecovering, setIsRecovering] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    scanForRecoverableData();
  }, [userProfile?.id]);

  const scanForRecoverableData = () => {
    if (!userProfile?.id) {
      addLog('❌ 用户未登录，无法扫描数据');
      return;
    }

    addLog(`🔍 扫描用户 ${userProfile.display_name} 的数据...`);

    const recovery: any = {
      currentUserData: {},
      globalData: {},
      otherUsersData: {}
    };

    // 扫描当前用户的数据
    const currentUserPrefix = `user_${userProfile.id}_`;
    const currentUserKeys = Object.keys(localStorage).filter(key => key.startsWith(currentUserPrefix));
    currentUserKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        const shortKey = key.replace(currentUserPrefix, '');
        recovery.currentUserData[shortKey] = value ? JSON.parse(value) : null;
      } catch (error) {
        recovery.currentUserData[key] = localStorage.getItem(key);
      }
    });

    // 扫描全局数据（可能的遗留数据）
    const globalKeys = ['calendar-todos', 'todo-list', 'tasks', 'events'];
    globalKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          recovery.globalData[key] = JSON.parse(value);
        } catch (error) {
          recovery.globalData[key] = value;
        }
      }
    });

    // 扫描其他用户的数据（用于统计）
    const allUserKeys = Object.keys(localStorage).filter(key => key.startsWith('user_') && !key.startsWith(currentUserPrefix));
    const userStats: { [userId: string]: number } = {};
    allUserKeys.forEach(key => {
      const match = key.match(/^user_([^_]+)_/);
      if (match) {
        const userId = match[1];
        userStats[userId] = (userStats[userId] || 0) + 1;
      }
    });
    recovery.otherUsersData = userStats;

    setRecoveryData(recovery);

    addLog(`✅ 扫描完成:`);
    addLog(`  - 当前用户数据: ${Object.keys(recovery.currentUserData).length} 项`);
    addLog(`  - 全局遗留数据: ${Object.keys(recovery.globalData).length} 项`);
    addLog(`  - 其他用户: ${Object.keys(recovery.otherUsersData).length} 人`);
  };

  const recoverFromGlobalData = async () => {
    if (!userProfile?.id || isRecovering) return;

    setIsRecovering(true);
    addLog('🔄 开始从全局数据恢复...');

    try {
      userAwareStorage.setCurrentUserId(userProfile.id);

      let recoveredCount = 0;

      // 恢复待办事项
      if (recoveryData.globalData['calendar-todos']) {
        addLog('📝 发现全局待办事项数据，开始恢复...');
        const todos = recoveryData.globalData['calendar-todos'];
        userAwareStorage.setItem('calendar-todos', JSON.stringify(todos));
        addLog(`✅ 恢复了 ${Array.isArray(todos) ? todos.length : 1} 个待办事项`);
        recoveredCount++;
      }

      // 恢复其他全局数据
      Object.keys(recoveryData.globalData).forEach(key => {
        if (key !== 'calendar-todos') {
          try {
            const data = recoveryData.globalData[key];
            userAwareStorage.setItem(key, JSON.stringify(data));
            addLog(`✅ 恢复了数据: ${key}`);
            recoveredCount++;
          } catch (error) {
            addLog(`❌ 恢复失败: ${key}`);
          }
        }
      });

      if (recoveredCount > 0) {
        addLog(`🎉 恢复完成！共恢复 ${recoveredCount} 项数据`);
        addLog('💡 建议刷新页面以查看恢复的数据');
      } else {
        addLog('ℹ️ 没有找到可恢复的全局数据');
      }

      // 重新扫描数据
      setTimeout(() => {
        scanForRecoverableData();
      }, 1000);

    } catch (error: any) {
      addLog(`❌ 恢复过程中出错: ${error.message}`);
    } finally {
      setIsRecovering(false);
    }
  };

  const clearGlobalData = () => {
    if (!confirm('确定要清除全局遗留数据吗？这些数据可能是其他用户的！')) {
      return;
    }

    addLog('🧹 清除全局遗留数据...');
    Object.keys(recoveryData.globalData).forEach(key => {
      localStorage.removeItem(key);
      addLog(`🗑️ 已删除: ${key}`);
    });

    setTimeout(() => {
      scanForRecoverableData();
    }, 500);
  };

  const exportUserData = () => {
    if (!userProfile?.id) return;

    const exportData = {
      userId: userProfile.id,
      userName: userProfile.display_name,
      exportTime: new Date().toISOString(),
      data: recoveryData.currentUserData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `love-planner-data-${userProfile.display_name}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addLog('📄 用户数据已导出');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const goBack = () => {
    router.push('/');
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#1a1a1a', 
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#00ffff', marginBottom: '20px' }}>🔧 数据恢复工具</h1>
      
      {/* 当前用户信息 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #ffff00' }}>
        <h3 style={{ color: '#ffff00' }}>当前用户</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          {userProfile ? (
            <>
              <p><strong>用户ID:</strong> {userProfile.id}</p>
              <p><strong>显示名称:</strong> {userProfile.display_name}</p>
              <p><strong>邮箱:</strong> {userProfile.email}</p>
            </>
          ) : (
            <p style={{ color: '#ff6666' }}>❌ 用户未登录</p>
          )}
        </div>
      </div>

      {/* 数据恢复状态 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>数据扫描结果</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00ff88' }}>当前用户数据:</h4>
            {Object.keys(recoveryData.currentUserData || {}).length > 0 ? (
              <ul style={{ marginLeft: '20px' }}>
                {Object.entries(recoveryData.currentUserData || {}).map(([key, value]) => (
                  <li key={key} style={{ color: '#88ffaa' }}>
                    {key}: {Array.isArray(value) ? `${value.length} 项` : typeof value}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#888' }}>没有当前用户的专属数据</p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#ffaa00' }}>全局遗留数据（可恢复）:</h4>
            {Object.keys(recoveryData.globalData || {}).length > 0 ? (
              <ul style={{ marginLeft: '20px' }}>
                {Object.entries(recoveryData.globalData || {}).map(([key, value]) => (
                  <li key={key} style={{ color: '#ffcc88' }}>
                    {key}: {Array.isArray(value) ? `${value.length} 项` : typeof value}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#888' }}>没有全局遗留数据</p>
            )}
          </div>

          <div>
            <h4 style={{ color: '#8888ff' }}>其他用户数据统计:</h4>
            {Object.keys(recoveryData.otherUsersData || {}).length > 0 ? (
              <ul style={{ marginLeft: '20px' }}>
                {Object.entries(recoveryData.otherUsersData || {}).map(([userId, count]) => (
                  <li key={userId} style={{ color: '#aaaaff' }}>
                    用户 {userId}: {count} 项数据
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#888' }}>没有其他用户数据</p>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffff00' }}>恢复操作</h3>
        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '5px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              onClick={recoverFromGlobalData} 
              disabled={isRecovering || Object.keys(recoveryData.globalData || {}).length === 0}
              style={{
                ...buttonStyle,
                backgroundColor: isRecovering ? '#666' : '#00aa00',
                cursor: isRecovering ? 'not-allowed' : 'pointer'
              }}
            >
              {isRecovering ? '恢复中...' : '🔄 从全局数据恢复'}
            </button>
            
            <button onClick={exportUserData} style={buttonStyle}>
              📄 导出当前用户数据
            </button>
            
            <button 
              onClick={clearGlobalData}
              disabled={Object.keys(recoveryData.globalData || {}).length === 0}
              style={{
                ...buttonStyle,
                backgroundColor: Object.keys(recoveryData.globalData || {}).length === 0 ? '#666' : '#cc3333'
              }}
            >
              🗑️ 清除全局遗留数据
            </button>
            
            <button onClick={scanForRecoverableData} style={buttonStyle}>
              🔍 重新扫描
            </button>
            
            <button onClick={refreshPage} style={buttonStyle}>
              🔄 刷新页面
            </button>
            
            <button onClick={clearLogs} style={buttonStyle}>
              🧹 清除日志
            </button>
            
            <button onClick={goBack} style={buttonStyle}>
              🏠 返回主应用
            </button>
          </div>
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

      {/* 使用说明 */}
      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #00ff00' }}>
        <h3 style={{ color: '#00ff00' }}>🛠️ 数据恢复说明</h3>
        <div style={{ color: '#ffffff' }}>
          <h4 style={{ color: '#ffff88' }}>问题原因：</h4>
          <p>之前的登出逻辑错误地删除了用户数据。现在已修复，登出时只清理会话，保留用户数据。</p>
          
          <h4 style={{ color: '#ffff88', marginTop: '15px' }}>恢复步骤：</h4>
          <ol>
            <li>如果扫描到"全局遗留数据"，点击"从全局数据恢复"</li>
            <li>恢复完成后，点击"刷新页面"查看恢复的待办事项</li>
            <li>建议导出数据作为备份</li>
          </ol>
          
          <h4 style={{ color: '#ffff88', marginTop: '15px' }}>预防措施：</h4>
          <p>现在登出时只清理会话，不再删除用户数据。未来登出后重新登录，待办事项将会保留。</p>
        </div>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '8px 15px',
  backgroundColor: '#333',
  color: '#00ff00',
  border: '1px solid #00ff00',
  borderRadius: '4px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '12px'
};

export default DataRecoveryDebugPage;
