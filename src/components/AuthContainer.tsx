import React, { useState } from 'react';
import AuthForm from './AuthForm';
import RegisterForm from './RegisterForm';

interface AuthContainerProps {
  onAuthSuccess: (user: any, profile: any) => void;
}

type AuthMode = 'login' | 'register';

const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  const handleAuthSuccess = (user: any, profile: any) => {
    onAuthSuccess(user, profile);
  };

  if (mode === 'register') {
    return (
      <RegisterForm
        onRegisterSuccess={handleAuthSuccess}
        onBackToLogin={handleSwitchToLogin}
      />
    );
  }

  return (
    <AuthForm
      onAuthSuccess={handleAuthSuccess}
      onSwitchToRegister={handleSwitchToRegister}
    />
  );
};

export default AuthContainer;
