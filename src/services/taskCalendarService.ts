// 🎯 任务-日历联动服务
import type { Task, TaskStatus } from '../types/task';
import type { Event } from '../types/event';
import { getTodayString, getCurrentTime } from '../utils/testTimeManager';

export interface TaskCalendarEvent extends Event {
  taskId: string;
  taskStatus: TaskStatus;
  taskType: 'deadline' | 'scheduled' | 'reminder' | 'habit';
  isCompleted: boolean;
  canComplete: boolean;
  originalTask: Task;
}

export interface CalendarDisplayRule {
  shouldDisplay: boolean;
  displayType: 'event' | 'reminder' | 'deadline' | 'habit';
  color: string;
  priority: number;
  reason?: string;
}

export class TaskCalendarService {
  
  /**
   * 判断任务是否应该在日历上显示
   */
  static shouldDisplayInCalendar(task: Task, currentUserId: string): CalendarDisplayRule {
    // 🔴 不显示：招募状态的任务
    if (task.status === 'recruiting') {
      return {
        shouldDisplay: false,
        displayType: 'reminder',
        color: '#gray',
        priority: 0,
        reason: '任务尚未被领取'
      };
    }

    // 🔴 不显示：已放弃的任务
    if (task.status === 'abandoned') {
      return {
        shouldDisplay: false,
        displayType: 'reminder',
        color: '#gray',
        priority: 0,
        reason: '任务已放弃'
      };
    }

    // 🟢 高优先级：有明确截止时间的任务
    if (task.task_deadline) {
      return {
        shouldDisplay: true,
        displayType: 'deadline',
        color: this.getTaskColor(task, 'deadline'),
        priority: 9,
        reason: '有明确截止时间'
      };
    }

    // 🟢 高优先级：有固定时间安排的任务
    if (task.daily_time_start && task.daily_time_end) {
      return {
        shouldDisplay: true,
        displayType: 'scheduled',
        color: this.getTaskColor(task, 'scheduled'),
        priority: 8,
        reason: '有固定时间安排'
      };
    }

    // 🟢 中优先级：重复任务（有固定星期几）
    if (task.repeat_frequency !== 'never' && task.repeat_weekdays && task.repeat_weekdays.length > 0) {
      return {
        shouldDisplay: true,
        displayType: 'event',
        color: this.getTaskColor(task, 'repeat'),
        priority: 7,
        reason: '有固定重复时间'
      };
    }

    // 🟡 中优先级：每日习惯任务
    if (task.repeat_frequency === 'daily' || task.task_type === 'habit') {
      return {
        shouldDisplay: true,
        displayType: 'habit',
        color: this.getTaskColor(task, 'habit'),
        priority: 6,
        reason: '每日习惯任务'
      };
    }

    // 🟡 中优先级：有开始时间的任务
    if (task.earliest_start_time) {
      return {
        shouldDisplay: true,
        displayType: 'reminder',
        color: this.getTaskColor(task, 'reminder'),
        priority: 5,
        reason: '有开始时间提醒'
      };
    }

    // 🟡 低优先级：已分配的其他重复任务
    if (task.repeat_frequency !== 'never' && task.assignee_id === currentUserId) {
      return {
        shouldDisplay: true,
        displayType: 'reminder',
        color: this.getTaskColor(task, 'reminder'),
        priority: 4,
        reason: '重复任务提醒'
      };
    }

    // 🔴 不显示：其他情况
    return {
      shouldDisplay: false,
      displayType: 'reminder',
      color: '#gray',
      priority: 0,
      reason: '无明确时间信息'
    };
  }

