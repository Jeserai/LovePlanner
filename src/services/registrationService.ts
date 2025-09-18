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
export const registrationService = {
  /**
   * 注册新用户
   */
  async registerUser(data: RegistrationData) {
    try {
      // 1. 检查用户名是否已存在
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

      // 3. 创建用户档案（如果 Auth 触发器没有自动创建）
      const profileData = {
        id: authData.user.id,
        email: data.email,
        username: data.username,
        display_name: data.displayName,
        birthday: data.birthday,
        points: 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_active: true,
      };

      // 尝试获取现有档案（触发器可能已创建）
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // 档案不存在，手动创建
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          console.error('创建用户档案失败:', createError);
          throw new Error('创建用户档案失败，请重试');
        }

        profile = newProfile;
      } else if (profileError) {
        console.error('获取用户档案失败:', profileError);
        throw new Error('获取用户档案失败');
      } else {
        // 档案存在，更新信息
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            username: data.username,
            display_name: data.displayName,
            birthday: data.birthday,
          })
          .eq('id', authData.user.id)
          .select()
          .single();

        if (updateError) {
          console.error('更新用户档案失败:', updateError);
          // 不抛出错误，因为基本注册已成功
        } else {
          profile = updatedProfile;
        }
      }

      return { 
        user: authData.user, 
        profile,
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
        console.error('获取用户档案失败:', profileError);
        throw new Error('获取用户档案失败');
      }

      return { user: session.user, profile };

    } catch (error) {
      console.error('处理邮箱验证过程中发生错误:', error);
      throw error;
    }
  }
};
