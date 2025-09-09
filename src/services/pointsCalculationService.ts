import { 
  DIFFICULTY_CONFIGS, 
  DURATION_TIER_CONFIGS, 
  PROOF_MULTIPLIER, 
  MIN_POINTS,
  DifficultyConfig,
  DurationTierConfig 
} from '../config/pointsConfig';

export interface PointsCalculationResult {
  suggestedPoints: number;
  breakdown: {
    basePoints: number;
    durationMultiplier: number;
    durationTierName: string;
    proofMultiplier: number;
    finalPoints: number;
  };
  explanation: string[];
}

// 现在直接使用新的task_type值，无需映射

export class PointsCalculationService {
  /**
   * 获取难度配置
   */
  static getDifficultyConfig(difficultyId: string): DifficultyConfig | null {
    return DIFFICULTY_CONFIGS.find(config => config.id === difficultyId) || null;
  }

  // 映射函数已移除，现在直接使用新的task_type值

  /**
   * 获取所有难度配置（按顺序）
   */
  static getAllDifficulties(): DifficultyConfig[] {
    return DIFFICULTY_CONFIGS.sort((a, b) => a.order - b.order);
  }

  /**
   * 根据持续时间获取时间系数和档位信息
   */
  static getDurationTier(hours: number): DurationTierConfig {
    for (const tier of DURATION_TIER_CONFIGS) {
      if (hours < tier.maxHours) {
        return tier;
      }
    }
    return DURATION_TIER_CONFIGS[DURATION_TIER_CONFIGS.length - 1];
  }

  /**
   * 计算任务持续时间（小时）
   */
  static calculateDurationHours(
    earliestStartTime?: string,
    taskDeadline?: string,
    createdAt?: string
  ): number {
    const now = new Date();
    const createdTime = createdAt ? new Date(createdAt) : now;
    
    // 情况1: 既有开始时间又有结束时间
    if (earliestStartTime && taskDeadline) {
      const start = new Date(earliestStartTime);
      const end = new Date(taskDeadline);
      return Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60), 0.1);
    }
    
    // 情况2: 只有开始时间，无结束时间
    if (earliestStartTime && !taskDeadline) {
      return Infinity;
    }
    
    // 情况3: 无开始时间，但有结束时间（按创建时间计算）
    if (!earliestStartTime && taskDeadline) {
      const end = new Date(taskDeadline);
      return Math.max((end.getTime() - createdTime.getTime()) / (1000 * 60 * 60), 0.1);
    }
    
    // 情况4: 完全无时间限制
    return Infinity;
  }

  /**
   * 计算单次任务建议积分
   */
  static calculateOneTimeTaskPoints(
    difficultyId: string,
    earliestStartTime?: string,
    taskDeadline?: string,
    requiresProof: boolean = false,
    createdAt?: string
  ): PointsCalculationResult | null {
    const difficultyConfig = this.getDifficultyConfig(difficultyId);
    if (!difficultyConfig) {
      return null;
    }

    // 计算持续时间
    const durationHours = this.calculateDurationHours(
      earliestStartTime,
      taskDeadline,
      createdAt
    );

    // 获取时间档位
    const durationTier = this.getDurationTier(durationHours);

    // 计算各项系数
    const basePoints = difficultyConfig.oneTimeBasePoints;
    const durationMultiplier = durationTier.multiplier;
    const proofMultiplier = requiresProof ? PROOF_MULTIPLIER : 1.0;

    // 计算最终积分
    const finalPoints = Math.max(
      Math.round(basePoints * durationMultiplier * proofMultiplier),
      MIN_POINTS
    );

    // 生成说明
    const explanation: string[] = [
      `${difficultyConfig.name}任务基础分：${basePoints}分`,
      `时间档位：${durationTier.name}（×${durationMultiplier}）`
    ];

    if (requiresProof) {
      explanation.push(`凭证奖励：×${PROOF_MULTIPLIER}`);
    }

    if (durationHours === Infinity) {
      explanation.push(`无时间限制任务`);
    } else {
      explanation.push(`任务持续时间：${durationHours.toFixed(1)}小时`);
    }

    return {
      suggestedPoints: finalPoints,
      breakdown: {
        basePoints,
        durationMultiplier,
        durationTierName: durationTier.name,
        proofMultiplier,
        finalPoints
      },
      explanation
    };
  }

  /**
   * 验证积分是否在合理范围内
   */
  static validatePoints(
    points: number,
    suggestedPoints: number,
    allowedVariance: number = 0.5 // 允许50%的变化范围
  ): {
    isValid: boolean;
    warning?: string;
  } {
    const minAllowed = Math.max(Math.floor(suggestedPoints * (1 - allowedVariance)), MIN_POINTS);
    const maxAllowed = Math.ceil(suggestedPoints * (1 + allowedVariance));

    if (points < minAllowed) {
      return {
        isValid: false,
        warning: `积分过低，建议不少于 ${minAllowed} 分`
      };
    }

    if (points > maxAllowed) {
      return {
        isValid: false,
        warning: `积分过高，建议不超过 ${maxAllowed} 分`
      };
    }

    if (Math.abs(points - suggestedPoints) > suggestedPoints * 0.2) {
      return {
        isValid: true,
        warning: `积分与建议值差异较大，请确认任务难度评估准确`
      };
    }

    return { isValid: true };
  }
}
