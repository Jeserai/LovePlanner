// 在浏览器控制台运行这个脚本来强制刷新FullCalendar配置

console.log('🔧 === FullCalendar配置调试 ===');

// 获取FullCalendar实例
const calendarEl = document.querySelector('.fc');
if (calendarEl && calendarEl._calendar) {
  const calendar = calendarEl._calendar;
  
  console.log('📅 当前FullCalendar配置:', {
    slotMinTime: calendar.getOption('slotMinTime'),
    slotMaxTime: calendar.getOption('slotMaxTime'), 
    slotDuration: calendar.getOption('slotDuration'),
    height: calendar.getOption('height'),
    aspectRatio: calendar.getOption('aspectRatio')
  });
  
  // 尝试强制重新配置
  calendar.setOption('slotMinTime', '00:00:00');
  calendar.setOption('slotMaxTime', '24:00:00');
  calendar.setOption('slotDuration', '00:30:00');
  
  console.log('✅ 已强制更新FullCalendar配置');
  
  // 重新渲染
  calendar.render();
  console.log('🔄 已重新渲染日历');
} else {
  console.log('❌ 未找到FullCalendar实例');
}
