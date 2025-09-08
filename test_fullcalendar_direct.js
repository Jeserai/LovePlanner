// 直接测试FullCalendar配置的脚本
console.log('🧪 === 直接测试FullCalendar ===');

// 检查FullCalendar容器
const fcContainer = document.querySelector('.fullcalendar-container');
const fcElement = document.querySelector('.fc');
const fcCard = fcElement?.closest('[class*="rounded-xl"]');

console.log('📦 容器信息:', {
  'FullCalendar容器': fcContainer ? `${fcContainer.getBoundingClientRect().height}px` : '未找到',
  'FC元素': fcElement ? `${fcElement.getBoundingClientRect().height}px` : '未找到',
  'Card容器': fcCard ? `${fcCard.getBoundingClientRect().height}px` : '未找到'
});

// 检查CSS样式
if (fcElement) {
  const styles = window.getComputedStyle(fcElement);
  console.log('🎨 FullCalendar样式:', {
    height: styles.height,
    maxHeight: styles.maxHeight,
    overflow: styles.overflow,
    display: styles.display
  });
}

// 检查滚动容器
const scrollers = document.querySelectorAll('.fc-scroller');
console.log('📜 滚动容器数量:', scrollers.length);

scrollers.forEach((scroller, index) => {
  const styles = window.getComputedStyle(scroller);
  const rect = scroller.getBoundingClientRect();
  console.log(`📜 滚动器${index + 1}:`, {
    高度: rect.height + 'px',
    CSS高度: styles.height,
    overflow: styles.overflow,
    overflowY: styles.overflowY,
    scrollHeight: scroller.scrollHeight + 'px'
  });
});

// 尝试手动设置FullCalendar高度
if (fcElement) {
  console.log('🔧 尝试手动设置高度...');
  fcElement.style.height = '600px';
  fcElement.style.minHeight = '600px';
  
  // 查找并设置滚动容器高度
  const mainScroller = document.querySelector('.fc-timegrid .fc-scroller');
  if (mainScroller) {
    mainScroller.style.height = '500px';
    mainScroller.style.maxHeight = '500px';
    console.log('✅ 已设置滚动容器高度');
  }
}
