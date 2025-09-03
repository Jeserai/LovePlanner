import { useState, useMemo } from 'react';

// 🎯 日历视图状态管理Hook
export const useCalendarView = () => {
  // 日历导航状态
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // 选中日期状态
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // 用户视图类型
  type UserView = 'my' | 'partner' | 'shared';
  const [currentView, setCurrentView] = useState<UserView>('my');

  // 日历显示模式
  type CalendarMode = 'month' | 'week';
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');

  // 使用useMemo优化日历计算，确保渲染稳定性
  const calendarData = useMemo(() => {
    const today = new Date();
    
    if (calendarMode === 'week') {
      // 周视图计算
      const currentDate = selectedDate ? new Date(selectedDate) : today;
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // 周日作为一周的开始
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push(date.getDate());
      }
      
      return {
        days,
        rowsNeeded: 1,
        totalCells: 7,
        daysInMonth: days.length,
        startingDayOfWeek: 0,
        firstRowEmptyCount: 0,
        firstRowEmptyRatio: 0,
        shouldAdjustSpacing: false,
        spacingClass: 'mb-3',
        today,
        weekStartDate: startOfWeek, // 周视图特有
        isWeekView: true
      };
    } else {
      // 月视图计算（原逻辑）
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }

      // 计算实际需要的行数，避免完全空白行
      const totalUsedCells = startingDayOfWeek + daysInMonth;
      const rowsNeeded = Math.ceil(totalUsedCells / 7);
      const totalCells = rowsNeeded * 7; // 动态计算总单元格数
      
      // Add empty cells to complete the grid (now dynamic)
      while (days.length < totalCells) {
        days.push(null);
      }
      
      // 计算首行空白比例，用于视觉优化
      const firstRowEmptyCount = startingDayOfWeek;
      const firstRowEmptyRatio = firstRowEmptyCount / 7;
      
      // 当首行空白过多时，调整上边距以改善视觉平衡
      const shouldAdjustSpacing = firstRowEmptyRatio >= 0.7; // 70%以上空白时调整
      const spacingClass = shouldAdjustSpacing ? 'mb-2' : 'mb-3';
      
      return {
        days,
        rowsNeeded,
        totalCells,
        daysInMonth,
        startingDayOfWeek,
        firstRowEmptyCount,
        firstRowEmptyRatio,
        shouldAdjustSpacing,
        spacingClass,
        today,
        isWeekView: false
      };
    }
  }, [currentYear, currentMonth, calendarMode, selectedDate]);

  // 时间导航（支持月视图和周视图）
  const goToPrevious = () => {
    if (calendarMode === 'week') {
      // 周视图：前一周
      const currentDate = selectedDate ? new Date(selectedDate) : new Date();
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setSelectedDate(prevWeek.toISOString().split('T')[0]);
      // 更新月份和年份以保持同步
      setCurrentMonth(prevWeek.getMonth());
      setCurrentYear(prevWeek.getFullYear());
    } else {
      // 月视图：前一月
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  const goToNext = () => {
    if (calendarMode === 'week') {
      // 周视图：下一周
      const currentDate = selectedDate ? new Date(selectedDate) : new Date();
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setSelectedDate(nextWeek.toISOString().split('T')[0]);
      // 更新月份和年份以保持同步
      setCurrentMonth(nextWeek.getMonth());
      setCurrentYear(nextWeek.getFullYear());
    } else {
      // 月视图：下一月
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // 兼容性别名
  const goToPreviousMonth = goToPrevious;
  const goToNextMonth = goToNext;

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // 格式化月份年份显示
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  const formatMonthYear = () => {
    return `${currentYear}年 ${monthNames[currentMonth]}`;
  };

  // 判断是否为今天
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  // 获取日期字符串
  const getDateString = (day: number) => {
    return `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // 判断是否为选中日期
  const isSelectedDate = (day: number) => {
    const dateStr = getDateString(day);
    return selectedDate === dateStr;
  };

  return {
    // 状态
    currentMonth,
    currentYear,
    selectedDate,
    currentView,
    calendarMode,
    calendarData,
    
    // 设置函数
    setCurrentMonth,
    setCurrentYear,
    setSelectedDate,
    setCurrentView,
    setCalendarMode,
    
    // 导航函数
    goToPreviousMonth,
    goToNextMonth,
    goToPrevious,
    goToNext,
    goToToday,
    
    // 工具函数
    formatMonthYear,
    isToday,
    getDateString,
    isSelectedDate,
    
    // 常量
    monthNames,
    dayNames
  };
};
