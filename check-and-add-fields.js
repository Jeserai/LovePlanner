// 检查并添加缺失的数据库字段
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 手动读取 .env.local 文件
let supabaseUrl, supabaseAnonKey;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1];
    }
  });
} catch (error) {
  console.error('❌ 无法读取 .env.local 文件:', error.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndAddFields() {
  try {
    console.log('🔍 检查数据库字段...');
    
    // 测试查询来检查字段是否存在
    const { data: testData, error: testError } = await supabase
      .from('events')
      .select('id, excluded_dates, modified_instances')
      .limit(1);

    if (testError) {
      console.log('⚠️ 字段检查结果:');
      
      if (testError.message.includes('excluded_dates')) {
        console.log('❌ excluded_dates 字段不存在');
        console.log('请在 Supabase Dashboard 的 SQL Editor 中执行:');
        console.log('ALTER TABLE events ADD COLUMN excluded_dates TEXT[] DEFAULT \'{}\';');
      }
      
      if (testError.message.includes('modified_instances')) {
        console.log('❌ modified_instances 字段不存在');
        console.log('请在 Supabase Dashboard 的 SQL Editor 中执行:');
        console.log('ALTER TABLE events ADD COLUMN modified_instances JSONB DEFAULT \'{}\';');
      }
      
      console.log('\n📝 完整的迁移SQL:');
      console.log('-- 添加 excluded_dates 字段');
      console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS excluded_dates TEXT[] DEFAULT \'{}\';');
      console.log('-- 添加 modified_instances 字段');
      console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS modified_instances JSONB DEFAULT \'{}\';');
      console.log('-- 添加注释');
      console.log('COMMENT ON COLUMN events.excluded_dates IS \'被排除的重复事件日期列表，格式为 YYYY-MM-DD\';');
      console.log('COMMENT ON COLUMN events.modified_instances IS \'重复事件的修改实例，键为日期(YYYY-MM-DD)，值为修改的字段\';');
      
    } else {
      console.log('✅ 所有字段都存在！');
      console.log('📊 测试查询成功，字段状态：');
      if (testData && testData.length > 0) {
        const sample = testData[0];
        console.log(`   - excluded_dates: ${sample.excluded_dates ? '存在' : '空值'}`);
        console.log(`   - modified_instances: ${sample.modified_instances ? '存在' : '空值'}`);
      }
    }

    // 测试更新操作
    console.log('\n🧪 测试字段更新功能...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, is_recurring')
      .eq('is_recurring', true)
      .limit(1);

    if (eventsError) {
      console.error('❌ 查询重复事件失败:', eventsError);
      return;
    }

    if (events && events.length > 0) {
      const testEvent = events[0];
      console.log(`📅 测试事件: ${testEvent.title} (ID: ${testEvent.id})`);
      
      // 测试 excluded_dates 更新
      console.log('🔧 测试 excluded_dates 更新...');
      const { error: excludeError } = await supabase
        .from('events')
        .update({ excluded_dates: ['2025-09-01'] })
        .eq('id', testEvent.id);

      if (excludeError) {
        console.error('❌ excluded_dates 更新失败:', excludeError.message);
      } else {
        console.log('✅ excluded_dates 更新成功');
        
        // 恢复原状态
        await supabase
          .from('events')
          .update({ excluded_dates: [] })
          .eq('id', testEvent.id);
      }

      // 测试 modified_instances 更新
      console.log('🔧 测试 modified_instances 更新...');
      const { error: modifyError } = await supabase
        .from('events')
        .update({ 
          modified_instances: { 
            '2025-09-01': { title: '测试修改', start_time: '10:00' }
          }
        })
        .eq('id', testEvent.id);

      if (modifyError) {
        console.error('❌ modified_instances 更新失败:', modifyError.message);
      } else {
        console.log('✅ modified_instances 更新成功');
        
        // 恢复原状态
        await supabase
          .from('events')
          .update({ modified_instances: {} })
          .eq('id', testEvent.id);
      }
    } else {
      console.log('ℹ️ 没有找到重复事件进行测试');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

console.log('🔧 开始检查和添加数据库字段...\n');
checkAndAddFields();
