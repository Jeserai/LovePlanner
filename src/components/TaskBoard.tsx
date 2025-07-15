import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { PlusIcon, StarIcon, GiftIcon, CheckIcon, CalendarIcon, ClockIcon, XMarkIcon, UserIcon, DocumentIcon, ListBulletIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PixelIcon from './PixelIcon';
import PointsDisplay from './PointsDisplay';

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  points: number;
  status: 'recruiting' | 'assigned' | 'in-progress' | 'completed' | 'abandoned' | 'pending_review';
  assignee?: string;
  creator: string;
  createdAt: string;
  requiresProof: boolean;
  proof?: string;
  taskType: 'daily' | 'habit' | 'special';
  repeatType: 'once' | 'repeat';
  repeatFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  duration?: '21days' | '1month' | '6months' | '1year';
  totalPoints?: number;
  reviewComment?: string;
  hasSpecificTime?: boolean;
  taskStartTime?: string;
  taskEndTime?: string;
  repeatWeekdays?: number[];
  repeatTime?: string;
  submittedAt?: string; // 提交日期
}

interface TaskBoardProps {
  currentUser?: string | null;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const [view, setView] = useState<'published' | 'assigned' | 'available'>('published');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [publishedPage, setPublishedPage] = useState<string>('active'); // 添加分页状态

  // 获取当前用户名称
  const getCurrentUserName = () => {
    if (!currentUser) return 'Whimsical Cat'; // 默认用户
    if (currentUser.toLowerCase().includes('cat')) return 'Whimsical Cat';
    if (currentUser.toLowerCase().includes('cow')) return 'Whimsical Cow';
    return 'Whimsical Cat'; // 默认用户
  };

  // 调试信息
  console.log('DEBUG: Current publishedPage state:', publishedPage);
  console.log('DEBUG: Current theme:', theme);

  // 获取对方用户名称
  const getPartnerUserName = () => {
    const currentUserName = getCurrentUserName();
    return currentUserName === 'Whimsical Cat' ? 'Whimsical Cow' : 'Whimsical Cat';
  };

  const currentUserName = getCurrentUserName();
  const partnerUserName = getPartnerUserName();

  // 模拟数据 - 按用户分开
  const [catTasks, setCatTasks] = useState<Task[]>([
    // Whimsical Cat创建的recruiting任务
    {
      id: 'cat-1',
      title: '每日拥抱',
      description: '每天至少给对方一个温暖的拥抱，传递爱与关怀',
      deadline: '2024-12-31',
      points: 8,
      status: 'recruiting',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-15',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-15',
      endDate: '2024-12-31',
      hasSpecificTime: false
    },
    {
      id: 'cat-2',
      title: '一起做饭',
      description: '每周三晚上一起下厨，享受烹饪的乐趣',
      deadline: '2024-12-31',
      points: 25,
      status: 'recruiting',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-14',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-14',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [3],
      repeatTime: '18:00'
    },
    {
      id: 'cat-3',
      title: '生日惊喜',
      description: '为对方准备一个难忘的生日惊喜派对',
      deadline: '2024-04-15',
      points: 100,
      status: 'recruiting',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-10',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'once'
    },
    {
      id: 'cat-4',
      title: '一起读书',
      description: '每天晚上一起读同一本书，分享阅读心得',
      deadline: '2024-12-31',
      points: 15,
      status: 'recruiting',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-12',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-12',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '21:00'
    },
    {
      id: 'cat-5',
      title: '周末旅行',
      description: '计划一次浪漫的周末短途旅行',
      deadline: '2024-05-30',
      points: 80,
      status: 'recruiting',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-08',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'once'
    },
    {
      id: 'cat-6',
      title: '每日运动',
      description: '每天一起运动30分钟，保持健康',
      deadline: '2024-12-31',
      points: 12,
      status: 'recruiting',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-16',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-16',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '19:00'
    },
    {
      id: 'cat-7',
      title: '学习新技能',
      description: '每周学习一项新技能，比如绘画、摄影等',
      deadline: '2024-12-31',
      points: 30,
      status: 'recruiting',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-13',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-13',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [6],
      repeatTime: '14:00'
    },
    {
      id: 'cat-8',
      title: '每月约会',
      description: '每月安排一次特别的约会活动',
      deadline: '2024-12-31',
      points: 50,
      status: 'recruiting',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-11',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'repeat',
      repeatFrequency: 'monthly',
      startDate: '2024-03-11',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '18:00'
    },
    // Whimsical Cat创建的已完成任务
    {
      id: 'cat-9',
      title: '情人节礼物',
      description: '精心准备情人节礼物和惊喜',
      deadline: '2024-02-14',
      points: 60,
      status: 'completed',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-02-01',
      requiresProof: true,
      proof: 'https://example.com/valentine.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '礼物很有创意，对方非常喜欢！',
      submittedAt: '2024-02-14T10:00:00.000Z'
    },
    {
      id: 'cat-10',
      title: '一起看星星',
      description: '找一个晴朗的夜晚一起看星星',
      deadline: '2024-03-08',
      points: 40,
      status: 'completed',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-01',
      requiresProof: true,
      proof: 'https://example.com/stars.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '星空很美，是一次浪漫的体验！',
      submittedAt: '2024-03-08T10:00:00.000Z'
    },
    {
      id: 'cat-11',
      title: '手工礼物',
      description: '亲手制作一个特别的礼物送给对方',
      deadline: '2024-03-20',
      points: 45,
      status: 'completed',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-15',
      requiresProof: true,
      proof: 'https://example.com/handmade.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '手工制作很有心意，对方很感动！',
      submittedAt: '2024-03-20T15:30:00.000Z'
    },
    // 添加一个正常的已完成任务示例
    {
      id: 'cat-22',
      title: '正常完成的任务',
      description: '这是一个正常完成的已完成任务',
      deadline: '2024-02-10',
      points: 30,
      status: 'completed',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-02-01',
      requiresProof: true,
      proof: 'https://example.com/overdue.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '任务完成得很好！',
      submittedAt: '2024-02-08T15:30:00.000Z'
    },
    // 添加另一个正常的已完成任务
    {
      id: 'cat-23',
      title: '正常完成的约会',
      description: '计划一次浪漫的约会',
      deadline: '2024-01-25',
      points: 35,
      status: 'completed',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-01-15',
      requiresProof: true,
      proof: 'https://example.com/overdue_date.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '约会很成功！',
      submittedAt: '2024-01-20T19:00:00.000Z'
    },
    // Whimsical Cat创建的进行中任务
    {
      id: 'cat-12',
      title: '学习新语言',
      description: '一起学习一门外语，每天练习30分钟',
      deadline: '2024-12-31',
      points: 50,
      status: 'in-progress',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-01',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-01',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '20:00'
    },
    {
      id: 'cat-13',
      title: '一起做早餐',
      description: '每周日早上一起准备和享用早餐',
      deadline: '2024-12-31',
      points: 15,
      status: 'in-progress',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-10',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-10',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [0],
      repeatTime: '09:00'
    },
    // 添加一个即将过期的进行中任务
    {
      id: 'cat-24',
      title: '即将过期的任务',
      description: '这是一个即将过期的进行中任务',
      deadline: '2024-01-30',
      points: 25,
      status: 'abandoned',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-01-15',
      requiresProof: true,
      taskType: 'daily',
      repeatType: 'once'
    },
    // Whimsical Cat创建的待审核任务
    {
      id: 'cat-14',
      title: '周末野餐',
      description: '准备一次浪漫的野餐约会',
      deadline: '2024-03-17',
      points: 35,
      status: 'pending_review',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-15',
      requiresProof: true,
      proof: 'https://example.com/picnic.jpg',
      taskType: 'special',
      repeatType: 'once',
      submittedAt: '2024-03-16T16:00:00.000Z'
    },
    {
      id: 'cat-15',
      title: '一起看电影',
      description: '每周五晚上一起看一部电影',
      deadline: '2024-12-31',
      points: 20,
      status: 'pending_review',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-14',
      requiresProof: true,
      proof: 'https://example.com/movie.jpg',
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-14',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [5],
      repeatTime: '20:00',
      submittedAt: '2024-03-21T20:30:00.000Z'
    },
    // Whimsical Cat创建的已放弃任务
    {
      id: 'cat-16',
      title: '早起瑜伽',
      description: '每天早上6点一起做瑜伽',
      deadline: '2024-12-31',
      points: 20,
      status: 'abandoned',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-01',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-01',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '06:00'
    },
    {
      id: 'cat-17',
      title: '学习钢琴',
      description: '一起学习弹钢琴，每周练习两次',
      deadline: '2024-12-31',
      points: 40,
      status: 'abandoned',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-05',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-05',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [2, 6],
      repeatTime: '19:00'
    },
    // Whimsical Cat创建的即将过期的任务（用于测试自动移动到abandoned）
    {
      id: 'cat-20',
      title: '过期测试任务1',
      description: '这是一个已经过期的任务，应该自动移动到abandoned状态',
      deadline: '2024-01-15',
      points: 25,
      status: 'abandoned',
      creator: 'Whimsical Cat',
      createdAt: '2024-01-01',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'once'
    },
    {
      id: 'cat-21',
      title: '过期测试任务2',
      description: '这是一个有特定时间且已过期的任务',
      deadline: '2024-01-20',
      points: 30,
      status: 'abandoned',
      creator: 'Whimsical Cat',
      createdAt: '2024-01-05',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'once',
      hasSpecificTime: true,
      taskStartTime: '2024-01-15T10:00',
      taskEndTime: '2024-01-15T12:00'
    },
    // 添加一个正常的待审核任务
    {
      id: 'cat-25',
      title: '正常待审核的任务',
      description: '这是一个正常的待审核任务',
      deadline: '2024-02-05',
      points: 30,
      status: 'pending_review',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-02-01',
      requiresProof: true,
      proof: 'https://example.com/overdue_pending.jpg',
      taskType: 'special',
      repeatType: 'once',
      submittedAt: '2024-02-03T14:00:00.000Z'
    },
    // 添加一个已领取但未开始的任务
    {
      id: 'cat-12',
      title: '已领取的任务',
      description: '这是一个已领取但还未开始的任务',
      deadline: '2024-04-15',
      points: 30,
      status: 'assigned',
      assignee: 'Whimsical Cow',
      creator: 'Whimsical Cat',
      createdAt: '2024-03-01',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'once'
    },
    // 添加一个已过期但还在recruiting状态的任务（测试自动移动到abandoned）
    {
      id: 'cat-27',
      title: '过期未领取的任务',
      description: '这是一个已过期但还没人领取的任务，应该自动变为abandoned',
      deadline: '2024-01-15',
      points: 25,
      status: 'abandoned',
      creator: 'Whimsical Cat',
      createdAt: '2024-01-01',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'once'
    },
  ]);

