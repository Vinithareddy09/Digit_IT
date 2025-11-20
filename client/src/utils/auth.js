// client/src/utils/auth.js
const TOKEN_KEY = 'edtech_token';
const USER_KEY = 'edtech_user';

export function setToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUser(userObj) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
  } catch (e) {}
}

export function getUser() {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function logout() {
  removeToken();
  if (typeof window !== 'undefined') window.location.href = '/login';
}
