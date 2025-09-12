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



/**
 * 预设用户登录服务
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

    // 通过 Supabase Auth 登录
    return this.loginWithSupabaseAuth(email, password);
  },

  /**
   * 快速登录预设用户
   */
  async quickLogin(userType: 'cat' | 'cow') {
    const presetUser = PRESET_USERS[userType];
    
    // 通过 Supabase Auth 登录
    return this.loginWithSupabaseAuth(presetUser.email, presetUser.password);
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
    // 清理本地存储的用户数据
    localStorage.removeItem('preset_user');
    
    // 调用 Supabase 登出
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase logout error:', error);
      throw error;
    }
    
    return { success: true };
  },

  /**
   * 获取当前用户状态
   */
  getCurrentUser() {
    try {
      const savedUser = localStorage.getItem('preset_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {

      return null;
    }
  },

  /**
   * 修改密码
   */
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      // 获取当前用户
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      // 获取当前 Supabase 会话
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('用户会话已过期，请重新登录');
      }

      const userEmail = session.user.email;
      if (!userEmail) {
        throw new Error('无法获取用户邮箱');
      }

      // 验证当前密码：通过重新登录验证
      try {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword
        });

        if (verifyError) {
          throw new Error('当前密码错误');
        }
      } catch (verifyError: any) {
        console.error('验证当前密码失败:', verifyError);
        throw new Error('当前密码错误');
      }

      // 使用 Supabase Auth 更新密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('Supabase 密码更新失败:', updateError);
        throw new Error(`密码更新失败: ${updateError.message}`);
      }

      console.log('✅ 密码修改成功');
      
      return {
        success: true,
        message: '密码修改成功'
      };

    } catch (error: any) {
      console.error('修改密码失败:', error);
      throw new Error(error.message || '修改密码失败');
    }
  },

  /**
   * 验证密码强度
   */
  validatePasswordStrength(password: string) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];
    
    if (password.length < minLength) {
      errors.push(`密码长度至少${minLength}位`);
    }
    
    if (!hasUpperCase) {
      errors.push('需要包含大写字母');
    }
    
    if (!hasLowerCase) {
      errors.push('需要包含小写字母');
    }
    
    if (!hasNumbers) {
      errors.push('需要包含数字');
    }
    
    if (!hasSpecialChar) {
      errors.push('需要包含特殊字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  },

  /**
   * 计算密码强度（0-100）
   */
  calculatePasswordStrength(password: string): number {
    let score = 0;
    
    // 长度分数 (0-30分)
    if (password.length >= 8) score += 15;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 5;
    
    // 字符类型分数 (0-40分)
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    
    // 复杂度分数 (0-30分)
    if (password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
      score += 30;
    } else if (password.length >= 10 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      score += 20;
    } else if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      score += 10;
    }
    
    return Math.min(100, score);
  }
};
