import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import CustomCard from './CustomCard';
// import { Button } from './button'; // 暂时移除

// 导出新的反馈组件
export { ToastProvider, useToast } from './toast';
export { AlertDialog } from './alert-dialog';
// 内联 shadcn Card 组件避免导入问题
const ShadcnCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
));
ShadcnCard.displayName = "ShadcnCard";

const ShadcnCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
ShadcnCardHeader.displayName = "ShadcnCardHeader";

const ShadcnCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
ShadcnCardTitle.displayName = "ShadcnCardTitle";

const ShadcnCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ShadcnCardDescription.displayName = "ShadcnCardDescription";

const ShadcnCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
ShadcnCardContent.displayName = "ShadcnCardContent";

const ShadcnCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
ShadcnCardFooter.displayName = "ShadcnCardFooter";

// 统一的主题适配卡片组件
export interface ThemeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const ThemeCard = React.forwardRef<HTMLDivElement, ThemeCardProps>(
  ({ variant = 'default', size = 'md', hover = true, className, children, ...props }, ref) => {
    const { theme } = useTheme();
    
    if (theme === 'modern') {
      // 使用 shadcn 的 Card 组件
      return (
        <ShadcnCard 
          ref={ref} 
          className={cn(
            size === 'sm' ? 'p-4' : size === 'lg' ? 'p-8' : 'p-6', // shadcn标准间距
            variant === 'elevated' && 'shadow-md hover:shadow-lg transition-shadow duration-200',
            variant === 'interactive' && hover && 'hover:bg-accent/5 cursor-pointer transition-colors duration-200',
            className
          )}
          {...props}
        >
          {children}
        </ShadcnCard>
      );
    } else {
      // 使用自定义 Card 组件（pixel/fresh主题）
      const customVariant = variant === 'elevated' ? 'default' : variant;
      return (
        <CustomCard
          variant={customVariant}
          size={size}
          hover={hover}
          className={className}
          onClick={props.onClick as () => void}
        >
          {children}
        </CustomCard>
      );
    }
  }
);
ThemeCard.displayName = 'ThemeCard';

// 统一的主题适配按钮组件
export interface ThemeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'navigation' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeButton = React.forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const { theme } = useTheme();
    
    // 基础样式
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    // 变体样式
    const variantStyles = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      navigation: "hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground"
    };
    
    // 尺寸样式
    const sizeStyles = {
      sm: "h-9 rounded-md px-3",
      md: "h-10 px-4 py-2",
      lg: "h-11 rounded-md px-8"
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        onClick={props.onClick as () => void}
        disabled={props.disabled}
        type={props.type as 'button' | 'submit' | 'reset'}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ThemeButton.displayName = 'ThemeButton';

// 简化的表单字段组件
export interface ThemeFormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ThemeFormField: React.FC<ThemeFormFieldProps> = ({
  label,
  description,
  error,
  required,
  children,
  className
}) => {
  const { theme } = useTheme();
  
  const labelClasses = theme === 'pixel'
    ? 'block text-sm font-medium mb-2 text-pixel-text font-mono uppercase tracking-wide'
    : false
    ? 'block text-sm font-medium mb-2 '
    : theme === 'modern'
    ? 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
    : 'block text-sm font-medium mb-2 text-gray-700';
    
  const errorClasses = theme === 'pixel'
    ? 'text-pixel-accent font-mono text-xs mt-1'
    : false
    ? 'text-red-500 text-xs mt-1'
    : theme === 'modern'
    ? 'text-sm text-destructive'
    : 'text-red-500 text-xs mt-1';
    
  const descClasses = theme === 'pixel'
    ? 'text-pixel-textMuted font-mono text-xs mt-1'
    : false
    ? ' text-xs mt-1'
    : theme === 'modern'
    ? 'text-sm text-muted-foreground'
    : 'text-gray-500 text-xs mt-1';

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className={labelClasses}>
          {theme === 'pixel' ? label.toUpperCase() : label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {description && !error && (
        <p className={descClasses}>
          {theme === 'pixel' ? description.toUpperCase() : description}
        </p>
      )}
      {error && (
        <p className={errorClasses}>
          {theme === 'pixel' ? error.toUpperCase() : error}
        </p>
      )}
    </div>
  );
};

// 简化的输入组件
export interface ThemeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const ThemeInput = React.forwardRef<HTMLInputElement, ThemeInputProps>(
  ({ className, error, ...props }, ref) => {
    const { theme } = useTheme();
    
    const inputClasses = theme === 'pixel'
      ? cn(
          'w-full px-3 py-2 bg-pixel-card border-2 border-pixel-border rounded-pixel text-pixel-text font-mono',
          'focus:border-pixel-accent focus:ring-2 focus:ring-pixel-accent/20 focus:outline-none',
          'placeholder:text-pixel-textMuted',
          error && 'border-pixel-accent'
        )
      : false
      ? cn(
          'w-full px-3 py-2 border    ',
          'focus:ring-fresh-primary focus:',
          error && 'border-red-500'
        )
      : theme === 'modern'
      ? cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive'
        )
      : cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg',
          'focus:ring-blue-500 focus:border-blue-500',
          error && 'border-red-500'
        );

    return <input ref={ref} className={cn(inputClasses, className)} {...props} />;
  }
);
ThemeInput.displayName = 'ThemeInput';

