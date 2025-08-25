import { supabase } from '../lib/supabase';

// 预设用户数据
export const PRESET_USERS = {
  cat: {
    id: 'cat-user-id-fixed',
    email: 'cat@loveplanner.com',
    password: '123456',
    username: 'whimsical_cat',
    displayName: 'Whimsical Cat',
    role: 'cat' as const
  },
  cow: {
    id: 'cow-user-id-fixed',
    email: 'cow@loveplanner.com', 
    password: '123456',
    username: 'whimsical_cow',
    displayName: 'Whimsical Cow',
    role: 'cow' as const
  }
};

// 检查是否为演示模式
const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co' || 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                   process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url';

/**
 * 预设用户登录服务
 * 支持演示模式和真实数据库模式
 */
export const authService = {
  /**
   * 使用邮箱和密码登录预设用户
   */
  async loginWithEmail(email: string, password: string) {
    // 检查是否为预设用户
    const presetUser = Object.values(PRESET_USERS).find(u => u.email === email);
    
    if (!presetUser) {
      throw new Error('只支持预设的Cat和Cow用户登录');
    }

    if (password !== presetUser.password) {
      throw new Error('密码错误');
    }

    if (isDemoMode) {
      // 演示模式：返回模拟数据
      return this.createDemoResponse(presetUser);
    } else {
      // 真实模式：从数据库获取用户数据
      return this.createRealResponse(presetUser);
    }
  },

  /**
   * 快速登录预设用户
   */
  async quickLogin(userType: 'cat' | 'cow') {
    const presetUser = PRESET_USERS[userType];
    
    if (isDemoMode) {
      return this.createDemoResponse(presetUser);
    } else {
      return this.createRealResponse(presetUser);
    }
  },

  /**
   * 创建演示模式响应
   */
  createDemoResponse(presetUser: typeof PRESET_USERS.cat | typeof PRESET_USERS.cow) {
    const mockUser = {
      id: presetUser.id,
      email: presetUser.email,
      user_metadata: presetUser
    };

    const mockProfile = {
      id: presetUser.id,
      email: presetUser.email,
      username: presetUser.username,
      display_name: presetUser.displayName,
      role: presetUser.role,
      points: presetUser.role === 'cat' ? 150 : 300,
      timezone: presetUser.role === 'cat' ? 'Asia/Shanghai' : 'America/New_York'
    };

    // 保存到本地存储
    localStorage.setItem('demo_user', JSON.stringify(mockUser));
    
    // 触发状态更新事件
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('demoAuthChange', {
        detail: { user: mockUser }
      });
      window.dispatchEvent(event);
    }

    return { user: mockUser, profile: mockProfile };
  },

  /**
   * 创建真实模式响应
   */
  async createRealResponse(presetUser: typeof PRESET_USERS.cat | typeof PRESET_USERS.cow) {
    try {
      // 从数据库获取用户档案
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', presetUser.id)
        .single();

      if (error) {
        console.error('获取用户档案失败:', error);
        throw new Error('用户数据未找到，请确保已运行数据迁移脚本');
      }

      // 创建用户对象（模拟Supabase Auth用户格式）
      const user = {
        id: presetUser.id,
        email: presetUser.email,
        user_metadata: {
          username: profile.username,
          display_name: profile.display_name,
          role: profile.role
        },
        created_at: profile.created_at
      };

      // 保存到本地存储（为了保持状态）
      localStorage.setItem('preset_user', JSON.stringify(user));
      
      // 触发状态更新事件
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('presetAuthChange', {
          detail: { user, profile }
        });
        window.dispatchEvent(event);
      }

      return { user, profile };
    } catch (error) {
      console.error('真实模式登录失败:', error);
      throw error;
    }
  },

  /**
   * 登出服务
   */
  async logout() {
    if (isDemoMode) {
      localStorage.removeItem('demo_user');
      
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('demoAuthChange', {
          detail: { user: null }
        });
        window.dispatchEvent(event);
      }
    } else {
      localStorage.removeItem('preset_user');
      
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('presetAuthChange', {
          detail: { user: null, profile: null }
        });
        window.dispatchEvent(event);
      }
    }
  },

  /**
   * 获取当前用户状态
   */
  getCurrentUser() {
    try {
      if (isDemoMode) {
        const savedUser = localStorage.getItem('demo_user');
        return savedUser ? JSON.parse(savedUser) : null;
      } else {
        const savedUser = localStorage.getItem('preset_user');
        return savedUser ? JSON.parse(savedUser) : null;
      }
    } catch (error) {
      console.warn('解析用户数据失败:', error);
      return null;
    }
  }
};
