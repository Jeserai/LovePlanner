import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PointsCalculationService } from '../../services/pointsCalculationService';
import type { DifficultyConfig } from '../../config/pointsConfig';

interface TaskTypeSelectorProps {
  selectedType: string;
  onTypeChange: (typeId: string) => void;
  className?: string;
}

const TaskTypeSelector: React.FC<TaskTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  const { theme } = useTheme();
  const difficulties = PointsCalculationService.getAllDifficulties();

  const getDifficultyCardStyles = (difficulty: DifficultyConfig, isSelected: boolean) => {
    const baseStyles = 'p-4 rounded-lg border-2 cursor-pointer transition-all text-center';
    
    if (theme === 'pixel') {
      return `${baseStyles} ${
        isSelected
          ? 'border-pixel-accent bg-pixel-card text-pixel-accent'
          : 'border-pixel-border bg-pixel-panel text-pixel-text hover:border-pixel-accent'
      }`;
    } else if (theme === 'modern') {
      return `${baseStyles} ${
        isSelected
          ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`;
    } else {
      return `${baseStyles} ${
        isSelected
          ? difficulty.color + ' border-blue-500 ring-2 ring-blue-200'
          : difficulty.color + ' border-gray-200 hover:border-gray-300'
      }`;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className={`font-medium ${
        theme === 'pixel' 
          ? 'text-pixel-text font-mono uppercase tracking-wide' 
          : theme === 'modern'
          ? 'text-foreground'
          : 'text-gray-700'
      }`}>
        {theme === 'pixel' ? 'TASK_DIFFICULTY' : theme === 'modern' ? 'Task Difficulty' : '任务难度'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {difficulties.map(difficulty => (
          <div
            key={difficulty.id}
            className={getDifficultyCardStyles(difficulty, selectedType === difficulty.id)}
            onClick={() => onTypeChange(difficulty.id)}
          >
            <div className="text-2xl mb-2">{difficulty.icon}</div>
            <h4 className={`font-medium ${
              theme === 'pixel' ? 'font-mono uppercase' : ''
            }`}>
              {difficulty.name}
            </h4>
            <div className={`text-lg font-bold mt-1 ${
              theme === 'pixel' ? 'text-pixel-info' : 'text-blue-600'
            }`}>
              {difficulty.oneTimeBasePoints}分
            </div>
            <div className={`text-xs mt-1 opacity-75 ${
              theme === 'pixel' ? 'font-mono' : ''
            }`}>
              {difficulty.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskTypeSelector;
