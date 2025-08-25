import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// 检查环境变量是否正确配置
if (typeof window !== 'undefined' && (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key')) {
  console.warn('⚠️ Supabase环境变量未配置，请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY')
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
          role: 'cat' | 'cow'
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
          role: 'cat' | 'cow'
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
          role?: 'cat' | 'cow'
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
          cat_user_id: string
          cow_user_id: string
          relationship_started: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          cat_user_id: string
          cow_user_id: string
          relationship_started?: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          cat_user_id?: string
          cow_user_id?: string
          relationship_started?: string
          created_at?: string
          is_active?: boolean
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          deadline: string
          points: number
          status: 'recruiting' | 'assigned' | 'in-progress' | 'pending_review' | 'completed' | 'abandoned'
          creator_id: string
          assignee_id: string | null
          couple_id: string
          task_type: 'daily' | 'habit' | 'special'
          repeat_type: 'once' | 'repeat'
          requires_proof: boolean
          repeat_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          start_date: string | null
          end_date: string | null
          duration: '21days' | '1month' | '6months' | '1year' | null
          repeat_weekdays: number[]
          repeat_time: string | null
          has_specific_time: boolean
          task_start_time: string | null
          task_end_time: string | null
          proof_url: string | null
          proof_type: string | null
          submitted_at: string | null
          review_comment: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          deadline: string
          points: number
          status?: 'recruiting' | 'assigned' | 'in-progress' | 'pending_review' | 'completed' | 'abandoned'
          creator_id: string
          assignee_id?: string | null
          couple_id: string
          task_type: 'daily' | 'habit' | 'special'
          repeat_type?: 'once' | 'repeat'
          requires_proof?: boolean
          repeat_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          start_date?: string | null
          end_date?: string | null
          duration?: '21days' | '1month' | '6months' | '1year' | null
          repeat_weekdays?: number[]
          repeat_time?: string | null
          has_specific_time?: boolean
          task_start_time?: string | null
          task_end_time?: string | null
          proof_url?: string | null
          proof_type?: string | null
          submitted_at?: string | null
          review_comment?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          deadline?: string
          points?: number
          status?: 'recruiting' | 'assigned' | 'in-progress' | 'pending_review' | 'completed' | 'abandoned'
          creator_id?: string
          assignee_id?: string | null
          couple_id?: string
          task_type?: 'daily' | 'habit' | 'special'
          repeat_type?: 'once' | 'repeat'
          requires_proof?: boolean
          repeat_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          start_date?: string | null
          end_date?: string | null
          duration?: '21days' | '1month' | '6months' | '1year' | null
          repeat_weekdays?: number[]
          repeat_time?: string | null
          has_specific_time?: boolean
          task_start_time?: string | null
          task_end_time?: string | null
          proof_url?: string | null
          proof_type?: string | null
          submitted_at?: string | null
          review_comment?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          start_time: string | null
          end_time: string | null
          participants: string[]
          couple_id: string
          color: string
          is_all_day: boolean
          is_recurring: boolean
          recurrence_type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_end: string | null
          original_date: string | null
          parent_event_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          start_time?: string | null
          end_time?: string | null
          participants: string[]
          couple_id: string
          color?: string
          is_all_day?: boolean
          is_recurring?: boolean
          recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_end?: string | null
          original_date?: string | null
          parent_event_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string | null
          end_time?: string | null
          participants?: string[]
          couple_id?: string
          color?: string
          is_all_day?: boolean
          is_recurring?: boolean
          recurrence_type?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_end?: string | null
          original_date?: string | null
          parent_event_id?: string | null
          created_by?: string
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
