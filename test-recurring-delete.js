// 测试重复事件删除功能
const { createClient } = require('@supabase/supabase-js');

// 从 .env.local 读取配置
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRecurringEventDelete() {
  try {
    console.log('🔍 查询现有的重复事件...');
    
    // 查找重复事件
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_recurring', true)
      .limit(5);

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    console.log(`📅 找到 ${events?.length || 0} 个重复事件:`);
    events?.forEach(event => {
      console.log(`  - ${event.title} (ID: ${event.id}, 原始日期: ${event.original_date || event.event_date})`);
    });

    if (events && events.length > 0) {
      const testEvent = events[0];
      console.log(`\n🧪 测试事件: ${testEvent.title}`);
      
      // 检查 excluded_dates 字段是否存在
      console.log('📋 当前排除日期:', testEvent.excluded_dates || '无');
      
      // 测试更新 excluded_dates（模拟删除单个实例）
      const testDate = '2025-09-01';
      const currentExcluded = testEvent.excluded_dates || [];
      const newExcluded = [...currentExcluded, testDate];
      
      console.log(`\n🔧 测试添加排除日期: ${testDate}`);
      const { error: updateError } = await supabase
        .from('events')
        .update({ excluded_dates: newExcluded })
        .eq('id', testEvent.id);

      if (updateError) {
        console.error('❌ 更新失败:', updateError);
        
        // 检查是否是字段不存在的问题
        if (updateError.message.includes('excluded_dates')) {
          console.log('\n⚠️  excluded_dates 字段可能不存在，需要添加到数据库');
          console.log('在 Supabase Dashboard 的 SQL Editor 中执行:');
          console.log('ALTER TABLE events ADD COLUMN excluded_dates TEXT[] DEFAULT \'{}\';');
        }
      } else {
        console.log('✅ 排除日期添加成功');
        
        // 恢复原状态
        console.log('🔄 恢复原状态...');
        await supabase
          .from('events')
          .update({ excluded_dates: currentExcluded })
          .eq('id', testEvent.id);
        console.log('✅ 已恢复');
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

console.log('🧪 开始测试重复事件删除功能...\n');
testRecurringEventDelete();
