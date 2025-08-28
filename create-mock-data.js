#!/usr/bin/env node
/**
 * 创建增强的模拟任务数据脚本
 * 包含各种类型的任务：简单任务、时间范围任务、重复任务等
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

// 模拟任务数据
const mockTasks = [
  // 1. 一次性任务 - 简单模式
  {
    title: '买菜准备晚餐',
    description: '去超市购买今晚做饭需要的食材，包括蔬菜、肉类和调料',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    points: 15,
    status: 'recruiting',
    task_type: 'daily',
    repeat_type: 'once',
    requires_proof: false,
    creator: 'cow'
  },
  {
    title: '整理书房',
    description: '清理书桌，整理书籍，打扫房间卫生',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    points: 25,
    status: 'recruiting',
    task_type: 'daily',
    repeat_type: 'once',
    requires_proof: true,
    creator: 'cat'
  },

  // 2. 一次性任务 - 时间范围模式
  {
    title: '准备浪漫晚餐',
    description: '在家准备一顿浪漫的烛光晚餐，包括前菜、主菜和甜点',
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000).toISOString(),
    points: 50,
    status: 'recruiting',
    task_type: 'special',
    repeat_type: 'once',
    requires_proof: true,
    task_start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(),
    task_end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000).toISOString(),
    creator: 'cow'
  },
  {
    title: '陪伴看电影',
    description: '一起观看最新上映的电影，享受两人时光',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000).toISOString(),
    points: 30,
    status: 'assigned',
    task_type: 'special',
    repeat_type: 'once',
    requires_proof: false,
    task_start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString(),
    task_end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000).toISOString(),
    creator: 'cat',
    assignee: 'cow'
  },

  // 3. 重复任务 - 每日
  {
    title: '早晨锻炼',
    description: '每天早上进行30分钟的晨练，包括跑步、瑜伽或其他运动',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    points: 20,
    status: 'recruiting',
    task_type: 'habit',
    repeat_type: 'repeat',
    requires_proof: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    repeat_frequency: 'daily',
    repeat_time: '07:00:00',
    creator: 'cow'
  },
  {
    title: '睡前阅读',
    description: '每天睡前阅读15-30分钟，培养良好的阅读习惯',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    points: 15,
    status: 'recruiting',
    task_type: 'habit',
    repeat_type: 'repeat',
    requires_proof: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    repeat_frequency: 'daily',
    repeat_time: '21:30:00',
    creator: 'cat'
  },

  // 4. 重复任务 - 每周（指定星期）
  {
    title: '深度清洁厨房',
    description: '每周三次对厨房进行深度清洁，包括油烟机、炉灶和橱柜',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    points: 35,
    status: 'recruiting',
    task_type: 'daily',
    repeat_type: 'repeat',
    requires_proof: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    repeat_frequency: 'weekly',
    repeat_time: '10:00:00',
    repeat_weekdays: [1, 3, 5], // 周一、周三、周五
    creator: 'cow'
  },
  {
    title: '制定周计划',
    description: '每周制定下一周的学习和工作计划，包括目标设定和时间安排',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    points: 25,
    status: 'recruiting',
    task_type: 'habit',
    repeat_type: 'repeat',
    requires_proof: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    repeat_frequency: 'weekly',
    repeat_time: '19:00:00',
    repeat_weekdays: [0], // 周日
    creator: 'cat'
  },

  // 5. 重复任务 - 双周
  {
    title: '约会计划',
    description: '每两周计划一次特别的约会活动，可以是看展览、郊游或尝试新餐厅',
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    points: 60,
    status: 'recruiting',
    task_type: 'special',
    repeat_type: 'repeat',
    requires_proof: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    repeat_frequency: 'biweekly',
    repeat_time: '14:00:00',
    creator: 'cow'
  },

  // 6. 重复任务 - 每月
  {
    title: '家庭财务回顾',
    description: '每月回顾和整理家庭财务状况，包括收支分析和预算调整',
    deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    points: 40,
    status: 'recruiting',
    task_type: 'daily',
    repeat_type: 'repeat',
    requires_proof: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    repeat_frequency: 'monthly',
    creator: 'cat'
  },

  // 7. 进行中的任务
  {
    title: '健身房锻炼',
    description: '每周三次去健身房进行力量训练和有氧运动',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    points: 30,
    status: 'in-progress',
    task_type: 'habit',
    repeat_type: 'repeat',
    requires_proof: false,
    start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    repeat_frequency: 'weekly',
    repeat_time: '18:30:00',
    repeat_weekdays: [1, 3, 5],
    creator: 'cow',
    assignee: 'cat'
  }
];

async function createMockData() {
  console.log('🎲 开始创建模拟任务数据...\n');

  try {
    // 1. 获取用户信息
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, display_name');

    if (usersError) {
      console.error('❌ 获取用户信息失败:', usersError);
      return;
    }

    const userMap = {};
    users?.forEach(user => {
      userMap[user.display_name] = user.id;
    });

    console.log('👥 找到用户:', Object.keys(userMap).join(', '));

    // 2. 获取情侣ID
    const { data: couples, error: couplesError } = await supabase
      .from('couples')
      .select('id')
      .limit(1);

    if (couplesError || !couples?.length) {
      console.error('❌ 获取情侣信息失败:', couplesError);
      return;
    }

    const coupleId = couples[0].id;
    console.log('💑 情侣ID:', coupleId);

    // 3. 删除现有测试数据
    console.log('\n🗑️ 清理现有测试数据...');
    await supabase
      .from('tasks')
      .delete()
      .or('title.like.%测试%,title.like.%买菜%,title.like.%整理%,title.like.%浪漫%,title.like.%锻炼%,title.like.%阅读%,title.like.%清洁%,title.like.%计划%,title.like.%约会%,title.like.%财务%,title.like.%健身%');

    // 4. 插入新的模拟数据
    console.log('📝 插入新的模拟数据...\n');

    for (const [index, task] of mockTasks.entries()) {
      const taskData = {
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        points: task.points,
        status: task.status,
        creator_id: userMap[task.creator],
        assignee_id: task.assignee ? userMap[task.assignee] : null,
        couple_id: coupleId,
        task_type: task.task_type,
        repeat_type: task.repeat_type,
        requires_proof: task.requires_proof,
        task_start_time: task.task_start_time || null,
        task_end_time: task.task_end_time || null,
        start_date: task.start_date || null,
        end_date: task.end_date || null,
        repeat_frequency: task.repeat_frequency || null,
        repeat_time: task.repeat_time || null,
        repeat_weekdays: task.repeat_weekdays || null
      };

      const { error } = await supabase
        .from('tasks')
        .insert(taskData);

      if (error) {
        console.error(`❌ 插入任务 "${task.title}" 失败:`, error);
      } else {
        console.log(`✅ ${index + 1}. ${task.title}`);
        console.log(`   类型: ${task.repeat_type === 'once' ? '一次性' : '重复'}${task.repeat_frequency ? ` - ${task.repeat_frequency}` : ''}`);
        if (task.task_start_time) {
          console.log(`   时间范围: 是`);
        }
        if (task.repeat_weekdays) {
          console.log(`   星期: ${task.repeat_weekdays.join(',')}`);
        }
        console.log('');
      }
    }

    // 5. 显示创建结果
    console.log('📊 数据创建完成！统计信息:');
    
    const { data: taskStats } = await supabase
      .from('tasks')
      .select('repeat_type, task_start_time, repeat_frequency')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (taskStats) {
      const onceSimple = taskStats.filter(t => t.repeat_type === 'once' && !t.task_start_time).length;
      const onceTimeRange = taskStats.filter(t => t.repeat_type === 'once' && t.task_start_time).length;
      const repeatTasks = taskStats.filter(t => t.repeat_type === 'repeat').length;

      console.log(`- 一次性任务（简单模式）: ${onceSimple} 个`);
      console.log(`- 一次性任务（时间范围模式）: ${onceTimeRange} 个`);
      console.log(`- 重复任务: ${repeatTasks} 个`);

      const freqStats = {};
      taskStats.filter(t => t.repeat_frequency).forEach(t => {
        freqStats[t.repeat_frequency] = (freqStats[t.repeat_frequency] || 0) + 1;
      });
      console.log('重复频率分布:', freqStats);
    }

    console.log('\n🎉 模拟数据创建完成！现在可以测试新功能了。');

  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
  }
}

// 执行脚本
createMockData();