// 简化的文本域组件
export interface ThemeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const ThemeTextarea = React.forwardRef<HTMLTextAreaElement, ThemeTextareaProps>(
  ({ className, error, ...props }, ref) => {
    const { theme } = useTheme();
    
    const textareaClasses = theme === 'pixel'
      ? cn(
          'w-full px-3 py-2 bg-pixel-card border-2 border-pixel-border rounded-pixel text-pixel-text font-mono',
          'focus:border-pixel-accent focus:ring-2 focus:ring-pixel-accent/20 focus:outline-none',
          'placeholder:text-pixel-textMuted resize-none',
          error && 'border-pixel-accent'
        )
      : false
      ? cn(
          'w-full px-3 py-2 border    ',
          'focus:ring-fresh-primary focus: resize-none',
          error && 'border-red-500'
        )
      : theme === 'modern'
      ? cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive'
        )
      : cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg',
          'focus:ring-blue-500 focus:border-blue-500',
          error && 'border-red-500'
        );

    return <textarea ref={ref} className={cn(textareaClasses, className)} {...props} />;
  }
);
ThemeTextarea.displayName = 'ThemeTextarea';

// 简化的选择框组件
export interface ThemeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const ThemeSelect = React.forwardRef<HTMLSelectElement, ThemeSelectProps>(
  ({ className, error, children, ...props }, ref) => {
    const { theme } = useTheme();
    
    const selectClasses = theme === 'pixel'
      ? cn(
          'w-full px-3 py-2 bg-pixel-card border-2 border-pixel-border rounded-pixel text-pixel-text font-mono',
          'focus:border-pixel-accent focus:ring-2 focus:ring-pixel-accent/20 focus:outline-none',
          error && 'border-pixel-accent'
        )
      : false
      ? cn(
          'w-full px-3 py-2 border    ',
          'focus:ring-fresh-primary focus:',
          error && 'border-red-500'
        )
      : theme === 'modern'
      ? cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive'
        )
      : cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg',
          'focus:ring-blue-500 focus:border-blue-500',
          error && 'border-red-500'
        );

    return (
      <select ref={ref} className={cn(selectClasses, className)} {...props}>
        {children}
      </select>
    );
  }
);
ThemeSelect.displayName = 'ThemeSelect';

// 简化的复选框组件
export interface ThemeCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: boolean;
}

export const ThemeCheckbox = React.forwardRef<HTMLInputElement, ThemeCheckboxProps>(
  ({ label, description, error, className, ...props }, ref) => {
    const { theme } = useTheme();
    
    const checkboxClasses = theme === 'pixel'
      ? cn(
          'w-4 h-4 text-pixel-accent bg-pixel-card border-2 border-pixel-border rounded-pixel focus:ring-pixel-accent',
          error && 'border-pixel-accent'
        )
      : false
      ? cn(
          'w-4 h-4   border  rounded focus:ring-fresh-primary',
          error && 'border-red-500'
        )
      : theme === 'modern'
      ? cn(
          'h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive'
        )
      : cn(
          'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500',
          error && 'border-red-500'
        );
        
    const labelClasses = theme === 'pixel'
      ? 'text-sm font-medium leading-none text-pixel-text font-mono uppercase'
      : false
      ? 'text-sm font-medium leading-none '
      : theme === 'modern'
      ? 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
      : 'text-sm font-medium leading-none text-gray-700';

    return (
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          ref={ref}
          className={cn(checkboxClasses, className)}
          {...props}
        />
        {label && (
          <label className={labelClasses}>
            {theme === 'pixel' ? label.toUpperCase() : label}
          </label>
        )}
      </div>
    );
  }
);
ThemeCheckbox.displayName = 'ThemeCheckbox';

