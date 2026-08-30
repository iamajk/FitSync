// ============================================
// js/config.js — Frontend runtime configuration
// ============================================
// Load this BEFORE api.js and layout.js on every page.
//
// DEMO MODE (default): if no API origin is configured, FitSync runs
// entirely in the browser — no login wall, demo data stored in
// localStorage. See js/demo-mode.js.
//
// REAL BACKEND: set an API origin and the app talks to the live
// Express/MongoDB server instead. Either:
//   • edit API_ORIGIN below, or
//   • define window.FITSYNC_API_ORIGIN before this script runs.
// Same-origin deploy (one server serves API + frontend): use "" — but
// then demo mode is off and a backend must be reachable at /api.

(function () {
  // ↓↓↓ set this to your API URL to use the real backend, e.g.
  //     "https://fitsync-api.onrender.com"
  const API_ORIGIN = window.FITSYNC_API_ORIGIN || '';

  // Demo mode is on whenever no API origin is set.
  const DEMO = !API_ORIGIN;

  window.FITSYNC_CONFIG = {
    demo: DEMO,
    apiBase: (API_ORIGIN ? API_ORIGIN.replace(/\/$/, '') : '') + '/api',
    socketOrigin: API_ORIGIN ? API_ORIGIN.replace(/\/$/, '') : '',
  };
  window.FITSYNC_DEMO = DEMO;
})();
