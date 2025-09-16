import { useState, useEffect, useCallback } from 'react'

/**
 * 安全的localStorage hook
 * 解决SSR、hydration和时机问题
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
  }
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  
  const serialize = options?.serialize || JSON.stringify
  const deserialize = options?.deserialize || JSON.parse

  // 安全读取localStorage的函数
  const readFromStorage = useCallback((): T => {
    try {
      // 确保在客户端环境
      if (typeof window === 'undefined') {
        return initialValue
      }

      const item = window.localStorage.getItem(key)
      if (item === null) {
        return initialValue
      }

      // 对于字符串类型，直接返回而不解析JSON
      if (typeof initialValue === 'string') {
        return item as T
      }

      // 对于其他类型，尝试解析JSON
      return deserialize(item)
    } catch (error) {
      console.warn(`读取localStorage键 "${key}" 失败:`, error)
      return initialValue
    }
  }, [key, initialValue, deserialize])

  // 安全写入localStorage的函数
  const writeToStorage = useCallback((value: T): void => {
    try {
      // 确保在客户端环境
      if (typeof window === 'undefined') {
        console.warn('尝试在服务端写入localStorage')
        return
      }

      // 对于字符串类型，直接存储
      if (typeof value === 'string') {
        window.localStorage.setItem(key, value as string)
      } else {
        window.localStorage.setItem(key, serialize(value))
      }
    } catch (error) {
      console.error(`写入localStorage键 "${key}" 失败:`, error)
    }
  }, [key, serialize])

  // 使用useState，初始值始终为initialValue避免hydration问题
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // 客户端hydration后读取localStorage
  useEffect(() => {
    setIsHydrated(true)
    const value = readFromStorage()
    setStoredValue(value)
  }, [readFromStorage])

  // 设置值的函数
  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    try {
      // 支持函数式更新
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // 更新状态
      setStoredValue(valueToStore)
      
      // 写入localStorage
      writeToStorage(valueToStore)
      
      // 触发自定义事件，通知其他组件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { key, newValue: valueToStore }
        }))
      }
    } catch (error) {
      console.error(`设置localStorage键 "${key}" 失败:`, error)
    }
  }, [key, storedValue, writeToStorage])

  // 清除值的函数
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        setStoredValue(initialValue)
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { key, newValue: initialValue }
        }))
      }
    } catch (error) {
      console.error(`清除localStorage键 "${key}" 失败:`, error)
    }
  }, [key, initialValue])

  // 监听其他组件的localStorage变化
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = typeof initialValue === 'string' 
            ? e.newValue as T 
            : deserialize(e.newValue)
          setStoredValue(newValue)
        } catch (error) {
          console.warn(`解析localStorage变化失败:`, error)
        }
      }
    }

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener)
    }
  }, [key, deserialize, initialValue])

  // 始终返回storedValue，避免hydration不一致
  return [storedValue, setValue, removeValue]
}

/**
 * 专门用于布局设置的localStorage hook
 */
export function useLayoutStorage() {
  const [sidebarLayout, setSidebarLayout] = useLocalStorage('sidebarLayout', 'true')
  const [todoListWidth, setTodoListWidth] = useLocalStorage('todoListWidth', '300')
  const [theme, setTheme] = useLocalStorage('theme', 'modern')
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', 'false')
  const [language, setLanguage] = useLocalStorage('language', 'zh')

  return {
    // 布局设置
    useSidebarLayout: sidebarLayout === 'true',
    setUseSidebarLayout: (value: boolean) => setSidebarLayout(value ? 'true' : 'false'),
    
    // 待办列表宽度
    todoListWidth: parseInt(todoListWidth, 10) || 300,
    setTodoListWidth: (value: number) => setTodoListWidth(value.toString()),
    
    // 主题设置
    theme: theme as 'modern' | 'pixel',
    setTheme: (value: 'modern' | 'pixel') => setTheme(value),
    
    // 深色模式
    isDarkMode: darkMode === 'true',
    setDarkMode: (value: boolean) => setDarkMode(value ? 'true' : 'false'),
    
    // 语言设置
    language: language as 'zh' | 'en',
    setLanguage: (value: 'zh' | 'en') => setLanguage(value),

    // 清除所有布局设置
    clearAllSettings: () => {
      setSidebarLayout('true')
      setTodoListWidth('300')
      setTheme('modern')
      setDarkMode('false')
      setLanguage('zh')
    }
  }
}
