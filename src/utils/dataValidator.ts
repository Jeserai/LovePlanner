// 🔍 数据一致性验证工具

import type { Task } from '../types/task';

// 解析completion_record (复制自taskService)
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

// 计算实际的连续次数
const calculateActualStreak = (task: Task): number => {
  const completionRecord = parseCompletionRecord(task.completion_record);
  
  if (completionRecord.length === 0) return 0;
  if (task.repeat_frequency === 'never') return completionRecord.length > 0 ? 1 : 0;
  
  // 排序记录
  const sortedRecords = [...completionRecord].sort();
  let currentStreak = 1; // 至少最新的一次
  
  // 从最新记录开始向前计算连续次数
  for (let i = sortedRecords.length - 1; i > 0; i--) {
    const currentRecord = sortedRecords[i - 1];
    const nextRecord = sortedRecords[i];
    
    // 根据频率检查是否连续
    let isConsecutive = false;
    switch (task.repeat_frequency) {
      case 'daily':
        const currentDate = new Date(currentRecord);
        const nextDate = new Date(nextRecord);
        const diffDays = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        isConsecutive = diffDays === 1;
        break;
      case 'weekly':
        // 周任务：检查是否是连续的周
        const currentWeekStart = new Date(currentRecord);
        const nextWeekStart = new Date(nextRecord);
        const diffWeeks = (nextWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000);
        isConsecutive = diffWeeks === 1;
        break;
      case 'monthly':
        // 月任务：检查格式 YYYY-MM
        const [currentYear, currentMonth] = currentRecord.split('-').map(Number);
        const [nextYear, nextMonth] = nextRecord.split('-').map(Number);
        isConsecutive = (nextYear === currentYear && nextMonth === currentMonth + 1) || 
                      (nextYear === currentYear + 1 && currentMonth === 12 && nextMonth === 1);
        break;
      case 'yearly':
        // 年任务：检查格式 YYYY
        const currentYearNum = parseInt(currentRecord);
        const nextYearNum = parseInt(nextRecord);
        isConsecutive = nextYearNum === currentYearNum + 1;
        break;
      default:
        isConsecutive = false;
    }
    
    if (isConsecutive) {
      currentStreak++;
    } else {
      // 不连续，停止计算
      break;
    }
  }
  
  return currentStreak;
};

// 验证任务数据一致性
export const validateTaskConsistency = (task: Task): string[] => {
  const errors: string[] = [];
  const completionRecord = parseCompletionRecord(task.completion_record);
  
  // 检查completed_count一致性
  if (task.completed_count !== completionRecord.length) {
    errors.push(`完成次数不匹配: 数据库显示${task.completed_count}次，记录显示${completionRecord.length}次`);
  }
  
  // 检查current_streak一致性
  const actualStreak = calculateActualStreak(task);
  if (task.current_streak !== actualStreak) {
    errors.push(`连续次数不匹配: 数据库显示${task.current_streak}次，实际应该是${actualStreak}次`);
  }
  
  // 检查longest_streak逻辑性
  if (task.longest_streak < task.current_streak) {
    errors.push(`历史最长连续次数(${task.longest_streak})不能小于当前连续次数(${task.current_streak})`);
  }
  
  // 检查基本数据合理性
  if (task.completed_count < 0) {
    errors.push(`完成次数不能为负数: ${task.completed_count}`);
  }
  
  if (task.current_streak < 0) {
    errors.push(`当前连续次数不能为负数: ${task.current_streak}`);
  }
  
  if (task.longest_streak < 0) {
    errors.push(`历史最长连续次数不能为负数: ${task.longest_streak}`);
  }
  
  return errors;
};

// 计算修复后的数据
export const calculateCorrectTaskData = (task: Task) => {
  const completionRecord = parseCompletionRecord(task.completion_record);
  const actualStreak = calculateActualStreak(task);
  
  return {
    completed_count: completionRecord.length,
    current_streak: actualStreak,
    longest_streak: Math.max(task.longest_streak, actualStreak)
  };
};

// 分析任务的打卡记录详情
export const analyzeCompletionRecord = (task: Task) => {
  const completionRecord = parseCompletionRecord(task.completion_record);
  
  if (completionRecord.length === 0) {
    return {
      totalRecords: 0,
      firstRecord: null,
      lastRecord: null,
      gaps: [],
      consecutiveSegments: []
    };
  }
  
  const sortedRecords = [...completionRecord].sort();
  const gaps: string[] = [];
  const consecutiveSegments: { start: string; end: string; length: number }[] = [];
  
  // 查找间隔和连续段
  let segmentStart = sortedRecords[0];
  let segmentLength = 1;
  
  for (let i = 1; i < sortedRecords.length; i++) {
    const current = new Date(sortedRecords[i - 1]);
    const next = new Date(sortedRecords[i]);
    const diffDays = (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      // 连续
      segmentLength++;
    } else {
      // 不连续，记录当前段
      consecutiveSegments.push({
        start: segmentStart,
        end: sortedRecords[i - 1],
        length: segmentLength
      });
      
      // 记录间隔
      if (diffDays > 1) {
        gaps.push(`${sortedRecords[i - 1]} 到 ${sortedRecords[i]} (间隔${diffDays - 1}天)`);
      }
      
      // 开始新段
      segmentStart = sortedRecords[i];
      segmentLength = 1;
    }
  }
  
  // 添加最后一段
  consecutiveSegments.push({
    start: segmentStart,
    end: sortedRecords[sortedRecords.length - 1],
    length: segmentLength
  });
  
  return {
    totalRecords: completionRecord.length,
    firstRecord: sortedRecords[0],
    lastRecord: sortedRecords[sortedRecords.length - 1],
    gaps,
    consecutiveSegments
  };
};

// 生成数据一致性报告
export const generateConsistencyReport = (task: Task) => {
  const errors = validateTaskConsistency(task);
  const correctData = calculateCorrectTaskData(task);
  const analysis = analyzeCompletionRecord(task);
  
  return {
    taskId: task.id,
    taskTitle: task.title,
    hasErrors: errors.length > 0,
    errors,
    currentData: {
      completed_count: task.completed_count,
      current_streak: task.current_streak,
      longest_streak: task.longest_streak
    },
    correctData,
    analysis,
    needsRepair: errors.length > 0
  };
};
