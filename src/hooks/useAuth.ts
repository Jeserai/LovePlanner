import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authService } from '../services/authService'



export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 预设用户模式
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
    const handlePresetAuthChange = (event: any) => {
      if (event.detail) {
        setUser(event.detail.user)
      }
    }

    // 监听自定义事件
    if (typeof window !== 'undefined') {
      window.addEventListener('presetAuthChange', handlePresetAuthChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
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
