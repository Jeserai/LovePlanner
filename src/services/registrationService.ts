import { supabase } from '../lib/supabase';

export interface RegistrationData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  birthday: string | null;
}

/**
 * 用户注册服务
 */
/**
 * 验证用户名格式
 */
const validateUsername = (username: string) => {
  if (!username) {
    throw new Error('用户名不能为空');
  }
  
  if (username.length < 3) {
    throw new Error('用户名长度至少需要3位字符');
  }

  if (username.length > 20) {
    throw new Error('用户名长度不能超过20个字符');
  }

  // 检查是否包含空格
  if (/\s/.test(username)) {
    throw new Error('用户名不能包含空格');
  }

  // 检查是否只包含允许的字符：字母、数字、下划线、连字符
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    throw new Error('用户名只能包含字母、数字、下划线和连字符');
  }

  // 不能以数字、下划线或连字符开头
  if (/^[0-9_-]/.test(username)) {
    throw new Error('用户名不能以数字、下划线或连字符开头');
  }

  return true;
};

export const registrationService = {
  /**
   * 注册新用户
   */
  async registerUser(data: RegistrationData) {
    try {
      // 1. 验证用户名格式
      validateUsername(data.username);

      // 2. 检查用户名是否已存在
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', data.username)
        .single();

      // 如果找到了用户名记录，说明用户名已被使用
      if (existingProfile) {
        throw new Error('用户名已被使用，请选择其他用户名');
      }

      // 如果查询出错但不是"未找到记录"的错误，说明有其他问题
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('检查用户名时发生错误:', checkError);
        throw new Error('检查用户名失败，请重试');
      }

      // checkError.code === 'PGRST116' 表示没有找到记录，这是我们期望的情况（用户名可用）

      // 2. 使用 Supabase Auth 注册用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            display_name: data.displayName,
            birthday: data.birthday,
          }
        }
      });

      if (authError) {
        console.error('Supabase Auth 注册失败:', authError);
        
        // 处理常见错误
        if (authError.message.includes('already registered')) {
          throw new Error('该邮箱已被注册，请使用其他邮箱或尝试登录');
        }
        if (authError.message.includes('Password should be')) {
          throw new Error('密码强度不够，请使用至少6位字符的密码');
        }
        if (authError.message.includes('Invalid email')) {
          throw new Error('邮箱格式不正确');
        }
        
        throw new Error(`注册失败: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('注册失败：用户创建失败');
      }

      console.log('Supabase Auth 注册成功，用户ID:', authData.user.id);
      console.log('用户邮箱验证状态:', authData.user.email_confirmed);
      
      // 暂存用户注册数据，在邮箱验证成功后创建档案
      if (!authData.user.email_confirmed) {
        const tempUserData = {
          username: data.username,
          display_name: data.displayName,
          birthday: data.birthday,
        };
        localStorage.setItem(`temp_user_data_${authData.user.id}`, JSON.stringify(tempUserData));
      }

      return { 
        user: authData.user, 
        profile: null, // 档案将在邮箱验证后创建
        needsEmailVerification: !authData.user.email_confirmed
      };

    } catch (error) {
      console.error('注册过程中发生错误:', error);
      throw error;
    }
  },

  /**
   * 重新发送验证邮件
   */
  async resendVerificationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('重新发送验证邮件失败:', error);
        throw new Error(`发送验证邮件失败: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('重新发送验证邮件过程中发生错误:', error);
      throw error;
    }
  },

  /**
   * 验证用户名是否可用
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      // 首先验证用户名格式
      validateUsername(username);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // 没有找到记录，用户名可用
        return true;
      }

      if (error) {
        console.error('检查用户名可用性失败:', error);
        throw new Error('检查用户名失败，请重试');
      }

      // 找到记录，用户名不可用
      return false;
    } catch (error) {
      console.error('检查用户名可用性过程中发生错误:', error);
      throw error;
    }
  },

  /**
   * 验证邮箱是否已注册
   */
  async checkEmailRegistered(email: string): Promise<boolean> {
    try {
      // 注意：由于安全原因，Supabase 不会直接告诉我们邮箱是否已注册
      // 这个方法主要用于客户端提前检查，实际验证还是在注册时进行
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (error && error.code === 'PGRST116') {
        // 没有找到记录，邮箱未注册
        return false;
      }

      if (error) {
        console.error('检查邮箱注册状态失败:', error);
        // 不抛出错误，返回 false 让注册流程继续
        return false;
      }

      // 找到记录，邮箱已注册
      return true;
    } catch (error) {
      console.error('检查邮箱注册状态过程中发生错误:', error);
      return false;
    }
  },

  /**
   * 处理邮箱验证回调
   */
  async handleEmailVerification() {
    try {
      // 获取当前会话状态
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('获取会话状态失败:', error);
        throw new Error('验证状态检查失败');
      }

      if (!session || !session.user) {
        throw new Error('用户会话不存在');
      }

      if (!session.user.email_confirmed) {
        throw new Error('邮箱尚未验证');
      }

      // 获取用户档案
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // 档案不存在，需要创建
          console.log('用户档案不存在，尝试创建');
          
          // 从 localStorage 获取临时用户数据
          const tempDataKey = `temp_user_data_${session.user.id}`;
          const tempDataStr = localStorage.getItem(tempDataKey);
          
          if (!tempDataStr) {
            throw new Error('找不到用户注册信息，请重新注册');
          }
          
          const tempUserData = JSON.parse(tempDataStr);
          
          // 构建档案数据
          const now = new Date().toISOString();
          const profileData = {
            id: session.user.id,
            email: session.user.email!,
            username: tempUserData.username,
            display_name: tempUserData.display_name,
            avatar_url: null,
            birthday: tempUserData.birthday,
            points: 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            created_at: now,
            updated_at: now,
            last_login: null,
            is_active: true,
          };
          
          console.log('创建用户档案，数据:', profileData);
          
          // 创建用户档案
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert(profileData)
            .select()
            .single();
          
          if (createError) {
            console.error('创建用户档案失败:', createError);
            
            // 处理特定错误
            if (createError.code === '23505') {
              throw new Error('用户名已被使用，请联系管理员');
            } else if (createError.code === '23502') {
              throw new Error('用户信息不完整，请重新注册');
            }
            
            throw new Error(`创建用户档案失败: ${createError.message}`);
          }
          
          // 清理临时数据
          localStorage.removeItem(tempDataKey);
          
          console.log('用户档案创建成功');
          return { user: session.user, profile: newProfile };
          
        } else {
          console.error('获取用户档案失败:', profileError);
          throw new Error(`获取用户档案失败: ${profileError.message}`);
        }
      }

      return { user: session.user, profile };

    } catch (error) {
      console.error('处理邮箱验证过程中发生错误:', error);
      throw error;
    }
  }
};
