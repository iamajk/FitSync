// api.js — All API calls and shared utilities for FitSync

const API_BASE = (window.FITSYNC_CONFIG && window.FITSYNC_CONFIG.apiBase) || '/api';
const getToken = () => localStorage.getItem('fitsync_token');

// Core fetch wrapper
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_BASE + endpoint, { ...options, headers });
  } catch (netErr) {
    throw new Error('Cannot reach the API. Is the backend running? (' + API_BASE + ')');
  }

  // Some endpoints (e.g. 204) may have no body
  const ct = res.headers.get('content-type') || '';
  let data = {};
  if (ct.includes('application/json')) {
    try { data = await res.json(); } catch (_) { /* empty / bad JSON */ }
  } else if (!res.ok) {
    // Non-JSON error = we hit the static host / a proxy, not the API
    throw new Error(
      `API not reachable (HTTP ${res.status}). The frontend is deployed but the backend isn't wired up — ` +
      `set window.FITSYNC_API_ORIGIN in client/js/config.js to your API URL.`
    );
  }
  if (res.status === 401) {
    localStorage.removeItem('fitsync_token');
    localStorage.removeItem('fitsync_user');
    const p = window.location.pathname;
    if (!p.includes('login') && !p.includes('register') && p !== '/') {
      window.location.href = '/pages/login.html';
    }
    throw new Error(data.message || 'Session expired');
  }
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Auth
const Auth = {
  register:       (d) => request('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
  login:          (d) => request('/auth/login',    { method: 'POST', body: JSON.stringify(d) }),
  getProfile:     ()  => request('/auth/profile'),
  changePassword: (d) => request('/auth/password', { method: 'PUT',  body: JSON.stringify(d) }),
  updateProfile:  (d) => {
    if (d instanceof FormData) {
      const token = getToken();
      return fetch(API_BASE + '/auth/profile', {
        method: 'PUT',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: d,
      }).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Upload failed');
        return data;
      });
    }
    return request('/auth/profile', { method: 'PUT', body: JSON.stringify(d) });
  },
};

// Workouts
const Workouts = {
  getAll:  (qs = '') => request('/workouts?' + (typeof qs === 'object' ? new URLSearchParams(qs) : qs)),
  getStats: ()       => request('/workouts/stats'),
  getById: (id)      => request('/workouts/' + id),
  create:  (d)       => request('/workouts', { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d)   => request('/workouts/' + id, { method: 'PUT', body: JSON.stringify(d) }),
  delete:  (id)      => request('/workouts/' + id, { method: 'DELETE' }),
};

// Nutrition
const Nutrition = {
  getAll:   (qs = '') => request('/meals?' + (typeof qs === 'object' ? new URLSearchParams(qs) : qs)),
  getMeals: (qs = '') => request('/meals?' + (typeof qs === 'object' ? new URLSearchParams(qs) : qs)),
  getWeekly: ()       => request('/meals/weekly'),
  create:   (d)       => request('/meals', { method: 'POST', body: JSON.stringify(d) }),
  update:   (id, d)   => request('/meals/' + id, { method: 'PUT', body: JSON.stringify(d) }),
  delete:   (id)      => request('/meals/' + id, { method: 'DELETE' }),
};

// Goals
const Goals = {
  getAll:      ()        => request('/goals'),
  create:      (d)       => request('/goals',             { method: 'POST', body: JSON.stringify(d) }),
  update:      (id, d)   => request('/goals/' + id,       { method: 'PUT',  body: JSON.stringify(d) }),
  logProgress: (id, d)   => request('/goals/' + id + '/progress', { method: 'POST', body: JSON.stringify(d) }),
  delete:      (id)      => request('/goals/' + id,       { method: 'DELETE' }),
};

// Admin
const Admin = {
  getDashboard:   ()       => request('/admin/dashboard'),
  getUsers:       (p = {}) => request('/admin/users?' + new URLSearchParams(p)),
  deleteUser:     (id)     => request('/admin/user/' + id,          { method: 'DELETE' }),
  toggleUser:     (id)     => request('/admin/user/' + id + '/toggle', { method: 'PUT' }),
  getExercises:   ()       => request('/admin/exercises'),
  createExercise: (d)      => request('/admin/exercises', { method: 'POST', body: JSON.stringify(d) }),
  deleteExercise: (id)     => request('/admin/exercises/' + id, { method: 'DELETE' }),
};

// ── Utility functions ──────────────────────────────────────────────────────
function requireAuth() {
  if (!getToken()) { window.location.href = '/pages/login.html'; return false; }
  return true;
}
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('fitsync_user')) || null; } catch { return null; }
}
function saveAuth(token, user) {
  localStorage.setItem('fitsync_token', token);
  localStorage.setItem('fitsync_user', JSON.stringify(user));
}
function logout() {
  localStorage.removeItem('fitsync_token');
  localStorage.removeItem('fitsync_user');
  window.location.href = '/pages/login.html';
}
function showToast(msg, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = '<span>' + (type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️') + '</span><span>' + msg + '</span>';
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}
function formatDate(d) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return 'N/A';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function localDate() {
  // Returns today as YYYY-MM-DD in LOCAL time (not UTC)
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
// Returns a NUMBER (not string) e.g. 24.5
function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = height / 100;
  return parseFloat((weight / (h * h)).toFixed(1));
}
function getBMICategory(bmi) {
  const n = parseFloat(bmi);
  if (n < 18.5) return { label: 'Underweight', cls: 'underweight', color: '#3b82f6', msg: 'You may be underweight. Consider consulting a nutritionist.' };
  if (n < 25)   return { label: 'Normal',      cls: 'normal',      color: '#22c55e', msg: 'Your weight is in the healthy range. Keep it up!' };
  if (n < 30)   return { label: 'Overweight',  cls: 'overweight',  color: '#f59e0b', msg: 'You are slightly overweight. Regular exercise can help.' };
  return           { label: 'Obese',            cls: 'obese',       color: '#ef4444', msg: 'Consider speaking to a healthcare professional for guidance.' };
}
// Resolve a stored profileImage path to a usable URL.
// - "/assets/..."  → served by the frontend, use as-is
// - "/uploads/..."  → served by the API; prefix with the API origin in split deploys
// - falsy           → bundled default avatar
function resolveAvatar(path) {
  if (!path) return '/assets/default-avatar.svg';
  if (/^https?:\/\//.test(path) || path.startsWith('/assets/')) return path;
  if (path.startsWith('/uploads/')) {
    const base = (window.FITSYNC_CONFIG && window.FITSYNC_CONFIG.apiBase) || '/api';
    const origin = base.replace(/\/api\/?$/, '');
    return origin + path;
  }
  return path;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setHTML(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

// Export everything globally
window.API = { Auth, Workouts, Nutrition, Goals, Admin };
window.Auth = Auth; window.Workouts = Workouts; window.Nutrition = Nutrition;
window.Goals = Goals; window.Admin = Admin;
window.requireAuth = requireAuth; window.getCurrentUser = getCurrentUser;
window.saveAuth = saveAuth; window.logout = logout;
window.showToast = showToast; window.formatDate = formatDate;
window.localDate = localDate; window.calcBMI = calcBMI;
window.getBMICategory = getBMICategory; window.setText = setText; window.setHTML = setHTML;
window.resolveAvatar = resolveAvatar;
