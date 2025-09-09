import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { ThemeButton, ThemeInput } from '../ui/Components';
import { useTranslation } from '../../utils/i18n';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoListProps {
  className?: string;
  onTodoDropped?: (todoId: string) => void;
  useSidebarLayout?: boolean;
}

export interface TodoListRef {
  removeTodo: (todoId: string) => void;
}

const TodoList = React.forwardRef<TodoListRef, TodoListProps>(({ className = '', onTodoDropped, useSidebarLayout = false }, ref) => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  
  // 输入框引用
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 🔧 从localStorage加载待办事项，如果没有则使用默认的测试数据
  const loadTodosFromStorage = (): TodoItem[] => {
    try {
      const stored = localStorage.getItem('calendar-todos');
      if (stored) {
        const parsedTodos = JSON.parse(stored);
        // 过滤掉测试数据
        const filteredTodos = parsedTodos.filter((todo: any) => 
          !todo.id.startsWith('test-') && 
          !todo.title.includes('测试') &&
          !todo.title.includes('🌅') &&
          !todo.title.includes('🌆') &&
          !todo.title.includes('准备会议材料') &&
          !todo.title.includes('已完成的任务')
        );
        // 转换createdAt字符串回Date对象
        return filteredTodos.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
      }
    } catch (error) {
      console.warn('加载待办事项失败:', error);
    }
    
    // 返回空数组，不再提供默认测试数据
    return [];
  };

  const [todos, setTodos] = useState<TodoItem[]>(loadTodosFromStorage);
  
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false); // 🔧 控制是否显示已完成项目
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const todoListRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);

  // 🔧 保存待办事项到localStorage
  const saveTodosToStorage = useCallback((todosToSave: TodoItem[]) => {
    try {
      localStorage.setItem('calendar-todos', JSON.stringify(todosToSave));
      // 待办事项已保存到localStorage
    } catch (error) {
      console.warn('保存待办事项失败:', error);
    }
  }, []);

  // 🔧 当todos变化时自动保存
  useEffect(() => {
    saveTodosToStorage(todos);
  }, [todos, saveTodosToStorage]);

  // 🔧 过滤和排序待办事项：默认隐藏已完成项目，已完成的显示在最下面
  const filteredTodos = useMemo(() => {
    const filtered = showCompleted ? todos : todos.filter(todo => !todo.completed);
    
    // 按完成状态和创建时间排序：未完成的在前面，已完成的在后面
    return filtered.sort((a, b) => {
      // 首先按完成状态排序：未完成的在前面
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // 同一完成状态内按创建时间倒序排列（最新的在前面）
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [todos, showCompleted]);

  // 添加新待办
  const handleAddTodo = useCallback(() => {
    if (newTodoTitle.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        title: newTodoTitle.trim(),
        completed: false,
        createdAt: new Date()
      };
      setTodos(prev => [...prev, newTodo]);
      setNewTodoTitle('');
      setShowAddForm(false);
    }
  }, [newTodoTitle]);

  // 开始编辑待办事项
  const handleStartEdit = useCallback((todo: TodoItem) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }, []);

  // 保存编辑
  const handleSaveEdit = useCallback(() => {
    if (editingTitle.trim() && editingId) {
      setTodos(prev => prev.map(todo => 
        todo.id === editingId 
          ? { ...todo, title: editingTitle.trim() }
          : todo
      ));
      setEditingId(null);
      setEditingTitle('');
    }
  }, [editingId, editingTitle]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingTitle('');
  }, []);

  // 切换完成状态
  const handleToggleComplete = useCallback((id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, []);

  // 删除待办
  const handleDeleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  // 处理待办事项被拖拽后的移除
  const handleTodoDropped = useCallback((todoId: string) => {
    handleDeleteTodo(todoId);
    if (onTodoDropped) {
      onTodoDropped(todoId);
    }
  }, [handleDeleteTodo, onTodoDropped]);

  // 暴露给父组件的方法
  React.useImperativeHandle(ref, () => ({
    removeTodo: handleTodoDropped
  }), [handleTodoDropped]);

  // 初始化FullCalendar Draggable
  useEffect(() => {
    if (todoListRef.current) {
      // 清理之前的draggable实例
      if (draggableRef.current) {
        draggableRef.current.destroy();
      }

      // 创建新的FullCalendar Draggable实例
      draggableRef.current = new Draggable(todoListRef.current, {
        itemSelector: '.todo-draggable',
        eventData: function(eventEl) {
          const todoId = eventEl.getAttribute('data-todo-id');
          const todoTitle = eventEl.getAttribute('data-todo-title');
          
          console.log('🎯 Draggable创建事件数据:', {
            todoId,
            todoTitle,
            当前时区: Intl.DateTimeFormat().resolvedOptions().timeZone,
            时区偏移: new Date().getTimezoneOffset()
          });
          
          return {
            title: todoTitle || '待办事项',
            duration: '01:00', // 默认1小时
            description: `从待办事项创建: ${todoTitle}`,
            // 不设置具体时间，让FullCalendar根据拖拽位置确定
            extendedProps: {
              todoId: todoId,
              fromTodo: true
            }
          };
        }
      });

      // FullCalendar Draggable 初始化完成
    }

    // 清理函数
    return () => {
      if (draggableRef.current) {
        draggableRef.current.destroy();
        draggableRef.current = null;
      }
    };
  }, [todos]); // 当todos变化时重新初始化

  return (
    <Card 
      className={`p-4 ${className} flex flex-col`}
      style={{
        height: useSidebarLayout 
          ? 'calc(100vh - 2rem)' // 侧边栏布局：与TaskBoard一致
          : 'calc(100vh - 5rem)' // 顶部导航布局：与TaskBoard一致
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${
          theme === 'pixel' ? 'font-mono text-green-400' : 'text-foreground'
        }`}>
          {theme === 'pixel' ? 'TODO_LIST.EXE' : t('todo_list')}
        </h3>
        <div className="flex items-center space-x-2">
          {/* 🔧 显示/隐藏已完成项目按钮 */}
          <ThemeButton
            onClick={() => setShowCompleted(!showCompleted)}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            {showCompleted 
              ? (theme === 'pixel' ? 'HIDE_DONE' : t('hide_completed')) 
              : (theme === 'pixel' ? 'SHOW_DONE' : t('show_completed'))
            }
          </ThemeButton>
          <ThemeButton
            onClick={() => {
              setShowAddForm(!showAddForm);
              // 延迟focus，确保DOM已更新
              setTimeout(() => {
                if (!showAddForm) {
                  inputRef.current?.focus();
                }
              }, 0);
            }}
            variant="secondary"
            size="sm"
          >
            {theme === 'pixel' ? 'ADD' : t('add')}
          </ThemeButton>
        </div>
      </div>
      
      {/* 添加待办表单 */}
      {showAddForm && (
        <div className="mb-4 space-y-2">
          <ThemeInput
            ref={inputRef}
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder={theme === 'pixel' ? 'ENTER_TODO_TITLE' : '输入待办事项'}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTodo();
              }
            }}
          />
          <div className="flex space-x-2">
            <ThemeButton
              onClick={handleAddTodo}
              variant="primary"
              size="sm"
              disabled={!newTodoTitle.trim()}
            >
              {theme === 'pixel' ? 'SAVE' : '保存'}
            </ThemeButton>
            <ThemeButton
              onClick={() => {
                setShowAddForm(false);
                setNewTodoTitle('');
              }}
              variant="secondary"
              size="sm"
            >
              {theme === 'pixel' ? 'CANCEL' : '取消'}
            </ThemeButton>
          </div>
        </div>
      )}
      
      {/* 待办事项列表 */}
      <div 
        ref={todoListRef} 
        className="space-y-2 overflow-y-auto auto-hide-scrollbar flex-1"
      >
        {filteredTodos.length === 0 ? (
          <div className={`text-sm text-center py-8 ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-muted-foreground'
          }`}>
            {showCompleted 
              ? (theme === 'pixel' ? 'NO_TODOS_FOUND' : t('no_todos'))
              : (theme === 'pixel' ? 'NO_PENDING_TODOS' : t('no_pending_todos'))
            }
            <br />
            <span className="text-xs">
              {!showCompleted && todos.some(t => t.completed) 
                ? (theme === 'pixel' ? 'CLICK_SHOW_DONE' : t('click_show_done'))
                : (theme === 'pixel' ? 'DRAG_TO_CALENDAR' : language === 'zh' ? '拖拽到日历创建日程' : 'Drag to calendar to create events')
              }
            </span>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`
                todo-draggable group flex items-center justify-between p-3 rounded-lg border
                ${todo.completed ? 'opacity-60' : 'cursor-move'}
                ${theme === 'pixel' 
                  ? 'border-pixel-border bg-pixel-panel hover:bg-pixel-hover' 
                  : 'border-border bg-card hover:bg-accent/50'
                }
                ${!todo.completed ? 'hover:shadow-md transition-all duration-200' : ''}
              `}
              data-todo-id={todo.id}
              data-todo-title={todo.title}
              style={{
                pointerEvents: todo.completed ? 'none' : 'auto'
              }}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div style={{ pointerEvents: 'auto' }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo.id)}
                    className="w-4 h-4 rounded"
                  />
                </div>
                {editingId === todo.id ? (
                  <ThemeInput
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="flex-1"
                    autoFocus
                  />
                ) : (
                  <span 
                    className={`
                      ${todo.completed ? 'line-through' : 'cursor-pointer'}
                      ${theme === 'pixel' ? 'font-mono text-sm' : 'text-sm'}
                      truncate flex-1 hover:text-primary
                    `}
                    onClick={() => !todo.completed && handleStartEdit(todo)}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {todo.title}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {editingId === todo.id ? (
                  <div className="flex space-x-1" style={{ pointerEvents: 'auto' }}>
                    <ThemeButton
                      onClick={handleSaveEdit}
                      variant="primary"
                      size="sm"
                    >
                      {theme === 'pixel' ? 'SAVE' : '保存'}
                    </ThemeButton>
                    <ThemeButton
                      onClick={handleCancelEdit}
                      variant="secondary"
                      size="sm"
                    >
                      {theme === 'pixel' ? 'CANCEL' : '取消'}
                    </ThemeButton>
                  </div>
                ) : (
                  <>
                    {!todo.completed && (
                      <span className={`text-xs ${
                        theme === 'pixel' ? 'text-pixel-textMuted' : 'text-muted-foreground'
                      } opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {theme === 'pixel' ? 'DRAG' : t('drag')}
                      </span>
                    )}
                    <div style={{ pointerEvents: 'auto' }}>
                      <ThemeButton
                        onClick={() => handleDeleteTodo(todo.id)}
                        variant="secondary"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {theme === 'pixel' ? 'DEL' : t('delete')}
                      </ThemeButton>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
});

TodoList.displayName = 'TodoList';

export default TodoList;