  const [cowTasks, setCowTasks] = useState<Task[]>([
    // Whimsical Cow创建的recruiting任务
    {
      id: 'cow-1',
      title: '每日早安吻',
      description: '每天早上起床后给对方一个早安吻，开启美好的一天',
      deadline: '2024-12-31',
      points: 5,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-15',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '08:00'
    },
    {
      id: 'cow-2',
      title: '周末约会',
      description: '每周六下午一起去看电影或共进晚餐',
      deadline: '2024-12-31',
      points: 20,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-15',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [6],
      repeatTime: '14:00'
    },
    {
      id: 'cow-3',
      title: '健身打卡',
      description: '每周一三五晚上一起去健身房锻炼',
      deadline: '2024-12-31',
      points: 15,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-15',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [1, 3, 5],
      repeatTime: '19:00'
    },
    {
      id: 'cow-4',
      title: '每月纪念日',
      description: '每月15号庆祝我们的纪念日',
      deadline: '2024-12-31',
      points: 30,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'repeat',
      repeatFrequency: 'monthly',
      startDate: '2024-03-15',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '18:00'
    },
    {
      id: 'cow-5',
      title: '睡前故事',
      description: '每天晚上睡前给对方讲一个故事',
      deadline: '2024-12-31',
      points: 10,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-15',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '22:00'
    },
    {
      id: 'cow-6',
      title: '一起做饭',
      description: '每周二四晚上一起下厨，享受烹饪的乐趣',
      deadline: '2024-12-31',
      points: 25,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-16',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-16',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [2, 4],
      repeatTime: '18:00'
    },
    {
      id: 'cow-7',
      title: '学习摄影',
      description: '一起学习摄影技巧，记录美好时光',
      deadline: '2024-12-31',
      points: 35,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-14',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-14',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [6],
      repeatTime: '15:00'
    },
    {
      id: 'cow-8',
      title: '一起做手工',
      description: '每周日一起做手工，比如编织、陶艺等',
      deadline: '2024-12-31',
      points: 20,
      status: 'recruiting',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-13',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-13',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [0],
      repeatTime: '14:00'
    },
    // Whimsical Cow创建的已完成任务
    {
      id: 'cow-9',
      title: '情人节惊喜',
      description: '准备一个浪漫的情人节惊喜',
      deadline: '2024-02-14',
      points: 50,
      status: 'completed',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-02-01',
      requiresProof: true,
      proof: 'https://example.com/proof.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '非常用心的准备，对方很感动！',
      submittedAt: '2024-02-14T10:00:00.000Z'
    },
    {
      id: 'cow-10',
      title: '一起看日出',
      description: '早起一起去海边看日出',
      deadline: '2024-03-10',
      points: 30,
      status: 'completed',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-01',
      requiresProof: true,
      proof: 'https://example.com/sunrise.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '景色很美，是一次难忘的经历！',
      submittedAt: '2024-03-10T06:30:00.000Z'
    },
    {
      id: 'cow-11',
      title: '一起看星星',
      description: '找一个晴朗的夜晚一起看星星',
      deadline: '2024-03-08',
      points: 40,
      status: 'completed',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-01',
      requiresProof: true,
      proof: 'https://example.com/stars.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '星空很美，是一次浪漫的体验！',
      submittedAt: '2024-03-08T10:00:00.000Z'
    },
    {
      id: 'cow-12',
      title: '手工礼物',
      description: '亲手制作一个特别的礼物送给对方',
      deadline: '2024-03-20',
      points: 45,
      status: 'completed',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: true,
      proof: 'https://example.com/handmade.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '手工制作很有心意，对方很感动！',
      submittedAt: '2024-03-20T14:00:00.000Z'
    },
    // 添加一个正常的已完成任务示例
    {
      id: 'cow-25',
      title: '正常完成的约会',
      description: '计划一次浪漫的约会',
      deadline: '2024-01-20',
      points: 40,
      status: 'completed',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-01-10',
      requiresProof: true,
      proof: 'https://example.com/overdue_cow.jpg',
      taskType: 'special',
      repeatType: 'once',
      reviewComment: '约会很成功！',
      submittedAt: '2024-01-18T18:00:00.000Z'
    },
    // Whimsical Cow创建的进行中任务
    {
      id: 'cow-13',
      title: '学习新技能',
      description: '每周二四晚上一起学习一项新技能',
      deadline: '2024-12-31',
      points: 25,
      status: 'in-progress',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-12',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-12',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [2, 4],
      repeatTime: '20:00'
    },
    {
      id: 'cow-14',
      title: '一起做早餐',
      description: '每周日早上一起准备和享用早餐',
      deadline: '2024-12-31',
      points: 15,
      status: 'in-progress',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-10',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-10',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [0],
      repeatTime: '09:00'
    },
    {
      id: 'cow-15',
      title: '一起读书',
      description: '每天晚上一起读同一本书，分享阅读心得',
      deadline: '2024-12-31',
      points: 15,
      status: 'in-progress',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-12',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-12',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '21:00'
    },
    // Whimsical Cow创建的待审核任务
    {
      id: 'cow-16',
      title: '周末野餐',
      description: '准备一次浪漫的野餐约会',
      deadline: '2024-03-17',
      points: 35,
      status: 'pending_review',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: true,
      proof: 'https://example.com/picnic.jpg',
      taskType: 'special',
      repeatType: 'once',
      submittedAt: '2024-03-16T17:30:00.000Z'
    },
    {
      id: 'cow-17',
      title: '一起看电影',
      description: '每周五晚上一起看一部电影',
      deadline: '2024-12-31',
      points: 20,
      status: 'pending_review',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-14',
      requiresProof: true,
      proof: 'https://example.com/movie.jpg',
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-14',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [5],
      repeatTime: '20:00',
      submittedAt: '2024-03-20T21:00:00.000Z'
    },
    // Whimsical Cow创建的已放弃任务
    {
      id: 'cow-18',
      title: '早起晨跑',
      description: '每天早上6点一起晨跑',
      deadline: '2024-12-31',
      points: 20,
      status: 'abandoned',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-01',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-01',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '06:00'
    },
    {
      id: 'cow-19',
      title: '学习钢琴',
      description: '一起学习弹钢琴，每周练习两次',
      deadline: '2024-12-31',
      points: 40,
      status: 'abandoned',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-05',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-05',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [2, 6],
      repeatTime: '19:00'
    },
    // Whimsical Cow创建的即将过期的任务（用于测试自动移动到abandoned）
    {
      id: 'cow-22',
      title: '过期测试任务3',
      description: '这是一个已经过期的任务，应该自动移动到abandoned状态',
      deadline: '2024-01-10',
      points: 20,
      status: 'abandoned',
      creator: 'Whimsical Cow',
      createdAt: '2024-01-01',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'once'
    },
    {
      id: 'cow-23',
      title: '过期测试任务4',
      description: '这是一个有特定时间且已过期的任务',
      deadline: '2024-01-25',
      points: 35,
      status: 'abandoned',
      creator: 'Whimsical Cow',
      createdAt: '2024-01-05',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'once',
      hasSpecificTime: true,
      taskStartTime: '2024-01-20T14:00',
      taskEndTime: '2024-01-20T16:00'
    },
    // 添加一个正常的待审核任务示例
    {
      id: 'cow-24',
      title: '正常待审核的任务',
      description: '这是一个正常的待审核任务',
      deadline: '2024-02-08',
      points: 25,
      status: 'pending_review',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-02-01',
      requiresProof: true,
      proof: 'https://example.com/overdue_review.jpg',
      taskType: 'special',
      repeatType: 'once',
      submittedAt: '2024-02-06T16:00:00.000Z'
    },
    {
      id: 'cow-26',
      title: '学习新技能',
      description: '每周二四晚上一起学习一项新技能',
      deadline: '2024-12-31',
      points: 25,
      status: 'in-progress',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-12',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-12',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [2, 4],
      repeatTime: '20:00'
    },
    {
      id: 'cow-27',
      title: '一起做早餐',
      description: '每周日早上一起准备和享用早餐',
      deadline: '2024-12-31',
      points: 15,
      status: 'in-progress',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-10',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-10',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [0],
      repeatTime: '09:00'
    },
    {
      id: 'cow-28',
      title: '一起读书',
      description: '每天晚上一起读同一本书，分享阅读心得',
      deadline: '2024-12-31',
      points: 15,
      status: 'in-progress',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-12',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-12',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '21:00'
    },
    {
      id: 'cow-29',
      title: '周末旅行',
      description: '计划一次浪漫的周末短途旅行',
      deadline: '2024-05-30',
      points: 80,
      status: 'in-progress',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-08',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'once'
    },
    {
      id: 'cow-30',
      title: '每日运动',
      description: '每天一起运动30分钟，保持健康',
      deadline: '2024-12-31',
      points: 12,
      status: 'in-progress',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-16',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'daily',
      startDate: '2024-03-16',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '19:00'
    },
    {
      id: 'cow-31',
      title: '学习新技能',
      description: '每周学习一项新技能，比如绘画、摄影等',
      deadline: '2024-12-31',
      points: 30,
      status: 'in-progress',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-13',
      requiresProof: true,
      taskType: 'habit',
      repeatType: 'repeat',
      repeatFrequency: 'weekly',
      startDate: '2024-03-13',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatWeekdays: [6],
      repeatTime: '14:00'
    },
    {
      id: 'cow-32',
      title: '每月约会',
      description: '每月安排一次特别的约会活动',
      deadline: '2024-12-31',
      points: 50,
      status: 'in-progress',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-11',
      requiresProof: true,
      taskType: 'special',
      repeatType: 'repeat',
      repeatFrequency: 'monthly',
      startDate: '2024-03-11',
      endDate: '2024-12-31',
      hasSpecificTime: true,
      repeatTime: '18:00'
    },
    // 添加一个即将过期的进行中任务
    {
      id: 'cow-33',
      title: '即将过期的任务',
      description: '这是一个即将过期的进行中任务',
      deadline: '2024-01-25',
      points: 30,
      status: 'abandoned',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-01-10',
      requiresProof: true,
      taskType: 'daily',
      repeatType: 'once'
    },
    // Whimsical Cow创建的待审核任务
    {
      id: 'cow-34',
      title: '待审核任务',
      description: '这是一个待审核的任务',
      deadline: '2024-03-17',
      points: 35,
      status: 'pending_review',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-15',
      requiresProof: true,
      proof: 'https://example.com/pending_review.jpg',
      taskType: 'special',
      repeatType: 'once',
      submittedAt: '2024-03-16T17:30:00.000Z'
    },
    // 添加一个正常的待审核任务
    {
      id: 'cow-35',
      title: '正常待审核的任务',
      description: '这是一个正常的待审核任务',
      deadline: '2024-02-08',
      points: 25,
      status: 'pending_review',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-02-01',
      requiresProof: true,
      proof: 'https://example.com/overdue_pending_cow.jpg',
      taskType: 'special',
      repeatType: 'once',
      submittedAt: '2024-02-06T16:00:00.000Z'
    },
    // 添加一个已领取但未开始的任务
    {
      id: 'cow-12',
      title: '已领取的任务',
      description: '这是一个已领取但还未开始的任务',
      deadline: '2024-04-20',
      points: 35,
      status: 'assigned',
      assignee: 'Whimsical Cat',
      creator: 'Whimsical Cow',
      createdAt: '2024-03-01',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'once'
    },
    // 添加一个已过期但还在recruiting状态的任务（测试自动移动到abandoned）
    {
      id: 'cow-36',
      title: '过期未领取的任务',
      description: '这是一个已过期但还没人领取的任务，应该自动变为abandoned',
      deadline: '2024-01-10',
      points: 20,
      status: 'abandoned',
      creator: 'Whimsical Cow',
      createdAt: '2024-01-01',
      requiresProof: false,
      taskType: 'daily',
      repeatType: 'once'
    }
  ]);

  // 合并所有任务数据
  const [tasks, setTasks] = useState<Task[]>([]);

