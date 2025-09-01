// 🧪 开发测试工具组件
// 用于方便测试重复任务和时间相关功能

import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeButton, ThemeCard, ThemeCardHeader, ThemeCardTitle, ThemeCardContent, useToast } from './ui/Components';
import { taskService } from '../services/taskService';

const DevTestingTools: React.FC = () => {
  const { theme } = useTheme();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // 🕐 模拟时间推进 - 通过修改任务的完成记录来模拟时间流逝
  const simulateTimeProgress = async (days: number) => {
    setIsLoading(true);
    try {
      // 获取所有进行中的重复任务
      const { data: tasks, error } = await (taskService as any).supabase
        .from('tasks')
        .select('*')
        .in('status', ['assigned', 'in_progress'])
        .neq('repeat_frequency', 'never');

      if (error) throw error;

      let updatedCount = 0;
      
      for (const task of tasks) {
        try {
          // 解析现有记录
          let completionRecord: string[] = [];
          if (task.completion_record) {
            completionRecord = JSON.parse(task.completion_record);
          }

          // 根据重复频率添加模拟记录
          const today = new Date();
          for (let i = 1; i <= days; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - (days - i));
            
            let periodKey = '';
            switch (task.repeat_frequency) {
              case 'daily':
                periodKey = targetDate.toISOString().split('T')[0];
                break;
              case 'weekly':
                const startOfWeek = new Date(targetDate);
                const dayOfWeek = startOfWeek.getDay();
                startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
                periodKey = `${startOfWeek.getFullYear()}-W${String(Math.ceil(startOfWeek.getDate() / 7)).padStart(2, '0')}`;
                break;
              case 'monthly':
                periodKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
                break;
              default:
                continue;
            }
            
            // 添加记录（如果不存在）
            if (!completionRecord.includes(periodKey)) {
              completionRecord.push(periodKey);
            }
          }

          // 计算新的统计数据
          const newCompletedCount = completionRecord.length;
          let newCurrentStreak = 0;
          
          // 简化的连续次数计算
          if (task.repeat_frequency === 'daily') {
            // 从最近的日期开始计算连续次数
            const sortedDates = completionRecord.sort().reverse();
            const today = new Date().toISOString().split('T')[0];
            
            for (let i = 0; i < sortedDates.length; i++) {
              const checkDate = new Date();
              checkDate.setDate(checkDate.getDate() - i);
              const expectedDate = checkDate.toISOString().split('T')[0];
              
              if (sortedDates.includes(expectedDate)) {
                newCurrentStreak++;
              } else {
                break;
              }
            }
          } else {
            newCurrentStreak = Math.min(completionRecord.length, task.current_streak + days);
          }

          const newLongestStreak = Math.max(task.longest_streak, newCurrentStreak);
          
          // 检查是否应该完成
          let newStatus = task.status;
          if (task.required_count && newCurrentStreak >= task.required_count) {
            newStatus = 'completed';
          } else if (task.status === 'assigned') {
            newStatus = 'in_progress';
          }

          // 更新任务
          const { error: updateError } = await (taskService as any).supabase
            .from('tasks')
            .update({
              completion_record: JSON.stringify(completionRecord),
              completed_count: newCompletedCount,
              current_streak: newCurrentStreak,
              longest_streak: newLongestStreak,
              status: newStatus
            })
            .eq('id', task.id);

          if (!updateError) {
            updatedCount++;
          }
        } catch (e) {
          console.error(`更新任务 ${task.title} 失败:`, e);
        }
      }

      addToast({
        type: 'success',
        message: `模拟时间推进成功！更新了 ${updatedCount} 个任务`
      });

    } catch (error) {
      console.error('模拟时间推进失败:', error);
      addToast({
        type: 'error',
        message: '模拟时间推进失败: ' + (error instanceof Error ? error.message : '未知错误')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 创建快速测试任务
  const createQuickTestTask = async (type: 'daily' | 'weekly' | 'almost_complete' | 'forever') => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let taskData: any = {
        title: '',
        description: '快速测试任务',
        points: 10,
        task_type: 'daily',
        repeat_frequency: 'daily',
        status: 'in_progress',
        requires_proof: false,
        completed_count: 0,
        current_streak: 0,
        longest_streak: 0,
        completion_record: null
      };

      switch (type) {
        case 'daily':
          taskData.title = '快速每日测试';
          taskData.repeat_frequency = 'daily';
          taskData.required_count = 5;
          taskData.completion_record = `["${yesterdayStr}"]`;
          taskData.completed_count = 1;
          taskData.current_streak = 1;
          taskData.longest_streak = 1;
          break;

        case 'weekly':
          taskData.title = '快速每周测试';
          taskData.repeat_frequency = 'weekly';
          taskData.required_count = 3;
          taskData.completion_record = '["2025-W01"]';
          taskData.completed_count = 1;
          taskData.current_streak = 1;
          taskData.longest_streak = 1;
          break;

        case 'almost_complete':
          taskData.title = '即将完成测试';
          taskData.repeat_frequency = 'daily';
          taskData.required_count = 3;
          taskData.completion_record = `["${yesterdayStr}"]`;
          taskData.completed_count = 2;
          taskData.current_streak = 2;
          taskData.longest_streak = 2;
          break;

        case 'forever':
          taskData.title = 'Forever任务测试';
          taskData.repeat_frequency = 'daily';
          taskData.required_count = null;
          taskData.completion_record = `["${yesterdayStr}"]`;
          taskData.completed_count = 5;
          taskData.current_streak = 3;
          taskData.longest_streak = 8;
          break;
      }

      await taskService.createTask(taskData);
      
      addToast({
        type: 'success',
        message: `快速测试任务 "${taskData.title}" 创建成功！`
      });

    } catch (error) {
      console.error('创建测试任务失败:', error);
      addToast({
        type: 'error',
        message: '创建测试任务失败: ' + (error instanceof Error ? error.message : '未知错误')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 重置所有测试任务
  const resetTestTasks = async () => {
    setIsLoading(true);
    try {
      const { error } = await (taskService as any).supabase
        .from('tasks')
        .delete()
        .or('title.ilike.%测试%,title.ilike.%快速%');

      if (error) throw error;

      addToast({
        type: 'success',
        message: '所有测试任务已清理完成！'
      });

    } catch (error) {
      console.error('清理测试任务失败:', error);
      addToast({
        type: 'error',
        message: '清理测试任务失败: ' + (error instanceof Error ? error.message : '未知错误')
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ThemeCard>
        <ThemeCardHeader>
          <ThemeCardTitle>
            {theme === 'pixel' ? 'DEV_TESTING_TOOLS' : theme === 'modern' ? 'Dev Testing Tools' : '🧪 开发测试工具'}
          </ThemeCardTitle>
        </ThemeCardHeader>
        <ThemeCardContent className="space-y-6">
          
          {/* 时间模拟工具 */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              {theme === 'pixel' ? 'TIME_SIMULATION' : theme === 'modern' ? 'Time Simulation' : '⏰ 时间模拟'}
            </h4>
            <div className="flex gap-2 flex-wrap">
              <ThemeButton
                onClick={() => simulateTimeProgress(1)}
                disabled={isLoading}
                variant="secondary"
                size="sm"
              >
                +1天
              </ThemeButton>
              <ThemeButton
                onClick={() => simulateTimeProgress(3)}
                disabled={isLoading}
                variant="secondary"
                size="sm"
              >
                +3天
              </ThemeButton>
              <ThemeButton
                onClick={() => simulateTimeProgress(7)}
                disabled={isLoading}
                variant="secondary"
                size="sm"
              >
                +1周
              </ThemeButton>
              <ThemeButton
                onClick={() => simulateTimeProgress(30)}
                disabled={isLoading}
                variant="secondary"
                size="sm"
              >
                +1月
              </ThemeButton>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              为重复任务添加模拟的完成记录，测试连续打卡和任务完成逻辑
            </p>
          </div>

          {/* 快速测试任务 */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              {theme === 'pixel' ? 'QUICK_TEST_TASKS' : theme === 'modern' ? 'Quick Test Tasks' : '🎯 快速测试任务'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <ThemeButton
                onClick={() => createQuickTestTask('daily')}
                disabled={isLoading}
                variant="secondary"
                size="sm"
              >
                每日任务
              </ThemeButton>
              <ThemeButton
                onClick={() => createQuickTestTask('weekly')}
                disabled={isLoading}
                variant="secondary"
                size="sm"
              >
                每周任务
              </ThemeButton>
              <ThemeButton
                onClick={() => createQuickTestTask('almost_complete')}
                disabled={isLoading}
                variant="secondary"
                size="sm"
              >
                即将完成
              </ThemeButton>
              <ThemeButton
                onClick={() => createQuickTestTask('forever')}
                disabled={isLoading}
                variant="secondary"
                size="sm"
              >
                Forever任务
              </ThemeButton>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              创建预配置的测试任务，包含历史记录，可以立即测试打卡功能
            </p>
          </div>

          {/* 清理工具 */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              {theme === 'pixel' ? 'CLEANUP_TOOLS' : theme === 'modern' ? 'Cleanup Tools' : '🧹 清理工具'}
            </h4>
            <ThemeButton
              onClick={resetTestTasks}
              disabled={isLoading}
              variant="secondary"
              size="sm"
            >
              清理测试任务
            </ThemeButton>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              删除所有标题包含"测试"或"快速"的任务
            </p>
          </div>

          {/* 使用说明 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h5 className="font-medium text-sm mb-2">💡 使用提示</h5>
            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
              <li>• 时间模拟：为现有任务添加历史完成记录</li>
              <li>• 快速任务：创建有初始记录的测试任务</li>
              <li>• 测试完成后记得清理测试数据</li>
              <li>• 建议在开发环境使用此工具</li>
            </ul>
          </div>

        </ThemeCardContent>
      </ThemeCard>
    </div>
  );
};

export default DevTestingTools;
