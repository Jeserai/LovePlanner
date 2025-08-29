const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('');
  console.error('请在 .env.local 文件中设置这些变量，或在命令行中提供:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node migrate-excluded-dates.js');
  process.exit(1);
}

// 创建 Supabase 客户端（使用服务角色密钥来执行管理操作）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addExcludedDatesColumn() {
  try {
    console.log('🔧 开始添加 excluded_dates 字段到 events 表...');
    
    // 执行 SQL 迁移
    const { data, error } = await supabase.rpc('sql', {
      query: `
        -- 添加 excluded_dates 字段
        ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS excluded_dates TEXT[] DEFAULT '{}';
        
        -- 添加注释
        COMMENT ON COLUMN events.excluded_dates IS '被排除的重复事件日期列表，格式为 YYYY-MM-DD';
      `
    });

    if (error) {
      // 尝试直接执行 SQL（如果 rpc 不可用）
      console.log('🔄 尝试直接执行 SQL...');
      
      const { error: directError } = await supabase
        .from('events')
        .select('excluded_dates')
        .limit(1);
        
      if (directError && directError.message.includes('column "excluded_dates" does not exist')) {
        console.error('❌ 字段不存在，需要手动添加字段');
        console.log('请在 Supabase Dashboard 的 SQL Editor 中执行以下命令:');
        console.log('');
        console.log('ALTER TABLE events ADD COLUMN excluded_dates TEXT[] DEFAULT \'{}\';');
        console.log('');
        process.exit(1);
      } else if (directError) {
        throw directError;
      } else {
        console.log('✅ excluded_dates 字段已存在');
      }
    } else {
      console.log('✅ excluded_dates 字段添加成功');
    }

    // 验证字段是否正确添加
    console.log('🔍 验证字段...');
    const { data: testData, error: testError } = await supabase
      .from('events')
      .select('id, excluded_dates')
      .limit(1);

    if (testError) {
      console.error('❌ 验证失败:', testError.message);
      process.exit(1);
    }

    console.log('✅ 字段验证成功！');
    console.log('📊 测试查询结果:', testData);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

// 执行迁移
addExcludedDatesColumn();
