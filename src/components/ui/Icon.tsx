import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import PixelIcon from '../PixelIcon';

// Lucide React 图标导入 (用于现代主题)
import {
  Plus,
  Calendar,
  Clock,
  User,
  Settings,
  ShoppingBag,
  List,
  Check,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Star,
  Gift,
  Heart,
  Mail,
  Phone,
  Search,
  Filter,
  RotateCcw,
  Tag,
  FileText,
  Home,
  LogOut,
  AlertTriangle,
  Sparkles,
  AtSign
} from 'lucide-react';

// Heroicons 导入 (用于清新主题)
import {
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  ListBulletIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  StarIcon,
  GiftIcon,
  HeartIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  TagIcon,
  DocumentIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';

// 图标名称类型定义
export type IconName = 
  | 'plus'
  | 'calendar'
  | 'clock'
  | 'user'
  | 'settings'
  | 'shopping-bag'
  | 'list'
  | 'check'
  | 'x'
  | 'pencil'
  | 'trash'
  | 'eye'
  | 'eye-off'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'star'
  | 'gift'
  | 'heart'
  | 'mail'
  | 'phone'
  | 'search'
  | 'filter'
  | 'refresh'
  | 'tag'
  | 'document'
  | 'home'
  | 'logout'
  | 'warning'
  | 'sparkles'
  | 'at-sign';

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 'md', 
  className = '', 
  glow = false 
}) => {
  const { theme } = useTheme();

  // 尺寸映射
  const sizeClasses = {
    'sm': 'w-4 h-4',
    'md': 'w-5 h-5',
    'lg': 'w-6 h-6',
    'xl': 'w-8 h-8'
  };

  const iconSize = sizeClasses[size];

  // 像素风主题使用 PixelIcon
  if (theme === 'pixel') {
    return (
      <PixelIcon 
        name={name} 
        size={size} 
        className={className} 
        glow={glow} 
      />
    );
  }

  // 现代主题使用 Lucide React 图标
  if (theme === 'modern') {
    const lucideIcons: Record<IconName, React.ComponentType<any>> = {
      'plus': Plus,
      'calendar': Calendar,
      'clock': Clock,
      'user': User,
      'settings': Settings,
      'shopping-bag': ShoppingBag,
      'list': List,
      'check': Check,
      'x': X,
      'pencil': Pencil,
      'trash': Trash2,
      'eye': Eye,
      'eye-off': EyeOff,
      'chevron-left': ChevronLeft,
      'chevron-right': ChevronRight,
      'chevron-up': ChevronUp,
      'chevron-down': ChevronDown,
      'star': Star,
      'gift': Gift,
      'heart': Heart,
      'mail': Mail,
      'phone': Phone,
      'search': Search,
      'filter': Filter,
      'refresh': RotateCcw,
      'tag': Tag,
      'document': FileText,
      'home': Home,
      'logout': LogOut,
      'warning': AlertTriangle,
      'sparkles': Sparkles,
      'at-sign': AtSign
    };

    const LucideIcon = lucideIcons[name];
    if (LucideIcon) {
      return (
        <LucideIcon 
          className={`${iconSize} ${className}`}
          style={glow ? { filter: 'drop-shadow(0 0 8px currentColor)' } : undefined}
        />
      );
    }
  }

  // 其他主题 (fresh/默认) 使用 Heroicons
  const heroIcons: Record<IconName, React.ComponentType<any>> = {
    'plus': PlusIcon,
    'calendar': CalendarDaysIcon,
    'clock': ClockIcon,
    'user': UserIcon,
    'settings': Cog6ToothIcon,
    'shopping-bag': ShoppingBagIcon,
    'list': ListBulletIcon,
    'check': CheckIcon,
    'x': XMarkIcon,
    'pencil': PencilIcon,
    'trash': TrashIcon,
    'eye': EyeIcon,
    'eye-off': EyeSlashIcon,
    'chevron-left': ChevronLeftIcon,
    'chevron-right': ChevronRightIcon,
    'chevron-up': ChevronUpIcon,
    'chevron-down': ChevronDownIcon,
    'star': StarIcon,
    'gift': GiftIcon,
    'heart': HeartIcon,
    'mail': EnvelopeIcon,
    'phone': UserIcon, // Heroicons doesn't have phone, use user as fallback
    'search': UserIcon, // Add proper search icon if needed
    'filter': UserIcon, // Add proper filter icon if needed
    'refresh': ArrowPathIcon,
    'tag': TagIcon,
    'document': DocumentIcon,
    'home': HomeIcon,
    'logout': ArrowRightOnRectangleIcon,
    'warning': ExclamationTriangleIcon,
    'sparkles': SparklesIcon,
    'at-sign': AtSymbolIcon
  };

  const HeroIcon = heroIcons[name];
  if (HeroIcon) {
    return (
      <HeroIcon 
        className={`${iconSize} ${className}`}
        style={glow ? { filter: 'drop-shadow(0 0 8px currentColor)' } : undefined}
      />
    );
  }

  // 降级处理：如果找不到图标，返回一个默认的占位符
  return (
    <div 
      className={`${iconSize} ${className} bg-gray-300 rounded flex items-center justify-center text-gray-600 text-xs`}
    >
      ?
    </div>
  );
};

export default Icon;
