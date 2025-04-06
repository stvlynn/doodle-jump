import { useEffect, useState } from 'react';

// 用户信息接口
export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
}

// 认证状态接口
export interface AuthState {
  isAuthenticated: boolean;
  user: TwitterUser | null;
  isLoading: boolean;
}

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true
};

// 本地存储键
const AUTH_STORAGE_KEY = 'twitter_auth';

// Twitter Auth URL - 更新为twi.am登录URL
const TWITTER_AUTH_URL = 'https://twi.am/login?returnUrl=https://doodle.twi.am';

// 从cookie中获取值
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// 保存认证状态到本地存储
export const saveAuthState = (state: AuthState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  }
};

// 从本地存储获取认证状态
export const getAuthState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const storedState = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedState) {
      try {
        return JSON.parse(storedState);
      } catch (error) {
        console.error('Failed to parse auth state:', error);
      }
    }
  }
  return initialState;
};

// 清除认证状态
export const clearAuthState = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

// 使用Twitter登录
export const loginWithTwitter = () => {
  // 跳转到twi.am登录页面
  window.location.href = TWITTER_AUTH_URL;
};

// 登出
export const logout = () => {
  clearAuthState();
  window.location.reload();
};

// 从cookie中获取用户信息
const getUserFromCookies = (): TwitterUser | null => {
  const twitterId = getCookie('twitter_id');
  const twitterUsername = getCookie('twitter_username');
  const twitterName = getCookie('twitter_name');
  const twitterProfileImage = getCookie('twitter_profile_image');
  
  if (twitterId && twitterUsername) {
    return {
      id: twitterId,
      username: twitterUsername,
      name: twitterName || twitterUsername,
      profile_image_url: twitterProfileImage || 'https://pbs.twimg.com/profile_images/default_profile.png'
    };
  }
  
  return null;
};

// 认证Hook
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  
  useEffect(() => {
    // 检查cookie中是否有用户信息
    const userFromCookies = getUserFromCookies();
    
    if (userFromCookies) {
      // 如果cookie中有用户信息，则认为用户已登录
      const newState: AuthState = {
        isAuthenticated: true,
        user: userFromCookies,
        isLoading: false
      };
      
      setAuthState(newState);
      saveAuthState(newState);
    } else {
      // 尝试从本地存储加载认证状态
      const storedState = getAuthState();
      setAuthState(prev => ({
        ...storedState,
        isLoading: false
      }));
    }
  }, []);
  
  return {
    ...authState,
    login: loginWithTwitter,
    logout
  };
}; 