  // 当catTasks或cowTasks更新时，合并数据
  useEffect(() => {
    setTasks([...catTasks, ...cowTasks]);
  }, [catTasks, cowTasks]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    points: 50,
    taskType: 'daily' as 'daily' | 'habit' | 'special',
    repeatType: 'once' as 'once' | 'repeat',
    deadline: '',
    requiresProof: false,
    repeatFrequency: 'daily' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
    startDate: '',
    endDate: '',
    duration: '21days' as '21days' | '1month' | '6months' | '1year',
    hasSpecificTime: false,
    taskStartTime: '',
    taskEndTime: '',
    repeatWeekdays: [] as number[],
    repeatTime: ''
  });

  const [userPoints, setUserPoints] = useState({ me: 230, partner: 180 });

  // 计算重复任务的结束日期
  const calculateEndDate = (startDate: string, duration: string) => {
    const start = new Date(startDate);
    const end = new Date(start);
    
    switch (duration) {
      case '21days':
        end.setDate(end.getDate() + 21);
        break;
      case '1month':
        end.setMonth(end.getMonth() + 1);
        break;
      case '6months':
        end.setMonth(end.getMonth() + 6);
        break;
      case '1year':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }
    
    return end.toISOString().split('T')[0];
  };

  // 计算重复任务的次数和总积分
  const calculateTaskCount = (startDate: string, endDate: string, frequency: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    
    switch (frequency) {
      case 'daily':
        count = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        break;
      case 'weekly':
        count = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        break;
      case 'biweekly':
        count = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 14));
        break;
      case 'monthly':
        count = (end.getFullYear() - start.getFullYear()) * 12 + 
                (end.getMonth() - start.getMonth());
        break;
      case 'yearly':
        count = end.getFullYear() - start.getFullYear();
        break;
    }
    
    return count;
  };

  // 检查任务是否在可完成时间范围内
  const isTaskInTimeRange = (task: Task) => {
    if (!task.hasSpecificTime) return true;
    
    const now = new Date();
    const startTime = new Date(task.taskStartTime || '');
    const endTime = new Date(task.taskEndTime || '');
    
    return now >= startTime && now <= endTime;
  };

  // 获取任务时间状态
  const getTaskTimeStatus = (task: Task) => {
    // 已完成和待审核的任务不应该有过期的情况
    if (task.status === 'completed' || task.status === 'pending_review') {
      return 'upcoming'; // 这些任务不会过期
    }
    
    if (!task.hasSpecificTime) {
      const deadline = new Date(task.deadline);
      const now = new Date();
      if (now > deadline) return 'overdue';
      if (now.toDateString() === deadline.toDateString()) return 'today';
      return 'upcoming';
    }

    const now = new Date();
    const startTime = new Date(task.taskStartTime || '');
    const endTime = new Date(task.taskEndTime || '');

    if (now < startTime) return 'not_started';
    if (now > endTime) return 'expired';
    return 'in_time_range';
  };

  // 渲染任务时间状态
  const renderTaskTimeStatus = (task: Task) => {
    const status = getTaskTimeStatus(task);
    
    if (task.hasSpecificTime) {
      switch (status) {
        case 'not_started':
          return (
            <div className={`text-sm ${
              theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
            }`}>
              {theme === 'pixel' ? 'STARTS_AT' : '开始时间'}: {formatDateTimeWithTimezone(task.taskStartTime || '')}
            </div>
          );
        case 'expired':
          return (
            <div className={`text-sm ${
              theme === 'pixel' ? 'text-pixel-accent font-mono' : 'text-red-500'
            }`}>
              {theme === 'pixel' ? 'TIME_EXPIRED' : '已超出时间范围'}
            </div>
          );
        case 'in_time_range':
          return null; // 不显示"在时间范围内"状态
      }
    } else {
      switch (status) {
        case 'overdue':
          return (
            <div className={`text-sm ${
              theme === 'pixel' ? 'text-pixel-accent font-mono' : 'text-red-500'
            }`}>
              {theme === 'pixel' ? 'OVERDUE' : '已过期'}
            </div>
          );
        case 'today':
          return (
            <div className={`text-sm ${
              theme === 'pixel' ? 'text-pixel-warning font-mono' : 'text-orange-500'
            }`}>
              {theme === 'pixel' ? 'DUE_TODAY' : '今天到期'}
            </div>
          );
        case 'upcoming':
          return null; // 不显示"截止时间"字段
      }
    }
    return null;
  };

  // 格式化日期时间
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 获取用户时区
  const getUserTimezone = () => {
    // 根据用户名称判断时区
    const currentUserName = getCurrentUserName();
    if (currentUserName === 'Whimsical Cat') {
      return 'Asia/Shanghai'; // 上海时区
    } else if (currentUserName === 'Whimsical Cow') {
      return 'America/New_York'; // 匹兹堡使用纽约时区（EST/EDT）
    }
    return 'Asia/Shanghai'; // 默认上海时区
  };

  // 将本地时间转换为UTC存储
  const convertToUTC = (localDateTime: string, timezone: string) => {
    // 创建本地时间对象
    const localDate = new Date(localDateTime);
    // 转换为UTC
    const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
    return utcDate.toISOString();
  };

  // 将UTC时间转换为用户时区显示
  const convertFromUTC = (utcDateTime: string, targetTimezone: string) => {
    const utcDate = new Date(utcDateTime);
    return new Date(utcDate.toLocaleString('en-US', { timeZone: targetTimezone }));
  };

  // 格式化日期（支持时区）
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezone = getUserTimezone();
    
    // 转换为用户时区的日期
    const userDate = convertFromUTC(dateString, userTimezone);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 获取用户时区的今天和明天
    const userToday = new Date(today.toLocaleString('en-US', { timeZone: userTimezone }));
    const userTomorrow = new Date(tomorrow.toLocaleString('en-US', { timeZone: userTimezone }));

    // 比较日期字符串（YYYY-MM-DD格式）
    const userDateStr = userDate.toISOString().split('T')[0];
    const userTodayStr = userToday.toISOString().split('T')[0];
    const userTomorrowStr = userTomorrow.toISOString().split('T')[0];

    if (userDateStr === userTodayStr) {
      return '今天';
    } else if (userDateStr === userTomorrowStr) {
      return '明天';
    } else {
      return `${userDate.getMonth() + 1}月${userDate.getDate()}日`;
    }
  };

  // 格式化日期时间（支持时区）
  const formatDateTimeWithTimezone = (dateTimeString: string) => {
    const userTimezone = getUserTimezone();
    const userDate = convertFromUTC(dateTimeString, userTimezone);
    
    return `${userDate.getMonth() + 1}月${userDate.getDate()}日 ${userDate.getHours().toString().padStart(2, '0')}:${userDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // 更新任务表单中的时间选择部分
  const renderTaskTimeFields = () => {
    if (newTask.repeatType === 'once') {
      return (
        <>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'SPECIFIC_TIME' : '是否指定时间'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newTask.hasSpecificTime}
                onChange={(e) => {
                  const hasSpecificTime = e.target.checked;
                  if (hasSpecificTime && newTask.taskStartTime && !newTask.taskEndTime) {
                    // 如果开启指定时间且有开始时间但没有结束时间，设置默认24小时后
                    const startTime = new Date(newTask.taskStartTime);
                    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
                    setNewTask({
                      ...newTask,
                      hasSpecificTime,
                      taskEndTime: endTime.toISOString().slice(0, 16)
                    });
                  } else {
                    setNewTask({...newTask, hasSpecificTime});
                  }
                }}
                className={`w-4 h-4 ${
                  theme === 'pixel' ? 'pixel-checkbox' : 'rounded text-primary-500'
                }`}
              />
              <span className={theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-600'}>
                {theme === 'pixel' ? 'TASK_HAS_SPECIFIC_TIME' : '任务需要在特定时间范围内完成'}
              </span>
            </div>
          </div>

          {newTask.hasSpecificTime ? (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'START_TIME *' : '开始时间 *'}
                </label>
                <input
                  type="datetime-local"
                  value={newTask.taskStartTime}
                  onChange={(e) => {
                    const startTime = e.target.value;
                    // 如果结束时间未设置，自动设置为24小时后
                    if (!newTask.taskEndTime) {
                      const start = new Date(startTime);
                      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                      setNewTask({
                        ...newTask,
                        taskStartTime: startTime,
                        taskEndTime: end.toISOString().slice(0, 16)
                      });
                    } else {
                      setNewTask({...newTask, taskStartTime: startTime});
                    }
                  }}
                  className={`w-full ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'END_TIME' : '结束时间'}
                </label>
                <input
                  type="datetime-local"
                  value={newTask.taskEndTime}
                  onChange={(e) => setNewTask({...newTask, taskEndTime: e.target.value})}
                  className={`w-full ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                  min={newTask.taskStartTime || new Date().toISOString().slice(0, 16)}
                />
                <p className={`text-xs mt-1 ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono' 
                    : 'text-gray-500'
                }`}>
                  {theme === 'pixel' 
                    ? 'OPTIONAL: DEFAULT_24_HOURS_AFTER_START' 
                    : '可选：默认开始时间后24小时'}
                </p>
              </div>
            </>
          ) : (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'pixel' 
                  ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                  : 'text-gray-700'
              }`}>
                {theme === 'pixel' ? 'DEADLINE *' : '截止日期 *'}
              </label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                className={`w-full ${
                  theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </>
      );
    } else {
      return (
        <>
          {/* 是否指定时间 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'SPECIFIC_TIME' : '是否指定时间'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newTask.hasSpecificTime}
                onChange={(e) => setNewTask({...newTask, hasSpecificTime: e.target.checked})}
                className={`w-4 h-4 ${
                  theme === 'pixel' ? 'pixel-checkbox' : 'rounded text-primary-500'
                }`}
              />
              <span className={theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-600'}>
                {theme === 'pixel' ? 'TASK_HAS_SPECIFIC_TIME' : '任务需要在特定时间完成'}
              </span>
            </div>
          </div>

          {/* 重复时间设置（紧跟在是否指定时间后面） */}
          {newTask.hasSpecificTime && (
            <div className="mt-2">
              <div className="mb-4">
                <p className={`text-sm mb-2 ${
                  theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-600'
                }`}>
                  {theme === 'pixel' ? 'SELECT_WEEKDAYS *' : '选择每周重复的日期 *'}
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { value: 0, label: theme === 'pixel' ? 'SUN' : '日' },
                    { value: 1, label: theme === 'pixel' ? 'MON' : '一' },
                    { value: 2, label: theme === 'pixel' ? 'TUE' : '二' },
                    { value: 3, label: theme === 'pixel' ? 'WED' : '三' },
                    { value: 4, label: theme === 'pixel' ? 'THU' : '四' },
                    { value: 5, label: theme === 'pixel' ? 'FRI' : '五' },
                    { value: 6, label: theme === 'pixel' ? 'SAT' : '六' }
                  ].map(day => (
                    <button
                      key={day.value}
                      onClick={() => {
                        const weekdays = newTask.repeatWeekdays || [];
                        const newWeekdays = weekdays.includes(day.value)
                          ? weekdays.filter(d => d !== day.value)
                          : [...weekdays, day.value].sort();
                        setNewTask({...newTask, repeatWeekdays: newWeekdays});
                      }}
                      className={`py-2 px-3 text-sm transition-all duration-300 ${
                        theme === 'pixel' 
                          ? `rounded-pixel border-2 font-mono uppercase ${
                              newTask.repeatWeekdays?.includes(day.value)
                                ? 'bg-pixel-accent text-black border-white shadow-pixel neon-border'
                                : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                            }`
                          : `rounded-xl border-2 ${
                              newTask.repeatWeekdays?.includes(day.value)
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className={`text-sm mb-2 ${
                  theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-600'
                }`}>
                  {theme === 'pixel' ? 'SELECT_TIME' : '选择时间'}
                </p>
                <input
                  type="time"
                  value={newTask.repeatTime}
                  onChange={(e) => setNewTask({...newTask, repeatTime: e.target.value})}
                  className={`w-full ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                  step="60"
                />
                <p className={`text-xs mt-1 ${
                  theme === 'pixel' 
                    ? 'text-pixel-textMuted font-mono' 
                    : 'text-gray-500'
                }`}>
                  {theme === 'pixel' 
                    ? 'OPTIONAL: IF_NOT_SET_TASK_CAN_BE_COMPLETED_ANYTIME' 
                    : '可选：如不设置，任务可在当天任意时间完成'}
                </p>
              </div>
            </div>
          )}

          {/* 重复频率 */}
          <div className="mt-4">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'REPEAT_FREQUENCY *' : '重复频率 *'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'daily', label: theme === 'pixel' ? 'DAILY' : '每天' },
                { value: 'weekly', label: theme === 'pixel' ? 'WEEKLY' : '每周' },
                { value: 'biweekly', label: theme === 'pixel' ? 'BIWEEKLY' : '每两周' },
                { value: 'monthly', label: theme === 'pixel' ? 'MONTHLY' : '每月' },
                { value: 'yearly', label: theme === 'pixel' ? 'YEARLY' : '每年' }
              ].map(freq => (
                <button
                  key={freq.value}
                  onClick={() => setNewTask({...newTask, repeatFrequency: freq.value as any})}
                  className={`py-2 px-3 text-sm transition-all duration-300 ${
                    theme === 'pixel' 
                      ? `rounded-pixel border-2 font-mono uppercase ${
                          newTask.repeatFrequency === freq.value
                            ? 'bg-pixel-accent text-black border-white shadow-pixel neon-border'
                            : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                        }`
                      : `rounded-xl border-2 ${
                          newTask.repeatFrequency === freq.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          {/* 开始日期 */}
          <div className="mt-4">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'START_DATE *' : '开始日期 *'}
            </label>
            <input
              type="date"
              value={newTask.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                setNewTask({
                  ...newTask,
                  startDate,
                  endDate: newTask.duration ? calculateEndDate(startDate, newTask.duration) : ''
                });
              }}
              className={`w-full ${
                theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
              }`}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* 持续时间 */}
          <div className="mt-4">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'DURATION' : '持续时间'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: '21days', label: theme === 'pixel' ? '21_DAYS' : '21天' },
                { value: '1month', label: theme === 'pixel' ? '1_MONTH' : '1个月' },
                { value: '6months', label: theme === 'pixel' ? '6_MONTHS' : '6个月' },
                { value: '1year', label: theme === 'pixel' ? '1_YEAR' : '1年' }
              ].map(duration => (
                <button
                  key={duration.value}
                  onClick={() => {
                    const newDuration = duration.value as any;
                    setNewTask({
                      ...newTask,
                      duration: newDuration,
                      endDate: newTask.startDate ? calculateEndDate(newTask.startDate, newDuration) : ''
                    });
                  }}
                  className={`py-2 px-3 text-sm transition-all duration-300 ${
                    theme === 'pixel' 
                      ? `rounded-pixel border-2 font-mono uppercase ${
                          newTask.duration === duration.value
                            ? 'bg-pixel-accent text-black border-white shadow-pixel neon-border'
                            : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                        }`
                      : `rounded-xl border-2 ${
                          newTask.duration === duration.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`
                  }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>

          {/* 结束日期（自动计算，可选修改） */}
          <div className="mt-4">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'END_DATE' : '结束日期'}
            </label>
            <input
              type="date"
              value={newTask.endDate}
              onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
              className={`w-full ${
                theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
              }`}
              min={newTask.startDate}
            />
            <p className={`text-xs mt-1 ${
              theme === 'pixel' 
                ? 'text-pixel-textMuted font-mono' 
                : 'text-gray-500'
            }`}>
              {theme === 'pixel' 
                ? 'OPTIONAL: SYSTEM_CALCULATED_BASED_ON_DURATION' 
                : '可选：系统根据持续时间自动计算'}
            </p>
          </div>

          {/* 每次任务积分 */}
          <div className="mt-4">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'pixel' 
                ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                : 'text-gray-700'
            }`}>
              {theme === 'pixel' ? 'POINTS_PER_TASK *' : '每次任务积分 *'}
            </label>
            <input
              type="number"
              value={newTask.points}
              onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
              className={`w-full ${
                theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
              }`}
              min="10"
              max="200"
            />
            {newTask.startDate && newTask.endDate && (
              <p className={`text-xs mt-1 ${
                theme === 'pixel' 
                  ? 'text-pixel-textMuted font-mono' 
                  : 'text-gray-500'
              }`}>
                {theme === 'pixel' 
                  ? `TOTAL_POINTS: ${newTask.points * calculateTaskCount(newTask.startDate, newTask.endDate, newTask.repeatFrequency)}` 
                  : `总积分：${newTask.points * calculateTaskCount(newTask.startDate, newTask.endDate, newTask.repeatFrequency)}`}
              </p>
            )}
          </div>
        </>
      );
    }
  };

  // 更新任务创建逻辑
  const handleAddTask = () => {
    if (newTask.title && (
      newTask.repeatType === 'once' 
        ? (newTask.hasSpecificTime ? newTask.taskStartTime : newTask.deadline)
        : (newTask.startDate && 
           (!newTask.hasSpecificTime || 
            (newTask.repeatFrequency === 'weekly' ? newTask.repeatWeekdays?.length > 0 : true)))
    )) {
      // 获取当前用户的时区
      const userTimezone = getUserTimezone();
      
      // 转换时间为UTC存储
      const utcDeadline = newTask.repeatType === 'once' && !newTask.hasSpecificTime 
        ? convertToUTC(newTask.deadline + 'T00:00:00', userTimezone)
        : '';
      
      const utcTaskStartTime = newTask.repeatType === 'once' && newTask.taskStartTime
        ? convertToUTC(newTask.taskStartTime, userTimezone)
        : undefined;
        
      const utcTaskEndTime = newTask.repeatType === 'once' && newTask.taskEndTime
        ? convertToUTC(newTask.taskEndTime, userTimezone)
        : undefined;

      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        points: newTask.points,
        status: 'recruiting',
        creator: currentUserName, // 使用当前用户名称
        createdAt: new Date().toISOString().split('T')[0],
        deadline: newTask.repeatType === 'once' && !newTask.hasSpecificTime ? newTask.deadline : '',
        requiresProof: newTask.requiresProof,
        taskType: newTask.taskType,
        repeatType: newTask.repeatType,
        repeatFrequency: newTask.repeatType === 'repeat' ? newTask.repeatFrequency : undefined,
        startDate: newTask.repeatType === 'repeat' ? newTask.startDate : undefined,
        endDate: newTask.repeatType === 'repeat' ? newTask.endDate : undefined,
        duration: newTask.repeatType === 'repeat' ? newTask.duration : undefined,
        totalPoints: newTask.repeatType === 'repeat' ? 
          newTask.points * calculateTaskCount(
            newTask.startDate,
            newTask.endDate || calculateEndDate(newTask.startDate, newTask.duration),
            newTask.repeatFrequency
          ) : undefined,
        hasSpecificTime: newTask.hasSpecificTime,
        taskStartTime: newTask.repeatType === 'once' ? utcTaskStartTime : undefined,
        taskEndTime: newTask.repeatType === 'once' ? (utcTaskEndTime || (() => {
          if (utcTaskStartTime) {
            const start = new Date(utcTaskStartTime);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
            return end.toISOString();
          }
          return undefined;
        })()) : undefined,
        repeatWeekdays: newTask.repeatType === 'repeat' && newTask.hasSpecificTime ? newTask.repeatWeekdays : undefined,
        repeatTime: newTask.repeatType === 'repeat' && newTask.hasSpecificTime ? newTask.repeatTime : undefined,
        submittedAt: new Date().toISOString() // 添加提交日期
      };
      
      // 将新任务添加到对应的任务数组中
      if (currentUserName === 'Whimsical Cat') {
        setCatTasks([...catTasks, task]);
      } else {
        setCowTasks([...cowTasks, task]);
      }
      
      setNewTask({
        title: '',
        description: '',
        points: 50,
        taskType: 'daily',
        repeatType: 'once',
        deadline: '',
        requiresProof: false,
        repeatFrequency: 'daily',
        startDate: '',
        endDate: '',
        duration: '21days',
        hasSpecificTime: false,
        taskStartTime: '',
        taskEndTime: '',
        repeatWeekdays: [],
        repeatTime: ''
      });
      setShowAddForm(false);
    }
  };

  // 获取重复类型名称
  const getRepeatTypeName = (task: Task) => {
    if (task.repeatType === 'once') {
      return theme === 'pixel' ? 'ONE_TIME' : '一次性';
    }
    
    if (task.repeatFrequency === 'daily') {
      return theme === 'pixel' ? 'DAILY' : '每日';
    } else if (task.repeatFrequency === 'weekly') {
      return theme === 'pixel' ? 'WEEKLY' : '每周';
    } else if (task.repeatFrequency === 'monthly') {
      return theme === 'pixel' ? 'MONTHLY' : '每月';
    } else if (task.repeatFrequency === 'yearly') {
      return theme === 'pixel' ? 'YEARLY' : '每年';
    }
    
    return theme === 'pixel' ? 'REPEAT' : '重复';
  };

  // 更新任务卡片渲染
  const renderTaskCard = (task: Task) => {
    const isExpiringSoon = !task.hasSpecificTime && isTaskExpiringSoon(task.deadline);
    const isOverdue = isTaskOverdue(task);
    const isSubmissionLate = isTaskSubmissionLate(task);
    const timeStatus = renderTaskTimeStatus(task);
    
    return (
      <div 
        onClick={() => setSelectedTask(task)}
        className={`p-4 mb-4 cursor-pointer transition-all duration-300 ${
          theme === 'pixel' 
            ? 'bg-pixel-card border-2 border-pixel-border rounded-pixel shadow-pixel hover:shadow-pixel-lg hover:border-pixel-accent'
            : 'bg-white rounded-xl shadow-soft hover:shadow-lg hover:border-primary-300'
        } ${isExpiringSoon ? 'border-yellow-500' : ''} ${isOverdue ? 'border-red-500 opacity-75' : ''}`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className={`font-bold ${
            theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
          }`}>
            {task.title}
          </h4>
          <div className="flex flex-col items-end space-y-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              theme === 'pixel'
                ? `font-mono uppercase ${getCategoryColor(task.taskType)}`
                : `text-white ${getCategoryColor(task.taskType)}`
            }`}>
              {getCategoryName(task.taskType)}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              theme === 'pixel'
                ? 'bg-pixel-purple text-pixel-text font-mono uppercase'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {getRepeatTypeName(task)}
            </span>
            {isOverdue && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                theme === 'pixel'
                  ? 'bg-pixel-accent text-black font-mono uppercase'
                  : 'bg-red-100 text-red-800'
              }`}>
                {theme === 'pixel' ? 'OVERDUE' : '已过期'}
              </span>
            )}
            {isSubmissionLate && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                theme === 'pixel'
                  ? 'bg-pixel-accent text-black font-mono uppercase'
                  : 'bg-red-100 text-red-800'
              }`}>
                {theme === 'pixel' ? 'LATE_SUBMISSION' : '逾期提交'}
              </span>
            )}
          </div>
        </div>

        <p className={`text-sm mb-3 ${
          theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-600'
        }`}>
          {task.description}
        </p>

        <div className="space-y-2">
          {timeStatus}
          
          {/* 任务时间信息 */}
          <div className={`flex items-center space-x-4 text-sm ${
            theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-500'
          }`}>
            {task.hasSpecificTime ? (
              <>
                <div className="flex items-center space-x-1">
                  {theme === 'pixel' ? (
                    <PixelIcon name="calendar" size="sm" />
                  ) : (
                    <CalendarIcon className="w-4 h-4" />
                  )}
                  <span>
                    {task.repeatType === 'repeat' 
                      ? (task.repeatFrequency === 'weekly' && task.repeatWeekdays
                        ? `${task.repeatWeekdays.map(d => ['日', '一', '二', '三', '四', '五', '六'][d]).join('、')}`
                        : getCategoryName(task.repeatFrequency || ''))
                      : formatDate(task.deadline)}
                  </span>
                </div>
                {task.repeatTime && (
                  <div className="flex items-center space-x-1">
                    {theme === 'pixel' ? (
                      <PixelIcon name="clock" size="sm" />
                    ) : (
                      <ClockIcon className="w-4 h-4" />
                    )}
                    <span>{task.repeatTime}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-1">
                {theme === 'pixel' ? (
                  <PixelIcon name="calendar" size="sm" />
                ) : (
                  <CalendarIcon className="w-4 h-4" />
                )}
                <span>{formatDate(task.deadline)}</span>
              </div>
            )}
            {/* 显示提交日期 */}
            {(task.status === 'completed' || task.status === 'pending_review') && task.submittedAt && (
              <div className="flex items-center space-x-1">
                {theme === 'pixel' ? (
                  <PixelIcon name="check" size="sm" />
                ) : (
                  <CheckIcon className="w-4 h-4" />
                )}
                <span className={`text-xs ${
                  isSubmissionLate 
                    ? (theme === 'pixel' ? 'text-pixel-accent font-mono' : 'text-red-600')
                    : (theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500')
                }`}>
                  {theme === 'pixel' ? 'SUBMITTED' : '已提交'}: {formatDateTimeWithTimezone(task.submittedAt)}
                  {isSubmissionLate && (
                    <span className="ml-1">
                      {theme === 'pixel' ? '(LATE)' : '(逾期)'}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* 积分信息 */}
          <div className={`flex items-center justify-between text-sm ${
            theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-500'
          }`}>
            <div className="flex items-center space-x-2">
              {theme === 'pixel' ? (
                <PixelIcon name="star" size="sm" className="text-pixel-accent" />
              ) : (
                <StarIcon className="w-4 h-4 text-yellow-500" />
              )}
              <span>{task.points}</span>
            </div>
            {task.requiresProof && (
              <div className={`flex items-center space-x-1 ${
                theme === 'pixel' ? 'text-pixel-warning' : 'text-orange-500'
              }`}>
                {theme === 'pixel' ? (
                  <PixelIcon name="document" size="sm" />
                ) : (
                  <DocumentIcon className="w-4 h-4" />
                )}
                <span className="text-xs">
                  {theme === 'pixel' ? 'REQUIRES_PROOF' : '需要凭证'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 处理接受任务
  const handleAcceptTask = (taskId: string) => {
    // 在catTasks和cowTasks中查找并更新任务
    setCatTasks(catTasks.map(task => {
      if (task.id === taskId && task.status === 'recruiting') {
        const updatedTask: Task = { 
          ...task, 
          assignee: currentUserName, // 使用当前用户名称
          status: 'assigned' as const
        };
        
        return updatedTask;
      }
      return task;
    }));

    setCowTasks(cowTasks.map(task => {
      if (task.id === taskId && task.status === 'recruiting') {
        const updatedTask: Task = { 
          ...task, 
          assignee: currentUserName, // 使用当前用户名称
          status: 'assigned' as const
        };
        
        return updatedTask;
      }
      return task;
    }));
  };

  const handleStartTask = (taskId: string) => {
    setCatTasks(catTasks.map(task => {
      if (task.id === taskId && task.status === 'assigned') {
        return { ...task, status: 'in-progress' };
      }
      return task;
    }));

    setCowTasks(cowTasks.map(task => {
      if (task.id === taskId && task.status === 'assigned') {
        return { ...task, status: 'in-progress' };
    }
      return task;
    }));
  };

  const handleCompleteTask = (taskId: string) => {
    setCatTasks(catTasks.map(task => {
      if (task.id === taskId) {
        // 检查任务是否过期，如果过期则移动到abandoned状态
        if (isTaskOverdue(task)) {
          return { ...task, status: 'abandoned' };
    }

        if (task.requiresProof) {
          // 如果需要凭证，任务进入待审核状态
          return { 
            ...task, 
            status: 'pending_review',
            submittedAt: new Date().toISOString() // 添加提交日期
          };
        } else {
          // 不需要凭证的任务直接完成
          if (task.assignee) {
        setUserPoints(prev => ({
          ...prev,
              me: prev.me + task.points // 奖励给当前用户
        }));
          }
          return { 
            ...task, 
            status: 'completed',
            submittedAt: new Date().toISOString() // 添加提交日期
          };
        }
      }
      return task;
    }));

    setCowTasks(cowTasks.map(task => {
      if (task.id === taskId) {
        // 检查任务是否过期，如果过期则移动到abandoned状态
        if (isTaskOverdue(task)) {
          return { ...task, status: 'abandoned' };
        }
        
        if (task.requiresProof) {
          // 如果需要凭证，任务进入待审核状态
          return { 
            ...task, 
            status: 'pending_review',
            submittedAt: new Date().toISOString() // 添加提交日期
          };
        } else {
          // 不需要凭证的任务直接完成
          if (task.assignee) {
        setUserPoints(prev => ({
          ...prev,
              me: prev.me + task.points // 奖励给当前用户
        }));
          }
          return { 
            ...task, 
            status: 'completed',
            submittedAt: new Date().toISOString() // 添加提交日期
          };
        }
      }
      return task;
    }));
  };

  const handleReviewTask = (taskId: string, approved: boolean, comment?: string) => {
    setCatTasks(catTasks.map(task => {
      if (task.id === taskId) {
        if (approved) {
          // 检查任务是否过期，如果过期则移动到abandoned状态
          if (isTaskOverdue(task)) {
            return { ...task, status: 'abandoned', reviewComment: comment };
          }
          
          // 审核通过，发放积分
          if (task.assignee) {
            setUserPoints(prev => ({
              ...prev,
              me: prev.me + task.points // 奖励给当前用户
            }));
          }
          return { 
            ...task, 
            status: 'completed', 
            reviewComment: comment,
            submittedAt: task.submittedAt || new Date().toISOString() // 确保有提交日期
          };
        } else {
          // 审核不通过，返回进行中状态
          return { ...task, status: 'in-progress', reviewComment: comment };
        }
      }
      return task;
    }));

    setCowTasks(cowTasks.map(task => {
      if (task.id === taskId) {
        if (approved) {
          // 检查任务是否过期，如果过期则移动到abandoned状态
          if (isTaskOverdue(task)) {
            return { ...task, status: 'abandoned', reviewComment: comment };
          }
          
          // 审核通过，发放积分
          if (task.assignee) {
            setUserPoints(prev => ({
              ...prev,
              me: prev.me + task.points // 奖励给当前用户
            }));
          }
          return { 
            ...task, 
            status: 'completed', 
            reviewComment: comment,
            submittedAt: task.submittedAt || new Date().toISOString() // 确保有提交日期
          };
        } else {
          // 审核不通过，返回进行中状态
          return { ...task, status: 'in-progress', reviewComment: comment };
        }
      }
      return task;
    }));
  };

  const handleUploadProof = (taskId: string, proof: string) => {
    setCatTasks(catTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, proof };
      }
      return task;
    }));

    setCowTasks(cowTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, proof };
      }
      return task;
    }));
  };

  const handleAbandonTask = (taskId: string) => {
    setCatTasks(catTasks.map(task => {
      if (task.id === taskId && task.status === 'assigned') {
        // 只有assigned状态的任务才能手动放弃
        setUserPoints(prev => ({
          ...prev,
          me: prev.me - 10 // 扣除当前用户的积分
        }));
        return { ...task, assignee: undefined, status: 'recruiting' };
      }
      return task;
    }));

    setCowTasks(cowTasks.map(task => {
      if (task.id === taskId && task.status === 'assigned') {
        // 只有assigned状态的任务才能手动放弃
        setUserPoints(prev => ({
          ...prev,
          me: prev.me - 10 // 扣除当前用户的积分
        }));
        return { ...task, assignee: undefined, status: 'recruiting' };
      }
      return task;
    }));
  };

  // 重新发布任务
  const handleRepublishTask = (taskId: string) => {
    setCatTasks(catTasks.map(task => {
      if (task.id === taskId && task.status === 'abandoned') {
        return { 
          ...task, 
          status: 'recruiting',
          assignee: undefined,
          proof: undefined,
          reviewComment: undefined
        };
      }
      return task;
    }));

    setCowTasks(cowTasks.map(task => {
      if (task.id === taskId && task.status === 'abandoned') {
        return { 
          ...task, 
          status: 'recruiting',
          assignee: undefined,
          proof: undefined,
          reviewComment: undefined
        };
      }
      return task;
    }));
  };

  const getCategoryColor = (category: string) => {
    if (theme === 'pixel') {
      switch (category) {
        case 'daily': return 'bg-pixel-info text-black';
        case 'habit': return 'bg-pixel-success text-black';
        case 'special': return 'bg-pixel-purple text-white';
        default: return 'bg-pixel-textMuted text-white';
      }
    }
    
    switch (category) {
      case 'daily': return 'bg-blue-500'; // 可爱浅蓝色
      case 'habit': return 'bg-green-500'; // 清新绿色
      case 'special': return 'bg-secondary-500'; // 香芋紫
      default: return 'bg-gray-500';
    }
  };

  const getCategoryName = (category: string) => {
    if (theme === 'pixel') {
      switch (category) {
        case 'daily': return 'DAILY';
        case 'habit': return 'HABIT';
        case 'special': return 'SPECIAL';
        default: return 'OTHER';
      }
    }
    
    switch (category) {
      case 'daily': return '日常';
      case 'habit': return '习惯';
      case 'special': return '特别';
      default: return '其他';
    }
  };

  const getStatusColor = (status: string) => {
    if (theme === 'pixel') {
      switch (status) {
        case 'recruiting': return 'border-pixel-info bg-pixel-card border-4';
        case 'assigned': return 'border-pixel-warning bg-pixel-card border-4';
        case 'in-progress': return 'border-pixel-info bg-pixel-panel border-4';
        case 'completed': return 'border-pixel-success bg-pixel-card border-4';
        case 'abandoned': return 'border-pixel-accent bg-pixel-card border-4';
        case 'pending_review': return 'border-pixel-warning bg-pixel-card border-4';
        default: return 'border-pixel-border bg-pixel-panel border-4';
      }
    }
    
    switch (status) {
      case 'recruiting': return 'border-blue-300 bg-blue-50';
      case 'assigned': return 'border-yellow-300 bg-yellow-50';
      case 'in-progress': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      case 'abandoned': return 'border-red-300 bg-red-50';
      case 'pending_review': return 'border-orange-300 bg-orange-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusName = (status: string) => {
    if (theme === 'pixel') {
      switch (status) {
        case 'recruiting': return 'RECRUITING';
        case 'assigned': return 'ASSIGNED';
        case 'in-progress': return 'IN_PROGRESS';
        case 'completed': return 'COMPLETED';
        case 'abandoned': return 'CLOSED';
        case 'pending_review': return 'PENDING_REVIEW';
        default: return 'UNKNOWN';
      }
    }
    
    switch (status) {
      case 'recruiting': return '招募中';
      case 'assigned': return '已领取';
      case 'in-progress': return '进行中';
      case 'completed': return '已完成';
      case 'abandoned': return '已关闭';
      case 'pending_review': return '待审核';
      default: return '未知';
    }
  };

  // 计算任务紧急程度
  const getTaskUrgency = (deadline?: string) => {
    if (!deadline) return 'normal';
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue'; // 已过期
    if (diffDays === 0) return 'today'; // 今天到期
    if (diffDays <= 2) return 'urgent'; // 紧急（2天内）
    if (diffDays <= 7) return 'upcoming'; // 即将到期（一周内）
    return 'normal'; // 正常
  };

  const getUrgencyColor = (urgency: string) => {
    if (theme === 'pixel') {
      switch (urgency) {
        case 'overdue': return 'text-black bg-pixel-accent font-mono';
        case 'today': return 'text-black bg-pixel-warning font-mono';
        case 'urgent': return 'text-black bg-pixel-orange font-mono';
        case 'upcoming': return 'text-black bg-pixel-info font-mono';
        default: return 'text-pixel-textMuted bg-pixel-card font-mono';
      }
    }
    
    switch (urgency) {
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'today': return 'text-orange-600 bg-orange-50';
      case 'urgent': return 'text-amber-600 bg-amber-50';
      case 'upcoming': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyText = (urgency: string) => {
    if (theme === 'pixel') {
      switch (urgency) {
        case 'overdue': return 'OVERDUE!';
        case 'today': return 'TODAY!';
        case 'urgent': return 'URGENT!';
        case 'upcoming': return 'SOON';
        default: return '';
      }
    }
    
    switch (urgency) {
      case 'overdue': return '已过期';
      case 'today': return '今天到期';
      case 'urgent': return '紧急';
      case 'upcoming': return '即将到期';
      default: return '';
    }
  };

  // 获取我发布的任务
  const getPublishedTasks = () => {
    return tasks.filter(task => task.creator === currentUserName);
  };

  // 获取我领取的任务
  const getAssignedTasks = () => {
    return tasks.filter(task => task.assignee === currentUserName);
  };

  // 获取可领取的任务 - 当前用户只能看到对方发布的还在招募中的任务
  const getAvailableTasks = () => {
    const availableTasks = tasks.filter(task => 
      task.creator === partnerUserName && // 对方发布的任务
      task.status === 'recruiting' && // 还在招募中
      !task.assignee && // 还没有被领取
      !isTaskOverdue(task) // 不是过期的任务
    );
    
    // 调试信息
    // console.log('All tasks:', tasks);
    // console.log(`${partnerUserName} recruiting tasks:`, tasks.filter(task => 
    //   task.creator === partnerUserName && task.status === 'recruiting'
    // ));
    // console.log(`Available tasks for ${currentUserName}:`, availableTasks);
    
    return availableTasks;
  };

  // 检查任务是否过期
  const isTaskOverdue = (task: Task) => {
    // 已完成和待审核的任务不应该有过期的情况
    // 因为一旦到了截止日期还没提交，任务就会自动变为abandoned
    if (task.status === 'completed' || task.status === 'pending_review') {
      return false; // 已完成和待审核的任务不会过期
    }
    
    // 其他状态的任务基于当前时间判断是否过期
    if (task.hasSpecificTime) {
      // 对于有特定时间的任务，检查结束时间
      if (task.taskEndTime) {
        const endTime = new Date(task.taskEndTime);
        const now = new Date();
        return now > endTime;
      }
      return false;
    } else {
      // 对于没有特定时间的任务，检查截止日期
      const deadline = new Date(task.deadline);
      const now = new Date();
      return now > deadline;
    }
  };

  // 检查任务提交是否逾期（提交日期晚于截止日期）
  const isTaskSubmissionLate = (task: Task) => {
    if (!task.submittedAt || (task.status !== 'completed' && task.status !== 'pending_review')) {
      return false;
    }
    
    const userTimezone = getUserTimezone();
    
    // 转换为用户时区的日期（只比较日期部分）
    const submittedDateInUserTZ = convertFromUTC(task.submittedAt, userTimezone);
    const deadlineInUserTZ = convertFromUTC(task.deadline, userTimezone);
    
    // 只比较日期部分，忽略时间部分
    const submittedDateOnly = new Date(submittedDateInUserTZ.getFullYear(), submittedDateInUserTZ.getMonth(), submittedDateInUserTZ.getDate());
    const deadlineDateOnly = new Date(deadlineInUserTZ.getFullYear(), deadlineInUserTZ.getMonth(), deadlineInUserTZ.getDate());
    
    const isLate = submittedDateOnly > deadlineDateOnly;
    
    // 调试信息
    if (task.status === 'completed' && (task.assignee === 'Whimsical Cow' || task.assignee === 'Whimsical Cat')) {
      console.log(`Task ${task.id}:`, {
        title: task.title,
        deadline: task.deadline,
        submittedAt: task.submittedAt,
        userTimezone: userTimezone,
        submittedDateInUserTZ: submittedDateInUserTZ.toISOString(),
        deadlineInUserTZ: deadlineInUserTZ.toISOString(),
        submittedDateOnly: submittedDateOnly.toISOString(),
        deadlineDateOnly: deadlineDateOnly.toISOString(),
        isLate: isLate,
        currentUser: getCurrentUserName()
      });
    }
    
    return isLate;
  };

  // 自动将过期任务移动到abandoned状态
  const moveOverdueTasksToAbandoned = () => {
    setCatTasks(catTasks.map(task => {
      // in-progress状态且过期的任务自动变为abandoned
      if (task.status === 'in-progress' && isTaskOverdue(task)) {
        return { ...task, status: 'abandoned' };
      }
      // recruiting状态且过期的任务变为abandoned（包括已发布但没人领取的）
      if (task.status === 'recruiting' && isTaskOverdue(task)) {
        return { ...task, status: 'abandoned' };
      }
      return task;
    }));

    setCowTasks(cowTasks.map(task => {
      // in-progress状态且过期的任务自动变为abandoned
      if (task.status === 'in-progress' && isTaskOverdue(task)) {
        return { ...task, status: 'abandoned' };
      }
      // recruiting状态且过期的任务变为abandoned（包括已发布但没人领取的）
      if (task.status === 'recruiting' && isTaskOverdue(task)) {
        return { ...task, status: 'abandoned' };
      }
      return task;
    }));
  };

  // 在组件加载时检查并移动过期任务
  useEffect(() => {
    moveOverdueTasksToAbandoned();
  }, []);

  // 检查任务是否即将过期（3天内）
  const isTaskExpiringSoon = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  // 渲染任务列表
  const renderTaskList = (taskList: Task[], type: 'published' | 'assigned' | 'available') => {
    if (type === 'published') {
      const recruitingTasks = taskList.filter(task => task.status === 'recruiting');
      const inProgressTasks = taskList.filter(task => task.status === 'in-progress');
      const pendingReviewTasks = taskList.filter(task => task.status === 'pending_review');
      const completedTasks = taskList.filter(task => task.status === 'completed');
      const abandonedTasks = taskList.filter(task => task.status === 'abandoned');

      if (publishedPage === 'active') {
  return (
          <div className="space-y-6">
            {/* 活跃任务页面 */}
            {/* 分类标题行 - 作为一个整体 */}
            <div className="relative mb-6">
              {/* 左侧箭头 */}
              <button
                onClick={() => setPublishedPage('completed')}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="上一页"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="arrow-left" size="sm" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4" />
                )}
              </button>
              
              {/* 右侧箭头 */}
              <button
                onClick={() => setPublishedPage('completed')}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="下一页"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="arrow-right" size="sm" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
              
              {/* 分类标题行 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-12">
          <div>
                  <h3 className={`text-lg font-bold ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'RECRUITING' : '正在招募'}
            </h3>
          </div>
          <div>
                  <h3 className={`text-lg font-bold ${
                    theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
                  }`}>
                    {theme === 'pixel' ? 'IN_PROGRESS' : '进行中'}
                  </h3>
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'PENDING_REVIEW' : '待审核'}
            </h3>
                </div>
              </div>
            </div>
            
            {/* 任务卡片区域 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                {recruitingTasks.map(task => renderTaskCard(task))}
              </div>
              <div>
                {inProgressTasks.map(task => renderTaskCard(task))}
              </div>
              <div>
            {pendingReviewTasks.map(task => renderTaskCard(task))}
          </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="space-y-6">
            {/* 已完成/已关闭任务页面 */}
            {/* 分类标题行 - 作为一个整体 */}
            <div className="relative mb-6">
              {/* 左侧箭头 */}
              <button
                onClick={() => setPublishedPage('active')}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="上一页"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="arrow-left" size="sm" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4" />
                )}
              </button>
              
              {/* 右侧箭头 */}
              <button
                onClick={() => setPublishedPage('active')}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-colors ${
                  theme === 'pixel'
                    ? 'hover:text-pixel-accent text-pixel-textMuted'
                    : 'hover:text-primary-500 text-gray-400'
                }`}
                aria-label="下一页"
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="arrow-right" size="sm" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
              
              {/* 分类标题行 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-12">
          <div>
                  <h3 className={`text-lg font-bold ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'COMPLETED' : '已完成'}
            </h3>
          </div>
          <div>
                  <h3 className={`text-lg font-bold ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
          }`}>
                    {theme === 'pixel' ? 'CLOSED' : '已关闭'}
            </h3>
                </div>
              </div>
            </div>
            
            {/* 任务卡片区域 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {completedTasks.map(task => renderTaskCard(task))}
              </div>
              <div>
                {abandonedTasks.map(task => renderTaskCard(task))}
              </div>
          </div>
        </div>
      );
      }
    } else if (type === 'assigned') {
      const notStartedTasks = taskList.filter(task => task.status === 'recruiting');
      const inProgressTasks = taskList.filter(task => task.status === 'in-progress');
      const completedTasks = taskList.filter(task => task.status === 'completed');
      const abandonedTasks = taskList.filter(task => task.status === 'abandoned');

      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'NOT_STARTED' : '未开始'}
            </h3>
            {notStartedTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'IN_PROGRESS' : '进行中'}
            </h3>
            {inProgressTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
          }`}>
              {theme === 'pixel' ? 'COMPLETED' : '已完成'}
            </h3>
            {completedTasks.map(task => renderTaskCard(task))}
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-4 ${
              theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
            }`}>
              {theme === 'pixel' ? 'ABANDONED' : '已放弃'}
            </h3>
            {abandonedTasks.map(task => renderTaskCard(task))}
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {taskList.map(task => (
            <div key={task.id} className={`relative ${
              isTaskExpiringSoon(task.deadline) ? 'animate-pulse' : ''
            }`}>
              {isTaskExpiringSoon(task.deadline) && (
                <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${
              theme === 'pixel' 
                    ? 'bg-pixel-warning text-black border-2 border-black'
                    : 'bg-yellow-100 text-yellow-800'
            }`}>
                  {theme === 'pixel' ? 'EXPIRING_SOON' : '即将过期'}
          </div>
              )}
              {renderTaskCard(task)}
        </div>
          ))}
        </div>
      );
    }
  };

  // 渲染任务详情弹窗
  const renderTaskDetailModal = () => {
    if (!selectedTask) return null;

    const isTaskOwner = selectedTask.creator === currentUserName;
    const isAssignee = selectedTask.assignee === currentUserName; // 使用当前用户名称
    const isRecruiting = selectedTask.status === 'recruiting';
    const isAssigned = selectedTask.status === 'assigned';
    const isInProgress = selectedTask.status === 'in-progress';
    const isPendingReview = selectedTask.status === 'pending_review';
    const isCompleted = selectedTask.status === 'completed';
    const isAbandoned = selectedTask.status === 'abandoned';
    const hasProof = selectedTask.proof !== undefined;
    const canComplete = !selectedTask.requiresProof || hasProof;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
          theme === 'pixel' 
            ? 'bg-pixel-panel pixel-container rounded-pixel shadow-pixel-lg neon-border' 
            : 'card-cutesy'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${
              theme === 'pixel' 
                ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                : 'font-display text-gray-800'
            }`}>
              {theme === 'pixel' ? 'TASK_DETAILS' : '任务详情'}
            </h3>
        <button
              onClick={() => setSelectedTask(null)}
              className={`p-2 transition-colors ${
            theme === 'pixel'
                  ? 'text-pixel-textMuted hover:text-pixel-text rounded-pixel border-2 border-pixel-border hover:border-pixel-textMuted'
                  : 'text-gray-500 hover:text-gray-700'
          }`}
        >
              {theme === 'pixel' ? (
                <PixelIcon name="x" size="sm" />
              ) : (
                <XMarkIcon className="w-5 h-5" />
              )}
        </button>
      </div>

          <div className="space-y-6">
            {/* 任务标题 */}
            <div>
              <h4 className={`text-lg font-bold mb-2 ${
                theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-800'
              }`}>
                {selectedTask.title}
              </h4>
              <p className={`text-sm ${
                theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-600'
              }`}>
                {selectedTask.description}
              </p>
                    </div>

            {/* 任务信息 */}
            <div className={`grid grid-cols-2 gap-4 ${
              theme === 'pixel' ? 'text-pixel-cyan font-mono' : 'text-gray-600'
            }`}>
              <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="clock" size="sm" />
                ) : (
                  <ClockIcon className="w-5 h-5" />
                )}
                <span>截止日期：{formatDate(selectedTask.deadline)}</span>
                    </div>
              <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="star" size="sm" className="text-pixel-accent" />
                ) : (
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  )}
                <span>积分奖励：{selectedTask.points}</span>
              </div>
                    <div className="flex items-center space-x-2">
                {theme === 'pixel' ? (
                  <PixelIcon name="user" size="sm" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
                <span>发布者：{selectedTask.creator}</span>
                    </div>
              {selectedTask.assignee && (
                    <div className="flex items-center space-x-2">
                  {theme === 'pixel' ? (
                    <PixelIcon name="user" size="sm" />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                  <span>执行者：{selectedTask.assignee}</span>
                    </div>
              )}
              {(selectedTask.status === 'completed' || selectedTask.status === 'pending_review') && selectedTask.submittedAt && (
                <div className="flex items-center space-x-2 col-span-2">
                  {theme === 'pixel' ? (
                    <PixelIcon name="calendar" size="sm" />
                  ) : (
                    <CalendarIcon className="w-5 h-5" />
                  )}
                  <span className={`${
                    isTaskSubmissionLate(selectedTask) 
                      ? (theme === 'pixel' ? 'text-pixel-accent font-mono' : 'text-red-600')
                      : ''
                  }`}>
                    提交日期：{formatDateTimeWithTimezone(selectedTask.submittedAt)}
                    {isTaskSubmissionLate(selectedTask) && (
                      <span className="ml-2">
                        {theme === 'pixel' ? '(LATE_SUBMISSION)' : '(逾期提交)'}
                      </span>
                    )}
                  </span>
                    </div>
              )}
                  </div>

            {/* 过期任务提示 */}
            {(isTaskOverdue(selectedTask) || isTaskSubmissionLate(selectedTask)) && (
              <div className={`p-4 rounded-lg ${
                theme === 'pixel'
                  ? 'bg-pixel-accent/20 border-2 border-pixel-accent'
                  : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {theme === 'pixel' ? (
                    <PixelIcon name="warning" size="sm" className="text-pixel-accent" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    theme === 'pixel' ? 'text-pixel-accent font-mono uppercase' : 'text-red-700'
                  }`}>
                    {isTaskSubmissionLate(selectedTask) 
                      ? (theme === 'pixel' ? 'LATE_SUBMISSION' : '逾期提交')
                      : (theme === 'pixel' ? 'TASK_OVERDUE' : '任务已过期')
                    }
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-red-600'
                }`}>
                  {isTaskSubmissionLate(selectedTask) ? (
                    theme === 'pixel' 
                      ? 'SUBMISSION_DATE_IS_AFTER_DEADLINE'
                      : '提交日期晚于截止日期'
                  ) : (
                    theme === 'pixel' 
                      ? 'THIS_TASK_HAS_PASSED_ITS_DEADLINE_AND_WILL_BE_MOVED_TO_CLOSED_STATUS'
                      : '此任务已超过截止时间，将被移动到已关闭状态'
                  )}
                </p>
              </div>
            )}

            {/* 凭证上传区域 */}
            {isAssignee && isInProgress && selectedTask.requiresProof && (
              <div className={`p-4 rounded-lg ${
                theme === 'pixel'
                  ? 'bg-pixel-card border-2 border-pixel-border'
                  : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium mb-3 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_PROOF' : '任务凭证'}
                </h4>
                {hasProof ? (
                  <div className="flex items-center space-x-2">
                    <CheckIcon className="w-5 h-5 text-green-500" />
                    <span className={theme === 'pixel' ? 'text-pixel-success font-mono' : 'text-green-600'}>
                      {theme === 'pixel' ? 'PROOF_UPLOADED' : '已上传凭证'}
                    </span>
                </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // 这里应该实现文件上传逻辑
                          handleUploadProof(selectedTask.id, 'proof_url');
                        }
                      }}
                      className={`w-full ${
                        theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                      }`}
                    />
                    <p className={`text-sm ${
                      theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
                    }`}>
                      {theme === 'pixel' ? 'UPLOAD_PROOF_TO_COMPLETE_TASK' : '请上传任务完成凭证'}
                    </p>
          </div>
                )}
        </div>
            )}

            {/* 审核区域 */}
            {isTaskOwner && isPendingReview && (
              <div className={`p-4 rounded-lg ${
                theme === 'pixel'
                  ? 'bg-pixel-card border-2 border-pixel-border'
                  : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium mb-3 ${
                  theme === 'pixel' ? 'text-pixel-text font-mono uppercase' : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REVIEW_TASK' : '审核任务'}
                </h4>
        <div className="space-y-4">
                  {selectedTask.proof && (
                    <div className="mb-4">
                      <p className={`text-sm mb-2 ${
                        theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-600'
                      }`}>
                        {theme === 'pixel' ? 'TASK_PROOF' : '任务凭证'}
                      </p>
                      <img 
                        src={selectedTask.proof} 
                        alt="Task proof" 
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                  <textarea
                    placeholder={theme === 'pixel' ? 'ENTER_REVIEW_COMMENT...' : '输入审核意见...'}
                    className={`w-full h-24 resize-none ${
                      theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                    }`}
                    onChange={(e) => setSelectedTask({...selectedTask, reviewComment: e.target.value})}
                    value={selectedTask.reviewComment || ''}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        handleReviewTask(selectedTask.id, true, selectedTask.reviewComment);
                        setSelectedTask(null);
                      }}
                      className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                        theme === 'pixel'
                          ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
                          : 'btn-primary'
                      }`}
                    >
                      {theme === 'pixel' ? 'APPROVE' : '通过'}
                    </button>
                    <button
                      onClick={() => {
                        handleReviewTask(selectedTask.id, false, selectedTask.reviewComment);
                        setSelectedTask(null);
                      }}
                      className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                        theme === 'pixel'
                          ? 'bg-pixel-card text-pixel-text rounded-pixel border-2 border-pixel-border hover:bg-pixel-accent hover:text-black'
                          : 'bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200'
                      }`}
                    >
                      {theme === 'pixel' ? 'REJECT' : '拒绝'}
                    </button>
                  </div>
                </div>
                    </div>
                  )}

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              {view === 'available' && !selectedTask.assignee && !isTaskOverdue(selectedTask) && (
                        <button
                  onClick={() => {
                    handleAcceptTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                    theme === 'pixel'
                      ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
                      : 'btn-primary'
                  }`}
                >
                  {theme === 'pixel' ? 'ACCEPT_TASK' : '领取任务'}
                </button>
              )}
              {isAssignee && isAssigned && !isTaskOverdue(selectedTask) && (
                <>
                  <button
                    onClick={() => {
                      handleStartTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                      theme === 'pixel'
                        ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
                        : 'btn-primary'
                    }`}
                  >
                    {theme === 'pixel' ? 'START_TASK' : '开始任务'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(
                        theme === 'pixel'
                          ? 'ABANDON_TASK_WARNING: THIS_WILL_COST_10_POINTS!'
                          : '确定要放弃任务吗？这将扣除10积分！'
                      )) {
                        handleAbandonTask(selectedTask.id);
                        setSelectedTask(null);
                      }
                    }}
                    className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                      theme === 'pixel'
                        ? 'bg-pixel-card text-pixel-text rounded-pixel border-2 border-pixel-border hover:bg-pixel-accent hover:text-black'
                        : 'bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200'
                    }`}
                  >
                    {theme === 'pixel' ? 'ABANDON_TASK (-10 POINTS)' : '放弃任务 (-10积分)'}
                  </button>
                </>
              )}
              {isAssignee && isInProgress && !isTaskOverdue(selectedTask) && (
                <button
                  onClick={() => {
                    handleCompleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  disabled={!canComplete || !isTaskInTimeRange(selectedTask)}
                  className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                    theme === 'pixel'
                      ? `rounded-pixel border-2 ${
                          canComplete && isTaskInTimeRange(selectedTask)
                            ? 'pixel-btn-neon text-white border-white'
                            : 'bg-pixel-card text-pixel-textMuted border-pixel-border cursor-not-allowed'
                        }`
                      : `rounded-xl ${
                          canComplete && isTaskInTimeRange(selectedTask)
                            ? 'btn-primary'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`
                  }`}
                >
                  {theme === 'pixel' ? 'COMPLETE_TASK' : '完成任务'}
                        </button>
                      )}
              {/* 重新发布按钮 - 只有任务创建者且任务状态为abandoned时显示 */}
              {isTaskOwner && selectedTask.status === 'abandoned' && (
                <button
                  onClick={() => {
                    if (window.confirm(
                      theme === 'pixel'
                        ? 'REPUBLISH_TASK_CONFIRMATION'
                        : '确定要重新发布这个任务吗？'
                    )) {
                      handleRepublishTask(selectedTask.id);
                      setSelectedTask(null);
                    }
                  }}
                  className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                    theme === 'pixel'
                      ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
                      : 'btn-primary'
                  }`}
                >
                  {theme === 'pixel' ? 'REPUBLISH_TASK' : '重新发布'}
                        </button>
                      )}
            </div>
                    </div>
                  </div>
                </div>
              );
  };


  // 更新任务详情弹窗中的操作按钮
  const renderTaskActions = (task: Task) => {
    const isAssignee = task.assignee === currentUserName; // 使用当前用户名称
    const isAssigned = task.status === 'assigned';
    const isInProgress = task.status === 'in-progress';
    const hasProof = task.proof !== undefined;
    const canComplete = !task.requiresProof || hasProof;
    const isInTimeRange = isTaskInTimeRange(task);
    const isOverdue = isTaskOverdue(task);

    if (view === 'available' && !task.assignee) {
    return (
              <button
          onClick={() => {
            handleAcceptTask(task.id);
            setSelectedTask(null);
          }}
          className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                  theme === 'pixel'
              ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
              : 'btn-primary'
                }`}
              >
          {theme === 'pixel' ? 'ACCEPT_TASK' : '领取任务'}
              </button>
      );
    }

    if (isAssignee && isAssigned) {
      return (
        <>
              <button
            onClick={() => {
              handleStartTask(task.id);
              setSelectedTask(null);
            }}
            className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                  theme === 'pixel'
                ? 'pixel-btn-neon text-white rounded-pixel border-2 border-white'
                : 'btn-primary'
                }`}
              >
            {theme === 'pixel' ? 'START_TASK' : '开始任务'}
              </button>
            <button
            onClick={() => {
              if (window.confirm(
                theme === 'pixel'
                  ? 'ABANDON_TASK_WARNING: THIS_WILL_COST_10_POINTS!'
                  : '确定要放弃任务吗？这将扣除10积分！'
              )) {
                handleAbandonTask(task.id);
                setSelectedTask(null);
              }
            }}
            className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
              theme === 'pixel'
                ? 'bg-pixel-card text-pixel-text rounded-pixel border-2 border-pixel-border hover:bg-pixel-accent hover:text-black'
                : 'bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200'
              }`}
            >
            {theme === 'pixel' ? 'ABANDON_TASK (-10 POINTS)' : '放弃任务 (-10积分)'}
            </button>
        </>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <h2 className={`text-3xl font-bold ${
            theme === 'pixel' 
              ? 'font-retro text-pixel-text uppercase tracking-wider' 
              : 'font-display text-gray-700'
          }`}>
            {theme === 'pixel' ? 'TASK_MANAGER.EXE' : '任务看板'}
          </h2>
          
          {/* View Switcher */}
          <div className={`flex ${
            theme === 'pixel' 
              ? 'border-4 border-pixel-border bg-pixel-card shadow-pixel' 
              : 'border border-gray-200'
          }`}>
            <button
              onClick={() => setView('published')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel' 
                  ? `font-mono uppercase border-r-4 border-pixel-border ${
                      view === 'published'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : `${
                      view === 'published'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="document" className="inline-block mr-1" size="sm" />
              ) : (
                <DocumentIcon className="w-4 h-4 inline-block mr-1" />
              )}
              <span className="font-medium">
                {theme === 'pixel' ? 'PUBLISHED' : '我发布的'}
              </span>
            </button>
            <button
              onClick={() => setView('assigned')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                theme === 'pixel'
                  ? `font-mono uppercase border-r-4 border-pixel-border ${
                      view === 'assigned'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : `${
                      view === 'assigned'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="user" className="inline-block mr-1" size="sm" />
              ) : (
                <UserIcon className="w-4 h-4 inline-block mr-1" />
              )}
              <span className="font-medium">
                {theme === 'pixel' ? 'ASSIGNED' : '我领取的'}
              </span>
            </button>
            <button
              onClick={() => setView('available')}
              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
              theme === 'pixel' 
                  ? `font-mono uppercase ${
                      view === 'available'
                        ? 'bg-pixel-accent text-black shadow-pixel-inner'
                        : 'text-pixel-text hover:bg-pixel-panel hover:text-pixel-accent'
                    }`
                  : `${
                      view === 'available'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
              }`}
            >
              {theme === 'pixel' ? (
                <PixelIcon name="list" className="inline-block mr-1" size="sm" />
              ) : (
                <ListBulletIcon className="w-4 h-4 inline-block mr-1" />
              )}
              <span className="font-medium">
                {theme === 'pixel' ? 'AVAILABLE' : '可领取'}
            </span>
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
        <button
          onClick={() => setShowAddForm(true)}
          className={`flex items-center space-x-2 px-6 py-3 font-bold transition-all duration-300 ${
            theme === 'pixel'
              ? 'pixel-btn-neon text-white rounded-pixel pixel-border-primary hover:shadow-pixel-neon-strong hover:translate-y-[-2px] font-mono uppercase tracking-wider'
              : 'btn-primary'
          }`}
        >
          {theme === 'pixel' ? (
            <PixelIcon name="plus" className="text-current" glow />
          ) : (
          <PlusIcon className="w-5 h-5" />
          )}
          <span>{theme === 'pixel' ? 'NEW_TASK' : '新建任务'}</span>
        </button>
        </div>
      </div>

      {/* Task Columns */}
      <div className="space-y-8">
        {view === 'published' && (
          <div>
            {renderTaskList(getPublishedTasks(), 'published')}
                  </div>
                  )}

        {view === 'assigned' && (
          <div>
            <h3 className={`text-xl font-bold mb-4 ${
              theme === 'pixel' 
                ? 'font-retro text-pixel-text uppercase tracking-wider' 
                : 'font-display text-gray-700'
            }`}>
              {theme === 'pixel' ? 'ASSIGNED_TASKS' : '我领取的任务'}
          </h3>
            {renderTaskList(getAssignedTasks(), 'assigned')}
                  </div>
                )}

        {view === 'available' && (
          <div>
            <h3 className={`text-xl font-bold mb-4 ${
              theme === 'pixel' 
                ? 'font-retro text-pixel-text uppercase tracking-wider' 
                : 'font-display text-gray-700'
            }`}>
              {theme === 'pixel' ? 'AVAILABLE_TASKS' : '可领取的任务'}
          </h3>
            {renderTaskList(getAvailableTasks(), 'available')}
                  </div>
                )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && renderTaskDetailModal()}

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto ${
            theme === 'pixel' 
              ? 'bg-pixel-panel pixel-container rounded-pixel shadow-pixel-lg neon-border' 
              : 'card-cutesy'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${
                theme === 'pixel' 
                  ? 'font-retro text-pixel-text uppercase tracking-wider neon-text' 
                  : 'font-display text-gray-800'
              }`}>
                {theme === 'pixel' ? 'ADD_NEW_TASK' : '发布新任务'}
            </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className={`p-2 transition-colors ${
                  theme === 'pixel'
                    ? 'text-pixel-textMuted hover:text-pixel-text rounded-pixel border-2 border-pixel-border hover:border-pixel-textMuted'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {theme === 'pixel' ? (
                  <PixelIcon name="x" size="sm" />
                ) : (
                  <XMarkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 任务性质 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REPEAT_TYPE *' : '任务性质 *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'once', label: theme === 'pixel' ? 'ONE_TIME' : '一次性' },
                    { value: 'repeat', label: theme === 'pixel' ? 'REPEATABLE' : '重复性' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewTask({...newTask, repeatType: type.value as any})}
                      className={`py-2 px-3 text-sm transition-all duration-300 ${
                        theme === 'pixel' 
                          ? `rounded-pixel border-2 font-mono uppercase ${
                              newTask.repeatType === type.value
                                ? 'bg-pixel-accent text-black border-white shadow-pixel neon-border'
                                : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                            }`
                          : `rounded-xl border-2 ${
                              newTask.repeatType === type.value
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 任务标题 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_TITLE *' : '任务标题 *'}
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className={`w-full ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                  placeholder={theme === 'pixel' ? 'ENTER_TASK_TITLE...' : '输入任务标题...'}
                />
              </div>

              {/* 任务描述 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_DESCRIPTION' : '任务描述'}
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className={`w-full h-20 resize-none ${
                    theme === 'pixel' ? 'pixel-input-glow' : 'input-cutesy'
                  }`}
                  placeholder={theme === 'pixel' ? 'ENTER_TASK_DESCRIPTION...' : '详细描述任务内容...'}
                />
              </div>

              {/* 任务时间 */}
              {renderTaskTimeFields()}

              {/* 任务类型 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'TASK_TYPE *' : '任务类型 *'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily', 'habit', 'special'].map(type => (
                  <button
                      key={type}
                      onClick={() => setNewTask({...newTask, taskType: type as any})}
                      className={`py-2 px-3 text-sm transition-all duration-300 ${
                        theme === 'pixel' 
                          ? `rounded-pixel border-2 font-mono uppercase ${
                              newTask.taskType === type
                                ? `${getCategoryColor(type)} border-white shadow-pixel neon-border`
                                : 'border-pixel-border text-pixel-text hover:border-pixel-info hover:bg-pixel-card'
                            }`
                          : `rounded-xl border-2 ${
                              newTask.taskType === type
                                ? `border-${getCategoryColor(type).replace('bg-', '')} bg-${getCategoryColor(type).replace('bg-', '')}/10`
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`
                    }`}
                  >
                      {getCategoryName(type)}
                  </button>
                  ))}
                </div>
              </div>

              {/* 是否需要凭证 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'pixel' 
                    ? 'text-pixel-cyan font-mono uppercase tracking-wide neon-text' 
                    : 'text-gray-700'
                }`}>
                  {theme === 'pixel' ? 'REQUIRE_PROOF' : '是否需要凭证'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newTask.requiresProof}
                    onChange={(e) => setNewTask({...newTask, requiresProof: e.target.checked})}
                    className={`w-4 h-4 ${
                      theme === 'pixel' ? 'pixel-checkbox' : 'rounded text-primary-500'
                    }`}
                  />
                  <span className={theme === 'pixel' ? 'text-pixel-text font-mono' : 'text-gray-600'}>
                    {theme === 'pixel' ? 'TASK_REQUIRES_PROOF' : '任务需要上传完成凭证'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className={`flex-1 py-3 px-4 border-2 transition-all duration-300 ${
                  theme === 'pixel'
                    ? 'border-pixel-border text-pixel-text rounded-pixel hover:bg-pixel-card font-mono uppercase'
                    : 'border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50'
                }`}
              >
                {theme === 'pixel' ? 'CANCEL' : '取消'}
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTask.title || (newTask.repeatType === 'once' ? !newTask.deadline : !newTask.startDate)}
                className={`flex-1 py-3 px-4 font-medium transition-all duration-300 ${
                  theme === 'pixel'
                    ? `rounded-pixel font-mono uppercase ${
                        newTask.title && (newTask.repeatType === 'once' ? newTask.deadline : newTask.startDate)
                          ? 'pixel-btn-neon text-white border-4 border-white'
                          : 'bg-pixel-card text-pixel-textMuted border-2 border-pixel-border cursor-not-allowed'
                      }`
                    : `rounded-xl ${
                        newTask.title && (newTask.repeatType === 'once' ? newTask.deadline : newTask.startDate)
                          ? 'btn-primary'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`
                }`}
              >
                {theme === 'pixel' ? 'PUBLISH_TASK' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard; 