// 简化的对话框组件
export interface ThemeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const ThemeDialog: React.FC<ThemeDialogProps> = ({
  open,
  onOpenChange,
  children
}) => {
  const { theme } = useTheme();
  
  if (!open) return null;
  
  const dialogClasses = theme === 'pixel'
    ? 'bg-pixel-panel border-4 border-pixel-border rounded-pixel shadow-pixel-lg neon-border pixel-container'
    : false
    ? ' border   '
    : theme === 'modern'
    ? 'bg-background text-foreground border border-border rounded-lg shadow-lg transition-all duration-200'
    : 'bg-white rounded-xl shadow-xl border border-gray-200';
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && onOpenChange) {
          onOpenChange(false);
        }
      }}
    >
      <div className={cn('p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto', dialogClasses)}>
        {children}
      </div>
    </div>
  );
};

// 简化的确认对话框
export interface ConfirmDialogProps {
  open?: boolean;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  onConfirm?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export interface RecurringEventActionDialogProps {
  open?: boolean;
  title?: string;
  description?: string;
  actionType: 'edit' | 'delete';
  onThisOnly?: () => void;
  onThisAndFuture?: () => void;
  onAllEvents?: () => void;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  variant = 'default',
  onConfirm,
  onOpenChange
}) => {
  const { theme } = useTheme();
  
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onOpenChange?.(false);
  };

  return (
    <ThemeDialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-semibold ${
            theme === 'pixel' ? 'text-pixel-text font-mono uppercase' :
            false ? '' :
            theme === 'modern' ? 'text-foreground' :
            'text-gray-900'
          }`}>
            {theme === 'pixel' ? title.toUpperCase() : title}
          </h3>
          <p className={`text-sm ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' :
            false ? '' :
            theme === 'modern' ? 'text-muted-foreground' :
            'text-gray-600'
          }`}>
            {theme === 'pixel' ? description.toUpperCase() : description}
          </p>
        </div>
        
        <div className="flex space-x-2 justify-end">
          <ThemeButton variant="secondary" onClick={handleCancel}>
            {theme === 'pixel' ? 'CANCEL' : theme === 'modern' ? 'Cancel' : '取消'}
          </ThemeButton>
          <ThemeButton 
            variant={variant === 'destructive' ? 'danger' : 'primary'} 
            onClick={handleConfirm}
          >
            {theme === 'pixel' ? 'CONFIRM' : theme === 'modern' ? 'Confirm' : '确认'}
          </ThemeButton>
        </div>
      </div>
    </ThemeDialog>
  );
};

export const RecurringEventActionDialog: React.FC<RecurringEventActionDialogProps> = ({
  open,
  title,
  description,
  actionType,
  onThisOnly,
  onThisAndFuture,
  onAllEvents,
  onCancel,
  onOpenChange
}) => {
  const { theme } = useTheme();
  
  const getActionText = () => {
    if (actionType === 'delete') {
      return {
        title: theme === 'pixel' ? 'DELETE_RECURRING_EVENT' : theme === 'modern' ? 'Delete Recurring Event' : '删除重复事件',
        description: theme === 'pixel' ? 'WHICH_EVENTS_TO_DELETE' : theme === 'modern' ? 'Which events would you like to delete?' : '您想删除哪些事件？',
        thisOnly: theme === 'pixel' ? 'THIS_EVENT_ONLY' : theme === 'modern' ? 'This event only' : '仅此事件',
        thisAndFuture: theme === 'pixel' ? 'THIS_AND_FUTURE_EVENTS' : theme === 'modern' ? 'This and future events' : '此事件及未来事件',
        allEvents: theme === 'pixel' ? 'ALL_EVENTS_IN_SERIES' : theme === 'modern' ? 'All events in the series' : '系列中的所有事件'
      };
    } else {
      return {
        title: theme === 'pixel' ? 'EDIT_RECURRING_EVENT' : theme === 'modern' ? 'Edit Recurring Event' : '编辑重复事件',
        description: theme === 'pixel' ? 'WHICH_EVENTS_TO_EDIT' : theme === 'modern' ? 'Which events would you like to edit?' : '您想编辑哪些事件？',
        thisOnly: theme === 'pixel' ? 'THIS_EVENT_ONLY' : theme === 'modern' ? 'This event only' : '仅此事件',
        thisAndFuture: theme === 'pixel' ? 'THIS_AND_FUTURE_EVENTS' : theme === 'modern' ? 'This and future events' : '此事件及未来事件',
        allEvents: theme === 'pixel' ? 'ALL_EVENTS_IN_SERIES' : theme === 'modern' ? 'All events in the series' : '系列中的所有事件'
      };
    }
  };

  const actionText = getActionText();

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const handleThisOnly = () => {
    onThisOnly?.();
    onOpenChange?.(false);
  };

  const handleThisAndFuture = () => {
    onThisAndFuture?.();
    onOpenChange?.(false);
  };

  const handleAllEvents = () => {
    onAllEvents?.();
    onOpenChange?.(false);
  };

  return (
    <ThemeDialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <div>
          <h3 className={`text-lg font-semibold ${
            theme === 'pixel' ? 'text-pixel-text font-mono uppercase' :
            false ? '' :
            theme === 'modern' ? 'text-foreground' :
            'text-gray-900'
          }`}>
            {theme === 'pixel' ? (title || actionText.title).toUpperCase() : (title || actionText.title)}
          </h3>
          <p className={`text-sm mb-4 ${
            theme === 'pixel' ? 'text-pixel-textMuted font-mono' :
            false ? '' :
            theme === 'modern' ? 'text-muted-foreground' :
            'text-gray-600'
          }`}>
            {theme === 'pixel' ? (description || actionText.description).toUpperCase() : (description || actionText.description)}
          </p>
        </div>
        
        <div className="space-y-3">
          <ThemeButton 
            variant="secondary" 
            className="w-full justify-start text-left p-4"
            onClick={handleThisOnly}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{theme === 'pixel' ? actionText.thisOnly.toUpperCase() : actionText.thisOnly}</span>
              <span className={`text-xs ${
                theme === 'pixel' ? 'text-pixel-textMuted font-mono' :
                false ? '' :
                theme === 'modern' ? 'text-muted-foreground' :
                'text-gray-500'
              }`}>
                {theme === 'pixel' ? 'ONLY_AFFECT_THIS_INSTANCE' : theme === 'modern' ? 'Only affects this instance' : '仅影响这一个实例'}
              </span>
            </div>
          </ThemeButton>
          
          <ThemeButton 
            variant="secondary" 
            className="w-full justify-start text-left p-4"
            onClick={handleThisAndFuture}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{theme === 'pixel' ? actionText.thisAndFuture.toUpperCase() : actionText.thisAndFuture}</span>
              <span className={`text-xs ${
                theme === 'pixel' ? 'text-pixel-textMuted font-mono' :
                false ? '' :
                theme === 'modern' ? 'text-muted-foreground' :
                'text-gray-500'
              }`}>
                {theme === 'pixel' ? 'AFFECT_FROM_THIS_DATE_FORWARD' : theme === 'modern' ? 'Affects from this date forward' : '从此日期开始往后影响'}
              </span>
            </div>
          </ThemeButton>
          
          <ThemeButton 
            variant={actionType === 'delete' ? 'danger' : 'primary'}
            className="w-full justify-start text-left p-4"
            onClick={handleAllEvents}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{theme === 'pixel' ? actionText.allEvents.toUpperCase() : actionText.allEvents}</span>
              <span className={`text-xs ${
                theme === 'pixel' ? 'text-pixel-textMuted font-mono' :
                false ? '' :
                theme === 'modern' ? 'text-muted-foreground' :
                'text-gray-500'
              }`}>
                {theme === 'pixel' ? 'AFFECT_ALL_INSTANCES' : theme === 'modern' ? 'Affects all instances in the series' : '影响系列中的所有实例'}
              </span>
            </div>
          </ThemeButton>
        </div>
        
        <div className="flex space-x-2 justify-end">
          <ThemeButton variant="secondary" onClick={handleCancel}>
            {theme === 'pixel' ? 'CANCEL' : theme === 'modern' ? 'Cancel' : '取消'}
          </ThemeButton>
        </div>
      </div>
    </ThemeDialog>
  );
};

// Dialog 子组件
export const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-1.5 mb-4">{children}</div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <h2 className={`text-lg font-semibold ${
      theme === 'pixel' ? 'text-pixel-text font-mono uppercase' :
      false ? '' :
      theme === 'modern' ? 'text-foreground' :
      'text-gray-900'
    }`}>
      {children}
    </h2>
  );
};

export const DialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-4">{children}</div>
);

export const DialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-end space-x-2 mt-6">{children}</div>
);

export const DialogClose: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { theme } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`absolute top-4 right-4 p-1 rounded ${
        theme === 'pixel' ? 'text-pixel-textMuted hover:text-pixel-text' :
        false ? ' hover:' :
        theme === 'modern' ? 'text-muted-foreground hover:text-foreground' :
        'text-gray-500 hover:text-gray-700'
      }`}
    >
      ✕
    </button>
  );
};

// shadcn Card 子组件的主题适配包装器
export const ThemeCardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  const { theme } = useTheme();
  
  if (theme === 'modern') {
    return <ShadcnCardHeader className={className} {...props}>{children}</ShadcnCardHeader>;
  } else {
    // pixel/fresh 主题下的自定义样式
    const headerClasses = theme === 'pixel'
      ? 'mb-4 border-b-2 border-pixel-border pb-3'
      : false
      ? 'mb-4 border-b  pb-3'
      : 'mb-4 border-b border-gray-200 pb-3';
    
    return (
      <div className={cn(headerClasses, className)} {...props}>
        {children}
      </div>
    );
  }
};

export const ThemeCardTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  const { theme } = useTheme();
  
  if (theme === 'modern') {
    return <ShadcnCardTitle className={className} {...props}>{children}</ShadcnCardTitle>;
  } else {
    const titleClasses = theme === 'pixel'
      ? 'text-lg font-bold text-pixel-text font-mono uppercase tracking-wider'
      : false
      ? 'text-lg font-semibold '
      : 'text-lg font-semibold text-gray-900';
    
    return (
      <div className={cn(titleClasses, className)} {...props}>
        {theme === 'pixel' && typeof children === 'string' ? children.toUpperCase() : children}
      </div>
    );
  }
};

export const ThemeCardDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  const { theme } = useTheme();
  
  if (theme === 'modern') {
    return <ShadcnCardDescription className={className} {...props}>{children}</ShadcnCardDescription>;
  } else {
    const descClasses = theme === 'pixel'
      ? 'text-sm text-pixel-textMuted font-mono mt-1'
      : false
      ? 'text-sm  mt-1'
      : 'text-sm text-gray-600 mt-1';
    
    return (
      <div className={cn(descClasses, className)} {...props}>
        {children}
      </div>
    );
  }
};

export const ThemeCardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  const { theme } = useTheme();
  
  if (theme === 'modern') {
    return <ShadcnCardContent className={className} {...props}>{children}</ShadcnCardContent>;
  } else {
    return (
      <div className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
};

export const ThemeCardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  const { theme } = useTheme();
  
  if (theme === 'modern') {
    return <ShadcnCardFooter className={className} {...props}>{children}</ShadcnCardFooter>;
  } else {
    const footerClasses = theme === 'pixel'
      ? 'mt-4 pt-3 border-t-2 border-pixel-border flex items-center justify-between'
      : false
      ? 'mt-4 pt-3 border-t  flex items-center justify-between'
      : 'mt-4 pt-3 border-t border-gray-200 flex items-center justify-between';
    
    return (
      <div className={cn(footerClasses, className)} {...props}>
        {children}
      </div>
    );
  }
};
