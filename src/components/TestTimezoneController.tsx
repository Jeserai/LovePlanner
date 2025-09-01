import React, { useState, useEffect } from 'react';
import { testTimezoneManager, TIMEZONES, type TimezoneData } from '../utils/testTimezoneManager';
import { useAuth } from '../hooks/useAuth';

const TestTimezoneController: React.FC = () => {
  const { user } = useAuth();
  const [isTestMode, setIsTestMode] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [status, setStatus] = useState(testTimezoneManager.getStatus());

  // 更新状态
  const updateStatus = () => {
    setStatus(testTimezoneManager.getStatus(user?.id));
  };

  useEffect(() => {
    updateStatus();
  }, [user?.id]);

  // 切换测试模式
  const toggleTestMode = () => {
    if (isTestMode) {
      testTimezoneManager.disableTestMode();
      setIsTestMode(false);
    } else {
      testTimezoneManager.enableTestMode();
      setIsTestMode(true);
    }
    updateStatus();
  };

  // 设置时区
  const handleSetTimezone = () => {
    if (user?.id && selectedTimezone) {
      testTimezoneManager.setUserTimezone(user.id, selectedTimezone);
      updateStatus();
    }
  };

  // 预设时区配置
  const presetConfigs = [
    {
      name: 'Cat (北京UTC+8) + Cow (纽约UTC-4)',
      action: () => {
        testTimezoneManager.enableTestMode();
        testTimezoneManager.setUserTimezone('f58b5791-c5f8-4d47-97eb-68f32d0e21f2', 'Asia/Shanghai'); // cat
        testTimezoneManager.setUserTimezone('6ec5465b-05c7-4f1e-8efd-ed487d785364', 'America/New_York'); // cow
        setIsTestMode(true);
        updateStatus();
      }
    },
    {
      name: 'Cat (纽约) + Cow (伦敦)',
      action: () => {
        testTimezoneManager.enableTestMode();
        testTimezoneManager.setUserTimezone('f58b5791-c5f8-4d47-97eb-68f32d0e21f2', 'America/New_York'); // cat
        testTimezoneManager.setUserTimezone('6ec5465b-05c7-4f1e-8efd-ed487d785364', 'Europe/London'); // cow
        setIsTestMode(true);
        updateStatus();
      }
    },
    {
      name: 'Cat (东京) + Cow (洛杉矶)',
      action: () => {
        testTimezoneManager.enableTestMode();
        testTimezoneManager.setUserTimezone('f58b5791-c5f8-4d47-97eb-68f32d0e21f2', 'Asia/Tokyo'); // cat
        testTimezoneManager.setUserTimezone('6ec5465b-05c7-4f1e-8efd-ed487d785364', 'America/Los_Angeles'); // cow
        setIsTestMode(true);
        updateStatus();
      }
    }
  ];

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border border-gray-200 min-w-80 z-50">
      <div className="space-y-4">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">🌍 时区测试控制器</h3>
          <button
            onClick={toggleTestMode}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isTestMode 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isTestMode ? '禁用测试' : '启用测试'}
          </button>
        </div>

        {/* 当前状态 */}
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">模式:</span>
            <span className={isTestMode ? 'text-green-600 font-medium' : 'text-gray-800'}>
              {isTestMode ? '测试模式' : '真实模式'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">当前用户:</span>
            <span className="text-gray-800">{user?.email || '未登录'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">时区:</span>
            <span className="text-gray-800">{status.currentDescription}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">偏移:</span>
            <span className="text-gray-800">
              {status.currentOffset > 0 ? 'UTC-' : 'UTC+'}
              {Math.abs(status.currentOffset / 60)}
            </span>
          </div>
        </div>

        {/* 手动设置时区 */}
        {isTestMode && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              设置当前用户时区:
            </label>
            <div className="flex space-x-2">
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">选择时区...</option>
                {Object.entries(TIMEZONES).map(([key, timezone]) => (
                  <option key={key} value={key}>
                    {timezone.description}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSetTimezone}
                disabled={!selectedTimezone || !user?.id}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
              >
                设置
              </button>
            </div>
          </div>
        )}

        {/* 预设配置 */}
        {!isTestMode && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              快速测试配置:
            </label>
            <div className="space-y-1">
              {presetConfigs.map((config, index) => (
                <button
                  key={index}
                  onClick={config.action}
                  className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700"
                >
                  {config.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <p><strong>使用说明:</strong></p>
          <p>1. 启用测试模式</p>
          <p>2. 为不同用户设置不同时区</p>
          <p>3. 切换账号查看时区效果</p>
          <p>4. 共同事件会显示本地时间</p>
        </div>
      </div>
    </div>
  );
};

export default TestTimezoneController;