  /**
   * 将任务转换为日历事件
   */
  static convertTasksToCalendarEvents(
    tasks: Task[], 
    currentUserId: string,
    dateRange: { start: Date; end: Date }
  ): TaskCalendarEvent[] {
    const events: TaskCalendarEvent[] = [];

    for (const task of tasks) {
      const rule = this.shouldDisplayInCalendar(task, currentUserId);
      
      if (!rule.shouldDisplay) continue;

      // 根据任务类型生成不同的日历事件
      switch (rule.displayType) {
        case 'deadline':
          events.push(...this.generateDeadlineEvents(task, rule, dateRange));
          break;
        case 'scheduled':
          events.push(...this.generateScheduledEvents(task, rule, dateRange));
          break;
        case 'event':
          events.push(...this.generateRepeatEvents(task, rule, dateRange));
          break;
        case 'habit':
          events.push(...this.generateHabitEvents(task, rule, dateRange));
          break;
        case 'reminder':
          events.push(...this.generateReminderEvents(task, rule, dateRange));
          break;
      }
    }

    return events.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 生成截止日期事件
   */
  private static generateDeadlineEvents(
    task: Task, 
    rule: CalendarDisplayRule, 
    dateRange: { start: Date; end: Date }
  ): TaskCalendarEvent[] {
    if (!task.task_deadline) return [];

    const deadlineDate = new Date(task.task_deadline);
    if (deadlineDate < dateRange.start || deadlineDate > dateRange.end) return [];

    const isOverdue = deadlineDate < new Date();
    const today = getTodayString();
    const deadlineDay = deadlineDate.toISOString().split('T')[0];
    
    return [{
      id: `task-deadline-${task.id}`,
      taskId: task.id,
      title: `📅 ${task.title}`,
      description: `截止日期: ${task.description || ''}`,
      date: deadlineDay,
      time: deadlineDate.toTimeString().slice(0, 5),
      color: isOverdue ? '#ef4444' : rule.color,
      isAllDay: false,
      taskStatus: task.status,
      taskType: 'deadline',
      isCompleted: task.status === 'completed',
      canComplete: task.assignee_id === task.creator_id, // 简化判断
      originalTask: task,
      category: 'task',
      participants: [task.assignee_id || task.creator_id],
      createdBy: task.creator_id,
      priority: rule.priority
    } as TaskCalendarEvent];
  }

  /**
   * 生成固定时间安排事件
   */
  private static generateScheduledEvents(
    task: Task, 
    rule: CalendarDisplayRule, 
    dateRange: { start: Date; end: Date }
  ): TaskCalendarEvent[] {
    const events: TaskCalendarEvent[] = [];
    
    if (!task.daily_time_start || !task.daily_time_end) return events;

    // 根据重复频率生成事件
    const startDate = new Date(Math.max(dateRange.start.getTime(), 
      task.earliest_start_time ? new Date(task.earliest_start_time).getTime() : dateRange.start.getTime()));
    const endDate = new Date(Math.min(dateRange.end.getTime(),
      task.task_deadline ? new Date(task.task_deadline).getTime() : dateRange.end.getTime()));

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const shouldShowOnThisDay = this.shouldShowTaskOnDate(task, date);
      
      if (!shouldShowOnThisDay) continue;

      const dateStr = date.toISOString().split('T')[0];
      const isCompleted = this.isTaskCompletedOnDate(task, dateStr);
      
      events.push({
        id: `task-scheduled-${task.id}-${dateStr}`,
        taskId: task.id,
        title: `⏰ ${task.title}`,
        description: task.description || '',
        date: dateStr,
        time: task.daily_time_start,
        color: isCompleted ? '#10b981' : rule.color,
        isAllDay: false,
        taskStatus: task.status,
        taskType: 'scheduled',
        isCompleted,
        canComplete: !isCompleted && this.canCompleteTaskToday(task, dateStr),
        originalTask: task,
        category: 'task',
        participants: [task.assignee_id || task.creator_id],
        createdBy: task.creator_id,
        rawStartTime: `${dateStr}T${task.daily_time_start}:00`,
        rawEndTime: `${dateStr}T${task.daily_time_end}:00`,
        priority: rule.priority
      } as TaskCalendarEvent);
    }

    return events;
  }

  /**
   * 生成重复任务事件
   */
  private static generateRepeatEvents(
    task: Task, 
    rule: CalendarDisplayRule, 
    dateRange: { start: Date; end: Date }
  ): TaskCalendarEvent[] {
    const events: TaskCalendarEvent[] = [];
    
    if (!task.repeat_weekdays || task.repeat_weekdays.length === 0) return events;

    const startDate = new Date(Math.max(dateRange.start.getTime(), 
      task.earliest_start_time ? new Date(task.earliest_start_time).getTime() : dateRange.start.getTime()));
    const endDate = new Date(Math.min(dateRange.end.getTime(),
      task.task_deadline ? new Date(task.task_deadline).getTime() : dateRange.end.getTime()));

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 转换为周一=1的格式
      
      if (!task.repeat_weekdays.includes(dayOfWeek)) continue;

      const dateStr = date.toISOString().split('T')[0];
      const isCompleted = this.isTaskCompletedOnDate(task, dateStr);
      
      events.push({
        id: `task-repeat-${task.id}-${dateStr}`,
        taskId: task.id,
        title: `🔄 ${task.title}`,
        description: task.description || '',
        date: dateStr,
        time: task.daily_time_start || '09:00',
        color: isCompleted ? '#10b981' : rule.color,
        isAllDay: !task.daily_time_start,
        taskStatus: task.status,
        taskType: 'scheduled',
        isCompleted,
        canComplete: !isCompleted && this.canCompleteTaskToday(task, dateStr),
        originalTask: task,
        category: 'task',
        participants: [task.assignee_id || task.creator_id],
        createdBy: task.creator_id,
        priority: rule.priority
      } as TaskCalendarEvent);
    }

