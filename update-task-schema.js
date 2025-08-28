#!/usr/bin/env node
/**
 * 任务表结构更新脚本
 * 去除不必要的UI字段：has_specific_time, duration
 * 
 * 使用方法：
 * 1. 确保设置了 SUPABASE_SERVICE_ROLE_KEY 环境变量
 * 2. 运行: node update-task-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 加载环境变量
config({ path: '.env.local' });

const supabaseUrl = 'https://jnwfamqcjsmoxsnonodd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ 错误：需要设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.log('请在 .env.local 文件中添加：');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateTaskSchema() {
  console.log('🔄 开始更新任务表结构...\n');

  try {
    // 1. 检查当前表结构
    console.log('1️⃣ 检查当前表结构...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'tasks')
      .eq('table_schema', 'public');

    if (columnError) {
      console.error('❌ 获取表结构失败:', columnError);
      return;
    }

    console.log('当前表字段:', columns?.map(c => c.column_name).join(', '));

    // 2. 检查需要删除的字段是否存在
    const hasSpecificTimeExists = columns?.some(c => c.column_name === 'has_specific_time');
    const durationExists = columns?.some(c => c.column_name === 'duration');

    console.log(`\n2️⃣ 检查待删除字段:`);
    console.log(`- has_specific_time: ${hasSpecificTimeExists ? '存在' : '不存在'}`);
    console.log(`- duration: ${durationExists ? '存在' : '不存在'}`);

    // 3. 备份现有任务数据（可选）
    console.log('\n3️⃣ 备份现有任务数据...');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);

    if (tasksError) {
      console.error('❌ 获取任务数据失败:', tasksError);
      return;
    }

    console.log(`✅ 当前共有 ${tasks?.length || 0} 条任务记录（仅显示前5条）`);

    // 4. 生成SQL执行命令
    if (hasSpecificTimeExists || durationExists) {
      console.log('\n4️⃣ 生成SQL执行命令...');
      console.log('⚠️  请手动在Supabase SQL编辑器中执行以下命令：\n');

      if (hasSpecificTimeExists) {
        console.log('-- 删除 has_specific_time 字段');
        console.log('ALTER TABLE tasks DROP COLUMN IF EXISTS has_specific_time;\n');
      }

      if (durationExists) {
        console.log('-- 删除 duration 字段');
        console.log('ALTER TABLE tasks DROP COLUMN IF EXISTS duration;\n');
      }

      console.log('执行步骤：');
      console.log('1. 打开 Supabase Dashboard');
      console.log('2. 进入 SQL Editor');
      console.log('3. 复制上述SQL命令并执行');
      console.log('4. 再次运行此脚本验证更新结果');
      
      // 提示用户是否已经执行了SQL
      console.log('\n是否已经执行了上述SQL命令？(继续验证结果)');
    } else {
      console.log('\n4️⃣ 无需更新：待删除的字段不存在');
    }

    // 5. 验证更新后的表结构
    console.log('\n5️⃣ 验证更新后的表结构...');
    const { data: newColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'tasks')
      .eq('table_schema', 'public');

    console.log('更新后的表字段:', newColumns?.map(c => c.column_name).sort().join(', '));

    // 6. 分析现有数据模式
    console.log('\n6️⃣ 分析现有任务数据模式...');
    const { data: taskAnalysis } = await supabase
      .from('tasks')
      .select('id, title, repeat_type, task_start_time, deadline, start_date, end_date')
      .limit(10);

    if (taskAnalysis) {
      const onceTasksWithTimeRange = taskAnalysis.filter(t => 
        t.repeat_type === 'once' && t.task_start_time
      ).length;
      const onceTasksSimple = taskAnalysis.filter(t => 
        t.repeat_type === 'once' && !t.task_start_time
      ).length;
      const repeatTasks = taskAnalysis.filter(t => 
        t.repeat_type === 'repeat'
      ).length;

      console.log(`✅ 任务模式分析:`);
      console.log(`- 一次性任务（简单模式）: ${onceTasksSimple} 个`);
      console.log(`- 一次性任务（时间范围模式）: ${onceTasksWithTimeRange} 个`);
      console.log(`- 重复性任务: ${repeatTasks} 个`);
    }

    console.log('\n🎉 表结构更新完成！');
    console.log('\n📋 优化后的核心字段说明:');
    console.log('一次性任务: deadline, task_start_time (可选), task_end_time (可选)');
    console.log('重复性任务: start_date, end_date, repeat_frequency, repeat_time (可选), repeat_weekdays (可选)');
    console.log('前端通过 task_start_time IS NOT NULL 判断是否为时间范围模式');

  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
  }
}

// 执行脚本
updateTaskSchema();
