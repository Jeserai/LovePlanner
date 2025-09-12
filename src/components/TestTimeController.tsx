// 🕐 测试时间控制器组件
// 用于在开发环境中手动控制系统时间

import React, { useState, useEffect } from 'react';
import { testTimeManager } from '../utils/testTimeManager';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeButton, ThemeInput, ThemeCard, ThemeCardHeader, ThemeCardTitle, ThemeCardContent } from './ui/Components';
import { enableDebugFeatures } from '../config/environment';

const TestTimeController: React.FC = () => {
  const { theme } = useTheme();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [inputDate, setInputDate] = useState('');
  const [inputTime, setInputTime] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);

  // 更新当前时间显示
  const updateTimeDisplay = () => {
    const time = testTimeManager.getCurrentTime();
    setCurrentTime(time.toLocaleString());
    setIsTestMode(testTimeManager.isInTestMode());
  };

  useEffect(() => {
    updateTimeDisplay();
    const interval = setInterval(updateTimeDisplay, 1000);
    return () => clearInterval(interval);
  }, []);

  // 设置特定日期和时间
  const handleSetDateTime = () => {
    if (!inputDate) return;
    
    const dateTimeString = inputTime ? `${inputDate}T${inputTime}` : `${inputDate}T12:00:00`;
    testTimeManager.setMockTime(new Date(dateTimeString));
    updateTimeDisplay();
  };

  // 前进指定天数
  const handleAdvanceDays = (days: number) => {
    testTimeManager.advanceDays(days);
    updateTimeDisplay();
  };

  // 重置为真实时间
  const handleReset = () => {
    testTimeManager.resetToRealTime();
    updateTimeDisplay();
  };

  // 快速设置
  const handleQuickSet = (action: string) => {
    switch (action) {
      case 'yesterday':
        testTimeManager.setToYesterday();
        break;
      case 'tomorrow':
        testTimeManager.setToTomorrow();
        break;
      case 'lastWeek':
        testTimeManager.setToLastWeek();
        break;
      case 'nextWeek':
        testTimeManager.setToNextWeek();
        break;
    }
    updateTimeDisplay();
  };

  // 如果未启用调试功能，不显示组件
  if (!enableDebugFeatures) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-lg border border-gray-200 z-50 transition-all duration-300 ${
      isMinimized ? 'w-12 h-12' : 'min-w-80'
    }`}>
      <div className={isMinimized ? 'p-2' : 'p-4'}>
        {/* 标题和最小化按钮 */}
        <div className="flex items-center justify-between mb-4">
          {!isMinimized && (
            <h3 className={`font-semibold ${
              theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? '🕐 TIME_CTRL' : '🕐 时间控制器'}
            </h3>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-600"
              title={isMinimized ? '展开' : '最小化'}
            >
              {isMinimized ? '📅' : '−'}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="space-y-4">
            {/* 当前时间显示 */}
            <div className={`p-3 rounded-lg ${
              theme === 'pixel' ? 'bg-pixel-bgSecondary border-2 border-pixel-border' : 
              theme === 'modern' ? 'bg-gray-50 border border-gray-200' : 
              'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className={`text-sm font-medium ${
                isTestMode ? 
                  (theme === 'pixel' ? 'text-pixel-warning' : 'text-orange-600') :
                  (theme === 'pixel' ? 'text-pixel-success' : 'text-green-600')
              }`}>
                {isTestMode ? 
                  (theme === 'pixel' ? '🧪 TEST_MODE' : '🧪 测试模式') : 
                  (theme === 'pixel' ? '⏰ REAL_MODE' : '⏰ 真实模式')
                }
              </div>
              <div className={`text-lg font-mono ${
                theme === 'pixel' ? 'text-pixel-text' : 'text-gray-900'
              }`}>
                {currentTime}
              </div>
            </div>

            {/* 设置特定时间 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${
                theme === 'pixel' ? 'text-pixel-text' : 'text-gray-700'
              }`}>
                {theme === 'pixel' ? 'SET_SPECIFIC_TIME' : '设置特定时间'}
              </label>
              <div className="flex gap-2">
                <ThemeInput
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="flex-1"
                />
                <ThemeInput
                  type="time"
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  className="flex-1"
                />
                <ThemeButton onClick={handleSetDateTime} disabled={!inputDate}>
                  {theme === 'pixel' ? 'SET' : '设置'}
                </ThemeButton>
              </div>
            </div>

            {/* 快速设置按钮 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${
                theme === 'pixel' ? 'text-pixel-text' : 'text-gray-700'
              }`}>
                {theme === 'pixel' ? 'QUICK_SET' : '快速设置'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <ThemeButton 
                  variant="secondary" 
                  onClick={() => handleQuickSet('yesterday')}
                >
                  {theme === 'pixel' ? 'YESTERDAY' : '昨天'}
                </ThemeButton>
                <ThemeButton 
                  variant="secondary" 
                  onClick={() => handleQuickSet('tomorrow')}
                >
                  {theme === 'pixel' ? 'TOMORROW' : '明天'}
                </ThemeButton>
                <ThemeButton 
                  variant="secondary" 
                  onClick={() => handleQuickSet('lastWeek')}
                >
                  {theme === 'pixel' ? 'LAST_WEEK' : '上周'}
                </ThemeButton>
                <ThemeButton 
                  variant="secondary" 
                  onClick={() => handleQuickSet('nextWeek')}
                >
                  {theme === 'pixel' ? 'NEXT_WEEK' : '下周'}
                </ThemeButton>
              </div>
            </div>

            {/* 时间前进/后退 */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${
                theme === 'pixel' ? 'text-pixel-text' : 'text-gray-700'
              }`}>
                {theme === 'pixel' ? 'TIME_TRAVEL' : '时间穿越'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                <ThemeButton 
                  variant="secondary" 
                  onClick={() => handleAdvanceDays(-7)}
                  disabled={!isTestMode}
                >
                  {theme === 'pixel' ? '-7D' : '-7天'}
                </ThemeButton>
                <ThemeButton 
                  variant="secondary" 
                  onClick={() => handleAdvanceDays(-1)}
                  disabled={!isTestMode}
                >
                  {theme === 'pixel' ? '-1D' : '-1天'}
                </ThemeButton>
                <ThemeButton 
                  variant="secondary" 
                  onClick={() => handleAdvanceDays(1)}
                  disabled={!isTestMode}
                >
                  {theme === 'pixel' ? '+1D' : '+1天'}
                </ThemeButton>
                <ThemeButton 
                  variant="secondary" 
                  onClick={() => handleAdvanceDays(7)}
                  disabled={!isTestMode}
                >
                  {theme === 'pixel' ? '+7D' : '+7天'}
                </ThemeButton>
              </div>
            </div>

            {/* 重置按钮 */}
            <div className="pt-2 border-t border-gray-200">
              <ThemeButton 
                variant="danger" 
                onClick={handleReset}
                disabled={!isTestMode}
                className="w-full"
              >
                {theme === 'pixel' ? 'RESET_TO_REAL_TIME' : '重置为真实时间'}
              </ThemeButton>
            </div>

            {/* 使用说明 */}
            <div className={`text-xs ${
              theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-500'
            }`}>
              <p>{theme === 'pixel' ? 'DEV_ONLY_FEATURE' : '⚠️ 仅开发环境可用'}</p>
              <p>{theme === 'pixel' ? 'CONSOLE_COMMANDS' : '控制台命令: testTime.set("2025-01-01"), testTime.advance(1)'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestTimeController;