    return events;
  }

  /**
   * 生成习惯任务事件
   */
  private static generateHabitEvents(
    task: Task, 
    rule: CalendarDisplayRule, 
    dateRange: { start: Date; end: Date }
  ): TaskCalendarEvent[] {
    const events: TaskCalendarEvent[] = [];
    
    const startDate = new Date(Math.max(dateRange.start.getTime(), 
      task.earliest_start_time ? new Date(task.earliest_start_time).getTime() : dateRange.start.getTime()));
    const endDate = new Date(Math.min(dateRange.end.getTime(),
      task.task_deadline ? new Date(task.task_deadline).getTime() : dateRange.end.getTime()));

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const isCompleted = this.isTaskCompletedOnDate(task, dateStr);
      
      events.push({
        id: `task-habit-${task.id}-${dateStr}`,
        taskId: task.id,
        title: `🌱 ${task.title}`,
        description: task.description || '',
        date: dateStr,
        color: isCompleted ? '#10b981' : rule.color,
        isAllDay: true,
        taskStatus: task.status,
        taskType: 'habit',
        isCompleted,
        canComplete: !isCompleted && this.canCompleteTaskToday(task, dateStr),
        originalTask: task,
        category: 'task',
        participants: [task.assignee_id || task.creator_id],
        createdBy: task.creator_id,
        priority: rule.priority
      } as TaskCalendarEvent);
    }

    return events;
  }

  /**
   * 生成提醒事件
   */
  private static generateReminderEvents(
    task: Task, 
    rule: CalendarDisplayRule, 
    dateRange: { start: Date; end: Date }
  ): TaskCalendarEvent[] {
    const events: TaskCalendarEvent[] = [];
    
    if (task.earliest_start_time) {
      const startDate = new Date(task.earliest_start_time);
      if (startDate >= dateRange.start && startDate <= dateRange.end) {
        const dateStr = startDate.toISOString().split('T')[0];
        
        events.push({
          id: `task-reminder-${task.id}`,
          taskId: task.id,
          title: `🔔 ${task.title}`,
          description: `开始提醒: ${task.description || ''}`,
          date: dateStr,
          time: startDate.toTimeString().slice(0, 5),
          color: rule.color,
          isAllDay: false,
          taskStatus: task.status,
          taskType: 'reminder',
          isCompleted: task.status === 'completed',
          canComplete: this.canCompleteTaskToday(task, dateStr),
          originalTask: task,
          category: 'task',
          participants: [task.assignee_id || task.creator_id],
          createdBy: task.creator_id,
          priority: rule.priority
        } as TaskCalendarEvent);
      }
    }

    return events;
  }

  /**
   * 获取任务颜色
   */
  private static getTaskColor(task: Task, displayType: string): string {
    const colorMap = {
      'deadline': '#ef4444',    // 红色 - 截止日期
      'scheduled': '#3b82f6',   // 蓝色 - 固定时间
      'repeat': '#8b5cf6',      // 紫色 - 重复任务
      'habit': '#10b981',       // 绿色 - 习惯任务
      'reminder': '#f59e0b'     // 黄色 - 提醒
    };

    const difficultyMap = {
      'easy': '#10b981',
      'normal': '#f59e0b', 
      'hard': '#ef4444'
    };

    return colorMap[displayType as keyof typeof colorMap] || 
           difficultyMap[task.task_type as keyof typeof difficultyMap] || 
           '#6b7280';
  }

  /**
   * 检查任务是否应该在某个日期显示
   */
  private static shouldShowTaskOnDate(task: Task, date: Date): boolean {
    // 检查重复日期限制
    if (task.repeat_weekdays && task.repeat_weekdays.length > 0) {
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      return task.repeat_weekdays.includes(dayOfWeek);
    }

    // 检查重复频率
    if (task.repeat_frequency !== 'never') {
      // 简化处理：daily 和 forever 都显示
      return ['daily', 'forever'].includes(task.repeat_frequency);
    }

    return true;
  }

  /**
   * 检查任务在某个日期是否已完成
   */
  private static isTaskCompletedOnDate(task: Task, dateStr: string): boolean {
    if (!task.completion_record) return false;
    
    try {
      const completionRecord = JSON.parse(task.completion_record);
      if (Array.isArray(completionRecord)) {
        return completionRecord.includes(dateStr);
      }
      return completionRecord[dateStr] === true;
    } catch {
      return false;
    }
  }

  /**
   * 检查今天是否可以完成任务
   */
  private static canCompleteTaskToday(task: Task, dateStr: string): boolean {
    const today = getTodayString();
    if (dateStr !== today) return false;

    const now = getCurrentTime();

    // 检查每日时间窗口
    if (task.daily_time_start && task.daily_time_end) {
      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime < task.daily_time_start || currentTime > task.daily_time_end) {
        return false;
      }
    }

    // 检查是否已完成
    if (this.isTaskCompletedOnDate(task, dateStr)) {
      return false;
    }

    return true;
  }

  /**
   * 从日历事件快速完成任务
   */
  static async completeTaskFromCalendar(
    taskId: string, 
    date: string,
    taskService: any
  ): Promise<boolean> {
    try {
      // 这里调用任务服务的完成方法
      await taskService.completeTask(taskId);
      return true;
    } catch (error) {
      console.error('从日历完成任务失败:', error);
      return false;
    }
  }
}
