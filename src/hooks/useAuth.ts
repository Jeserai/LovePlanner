import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authService } from '../services/authService'

// 检查是否为演示模式
const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co' || 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                   process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 预设用户模式：支持演示模式和真实数据模式
    const checkPresetUser = () => {
      try {
        const currentUser = authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.warn('Preset user parse error:', error)
      }
      setLoading(false)
    }

    checkPresetUser()

    // 监听预设用户状态变化
    const handleDemoAuthChange = (event: any) => {
      if (event.detail) {
        setUser(event.detail.user)
      }
    }

    const handlePresetAuthChange = (event: any) => {
      if (event.detail) {
        setUser(event.detail.user)
      }
    }

    // 监听自定义事件
    if (typeof window !== 'undefined') {
      window.addEventListener('demoAuthChange', handleDemoAuthChange)
      window.addEventListener('presetAuthChange', handlePresetAuthChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('demoAuthChange', handleDemoAuthChange)
        window.removeEventListener('presetAuthChange', handlePresetAuthChange)
      }
    }
  }, [])

  const signOut = async () => {
    // 使用统一的认证服务处理登出
    await authService.logout()
    setUser(null)
  }

  return {
    user,
    loading,
    signOut,
  }
}
