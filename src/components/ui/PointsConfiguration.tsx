import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PointsCalculationService } from '../../services/pointsCalculationService';
import type { PointsCalculationResult } from '../../services/pointsCalculationService';

interface PointsConfigurationProps {
  difficultyId: string;
  earliestStartTime?: string;
  taskDeadline?: string;
  requiresProof: boolean;
  points: number;
  onPointsChange: (points: number) => void;
  className?: string;
}

const PointsConfiguration: React.FC<PointsConfigurationProps> = ({
  difficultyId,
  earliestStartTime,
  taskDeadline,
  requiresProof,
  points,
  onPointsChange,
  className = ''
}) => {
  const { theme } = useTheme();
  const [calculation, setCalculation] = useState<PointsCalculationResult | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // 计算建议积分
  useEffect(() => {
    if (difficultyId) {
      const result = PointsCalculationService.calculateOneTimeTaskPoints(
        difficultyId,
        earliestStartTime,
        taskDeadline,
        requiresProof
      );
      setCalculation(result);
    }
  }, [difficultyId, earliestStartTime, taskDeadline, requiresProof]);


  // 验证积分
  const validation = calculation 
    ? PointsCalculationService.validatePoints(points, calculation.suggestedPoints)
    : { isValid: true };

  const getContainerStyles = () => {
    if (theme === 'pixel') {
      return 'bg-pixel-panel border-4 border-pixel-border rounded-pixel shadow-pixel p-4';
    } else if (theme === 'modern') {
      return 'bg-muted/50 border border-border rounded-lg p-4';
    } else {
      return 'bg-gray-50 border border-gray-200 rounded-lg p-4';
    }
  };

  const getInputStyles = () => {
    const baseStyles = 'w-full px-3 py-2 rounded transition-colors';
    
    if (theme === 'pixel') {
      return `${baseStyles} bg-pixel-bg border-2 border-pixel-border text-pixel-text font-mono focus:border-pixel-accent`;
    } else if (theme === 'modern') {
      return `${baseStyles} bg-background border border-input text-foreground focus:ring-2 focus:ring-ring`;
    } else {
      return `${baseStyles} bg-white border border-gray-300 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`;
    }
  };

  const getTextStyles = (type: 'title' | 'body' | 'muted' = 'body') => {
    if (theme === 'pixel') {
      switch (type) {
        case 'title': return 'text-pixel-info font-mono uppercase tracking-wide';
        case 'body': return 'text-pixel-text font-mono';
        case 'muted': return 'text-pixel-textMuted font-mono text-sm';
      }
    } else if (theme === 'modern') {
      switch (type) {
        case 'title': return 'text-foreground font-medium';
        case 'body': return 'text-foreground';
        case 'muted': return 'text-muted-foreground text-sm';
      }
    } else {
      switch (type) {
        case 'title': return 'text-gray-700 font-medium';
        case 'body': return 'text-gray-700';
        case 'muted': return 'text-gray-500 text-sm';
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 建议积分显示 */}
      {calculation && (
        <div className={getContainerStyles()}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-medium ${getTextStyles('title')}`}>
              {theme === 'pixel' ? 'SUGGESTED_POINTS' : theme === 'modern' ? 'Suggested Points' : '💰 建议积分'}
            </h4>
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className={`text-xs px-2 py-1 rounded ${
                theme === 'pixel' 
                  ? 'bg-pixel-bgSecondary text-pixel-text border border-pixel-border' 
                  : theme === 'modern'
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showBreakdown ? '隐藏详情' : '查看详情'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={getTextStyles('body')}>
              {theme === 'pixel' ? 'RECOMMENDED:' : '系统建议：'}
            </span>
            <div className="flex items-center space-x-2">
              <span className={`text-xl font-bold ${
                theme === 'pixel' ? 'text-pixel-info' : 'text-blue-600'
              }`}>
                {calculation.suggestedPoints}分
              </span>
              <button
                type="button"
                onClick={() => onPointsChange(calculation.suggestedPoints)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  points === calculation.suggestedPoints 
                    ? (theme === 'pixel' 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : theme === 'modern'
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed')
                    : (theme === 'pixel' 
                        ? 'bg-pixel-info text-black hover:bg-pixel-accent' 
                        : theme === 'modern'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600')
                }`}
                disabled={points === calculation.suggestedPoints}
              >
                {theme === 'pixel' ? 'APPLY' : '应用'}
              </button>
            </div>
          </div>

          {/* 计算详情 */}
          {showBreakdown && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <div className="space-y-1">
                {calculation.explanation.map((line, index) => (
                  <div key={index} className={getTextStyles('muted')}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 积分输入 */}
      <div>
        <label className={`block font-medium mb-2 ${getTextStyles('title')}`}>
          {theme === 'pixel' ? 'FINAL_POINTS' : theme === 'modern' ? 'Task Points' : '任务积分'}
          <span className="text-red-500 ml-1">*</span>
        </label>
        
        <input
          type="number"
          value={points}
          onChange={(e) => {
            const value = Number(e.target.value);
            onPointsChange((value && value > 0) ? value : 1);
          }}
          min="1"
          max="1000"
          className={getInputStyles()}
          placeholder={calculation ? `建议: ${calculation.suggestedPoints}` : '请输入积分'}
        />

        {/* 验证提示 */}
        {!validation.isValid && validation.warning && (
          <div className={`mt-2 text-sm ${
            theme === 'pixel' ? 'text-pixel-warning font-mono' : 'text-red-600'
          }`}>
            ⚠️ {validation.warning}
          </div>
        )}

        {validation.isValid && validation.warning && (
          <div className={`mt-2 text-sm ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-amber-600'
          }`}>
            💡 {validation.warning}
          </div>
        )}

        {/* 积分说明 */}
        <div className={`mt-2 ${getTextStyles('muted')}`}>
          {theme === 'pixel' 
            ? 'POINTS_RANGE: 1-1000' 
            : '积分范围：1-1000分，建议根据任务难度和时间投入设置'
          }
        </div>
      </div>
    </div>
  );
};

export default PointsConfiguration;
