import { useEffect, useState } from 'react';
import { getCookie, clearAuthCookies } from './cookies';

// 用户信息接口
export interface TwitterUser {
  id: string;
  name: string;
  username?: string;
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
const TWITTER_LOGOUT_URL = 'https://twi.am/login?returnUrl=https://doodle.twi.am%3Flogout%3Dcompleted&logout=true';

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
    // 同时清除cookies
    clearAuthCookies();
  }
};

// 使用Twitter登录
export const loginWithTwitter = () => {
  // 跳转到twi.am登录页面
  window.location.href = TWITTER_AUTH_URL;
};

// 登出
export const logout = (redirect = true) => {
  clearAuthState();
  
  // 如果需要重定向到登出页面
  if (redirect) {
    window.location.href = TWITTER_LOGOUT_URL;
  } else {
    window.location.reload();
  }
};

// 从cookie中获取用户信息
const getUserFromCookies = (): TwitterUser | null => {
  // 新的cookie格式，用户信息存储在名为user的cookie中，格式为URL编码的JSON
  const userCookie = getCookie('user');
  
  if (userCookie) {
    try {
      // 解码URL编码的JSON字符串
      const decodedUser = decodeURIComponent(userCookie);
      const userData = JSON.parse(decodedUser);
      
      // 转换成TwitterUser格式，使用新增的username字段
      return {
        id: userData.id,
        name: userData.name,
        username: userData.username || userData.name, // 优先使用username，如果不存在则回退到name
        profile_image_url: userData.profileImage
      };
    } catch (error) {
      console.error('Failed to parse user cookie:', error);
    }
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