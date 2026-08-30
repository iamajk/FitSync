// ============================================
// js/layout.js — Shared Layout Components
// Injects sidebar and header into all pages
// ============================================

/**
 * Renders the app layout (sidebar + header) into the page.
 * Call this on every authenticated page.
 * @param {string} activePage - The current page name for active nav highlighting
 * @param {string} pageTitle - The page title shown in the header
 * @param {string} pageSubtitle - The page subtitle shown in the header
 */
function renderLayout(activePage, pageTitle, pageSubtitle = '') {
  requireAuth();
  const user = getCurrentUser();
  if (!user) return;

  // Determine avatar initials
  const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  const sidebarHTML = `
  <div class="app-layout">
    <!-- Sidebar Overlay (mobile) -->
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">🏋️</div>
        <span class="logo-text">FitSync</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">Main</div>
        <ul>
          <li class="nav-item">
            <a href="/pages/dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">
              <span class="nav-icon">📊</span> Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a href="/pages/workouts.html" class="${activePage === 'workouts' ? 'active' : ''}">
              <span class="nav-icon">🏋️</span> Workouts
            </a>
          </li>
          <li class="nav-item">
            <a href="/pages/nutrition.html" class="${activePage === 'nutrition' ? 'active' : ''}">
              <span class="nav-icon">🥗</span> Nutrition
            </a>
          </li>
          <li class="nav-item">
            <a href="/pages/progress.html" class="${activePage === 'progress' ? 'active' : ''}">
              <span class="nav-icon">📈</span> Progress
            </a>
          </li>
        </ul>

        <div class="nav-section-title" style="margin-top:1rem;">Account</div>
        <ul>
          <li class="nav-item">
            <a href="/pages/profile.html" class="${activePage === 'profile' ? 'active' : ''}">
              <span class="nav-icon">👤</span> Profile
            </a>
          </li>
          <li class="nav-item">
            <a href="/pages/admin.html" class="${activePage === 'admin' ? 'active' : ''}">
              <span class="nav-icon">⚙️</span> Admin Panel
              <span class="nav-badge">${user.role === 'admin' || window.FITSYNC_DEMO ? 'Admin' : 'View'}</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div class="user-avatar" style="width:36px;height:36px;font-size:0.8rem;">${initials}</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem;">${user.username}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${user.goal?.replace('_',' ') || 'Fitness'}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm btn-full" onclick="logout()">
          🚪 Log Out
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div class="hamburger" id="hamburger" onclick="toggleSidebar()">
            <span></span><span></span><span></span>
          </div>
          <div class="header-title">
            <h1>${pageTitle}</h1>
            ${pageSubtitle ? `<p>${pageSubtitle}</p>` : ''}
          </div>
        </div>
        <div class="header-actions">
          <div id="socketStatus" title="Real-time connection">
            <span style="font-size:0.75rem; color:var(--text-muted);">⚡ Live</span>
          </div>
          <button class="theme-toggle" id="themeToggle" title="Toggle theme">🌙</button>
          <div class="user-avatar" onclick="window.location.href='/pages/profile.html'">${initials}</div>
        </div>
      </header>

      <!-- Page Content (injected here) -->
      <div class="page-content" id="pageContent">
  `;

  const closingHTML = `
      </div><!-- /page-content -->
    </div><!-- /main-content -->
  </div><!-- /app-layout -->
  `;

  // Wrap existing body content
  const bodyContent = document.body.innerHTML;
  document.body.innerHTML = sidebarHTML + bodyContent + closingHTML;

  // Init theme
  initTheme();

  // Init socket
  initSocket(user.id);
}

// ── Theme Toggle ──────────────────────────────────────
function initTheme() {
  const savedTheme = localStorage.getItem('fitsync_theme') || 'dark';
  if (savedTheme === 'light') document.body.classList.add('light-mode');

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    btn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      localStorage.setItem('fitsync_theme', isLight ? 'light' : 'dark');
      btn.textContent = isLight ? '🌙' : '☀️';
    });
  }
}

// ── Sidebar Mobile Controls ───────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').style.display =
    document.getElementById('sidebar').classList.contains('open') ? 'block' : 'none';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
}

// ── Socket.IO Init ────────────────────────────────────
function initSocket(userId) {
  // Demo mode has no server — show a friendly status and skip the socket.
  if (window.FITSYNC_DEMO) {
    const el = document.getElementById('socketStatus');
    if (el) el.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);">🎭 Demo</span>';
    return;
  }
  if (typeof io === 'undefined') return;

  const origin = (window.FITSYNC_CONFIG && window.FITSYNC_CONFIG.socketOrigin) || '';
  const socket = origin ? io(origin) : io();
  window._socket = socket;

  socket.on('connect', () => {
    socket.emit('user_connected', userId);
    const el = document.getElementById('socketStatus');
    if (el) el.innerHTML = '<span style="font-size:0.75rem;color:#22c55e;">⚡ Live</span>';
  });

  socket.on('disconnect', () => {
    const el = document.getElementById('socketStatus');
    if (el) el.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);">⚡ Offline</span>';
  });

  socket.on('workout_notification', (data) => {
    showToast(data.message, 'success');
  });

  socket.on('active_users_count', (count) => {
    console.log(`Active users: ${count}`);
  });
}
