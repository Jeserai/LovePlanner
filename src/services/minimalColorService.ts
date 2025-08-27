import { supabase } from '../lib/supabase';

export interface CoupleColors {
  user1Color: string;
  user2Color: string;
  sharedColor: string;
}

/**
 * 最简化的颜色服务
 * 只管理情侣级别的固定颜色配置
 */
export const minimalColorService = {
  /**
   * 获取情侣的颜色配置
   */
  async getCoupleColors(coupleId: string): Promise<CoupleColors | null> {
    const { data, error } = await supabase
      .from('couples')
      .select('user1_color, user2_color, shared_color')
      .eq('id', coupleId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching couple colors:', error);
      return null;
    }

    return {
      user1Color: data.user1_color || '#06b6d4',
      user2Color: data.user2_color || '#8b5cf6',
      sharedColor: data.shared_color || '#10b981'
    };
  },

  /**
   * 更新情侣的颜色配置
   */
  async updateCoupleColors(coupleId: string, colors: CoupleColors): Promise<boolean> {
    const { error } = await supabase
      .from('couples')
      .update({
        user1_color: colors.user1Color,
        user2_color: colors.user2Color,
        shared_color: colors.sharedColor
      })
      .eq('id', coupleId);

    if (error) {
      console.error('Error updating couple colors:', error);
      return false;
    }

    return true;
  },

  /**
   * 获取用户在情侣关系中的颜色
   */
  async getUserColorInCouple(userId: string, coupleId: string): Promise<string> {
    const { data, error } = await supabase.rpc('get_user_color_in_couple', {
      p_user_id: userId,
      p_couple_id: coupleId
    });

    if (error) {
      console.error('Error fetching user color:', error);
      return '#6b7280'; // 默认灰色
    }

    return data || '#6b7280';
  },

  /**
   * 获取默认颜色配置（用于演示模式或错误时）
   */
  getDefaultColors(): CoupleColors {
    return {
      user1Color: '#06b6d4', // 经典蓝色
      user2Color: '#8b5cf6', // 经典紫色
      sharedColor: '#10b981' // 经典绿色
    };
  },

  /**
   * 根据用户在情侣关系中的位置获取颜色
   * @param isUser1 当前用户是否为user1
   * @param colors 情侣颜色配置
   */
  getUserColorByPosition(isUser1: boolean, colors: CoupleColors): string {
    return isUser1 ? colors.user1Color : colors.user2Color;
  },

  /**
   * 根据用户在情侣关系中的位置获取伴侣颜色
   * @param isUser1 当前用户是否为user1
   * @param colors 情侣颜色配置
   */
  getPartnerColorByPosition(isUser1: boolean, colors: CoupleColors): string {
    return isUser1 ? colors.user2Color : colors.user1Color;
  },

  /**
   * 判断事件参与者并返回对应颜色
   * @param participants 事件参与者
   * @param user1Id 用户1 ID
   * @param user2Id 用户2 ID
   * @param colors 情侣颜色配置
   * @param eventIncludesUser 判断事件是否包含用户的函数
   */
  getEventColor(
    participants: (string | 'cat' | 'cow')[],
    user1Id: string,
    user2Id: string,
    colors: CoupleColors,
    eventIncludesUser: (event: any, userId: string) => boolean
  ): string {
    const hasUser1 = eventIncludesUser({ participants } as any, user1Id);
    const hasUser2 = eventIncludesUser({ participants } as any, user2Id);

    if (hasUser1 && hasUser2) {
      return colors.sharedColor; // 共同事件
    } else if (hasUser1) {
      return colors.user1Color; // 用户1的事件
    } else if (hasUser2) {
      return colors.user2Color; // 用户2的事件
    }

    return '#6b7280'; // 默认颜色
  }
};
