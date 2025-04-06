/**
 * Cookie处理工具函数
 */

/**
 * 获取cookie
 * @param name cookie名称
 * @returns cookie值或null
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

/**
 * 设置cookie
 * @param name cookie名称
 * @param value cookie值
 * @param days 有效期（天）
 */
export const setCookie = (name: string, value: string, days?: number): void => {
  if (typeof document === 'undefined') return;
  
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  
  document.cookie = `${name}=${value}${expires}; path=/`;
};

/**
 * 删除cookie
 * @param name cookie名称
 */
export const deleteCookie = (name: string): void => {
  setCookie(name, '', -1);
};

/**
 * 清除所有与用户认证相关的cookies
 */
export const clearAuthCookies = (): void => {
  // 删除可能存在的身份验证相关cookie
  deleteCookie('user');
  deleteCookie('auth_token');
  deleteCookie('session');
  deleteCookie('twi_session');
}; 