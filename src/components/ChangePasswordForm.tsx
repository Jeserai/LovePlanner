import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../utils/i18n';
import { authService } from '../services/authService';
import { ThemeCard, ThemeFormField, ThemeInput, ThemeButton } from './ui/Components';
import Icon from './ui/Icon';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSuccess, onCancel }) => {
  const { theme, language } = useTheme();
  const t = useTranslation(language);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<any>(null);

  // 处理表单输入
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
    
    // 实时验证新密码强度
    if (field === 'newPassword') {
      const validation = authService.validatePasswordStrength(value);
      setPasswordValidation(validation);
    }
  };

  // 获取密码强度颜色
  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // 获取密码强度文本
  const getPasswordStrengthText = (strength: number) => {
    if (strength < 30) return '弱';
    if (strength < 60) return '中等';
    if (strength < 80) return '强';
    return '很强';
  };

  // 处理密码修改
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setError('');
    setSuccess('');
    
    // 表单验证
    if (!formData.currentPassword) {
      setError('请输入当前密码');
      return;
    }
    
    if (!formData.newPassword) {
      setError('请输入新密码');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      setError('新密码不能与当前密码相同');
      return;
    }
    
    // 验证新密码强度
    const validation = authService.validatePasswordStrength(formData.newPassword);
    if (!validation.isValid) {
      setError(`密码强度不够：${validation.errors.join('、')}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.changePassword(formData.currentPassword, formData.newPassword);
      setSuccess('密码修改成功！');
      
      // 清空表单
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordValidation(null);
      
      // 调用成功回调
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
      
    } catch (error: any) {
      setError(error.message || '密码修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeCard className="max-w-md mx-auto">
      <div className="space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {theme === 'pixel' ? 'CHANGE_PASSWORD' : '修改密码'}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {theme === 'pixel' ? 'UPDATE_YOUR_PASSWORD' : '为了安全，请设置一个强密码'}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-md">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="p-3 border border-green-200 bg-green-50 rounded-md">
            <p className="text-sm text-green-700 text-center">{success}</p>
          </div>
        )}

        {/* 修改密码表单 */}
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* 当前密码 */}
          <ThemeFormField 
            label={theme === 'pixel' ? 'CURRENT_PASSWORD' : '当前密码'} 
            required
          >
            <div className="relative">
              <ThemeInput
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder={theme === 'pixel' ? 'ENTER_CURRENT_PASSWORD' : '请输入当前密码'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.current ? (
                  <EyeSlashIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </ThemeFormField>

          {/* 新密码 */}
          <ThemeFormField 
            label={theme === 'pixel' ? 'NEW_PASSWORD' : '新密码'} 
            required
          >
            <div className="relative">
              <ThemeInput
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder={theme === 'pixel' ? 'ENTER_NEW_PASSWORD' : '请输入新密码'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.new ? (
                  <EyeSlashIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            
            {/* 密码强度指示器 */}
            {passwordValidation && formData.newPassword && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">密码强度</span>
                  <span className={`font-medium ${
                    passwordValidation.strength >= 80 ? 'text-green-600' :
                    passwordValidation.strength >= 60 ? 'text-blue-600' :
                    passwordValidation.strength >= 30 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {getPasswordStrengthText(passwordValidation.strength)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordValidation.strength)}`}
                    style={{ width: `${passwordValidation.strength}%` }}
                  />
                </div>
                {passwordValidation.errors.length > 0 && (
                  <ul className="text-xs text-red-600 space-y-1">
                    {passwordValidation.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </ThemeFormField>

          {/* 确认新密码 */}
          <ThemeFormField 
            label={theme === 'pixel' ? 'CONFIRM_PASSWORD' : '确认新密码'} 
            required
          >
            <div className="relative">
              <ThemeInput
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder={theme === 'pixel' ? 'CONFIRM_NEW_PASSWORD' : '请再次输入新密码'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.confirm ? (
                  <EyeSlashIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            
            {/* 确认密码匹配提示 */}
            {formData.confirmPassword && (
              <div className={`mt-1 text-xs ${
                formData.newPassword === formData.confirmPassword 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formData.newPassword === formData.confirmPassword 
                  ? '✓ 密码匹配' 
                  : '✗ 密码不匹配'}
              </div>
            )}
          </ThemeFormField>

          {/* 按钮组 */}
          <div className="flex space-x-3 pt-4">
            {onCancel && (
              <ThemeButton
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {theme === 'pixel' ? 'CANCEL' : '取消'}
              </ThemeButton>
            )}
            
            <ThemeButton
              type="submit"
              variant="primary"
              disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  {theme === 'pixel' ? 'UPDATING...' : '修改中...'}
                </div>
              ) : (
                theme === 'pixel' ? 'UPDATE_PASSWORD' : '修改密码'
              )}
            </ThemeButton>
          </div>
        </form>

        {/* 密码要求说明 */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
          <div className="font-medium mb-2">
            {theme === 'pixel' ? 'PASSWORD_REQUIREMENTS:' : '密码要求：'}
          </div>
          <ul className="space-y-1">
            <li>• 至少8位字符</li>
            <li>• 包含大写字母</li>
            <li>• 包含小写字母</li>
            <li>• 包含数字</li>
            <li>• 包含特殊字符</li>
          </ul>
        </div>
      </div>
    </ThemeCard>
  );
};

export default ChangePasswordForm;
