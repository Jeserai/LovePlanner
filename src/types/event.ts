// 前端展示用的Event接口
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  participants: string[];
  color: string;
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceEnd?: string;
  originalDate?: string;
  isAllDay?: boolean;
  createdBy?: string;
  createdAt?: string;
  excludedDates?: string[];
  modifiedInstances?: Record<string, any>;
  rawStartTime?: string;
  rawEndTime?: string;
  points?: number;
  category?: string;
}

// 编辑事件表单接口
export interface EditEventForm {
  title: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  description: string;
  includesUser1: boolean;
  includesUser2: boolean;
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceEnd?: string;
  originalDate?: string;
  date?: string;
}

// Calendar组件Props
export interface CalendarProps {
  currentUser?: string | null;
}