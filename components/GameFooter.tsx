'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import LogoutConfirmDialog from './LogoutConfirmDialog';

// X (Twitter) 图标组件
const XIcon = () => (
  <svg className="twitter-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path 
      fill="currentColor" 
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
    />
  </svg>
);

export default function GameFooter() {
  const { isAuthenticated, user, login } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      // 如果用户已登录，则显示登出确认对话框
      setShowLogoutDialog(true);
    } else {
      // 未登录时，直接登录
      login();
    }
  };

  return (
    <div className="game-footer">
      <button 
        className="twitter-login" 
        onClick={handleAuthButtonClick}
      >
        <XIcon />
        {isAuthenticated 
          ? `@${user?.name || ''}`
          : 'Login with 𝕏'
        }
      </button>
      
      <Link href="https://twi.am" className="more-games" target="_blank">
        More Games
      </Link>
      
      {/* 登出确认对话框 */}
      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
      />
    </div>
  );
} 