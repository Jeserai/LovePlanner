// API服务切换器 - 在真实API和模拟API之间切换
import { taskService as realTaskService } from './database';
import { simplifiedEventService as realEventService } from './simplifiedEventService';
import { 
  mockTaskService, 
  mockEventService, 
  mockUserService, 
  mockAuthService,
  USE_MOCK_API 
} from './mockApiService';

// 统一的任务服务接口
export const taskService = {
  getCoupleTasksOld: (coupleId: string) => USE_MOCK_API ? mockTaskService.getAllTasks() : realTaskService.getCoupleTasksOld(coupleId),
  createTask: (taskData: any) => USE_MOCK_API ? mockTaskService.createTask(taskData) : realTaskService.createTask(taskData),
  updateTask: (taskId: string, updates: any) => USE_MOCK_API ? mockTaskService.updateTask(taskId, updates) : realTaskService.updateTask(taskId, updates),
  updateTaskStatus: (taskId: string, status: any, assigneeId?: string) => USE_MOCK_API ? mockTaskService.updateTask(taskId, { status, assignee: assigneeId }) : realTaskService.updateTaskStatus(taskId, status, assigneeId),
  submitTask: (taskId: string, proofUrl?: string) => USE_MOCK_API ? mockTaskService.submitTask(taskId, { proofUrl }) : realTaskService.submitTask(taskId, proofUrl),
  completeTask: (taskId: string, reviewComment?: string) => USE_MOCK_API ? mockTaskService.updateTask(taskId, { status: 'completed', reviewComment }) : realTaskService.completeTask(taskId, reviewComment)
};

// 统一的事件服务接口
export const eventService = {
  getAllEvents: () => USE_MOCK_API ? mockEventService.getAllEvents() : realEventService.getAllEvents(),
  createEvent: (eventData: any) => USE_MOCK_API ? mockEventService.createEvent(eventData) : realEventService.createEvent(eventData),
  updateEvent: (eventId: string, updates: any) => USE_MOCK_API ? mockEventService.updateEvent(eventId, updates) : realEventService.updateEvent(eventId, updates),
  deleteEvent: (eventId: string) => USE_MOCK_API ? mockEventService.deleteEvent(eventId) : realEventService.deleteEvent(eventId)
};

// 统一的用户服务接口
export const userService = {
  getAllUsers: () => USE_MOCK_API ? mockUserService.getAllUsers() : Promise.resolve([]), // 真实服务需要实现
  getUserById: (userId: string) => USE_MOCK_API ? mockUserService.getUserById(userId) : Promise.resolve(null), // 真实服务需要实现
  getUserMap: () => USE_MOCK_API ? mockUserService.getUserMap() : Promise.resolve({}) // 真实服务需要实现
};

// 统一的认证服务接口
export const authService = {
  getCurrentUser: () => USE_MOCK_API ? mockAuthService.getCurrentUser() : null, // 真实服务需要实现
  getUserProfile: () => USE_MOCK_API ? mockAuthService.getUserProfile() : null // 真实服务需要实现
};
