import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeCard, ThemeFormField, ThemeInput, ThemeButton } from './ui/Components';
import { useTranslation } from '../utils/i18n';

interface UserOnboardingProps {
  user: any;
  profile: any;
  onComplete: () => void;
}

interface OnboardingData {
  partnerEmail: string;
  relationshipStarted: string;
  goals: string[];
}

const UserOnboarding: React.FC<UserOnboardingProps> = ({ user, profile, onComplete }) => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  
  const [step, setStep] = useState<'welcome' | 'partner' | 'relationship' | 'goals' | 'complete'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    partnerEmail: '',
    relationshipStarted: '',
    goals: [],
  });

  // 预设目标选项
  const goalOptions = [
    { id: 'better_communication', label: t('goal_better_communication') },
    { id: 'shared_activities', label: t('goal_shared_activities') },
    { id: 'habit_building', label: t('goal_habit_building') },
    { id: 'special_moments', label: t('goal_special_moments') },
    { id: 'time_management', label: t('goal_time_management') },
    { id: 'relationship_growth', label: t('goal_relationship_growth') },
  ];

  // 处理目标选择
  const toggleGoal = (goalId: string) => {
    setOnboardingData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(id => id !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  // 跳过引导
  const handleSkip = () => {
    onComplete();
  };

  // 下一步
  const handleNext = () => {
    setError('');
    
    if (step === 'welcome') {
      setStep('partner');
    } else if (step === 'partner') {
      setStep('relationship');
    } else if (step === 'relationship') {
      setStep('goals');
    } else if (step === 'goals') {
      handleComplete();
    }
  };

  // 上一步
  const handlePrevious = () => {
    if (step === 'partner') {
      setStep('welcome');
    } else if (step === 'relationship') {
      setStep('partner');
    } else if (step === 'goals') {
      setStep('relationship');
    }
  };

  // 完成引导
  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // 这里可以保存用户的引导数据到数据库
      // await saveOnboardingData(user.id, onboardingData);
      
      setStep('complete');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('onboarding_save_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染欢迎步骤
  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
        <span className="text-4xl">👋</span>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          {t('welcome_to_love_planner')}
        </h2>
        <p className="text-muted-foreground">
          {t('onboarding_welcome_text')}
        </p>
        <div className="text-sm text-muted-foreground">
          <strong>{t('hi')} {profile?.display_name || user?.email}!</strong>
        </div>
      </div>

      <div className="space-y-3">
        <ThemeButton onClick={handleNext} className="w-full" size="lg">
          {t('get_started')}
        </ThemeButton>
        <ThemeButton 
          variant="outline" 
          onClick={handleSkip} 
          className="w-full" 
          size="lg"
        >
          {t('skip_for_now')}
        </ThemeButton>
      </div>
    </div>
  );

  // 渲染伴侣设置步骤
  const renderPartnerStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-3xl">💕</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('connect_with_partner')}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t('partner_setup_description')}
          </p>
        </div>
      </div>

      <ThemeFormField label={t('partner_email')} hint={t('partner_email_hint')}>
        <ThemeInput
          type="email"
          value={onboardingData.partnerEmail}
          onChange={(e) => setOnboardingData(prev => ({
            ...prev,
            partnerEmail: e.target.value
          }))}
          placeholder={t('enter_partner_email')}
          disabled={isLoading}
        />
      </ThemeFormField>

      <div className="space-y-3">
        <ThemeButton onClick={handleNext} className="w-full" size="lg">
          {t('next_step')}
        </ThemeButton>
        <div className="flex space-x-3">
          <ThemeButton 
            variant="outline" 
            onClick={handlePrevious} 
            className="flex-1" 
            size="lg"
          >
            {t('previous_step')}
          </ThemeButton>
          <ThemeButton 
            variant="outline" 
            onClick={handleSkip} 
            className="flex-1" 
            size="lg"
          >
            {t('skip')}
          </ThemeButton>
        </div>
      </div>
    </div>
  );

  // 渲染关系设置步骤
  const renderRelationshipStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-3xl">📅</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('relationship_details')}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t('relationship_details_description')}
          </p>
        </div>
      </div>

      <ThemeFormField label={t('relationship_start_date')} hint={t('relationship_start_hint')}>
        <ThemeInput
          type="date"
          value={onboardingData.relationshipStarted}
          onChange={(e) => setOnboardingData(prev => ({
            ...prev,
            relationshipStarted: e.target.value
          }))}
          disabled={isLoading}
        />
      </ThemeFormField>

      <div className="space-y-3">
        <ThemeButton onClick={handleNext} className="w-full" size="lg">
          {t('next_step')}
        </ThemeButton>
        <div className="flex space-x-3">
          <ThemeButton 
            variant="outline" 
            onClick={handlePrevious} 
            className="flex-1" 
            size="lg"
          >
            {t('previous_step')}
          </ThemeButton>
          <ThemeButton 
            variant="outline" 
            onClick={handleSkip} 
            className="flex-1" 
            size="lg"
          >
            {t('skip')}
          </ThemeButton>
        </div>
      </div>
    </div>
  );

  // 渲染目标设置步骤
  const renderGoalsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-3xl">🎯</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('set_your_goals')}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t('goals_description')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {goalOptions.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`w-full p-4 border rounded-md transition-all duration-200 text-left ${
              onboardingData.goals.includes(goal.id)
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border bg-background hover:bg-accent/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{goal.label}</span>
              {onboardingData.goals.includes(goal.id) && (
                <CheckIcon className="w-5 h-5 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <ThemeButton 
          onClick={handleNext} 
          className="w-full" 
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? t('saving') : t('complete_setup')}
        </ThemeButton>
        <div className="flex space-x-3">
          <ThemeButton 
            variant="outline" 
            onClick={handlePrevious} 
            className="flex-1" 
            size="lg"
            disabled={isLoading}
          >
            {t('previous_step')}
          </ThemeButton>
          <ThemeButton 
            variant="outline" 
            onClick={handleSkip} 
            className="flex-1" 
            size="lg"
            disabled={isLoading}
          >
            {t('skip')}
          </ThemeButton>
        </div>
      </div>
    </div>
  );

  // 渲染完成步骤
  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckIcon className="w-10 h-10 text-green-600" />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          {t('setup_complete')}
        </h2>
        <p className="text-muted-foreground">
          {t('setup_complete_description')}
        </p>
      </div>

      <div className="animate-pulse">
        <p className="text-sm text-muted-foreground">
          {t('redirecting_to_app')}
        </p>
      </div>
    </div>
  );

  // 步骤指示器
  const renderStepIndicator = () => {
    if (step === 'welcome' || step === 'complete') return null;

    const steps = ['partner', 'relationship', 'goals'];
    const currentIndex = steps.indexOf(step);

    return (
      <div className="flex items-center justify-center space-x-2 mb-6">
        {steps.map((stepName, index) => (
          <React.Fragment key={stepName}>
            <div
              className={`w-3 h-3 rounded-full ${
                index <= currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  index < currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // 现代主题渲染
  if (theme === 'modern') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
        
        <div className="relative w-full max-w-md">
          <ThemeCard className="p-8 space-y-6">
            {renderStepIndicator()}

            {error && (
              <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-md">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {step === 'welcome' && renderWelcomeStep()}
            {step === 'partner' && renderPartnerStep()}
            {step === 'relationship' && renderRelationshipStep()}
            {step === 'goals' && renderGoalsStep()}
            {step === 'complete' && renderCompleteStep()}
          </ThemeCard>
        </div>
      </div>
    );
  }

  // 像素风主题渲染（简化版本）
  return (
    <div className="min-h-screen bg-pixel-bg flex items-center justify-center p-4 font-retro">
      <div className="relative w-full max-w-md">
        <div className="border-4 border-black rounded-pixel p-8 bg-pixel-panel">
          {renderStepIndicator()}
          
          {error && (
            <div className="border-2 border-red-600 rounded-pixel p-3 mb-4 bg-red-100">
              <p className="text-red-600 text-sm font-mono text-center">{error}</p>
            </div>
          )}

          {step === 'welcome' && renderWelcomeStep()}
          {step === 'partner' && renderPartnerStep()}
          {step === 'relationship' && renderRelationshipStep()}
          {step === 'goals' && renderGoalsStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};

export default UserOnboarding;
