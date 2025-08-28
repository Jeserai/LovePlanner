#!/usr/bin/env node
/**
 * 验证任务表结构脚本
 * 检查哪些字段存在，哪些缺失
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手动加载环境变量
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

const supabaseUrl = 'https://jnwfamqcjsmoxsnonodd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ 错误：需要设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 期望的字段列表
const expectedFields = [
  'id', 'title', 'description', 'deadline', 'points', 'status',
  'creator_id', 'assignee_id', 'couple_id', 'task_type', 'repeat_type',
  'requires_proof', 'proof_url', 'proof_type', 'submitted_at', 'review_comment',
  'completed_at', 'created_at', 'updated_at',
  // 新增的时间范围和重复任务字段
  'task_start_time', 'task_end_time', 'start_date', 'end_date',
  'repeat_frequency', 'repeat_time', 'repeat_weekdays'
];

async function verifySchema() {
  console.log('🔍 检查tasks表结构...\n');

  try {
    // 获取当前表结构
    const { data: currentFields, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'tasks' AND table_schema = 'public'
          ORDER BY ordinal_position
        `
      });

    if (error) {
      console.error('❌ 获取表结构失败:', error);
      return;
    }

    const currentFieldNames = currentFields?.map(f => f.column_name) || [];

    console.log('📋 当前表字段:');
    currentFieldNames.forEach(field => {
      console.log(`  ✓ ${field}`);
    });

    console.log('\n🔍 字段状态检查:');
    
    const missingFields = [];
    expectedFields.forEach(field => {
      if (currentFieldNames.includes(field)) {
        console.log(`  ✅ ${field} - 存在`);
      } else {
        console.log(`  ❌ ${field} - 缺失`);
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      console.log('\n⚠️  需要添加的字段:');
      missingFields.forEach(field => {
        console.log(`  - ${field}`);
      });
      
      console.log('\n📝 建议执行的SQL命令:');
      console.log('在Supabase SQL编辑器中执行 add-missing-fields.sql 文件');
    } else {
      console.log('\n🎉 表结构完整，所有字段都存在！');
    }

    // 检查数据示例
    console.log('\n📊 数据示例:');
    const { data: sampleTasks } = await supabase
      .from('tasks')
      .select('id, title, repeat_type, task_start_time, start_date')
      .limit(3);

    if (sampleTasks && sampleTasks.length > 0) {
      sampleTasks.forEach(task => {
        console.log(`  - ${task.title} (${task.repeat_type})`);
      });
    } else {
      console.log('  暂无数据');
    }

  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
  }
}

// 执行验证
verifySchema();
