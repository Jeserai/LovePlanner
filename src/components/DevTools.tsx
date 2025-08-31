// 开发工具面板 - 用于模拟API切换等开发功能
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeButton, ThemeCard } from './ui/Components';
import { enableMockApi, disableMockApi, USE_MOCK_API } from '../services/mockApiService';

interface DevToolsProps {
  className?: string;
}

const DevTools: React.FC<DevToolsProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mockApiEnabled, setMockApiEnabled] = useState(USE_MOCK_API);

  const handleToggleMockApi = () => {
    const newState = !mockApiEnabled;
    setMockApiEnabled(newState);
    
    if (newState) {
      enableMockApi();
    } else {
      disableMockApi();
    }
    
    // 刷新页面以应用新的API模式
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!isExpanded) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <ThemeButton
          variant="secondary"
          onClick={() => setIsExpanded(true)}
          size="sm"
          className="shadow-lg"
        >
          {theme === 'pixel' ? '🔧 DEV' : '🔧 开发工具'}
        </ThemeButton>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <ThemeCard className="p-4 shadow-lg max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-bold text-sm ${
            theme === 'pixel' ? 'font-mono uppercase text-pixel-accent' : 
            theme === 'modern' ? 'text-slate-900' : 'text-gray-900'
          }`}>
            {theme === 'pixel' ? 'DEV_TOOLS' : theme === 'modern' ? 'Dev Tools' : '开发工具'}
          </h3>
          <ThemeButton
            variant="secondary"
            onClick={() => setIsExpanded(false)}
            size="sm"
          >
            ✕
          </ThemeButton>
        </div>
        
        <div className="space-y-3">
          {/* 模拟API开关 */}
          <div className={`flex items-center justify-between p-2 rounded ${
            theme === 'pixel' ? 'bg-pixel-bgSecondary border border-pixel-border' :
            theme === 'modern' ? 'bg-slate-50 border border-slate-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div>
              <div className={`text-sm font-medium ${
                theme === 'pixel' ? 'font-mono uppercase text-pixel-text' :
                theme === 'modern' ? 'text-slate-800' : 'text-gray-800'
              }`}>
                {theme === 'pixel' ? 'MOCK_API' : theme === 'modern' ? 'Mock API' : '模拟API'}
              </div>
              <div className={`text-xs ${
                theme === 'pixel' ? 'text-pixel-textMuted' :
                theme === 'modern' ? 'text-slate-500' : 'text-gray-500'
              }`}>
                {theme === 'pixel' ? 'SIMULATE_DATA' : theme === 'modern' ? 'Use simulated data' : '使用模拟数据'}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mockApiEnabled}
                onChange={handleToggleMockApi}
                className="sr-only peer"
              />
              <div className={`relative w-11 h-6 rounded-full peer transition-colors ${
                mockApiEnabled ? 
                  (theme === 'pixel' ? 'bg-pixel-accent' : 
                   theme === 'modern' ? 'bg-blue-600' : 'bg-blue-500') :
                  (theme === 'pixel' ? 'bg-pixel-bgTertiary' :
                   theme === 'modern' ? 'bg-slate-300' : 'bg-gray-300')
              }`}>
                <div className={`absolute top-[2px] left-[2px] bg-white border rounded-full h-5 w-5 transition-transform ${
                  mockApiEnabled ? 'translate-x-full' : 'translate-x-0'
                } ${theme === 'pixel' ? 'border-pixel-border' : 'border-gray-300'}`}></div>
              </div>
            </label>
          </div>

          {/* API状态显示 */}
          <div className={`text-xs p-2 rounded ${
            mockApiEnabled ? 
              (theme === 'pixel' ? 'bg-pixel-accent/20 text-pixel-accent border border-pixel-accent/30' :
               theme === 'modern' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-50 text-blue-600 border border-blue-200') :
              (theme === 'pixel' ? 'bg-pixel-bgTertiary text-pixel-textMuted border border-pixel-border' :
               theme === 'modern' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-gray-100 text-gray-600 border border-gray-200')
          }`}>
            {mockApiEnabled ? 
              (theme === 'pixel' ? '📡 MOCK_DATA_ACTIVE' : theme === 'modern' ? '📡 Mock data active' : '📡 模拟数据已启用') :
              (theme === 'pixel' ? '🔗 REAL_API_ACTIVE' : theme === 'modern' ? '🔗 Real API active' : '🔗 真实API已启用')
            }
          </div>

          {/* 提示信息 */}
          {mockApiEnabled && (
            <div className={`text-xs p-2 rounded ${
              theme === 'pixel' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              theme === 'modern' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
            }`}>
              {theme === 'pixel' ? '⚠️ DEV_MODE_WARNING' : theme === 'modern' ? '⚠️ Development mode only' : '⚠️ 仅开发模式使用'}
            </div>
          )}
        </div>
      </ThemeCard>
    </div>
  );
};

export default DevTools;
