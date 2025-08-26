import { supabase } from '../lib/supabase';

// 获取用户显示信息（用于UI展示）
export const getUserDisplayInfo = (user: any) => {
  if (!user) return null;
  
  const username = user.username || user.user_metadata?.username || '';
  const email = user.email || '';
  const displayName = user.display_name || user.user_metadata?.display_name || user.displayName || '';
  
  // 为了保持UI兼容性，仍然可以识别当前的cat/cow用户
  // 但这只是为了显示合适的图标和颜色，不影响数据结构
  let uiTheme = 'default';
  if (username.includes('cat') || email.includes('cat') || displayName.toLowerCase().includes('cat')) {
    uiTheme = 'cat';
  } else if (username.includes('cow') || email.includes('cow') || displayName.toLowerCase().includes('cow')) {
    uiTheme = 'cow';
  }
  
  return {
    username,
    email,
    displayName,
    uiTheme, // 仅用于UI显示，不存储在数据库
    birthday: user.birthday || user.user_metadata?.birthday
  };
};

// 预设用户数据
export const PRESET_USERS = {
  cat: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'cat@loveplanner.com',
    password: '123456',
    username: 'whimsical_cat',
    displayName: 'Whimsical Cat',
    birthday: '1995-03-15'
  },
  cow: {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'cow@loveplanner.com', 
    password: '123456',
    username: 'whimsical_cow',
    displayName: 'Whimsical Cow',
    birthday: '1993-08-22'
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
      // 真实模式：通过 Supabase Auth 登录
      return this.loginWithSupabaseAuth(email, password);
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
      // 真实模式：通过 Supabase Auth 登录
      return this.loginWithSupabaseAuth(presetUser.email, presetUser.password);
    }
  },

  /**
   * 通过 Supabase Auth 真正登录
   */
  async loginWithSupabaseAuth(email: string, password: string) {
    try {
      // 使用 Supabase Auth 登录
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Supabase Auth 登录失败:', authError);
        throw new Error(`登录失败: ${authError.message}`);
      }

      if (!user) {
        throw new Error('登录失败：用户不存在');
      }

      // 获取用户档案
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('获取用户档案失败:', profileError);
        throw new Error('获取用户档案失败');
      }

      console.log('✅ Supabase Auth 登录成功:', user.email);
      
      // 保存到本地存储（为了保持状态）
      localStorage.setItem('preset_user', JSON.stringify(user));
      
      // 触发状态更新事件，让 useAuth hook 知道用户已登录
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('presetAuthChange', {
          detail: { user, profile }
        });
        window.dispatchEvent(event);
      }
      
      return { user, profile };
    } catch (error) {
      console.error('Supabase Auth 登录过程中发生错误:', error);
      throw error;
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

    const userInfo = getUserDisplayInfo(presetUser);
    const mockProfile = {
      id: presetUser.id,
      email: presetUser.email,
      username: presetUser.username,
      display_name: presetUser.displayName,
      birthday: presetUser.birthday,
      points: userInfo?.uiTheme === 'cat' ? 150 : 300,
      timezone: userInfo?.uiTheme === 'cat' ? 'Asia/Shanghai' : 'America/New_York'
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
      // 从数据库获取用户档案（使用邮箱查询，因为实际的UUID与预设不同）
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', presetUser.email)
        .single();

      if (error) {
        console.error('获取用户档案失败:', error);
        throw new Error('用户数据未找到，请确保已运行数据库迁移脚本');
      }

      // 创建用户对象（模拟Supabase Auth用户格式，使用真实的数据库ID）
      const user = {
        id: profile.id, // 使用数据库中的真实ID
        email: profile.email,
        user_metadata: {
          username: profile.username,
          display_name: profile.display_name,
          birthday: profile.birthday
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
