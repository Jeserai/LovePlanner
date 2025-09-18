import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { HeartIcon, UserPlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { ThemeButton, ThemeInput, ThemeFormField } from './ui/Components';
import { useTranslation } from '../utils/i18n';
import { userService } from '../services/userService';
import PixelIcon from './PixelIcon';

interface CoupleInfo {
  id: string;
  partnerProfile?: {
    id: string;
    email: string;
    display_name: string;
    birthday?: string;
  };
  relationshipStarted?: string;
}

const CoupleRelationshipManager: React.FC = () => {
  const { theme, language } = useTheme();
  const { userProfile } = useUser();
  const t = useTranslation(language);
  
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 加载情侣关系信息
  useEffect(() => {
    loadCoupleInfo();
  }, [userProfile?.id]);

  const loadCoupleInfo = async () => {
    if (!userProfile?.id) return;
    
    try {
      setLoading(true);
      
      // 获取当前用户的情侣关系
      const coupleRelation = await userService.getCoupleRelation(userProfile.id);
      
      if (coupleRelation) {
        // 获取情侣中的所有用户
        const coupleUsers = await userService.getCoupleUsers(coupleRelation.id);
        
        // 找到伴侣（不是当前用户的那个）
        const partner = coupleUsers.find(user => user.id !== userProfile.id);
        
        setCoupleInfo({
          id: coupleRelation.id,
          partnerProfile: partner,
          relationshipStarted: coupleRelation.created_at
        });
      } else {
        setCoupleInfo(null);
      }
    } catch (error) {
      console.error('加载情侣关系失败:', error);
      setError('加载情侣关系信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPartner = async () => {
    if (!partnerEmail.trim() || !userProfile?.id) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsConnecting(true);
    setError('');
    setSuccess('');

    try {
      // 首先通过邮箱查找伴侣用户
      const partnerProfile = await userService.findUserByEmail(partnerEmail.trim());
      
      if (!partnerProfile) {
        setError('未找到该邮箱对应的用户，请确认邮箱地址正确');
        return;
      }

      if (partnerProfile.id === userProfile.id) {
        setError('不能绑定自己为伴侣');
        return;
      }

      // 检查伴侣是否已经有情侣关系
      const partnerCoupleRelation = await userService.getCoupleRelation(partnerProfile.id);
      if (partnerCoupleRelation) {
        setError('该用户已经有情侣关系了');
        return;
      }

      // 创建情侣关系
      const coupleId = await userService.createCoupleRelation(userProfile.id, partnerProfile.id);
      
      if (coupleId) {
        setSuccess('成功绑定情侣关系！');
        setPartnerEmail('');
        setShowConnectForm(false);
        // 重新加载情侣信息
        setTimeout(() => {
          loadCoupleInfo();
          setSuccess('');
        }, 2000);
      } else {
        setError('创建情侣关系失败，请重试');
      }
    } catch (error: any) {
      console.error('绑定情侣关系失败:', error);
      setError(error.message || '绑定失败，请重试');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!coupleInfo?.id || !confirm('确定要解除情侣关系吗？这将删除你们的共享数据。')) {
      return;
    }

    try {
      setLoading(true);
      // 这里应该调用解除关系的API
      // await userService.deleteCoupleRelation(coupleInfo.id);
      console.log('解除情侣关系功能待实现');
      setError('解除关系功能待实现');
    } catch (error) {
      console.error('解除情侣关系失败:', error);
      setError('解除关系失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 像素风格渲染
  if (theme === 'pixel') {
    return (
      <div className="bg-pixel-panel border-4 border-black rounded-pixel shadow-pixel-lg p-8 neon-border pixel-matrix">
        <h3 className="text-xl font-bold mb-4 text-pixel-text font-retro uppercase tracking-wider flex items-center space-x-3">
          <PixelIcon name="heart" className="text-pixel-accent" glow />
          <span>{'>>> COUPLE RELATIONSHIP'}</span>
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-600 border-2 border-red-800 text-white font-mono text-sm rounded-pixel">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-600 border-2 border-green-800 text-white font-mono text-sm rounded-pixel">
            {success}
          </div>
        )}

        {coupleInfo ? (
          <div className="space-y-4">
            <div className="bg-pixel-card border-2 border-pixel-accent p-4 rounded-pixel">
              <div className="flex items-center space-x-3 mb-3">
                <PixelIcon name="user" className="text-pixel-accent" />
                <span className="font-retro text-pixel-text uppercase">PARTNER INFO</span>
              </div>
              {coupleInfo.partnerProfile ? (
                <div className="space-y-2">
                  <p className="text-pixel-text font-mono">
                    <span className="text-pixel-textMuted">NAME:</span> {coupleInfo.partnerProfile.display_name}
                  </p>
                  <p className="text-pixel-text font-mono">
                    <span className="text-pixel-textMuted">EMAIL:</span> {coupleInfo.partnerProfile.email}
                  </p>
                  {coupleInfo.relationshipStarted && (
                    <p className="text-pixel-text font-mono">
                      <span className="text-pixel-textMuted">SINCE:</span> {new Date(coupleInfo.relationshipStarted).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-pixel-textMuted font-mono">PARTNER INFO LOADING...</p>
              )}
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full p-3 bg-red-600 text-white font-retro text-sm uppercase tracking-wider border-2 border-black hover:bg-red-700 transition-colors duration-200 shadow-pixel"
            >
              DISCONNECT RELATIONSHIP
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-pixel-textMuted font-mono text-sm">
              NO COUPLE RELATIONSHIP FOUND. CONNECT WITH YOUR PARTNER TO START SHARING YOUR LOVE JOURNEY!
            </p>

            {!showConnectForm ? (
              <button
                onClick={() => setShowConnectForm(true)}
                className="w-full p-4 bg-pixel-accent text-black font-retro text-sm uppercase tracking-wider border-2 border-black hover:bg-pink-400 transition-colors duration-200 shadow-pixel flex items-center justify-center space-x-2"
              >
                <PixelIcon name="plus" className="w-5 h-5" />
                <span>CONNECT PARTNER</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-pixel-text font-retro text-sm mb-2 uppercase">
                    PARTNER EMAIL:
                  </label>
                  <input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="Enter partner's email"
                    className="w-full p-3 bg-pixel-input border-2 border-pixel-border text-pixel-text font-mono focus:border-pixel-accent focus:outline-none rounded-pixel"
                    disabled={isConnecting}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleConnectPartner}
                    disabled={isConnecting}
                    className="flex-1 p-3 bg-green-600 text-white font-retro text-sm uppercase tracking-wider border-2 border-black hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 shadow-pixel flex items-center justify-center space-x-2"
                  >
                    {isConnecting ? (
                      <span>CONNECTING...</span>
                    ) : (
                      <>
                        <PixelIcon name="check" className="w-4 h-4" />
                        <span>CONNECT</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowConnectForm(false);
                      setPartnerEmail('');
                      setError('');
                    }}
                    className="flex-1 p-3 bg-gray-600 text-white font-retro text-sm uppercase tracking-wider border-2 border-black hover:bg-gray-700 transition-colors duration-200 shadow-pixel flex items-center justify-center space-x-2"
                  >
                    <PixelIcon name="x" className="w-4 h-4" />
                    <span>CANCEL</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 现代主题渲染
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <HeartIcon className="w-5 h-5 text-pink-500" />
          <span>情侣关系</span>
        </CardTitle>
        <CardDescription>
          管理你们的情侣关系，共享日历和任务
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        {coupleInfo ? (
          <div className="space-y-4">
            <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <HeartIcon className="w-4 h-4 text-pink-500" />
                <span className="font-medium text-foreground">伴侣信息</span>
              </div>
              {coupleInfo.partnerProfile ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">姓名：</span>
                    <span className="font-medium">{coupleInfo.partnerProfile.display_name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">邮箱：</span>
                    <span>{coupleInfo.partnerProfile.email}</span>
                  </p>
                  {coupleInfo.relationshipStarted && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">关系建立时间：</span>
                      <span>{new Date(coupleInfo.relationshipStarted).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">加载伴侣信息中...</p>
              )}
            </div>

            <ThemeButton
              onClick={handleDisconnect}
              variant="danger"
              className="w-full"
            >
              <div className="flex items-center justify-center space-x-2">
                <XMarkIcon className="w-4 h-4" />
                <span>解除情侣关系</span>
              </div>
            </ThemeButton>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              还没有绑定情侣关系。绑定后可以共享日历事件和任务，一起规划你们的爱情之旅！
            </p>

            {!showConnectForm ? (
              <ThemeButton
                onClick={() => setShowConnectForm(true)}
                className="w-full"
              >
                <div className="flex items-center justify-center space-x-2">
                  <UserPlusIcon className="w-4 h-4" />
                  <span>绑定情侣关系</span>
                </div>
              </ThemeButton>
            ) : (
              <div className="space-y-4">
                <ThemeFormField label="伴侣邮箱" hint="输入你伴侣的注册邮箱地址">
                  <ThemeInput
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="输入伴侣的邮箱地址"
                    disabled={isConnecting}
                  />
                </ThemeFormField>

                <div className="flex space-x-3">
                  <ThemeButton
                    onClick={handleConnectPartner}
                    disabled={isConnecting}
                    className="flex-1"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isConnecting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckIcon className="w-4 h-4" />
                      )}
                      <span>{isConnecting ? '绑定中...' : '确认绑定'}</span>
                    </div>
                  </ThemeButton>
                  <ThemeButton
                    onClick={() => {
                      setShowConnectForm(false);
                      setPartnerEmail('');
                      setError('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <XMarkIcon className="w-4 h-4" />
                      <span>取消</span>
                    </div>
                  </ThemeButton>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoupleRelationshipManager;
