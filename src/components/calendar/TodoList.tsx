import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import Button from '../ui/Button';
import { ThemeButton, ThemeInput } from '../ui/Components';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoListProps {
  className?: string;
  onTodoDropped?: (todoId: string) => void;
}

export interface TodoListRef {
  removeTodo: (todoId: string) => void;
}

const TodoList = React.forwardRef<TodoListRef, TodoListProps>(({ className = '', onTodoDropped }, ref) => {
  const { theme } = useTheme();
  
  // 🔧 从localStorage加载待办事项，如果没有则使用默认的测试数据
  const loadTodosFromStorage = (): TodoItem[] => {
    try {
      const stored = localStorage.getItem('calendar-todos');
      if (stored) {
        const parsedTodos = JSON.parse(stored);
        // 转换createdAt字符串回Date对象
        return parsedTodos.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
      }
    } catch (error) {
      console.warn('加载待办事项失败:', error);
    }
    
    // 返回默认的测试待办事项
    return [
      {
        id: 'test-morning-7',
        title: '🌅 测试早上7点拖拽',
        completed: false,
        createdAt: new Date()
      },
      {
        id: 'test-evening-18',
        title: '🌆 测试下午18点拖拽',
        completed: false,
        createdAt: new Date()
      },
      {
        id: 'test-2', 
        title: '准备会议材料',
        completed: false,
        createdAt: new Date()
      },
      {
        id: 'test-3',
        title: '已完成的任务',
        completed: true,
        createdAt: new Date()
      }
    ];
  };

  const [todos, setTodos] = useState<TodoItem[]>(loadTodosFromStorage);
  
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const todoListRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);

  // 🔧 保存待办事项到localStorage
  const saveTodosToStorage = useCallback((todosToSave: TodoItem[]) => {
    try {
      localStorage.setItem('calendar-todos', JSON.stringify(todosToSave));
      console.log('✅ 待办事项已保存到localStorage');
    } catch (error) {
      console.warn('保存待办事项失败:', error);
    }
  }, []);

  // 🔧 当todos变化时自动保存
  useEffect(() => {
    saveTodosToStorage(todos);
  }, [todos, saveTodosToStorage]);

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

      console.log('✅ FullCalendar Draggable 初始化完成');
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
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${
          theme === 'pixel' ? 'font-mono text-green-400' : 'text-gray-900'
        }`}>
          {theme === 'pixel' ? 'TODO_LIST.EXE' : 'To-Do 列表'}
        </h3>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="secondary"
          size="sm"
        >
          {theme === 'pixel' ? 'ADD' : '添加'}
        </Button>
      </div>
      
      {/* 添加待办表单 */}
      {showAddForm && (
        <div className="mb-4 space-y-2">
          <ThemeInput
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
      <div ref={todoListRef} className="space-y-2 max-h-96 overflow-y-auto">
        {todos.length === 0 ? (
          <div className={`text-sm text-center py-8 ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' : 'text-gray-500'
          }`}>
            {theme === 'pixel' ? 'NO_TODOS_FOUND' : '暂无待办事项'}
            <br />
            <span className="text-xs">
              {theme === 'pixel' ? 'DRAG_TO_CALENDAR' : '拖拽到日历创建日程'}
            </span>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`
                todo-draggable group flex items-center justify-between p-3 rounded-lg border
                ${todo.completed ? 'opacity-60' : 'cursor-move'}
                ${theme === 'pixel' 
                  ? 'border-pixel-border bg-pixel-panel hover:bg-pixel-hover' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
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
                <span className={`
                  ${todo.completed ? 'line-through' : ''}
                  ${theme === 'pixel' ? 'font-mono text-sm' : 'text-sm'}
                  truncate flex-1
                `}>
                  {todo.title}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {!todo.completed && (
                  <span className={`text-xs ${
                    theme === 'pixel' ? 'text-pixel-textMuted' : 'text-gray-400'
                  } opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {theme === 'pixel' ? 'DRAG' : '拖拽'}
                  </span>
                )}
                <div style={{ pointerEvents: 'auto' }}>
                  <Button
                    onClick={() => handleDeleteTodo(todo.id)}
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {theme === 'pixel' ? 'DEL' : '删除'}
                  </Button>
                </div>
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
