import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// 检查环境变量是否正确配置
if (typeof window !== 'undefined' && (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key')) {
  // Supabase环境变量未配置
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 数据库类型定义
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string
          avatar_url: string | null
          birthday: string | null
          points: number
          timezone: string
          created_at: string
          updated_at: string
          last_login: string | null
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          username: string
          display_name: string
          avatar_url?: string | null
          birthday?: string | null
          points?: number
          timezone?: string
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          birthday?: string | null
          points?: number
          timezone?: string
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_active?: boolean
        }
      }
      couples: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          relationship_started: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          relationship_started?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          relationship_started?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          points: number
          creator_id: string
          couple_id: string
          task_type: 'daily' | 'habit' | 'special'
          repeat_frequency: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever'
          earliest_start_time: string | null
          required_count: number | null
          task_deadline: string | null
          repeat_weekdays: number[] | null
          daily_time_start: string | null
          daily_time_end: string | null
          status: 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned' | 'pending_review'
          assignee_id: string | null
          completed_count: number
          current_streak: number
          longest_streak: number
          completion_record: any
          requires_proof: boolean
          proof_url: string | null
          review_comment: string | null
          created_at: string
          updated_at: string
          submitted_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          points?: number
          creator_id: string
          couple_id: string
          task_type?: 'daily' | 'habit' | 'special'
          repeat_frequency?: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever'
          earliest_start_time?: string | null
          required_count?: number | null
          task_deadline?: string | null
          repeat_weekdays?: number[] | null
          daily_time_start?: string | null
          daily_time_end?: string | null
          status?: 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned' | 'pending_review'
          assignee_id?: string | null
          completed_count?: number
          current_streak?: number
          longest_streak?: number
          completion_record?: any
          requires_proof?: boolean
          proof_url?: string | null
          review_comment?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          points?: number
          creator_id?: string
          couple_id?: string
          task_type?: 'daily' | 'habit' | 'special'
          repeat_frequency?: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'forever'
          earliest_start_time?: string | null
          required_count?: number | null
          task_deadline?: string | null
          repeat_weekdays?: number[] | null
          daily_time_start?: string | null
          daily_time_end?: string | null
          status?: 'recruiting' | 'assigned' | 'in_progress' | 'completed' | 'abandoned' | 'pending_review'
          assignee_id?: string | null
          completed_count?: number
          current_streak?: number
          longest_streak?: number
          completion_record?: any
          requires_proof?: boolean
          proof_url?: string | null
          review_comment?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          completed_at?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          // 🗑️ 移除event_date字段，避免时区混淆
          start_datetime: string | null         // 🔧 修复：使用正确的字段名
          end_datetime: string | null           // 🔧 修复：使用正确的字段名
          is_all_day: boolean
          location: string | null
          is_recurring: boolean
          recurrence_type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_end: string | null
          original_date: string | null
          excluded_dates: string[] | null
          modified_instances: Record<string, any> | null
          created_by: string
          includes_user1: boolean               // 🔧 修复：添加缺失字段
          includes_user2: boolean               // 🔧 修复：添加缺失字段
          couple_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          // 🗑️ 移除event_date字段
          start_datetime?: string | null        // 🔧 修复：使用正确的字段名
          end_datetime?: string | null          // 🔧 修复：使用正确的字段名
          is_all_day?: boolean
          location?: string | null
          is_recurring?: boolean
          recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_end?: string | null
          original_date?: string | null
          excluded_dates?: string[] | null
          modified_instances?: Record<string, any> | null
          created_by: string
          includes_user1?: boolean              // 🔧 修复：添加缺失字段
          includes_user2?: boolean              // 🔧 修复：添加缺失字段
          couple_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          // 🗑️ 移除event_date字段
          start_datetime?: string | null        // 🔧 修复：使用正确的字段名
          end_datetime?: string | null          // 🔧 修复：使用正确的字段名
          is_all_day?: boolean
          location?: string | null
          is_recurring?: boolean
          recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_end?: string | null
          original_date?: string | null
          excluded_dates?: string[] | null
          modified_instances?: Record<string, any> | null
          created_by?: string
          includes_user1?: boolean              // 🔧 修复：添加缺失字段
          includes_user2?: boolean              // 🔧 修复：添加缺失字段
          couple_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      point_transactions: {
        Row: {
          id: string
          user_id: string
          couple_id: string
          amount: number
          transaction_type: string
          description: string
          related_task_id: string | null
          related_purchase_id: string | null
          balance_before: number
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          couple_id: string
          amount: number
          transaction_type: string
          description: string
          related_task_id?: string | null
          related_purchase_id?: string | null
          balance_before: number
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          couple_id?: string
          amount?: number
          transaction_type?: string
          description?: string
          related_task_id?: string | null
          related_purchase_id?: string | null
          balance_before?: number
          balance_after?: number
          created_at?: string
        }
      }
      shop_items: {
        Row: {
          id: string
          name: string
          description: string | null
          category: 'time' | 'service' | 'gifts' | 'experience'
          price: number
          image_url: string | null
          owner_id: string
          couple_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: 'time' | 'service' | 'gifts' | 'experience'
          price: number
          image_url?: string | null
          owner_id: string
          couple_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'time' | 'service' | 'gifts' | 'experience'
          price?: number
          image_url?: string | null
          owner_id?: string
          couple_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          buyer_id: string
          item_id: string
          couple_id: string
          price_paid: number
          status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'
          notes: string | null
          purchased_at: string
          fulfilled_at: string | null
        }
        Insert: {
          id?: string
          buyer_id: string
          item_id: string
          couple_id: string
          price_paid: number
          status?: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'
          notes?: string | null
          purchased_at?: string
          fulfilled_at?: string | null
        }
        Update: {
          id?: string
          buyer_id?: string
          item_id?: string
          couple_id?: string
          price_paid?: number
          status?: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'
          notes?: string | null
          purchased_at?: string
          fulfilled_at?: string | null
        }
      }
    }
    Views: {
      user_task_stats: {
        Row: {
          user_id: string
          display_name: string
          role: 'cat' | 'cow'
          points: number
          completed_tasks: number
          active_tasks: number
          abandoned_tasks: number
          total_points_earned: number
        }
      }
    }
  }
}
