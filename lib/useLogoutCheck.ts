'use client';

import { useEffect } from 'react';
import { clearAuthCookies } from './cookies';

/**
 * 自定义钩子：检查URL中是否有登出参数，并清除相关cookies
 */
export const useLogoutCheck = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const logoutParam = url.searchParams.get('logout');
      
      // 如果URL中包含logout=completed参数，表示从登出页面返回
      if (logoutParam === 'completed') {
        console.log('从登出页面返回，清除cookies');
        
        // 清除所有与认证相关的cookies
        clearAuthCookies();
        
        // 清除URL参数
        url.searchParams.delete('logout');
        window.history.replaceState({}, document.title, url.toString());
      }
    }
  }, []);
}; 