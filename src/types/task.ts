// 🎯 新的任务类型定义 - 基于优化后的单表结构

export type RepeatFrequency = 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever';
export type TaskType = 'daily' | 'habit' | 'special';
export type TaskStatus = 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned';

// 🎯 核心任务接口 - 匹配数据库结构
export interface Task {
  id: string;
  title: string;
  description: string | null;
  points: number;
  creator_id: string;
  couple_id: string;
  
  // 任务分类
  task_type: TaskType;
  repeat_frequency: RepeatFrequency;
  
  // 核心时间配置
  earliest_start_time: string | null;     // 最早开始时间
  required_count: number | null;          // 需要完成的次数（forever任务为null）
  task_deadline: string | null;           // 任务截止时间（forever任务为null）
  
  // 重复细节配置
  repeat_weekdays: number[] | null;       // [1,2,5] 周一、周二、周五
  daily_time_start: string | null;        // 每日任务时间窗口开始
  daily_time_end: string | null;          // 每日任务时间窗口结束
  
  // 任务状态
  status: TaskStatus;
  assignee_id: string | null;
  
  // 完成跟踪
  completed_count: number;                // 已完成次数
  current_streak: number;                 // 当前连续次数
  longest_streak: number;                 // 历史最长连续次数
  completion_record: Record<string, boolean>; // 完成记录 {"2024-01-01": true, ...}
  
  // 其他字段
  requires_proof: boolean;
  proof_url: string | null;
  review_comment: string | null;
  
  // 系统字段
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  completed_at: string | null;
}

// 🎯 创建任务的表单数据
export interface CreateTaskForm {
  title: string;
  description: string;
  points: number;
  task_type: TaskType;
  repeat_frequency: RepeatFrequency;
  
  // 时间配置
  earliest_start_time?: string;
  required_count?: number;
  task_deadline?: string;
  
  // 重复配置
  repeat_weekdays?: number[];
  daily_time_start?: string;
  daily_time_end?: string;
  
  // 其他
  requires_proof: boolean;
}

// 🎯 编辑任务的表单数据
export interface EditTaskForm extends Partial<CreateTaskForm> {
  id: string;
}

// 🎯 任务显示的计算属性
export interface TaskDisplayInfo {
  task: Task;
  
  // 任务类型分类
  task_category: 'once' | 'limited_repeat' | 'forever_repeat';
  
  // 时间类型
  time_type: 'fixed' | 'flexible' | 'unlimited';
  
  // 完成进度
  completion_percentage: number | null;   // 永远重复任务为null
  
  // 状态检查
  is_overdue: boolean;
  can_complete_today: boolean;
  is_active: boolean;
  
  // 显示文本
  time_display: string;
  progress_display: string;
  status_display: string;
}

// 🎯 任务筛选条件
export interface TaskFilter {
  status?: TaskStatus[];
  task_type?: TaskType[];
  repeat_frequency?: RepeatFrequency[];
  assignee_id?: string;
  creator_id?: string;
  can_complete_today?: boolean;
}

// 🎯 任务排序选项
export type TaskSortBy = 'created_at' | 'task_deadline' | 'points' | 'title' | 'completion_percentage';
export type TaskSortOrder = 'asc' | 'desc';

export interface TaskSort {
  by: TaskSortBy;
  order: TaskSortOrder;
}
