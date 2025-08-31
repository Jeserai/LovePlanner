// 模拟API服务 - 代替真实的数据库请求
import { Database } from './database';

// 模拟数据存储
let mockTasks: any[] = [
  {
    id: 'task-1',
    title: '每日晨跑',
    description: '在指定时间内完成30分钟晨跑',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天后
    points: 100,
    status: 'assigned',
    assignee: 'user-1',
    creator: 'user-2',
    createdAt: new Date().toISOString(),
    requiresProof: true,
    taskType: 'daily',
    repeatType: 'once',
    taskStartTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1小时后开始
    taskEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'task-2', 
    title: '连续7天阅读',
    description: '每天阅读至少30分钟，连续坚持7天',
    deadline: null, // 不限时任务
    points: 200,
    status: 'assigned',
    assignee: 'user-1',
    creator: 'user-2',
    createdAt: new Date().toISOString(),
    requiresProof: false,
    taskType: 'habit',
    repeatType: 'repeat',
    repeatFrequency: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30天后
    consecutiveCount: 7,
    currentStreak: 2,
    streakStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completionRecord: JSON.stringify([
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ])
  },
  {
    id: 'task-3',
    title: '未开始的任务',
    description: '这个任务还没到开始时间',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后截止
    points: 150,
    status: 'assigned',
    assignee: 'user-1', 
    creator: 'user-2',
    createdAt: new Date().toISOString(),
    requiresProof: true,
    taskType: 'special',
    repeatType: 'once',
    taskStartTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天后开始
    taskEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'task-4',
    title: '已过期任务',
    description: '这个任务已经过期了',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1天前过期
    points: 80,
    status: 'assigned',
    assignee: 'user-1',
    creator: 'user-2', 
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    requiresProof: false,
    taskType: 'daily',
    repeatType: 'once',
    taskStartTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    taskEndTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'task-5',
    title: '不限时重复任务',
    description: '随时可以完成的重复任务',
    deadline: null,
    points: 120,
    status: 'recruiting',
    creator: 'user-1',
    createdAt: new Date().toISOString(),
    requiresProof: false,
    taskType: 'habit',
    repeatType: 'repeat',
    repeatFrequency: 'weekly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60天后
  }
];

let mockEvents: any[] = [
  {
    id: 'event-1',
    title: '约会',
    description: '去公园散步',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 明天+2小时
    participants: ['user-1', 'user-2'],
    creator: 'user-1',
    createdAt: new Date().toISOString(),
    isRecurring: false
  }
];

let mockUsers: any[] = [
  { id: 'user-1', name: '用户A', email: 'usera@example.com' },
  { id: 'user-2', name: '用户B', email: 'userb@example.com' }
];

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟任务服务
export const mockTaskService = {
  // 获取所有任务
  async getAllTasks(): Promise<any[]> {
    await delay(300); // 模拟网络延迟
    return mockTasks.map(task => ({ ...task }));
  },

  // 根据状态获取任务
  async getTasksByStatus(status: string): Promise<any[]> {
    await delay(200);
    return mockTasks.filter(task => task.status === status);
  },

  // 获取用户创建的任务
  async getTasksByCreator(userId: string): Promise<any[]> {
    await delay(200);
    return mockTasks.filter(task => task.creator === userId);
  },

  // 获取用户领取的任务
  async getTasksByAssignee(userId: string): Promise<any[]> {
    await delay(200);
    return mockTasks.filter(task => task.assignee === userId);
  },

  // 创建任务
  async createTask(taskData: any): Promise<any> {
    await delay(500);
    const newTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'recruiting'
    };
    mockTasks.push(newTask);
    return newTask;
  },

  // 更新任务
  async updateTask(taskId: string, updates: any): Promise<any> {
    await delay(400);
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }
    
    mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates };
    return mockTasks[taskIndex];
  },

  // 删除任务
  async deleteTask(taskId: string): Promise<void> {
    await delay(300);
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }
    mockTasks.splice(taskIndex, 1);
  },

  // 领取任务
  async assignTask(taskId: string, userId: string): Promise<any> {
    await delay(400);
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }
    
    mockTasks[taskIndex].assignee = userId;
    mockTasks[taskIndex].status = 'assigned';
    return mockTasks[taskIndex];
  },

  // 提交任务
  async submitTask(taskId: string, submissionData: any): Promise<any> {
    await delay(500);
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('任务不存在');
    }
    
    mockTasks[taskIndex] = {
      ...mockTasks[taskIndex],
      ...submissionData,
      status: 'pending_review',
      submittedAt: new Date().toISOString()
    };
    return mockTasks[taskIndex];
  }
};

// 模拟事件服务
export const mockEventService = {
  // 获取所有事件
  async getAllEvents(): Promise<any[]> {
    await delay(300);
    return mockEvents.map(event => ({ ...event }));
  },

  // 创建事件
  async createEvent(eventData: any): Promise<any> {
    await delay(500);
    const newEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    mockEvents.push(newEvent);
    return newEvent;
  },

  // 更新事件
  async updateEvent(eventId: string, updates: any): Promise<any> {
    await delay(400);
    const eventIndex = mockEvents.findIndex(event => event.id === eventId);
    if (eventIndex === -1) {
      throw new Error('事件不存在');
    }
    
    mockEvents[eventIndex] = { ...mockEvents[eventIndex], ...updates };
    return mockEvents[eventIndex];
  },

  // 删除事件
  async deleteEvent(eventId: string): Promise<void> {
    await delay(300);
    const eventIndex = mockEvents.findIndex(event => event.id === eventId);
    if (eventIndex === -1) {
      throw new Error('事件不存在');
    }
    mockEvents.splice(eventIndex, 1);
  }
};

// 模拟用户服务
export const mockUserService = {
  // 获取所有用户
  async getAllUsers(): Promise<any[]> {
    await delay(200);
    return mockUsers.map(user => ({ ...user }));
  },

  // 根据ID获取用户
  async getUserById(userId: string): Promise<any | null> {
    await delay(150);
    return mockUsers.find(user => user.id === userId) || null;
  },

  // 获取用户名映射
  async getUserMap(): Promise<{[id: string]: string}> {
    await delay(200);
    const userMap: {[id: string]: string} = {};
    mockUsers.forEach(user => {
      userMap[user.id] = user.name;
    });
    return userMap;
  }
};

// 模拟认证服务
export const mockAuthService = {
  // 模拟当前用户
  getCurrentUser: () => ({
    id: 'user-1',
    name: '用户A', 
    email: 'usera@example.com'
  }),

  // 模拟用户资料
  getUserProfile: () => ({
    id: 'user-1',
    name: '用户A',
    email: 'usera@example.com',
    points: 1250,
    level: 5,
    partnerId: 'user-2'
  })
};

// 导出切换标志
export let USE_MOCK_API = false;

export const toggleMockApi = (useMock: boolean) => {
  USE_MOCK_API = useMock;
  console.log(`📡 ${useMock ? '启用' : '禁用'}模拟API模式`);
};

// 便捷的切换函数
export const enableMockApi = () => toggleMockApi(true);
export const disableMockApi = () => toggleMockApi(false);
