// ============================================
// js/config.js — Frontend runtime configuration
// ============================================
// Load this BEFORE api.js and layout.js on every page.
//
// Same-origin deploy (one server serves API + frontend, e.g. Render web service):
//   leave both values empty — requests go to the current origin.
//
// Split deploy (frontend on Netlify, API on Render/Railway/etc.):
//   set API_ORIGIN to the API server's base URL, e.g.
//   "https://fitsync-api.onrender.com"
//
// You can override at deploy time without editing this file by defining
// window.FITSYNC_API_ORIGIN before this script runs (e.g. via a Netlify snippet).

(function () {
  const API_ORIGIN = window.FITSYNC_API_ORIGIN || ''; // e.g. "https://fitsync-api.onrender.com"

  window.FITSYNC_CONFIG = {
    // Base URL for REST calls. "" → same origin.
    apiBase: (API_ORIGIN ? API_ORIGIN.replace(/\/$/, '') : '') + '/api',
    // Origin for the Socket.IO connection. "" → same origin (io() with no args).
    socketOrigin: API_ORIGIN ? API_ORIGIN.replace(/\/$/, '') : '',
  };
})();
