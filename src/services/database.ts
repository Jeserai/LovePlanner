import { supabase, Database } from '../lib/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Event = Database['public']['Tables']['events']['Row']
type Couple = Database['public']['Tables']['couples']['Row']

// 用户相关操作
export const userService = {
  // 获取用户档案
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  },

  // 更新用户档案
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user profile:', error)
      return false
    }

    return true
  },

  // 获取情侣关系
  async getCoupleRelation(userId: string): Promise<Couple | null> {
    const { data, error } = await supabase
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      } else {
        console.error('查询情侣关系失败:', error);
        return null;
      }
    }

    return data
  },

  // 获取情侣关系详细信息（包含伴侣信息）
  async getCoupleRelationDetails(userId: string) {
    const { data, error } = await supabase.rpc('get_couple_relation', {
      user_id: userId
    });

    if (error) {
      console.error('Error fetching couple relation details:', error)
      return null
    }

    return data?.[0] || null
  },

  // 创建情侣关系
  async createCoupleRelation(user1Id: string, user2Id: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('create_couple_relationship', {
      user1_id: user1Id,
      user2_id: user2Id
    });

    if (error) {
      console.error('Error creating couple relation:', error)
      return null
    }

    return data
  },

  // 获取情侣中的所有用户
  async getCoupleUsers(coupleId: string) {
    try {
      // 首先获取couple关系
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('user1_id, user2_id')
        .eq('id', coupleId)
        .eq('is_active', true)
        .single();

      if (coupleError) {
        console.error('获取情侣数据失败:', coupleError);
        return [];
      }

      if (!coupleData) {
        return [];
      }

      // 然后分别查询两个用户的信息，保持couples表中的顺序
      const users = [];
      let user1 = null;
      let user2 = null;
      
      // 查询 user1 (couples表中的user1_id)
      if (coupleData.user1_id) {
        const { data: user1Data, error: user1Error } = await supabase
          .from('user_profiles')
          .select('id, email, display_name, birthday')
          .eq('id', coupleData.user1_id)
          .single();
          
        if (user1Error) {
          console.error('获取用户1失败:', user1Error);
        } else if (user1Data) {
          user1 = user1Data;
        }
      }

      // 查询 user2 (couples表中的user2_id)
      if (coupleData.user2_id) {
        const { data: user2Data, error: user2Error } = await supabase
          .from('user_profiles')
          .select('id, email, display_name, birthday')
          .eq('id', coupleData.user2_id)
          .single();
          
        if (user2Error) {
          console.error('获取用户2失败:', user2Error);
        } else if (user2Data) {
          user2 = user2Data;
        }
      }

      // 按照couples表的顺序返回：[user1, user2]
      if (user1) users.push(user1);
      if (user2) users.push(user2);

      return users;
    } catch (error) {
      console.error('getCoupleUsers错误:', error);
      return [];
    }
  }
}

// 🚫 避免循环依赖：不在此处重新导出其他服务
// 请直接从对应的服务文件导入：
// - eventService from './eventService'
// - taskService from './taskService'
// - pointService from './userService' (积分相关操作已移至 userService)
