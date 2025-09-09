// 积分计算系统配置文件

export interface DurationTierConfig {
  maxHours: number;
  multiplier: number;
  name: string;
  description: string;
}

export interface DifficultyConfig {
  id: string;
  name: string;
  oneTimeBasePoints: number;
  repeatBasePoints: number;
  repeatMilestoneMultipliers: number[];
  order: number;
  description?: string;
  color?: string;
  icon?: string;
}

// 时间系数配置（可配置）
export const DURATION_TIER_CONFIGS: DurationTierConfig[] = [
  {
    maxHours: 6,
    multiplier: 1.3,
    name: '紧急任务',
    description: '6小时内完成，时间紧迫'
  },
  {
    maxHours: 24,
    multiplier: 1.1,
    name: '当日任务',
    description: '24小时内完成，有一定时间压力'
  },
  {
    maxHours: 72,
    multiplier: 1.0,
    name: '短期任务',
    description: '1-3天完成，标准时间范围'
  },
  {
    maxHours: 168,
    multiplier: 0.9,
    name: '中期任务',
    description: '3-7天完成，时间充裕'
  },
  {
    maxHours: 720,
    multiplier: 0.8,
    name: '长期任务',
    description: '7-30天完成，可灵活安排'
  },
  {
    maxHours: Infinity,
    multiplier: 0.7,
    name: '超长期任务',
    description: '超过30天或无时间限制'
  }
];

// 难度配置 - 直接使用新的task_type值
export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    id: 'easy',
    name: '简单',
    oneTimeBasePoints: 15,
    repeatBasePoints: 8,
    repeatMilestoneMultipliers: [0.3, 0.5, 0.8, 1.0, 1.5],
    order: 1,
    description: '轻松完成的任务',
    color: 'bg-green-100 text-green-800',
    icon: '🟢'
  },
  {
    id: 'normal',
    name: '普通',
    oneTimeBasePoints: 30,
    repeatBasePoints: 18,
    repeatMilestoneMultipliers: [0.5, 0.8, 1.2, 1.5, 2.0],
    order: 2,
    description: '需要一定努力的任务',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🟡'
  },
  {
    id: 'hard',
    name: '困难',
    oneTimeBasePoints: 60,
    repeatBasePoints: 35,
    repeatMilestoneMultipliers: [0.8, 1.2, 1.8, 2.2, 3.0],
    order: 3,
    description: '具有挑战性的任务',
    color: 'bg-red-100 text-red-800',
    icon: '🔴'
  }
];

// 其他配置常量
export const PROOF_MULTIPLIER = 1.15; // 凭证奖励倍数
export const MIN_POINTS = 5; // 最低积分
