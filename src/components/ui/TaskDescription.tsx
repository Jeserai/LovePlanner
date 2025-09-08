import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../utils/i18n';

interface TaskDescriptionProps {
  description: string;
  maxLines?: number;
  maxLength?: number;
  className?: string;
}

const TaskDescription: React.FC<TaskDescriptionProps> = ({ 
  description, 
  maxLines = 3, 
  maxLength = 120, 
  className = '' 
}) => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  const [isExpanded, setIsExpanded] = useState(false);

  // 如果没有描述，不显示任何内容
  if (!description || description.trim() === '') {
    return null;
  }

  // 处理换行符，统一处理各种换行符格式
  const processedDescription = description
    .replace(/\\n/g, '\n')  // 处理转义的换行符
    .replace(/\r\n/g, '\n') // 处理Windows换行符
    .replace(/\r/g, '\n');  // 处理Mac换行符
  
  
  // 判断是否需要截断
  const needsTruncation = processedDescription.length > maxLength || 
                         processedDescription.split('\n').length > maxLines;

  // 截断逻辑
  const getTruncatedText = () => {
    if (!needsTruncation || isExpanded) {
      return processedDescription;
    }

    const lines = processedDescription.split('\n');
    
    // 先按行数截断
    let truncatedByLines = lines.slice(0, maxLines).join('\n');
    
    // 再检查字符数，如果超出则截断并添加省略号
    if (truncatedByLines.length > maxLength) {
      // 找到最后一个空格或标点符号的位置，避免截断单词
      let truncatedText = truncatedByLines.substring(0, maxLength);
      const lastSpaceIndex = truncatedText.lastIndexOf(' ');
      const lastPuncIndex = Math.max(
        truncatedText.lastIndexOf('，'),
        truncatedText.lastIndexOf('。'),
        truncatedText.lastIndexOf('！'),
        truncatedText.lastIndexOf('？'),
        truncatedText.lastIndexOf(','),
        truncatedText.lastIndexOf('.'),
        truncatedText.lastIndexOf('!'),
        truncatedText.lastIndexOf('?')
      );
      
      const cutIndex = Math.max(lastSpaceIndex, lastPuncIndex);
      if (cutIndex > maxLength * 0.8) { // 如果截断点不会丢失太多内容
        truncatedText = truncatedText.substring(0, cutIndex);
      }
      
      return truncatedText.trim() + '...';
    }
    
    // 如果按行数截断后字符数没有超出，检查是否因为行数截断而需要省略号
    if (lines.length > maxLines) {
      return truncatedByLines + '...';
    }
    
    return truncatedByLines;
  };

  const displayText = getTruncatedText();

  return (
    <div className={`mb-3 overflow-hidden ${className}`}>
      <p 
        className={`break-words overflow-hidden ${
          theme === 'pixel' ? 'text-pixel-text font-mono text-sm' : 
          theme === 'modern' ? 'text-foreground text-sm' :
          'text-gray-900 text-sm'
        }`}
        style={{
          whiteSpace: 'pre-line',
          lineHeight: '1.6',
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        {displayText}
      </p>
      
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // 阻止事件冒泡到卡片的点击事件
            setIsExpanded(!isExpanded);
          }}
          className={`mt-1 text-xs font-medium transition-colors duration-200 hover:underline ${
            theme === 'pixel' 
              ? 'text-pixel-accent hover:text-pixel-warning font-mono uppercase'
              : theme === 'modern'
              ? 'text-primary hover:text-primary/80'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          {isExpanded 
            ? (theme === 'pixel' ? 'COLLAPSE' : t('collapse') || '收起')
            : (theme === 'pixel' ? 'EXPAND' : t('expand') || '展开')
          }
        </button>
      )}
    </div>
  );
};

export default TaskDescription;
