// 数据修复工具组件
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeButton, ThemeCard, ThemeCardHeader, ThemeCardTitle, ThemeCardContent } from './ui/Components';
import { taskService } from '../services/taskService';
import { useToast } from './ui/Components';

// 🎯 统一解析completion_record字段，兼容新旧格式
const parseCompletionRecord = (completionRecord: any): string[] => {
  if (!completionRecord) return [];
  
  try {
    if (typeof completionRecord === 'string') {
      const parsed = JSON.parse(completionRecord);
      
      // 新格式：数组 ["2024-01-01", "2024-01-02"]
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // 旧格式：对象 {"2024-01-01": true, "2024-01-02": true}
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed).filter(key => parsed[key] === true);
      }
    }
    
    // 如果直接是数组
    if (Array.isArray(completionRecord)) {
      return completionRecord;
    }
    
    // 如果直接是对象
    if (typeof completionRecord === 'object' && completionRecord !== null) {
      return Object.keys(completionRecord).filter(key => completionRecord[key] === true);
    }
  } catch (e) {
    console.error('解析completion_record失败:', completionRecord, e);
  }
  
  return [];
};

interface FixResult {
  taskId: string;
  title: string;
  oldFormat: string;
  newFormat: string;
  oldCount: number;
  newCount: number;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

const DataFixTool: React.FC = () => {
  const { theme } = useTheme();
  const { addToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [scanResults, setScanResults] = useState<FixResult[]>([]);
  const [fixResults, setFixResults] = useState<FixResult[]>([]);

  // 扫描需要修复的数据
  const scanData = async () => {
    setIsScanning(true);
    setScanResults([]);
    
    try {
      // 获取所有任务（这里需要一个获取所有任务的方法）
      const { data: tasks, error } = await (taskService as any).supabase
        .from('tasks')
        .select('id, title, completion_record, completed_count')
        .not('completion_record', 'is', null);

      if (error) throw error;

      const results: FixResult[] = [];
      
      for (const task of tasks) {
        try {
          const recordArray = parseCompletionRecord(task.completion_record);
          const newFormat = JSON.stringify(recordArray);
          const needsFix = newFormat !== task.completion_record || recordArray.length !== task.completed_count;
          
          if (needsFix) {
            results.push({
              taskId: task.id,
              title: task.title,
              oldFormat: task.completion_record,
              newFormat: newFormat,
              oldCount: task.completed_count,
              newCount: recordArray.length,
              status: 'success'
            });
          }
        } catch (e) {
          results.push({
            taskId: task.id,
            title: task.title,
            oldFormat: task.completion_record,
            newFormat: '',
            oldCount: task.completed_count,
            newCount: 0,
            status: 'error',
            error: e instanceof Error ? e.message : '未知错误'
          });
        }
      }
      
      setScanResults(results);
      addToast({
        type: 'success',
        message: `扫描完成！发现 ${results.length} 个需要修复的任务`
      });
      
    } catch (error) {
      console.error('扫描数据失败:', error);
      addToast({
        type: 'error',
        message: '扫描数据失败: ' + (error instanceof Error ? error.message : '未知错误')
      });
    } finally {
      setIsScanning(false);
    }
  };

  // 修复数据
  const fixData = async () => {
    if (scanResults.length === 0) {
      addToast({
        type: 'warning',
        message: '请先扫描数据'
      });
      return;
    }

    setIsFixing(true);
    setFixResults([]);
    
    const results: FixResult[] = [];
    
    for (const item of scanResults) {
      try {
        const { error } = await (taskService as any).supabase
          .from('tasks')
          .update({
            completion_record: item.newFormat,
            completed_count: item.newCount
          })
          .eq('id', item.taskId);

        if (error) throw error;

        results.push({
          ...item,
          status: 'success'
        });
        
      } catch (e) {
        results.push({
          ...item,
          status: 'error',
          error: e instanceof Error ? e.message : '未知错误'
        });
      }
    }
    
    setFixResults(results);
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    if (errorCount === 0) {
      addToast({
        type: 'success',
        message: `修复完成！成功修复 ${successCount} 个任务`
      });
    } else {
      addToast({
        type: 'warning',
        message: `修复完成！成功 ${successCount} 个，失败 ${errorCount} 个`
      });
    }
    
    setIsFixing(false);
  };

  return (
    <div className="space-y-6">
      <ThemeCard>
        <ThemeCardHeader>
          <ThemeCardTitle>
            {theme === 'pixel' ? 'DATA_FIX_TOOL' : theme === 'modern' ? 'Data Fix Tool' : '数据修复工具'}
          </ThemeCardTitle>
        </ThemeCardHeader>
        <ThemeCardContent className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {theme === 'pixel' 
              ? 'FIX_COMPLETION_RECORD_FORMAT' 
              : theme === 'modern' 
              ? 'Fix completion_record format inconsistencies' 
              : '修复 completion_record 字段格式不一致问题'
            }
          </div>
          
          <div className="flex gap-4">
            <ThemeButton
              onClick={scanData}
              disabled={isScanning || isFixing}
              variant="secondary"
            >
              {isScanning 
                ? (theme === 'pixel' ? 'SCANNING...' : theme === 'modern' ? 'Scanning...' : '扫描中...') 
                : (theme === 'pixel' ? 'SCAN_DATA' : theme === 'modern' ? 'Scan Data' : '扫描数据')
              }
            </ThemeButton>
            
            <ThemeButton
              onClick={fixData}
              disabled={isFixing || scanResults.length === 0}
              variant="primary"
            >
              {isFixing 
                ? (theme === 'pixel' ? 'FIXING...' : theme === 'modern' ? 'Fixing...' : '修复中...') 
                : (theme === 'pixel' ? 'FIX_DATA' : theme === 'modern' ? 'Fix Data' : '修复数据')
              }
            </ThemeButton>
          </div>
        </ThemeCardContent>
      </ThemeCard>

      {/* 扫描结果 */}
      {scanResults.length > 0 && (
        <ThemeCard>
          <ThemeCardHeader>
            <ThemeCardTitle>
              {theme === 'pixel' ? 'SCAN_RESULTS' : theme === 'modern' ? 'Scan Results' : '扫描结果'}
            </ThemeCardTitle>
          </ThemeCardHeader>
          <ThemeCardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {scanResults.map((result, index) => (
                <div key={result.taskId} className="p-3 border rounded-lg">
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>旧格式: {result.oldFormat}</div>
                    <div>新格式: {result.newFormat}</div>
                    <div>完成次数: {result.oldCount} → {result.newCount}</div>
                  </div>
                </div>
              ))}
            </div>
          </ThemeCardContent>
        </ThemeCard>
      )}

      {/* 修复结果 */}
      {fixResults.length > 0 && (
        <ThemeCard>
          <ThemeCardHeader>
            <ThemeCardTitle>
              {theme === 'pixel' ? 'FIX_RESULTS' : theme === 'modern' ? 'Fix Results' : '修复结果'}
            </ThemeCardTitle>
          </ThemeCardHeader>
          <ThemeCardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {fixResults.map((result, index) => (
                <div key={result.taskId} className={`p-3 border rounded-lg ${
                  result.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm">
                    {result.status === 'success' ? (
                      <span className="text-green-600">✅ 修复成功</span>
                    ) : (
                      <span className="text-red-600">❌ 修复失败: {result.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ThemeCardContent>
        </ThemeCard>
      )}
    </div>
  );
};

export default DataFixTool;
