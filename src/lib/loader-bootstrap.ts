export type LoaderBootstrapState = {
  expired: boolean;
  heartbeat: () => void;
  stop: () => void;
  onTimeout?: () => void;
  owner?: object;
};

// Trusted, fixed application code: this runs in the head before the first paint.
export const loaderBootstrap = String.raw`(() => {
  const html = document.documentElement;
  const prefix = 'ranz-v21:';
  const name = window.name;
  const namedId = name.startsWith(prefix) ? name.slice(prefix.length).split('|')[0] : null;
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem('ranz.portfolio.v2.1.tab')); } catch {}
  if (!saved && namedId) saved = { id: namedId, complete: name.endsWith('|complete') };
  const type = performance.getEntriesByType('navigation')[0]?.type;
  const skip = saved?.complete && saved.id === namedId && (type === 'reload' || type === 'back_forward');
  html.setAttribute(skip ? 'data-loader-skip' : 'data-loader-active', '');
  let last = performance.now(), elapsed = 0, timer;
  const visibility = () => { last = performance.now(); };
  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    document.removeEventListener('visibilitychange', visibility);
  };
  const state = {
    expired: false,
    heartbeat: () => { elapsed = 0; },
    stop,
  };
  window.__ranzLoaderBootstrap = state;
  if (skip) return;
  document.addEventListener('visibilitychange', visibility);
  timer = setInterval(() => {
    const now = performance.now();
    elapsed += document.hidden ? 0 : Math.max(0, (now - last) / 1000);
    last = now;
    if (elapsed < 15) return;
    state.expired = true;
    stop();
    try { state.onTimeout?.(); } catch {}
    html.removeAttribute('data-loader-active');
    html.removeAttribute('data-loader-skip');
    const loader = document.getElementById('loader');
    if (loader) { loader.hidden = true; loader.removeAttribute('data-running'); }
    document.querySelectorAll('[data-loader-inert]').forEach(element => {
      element.inert = element.getAttribute('data-loader-inert') === 'true';
      element.removeAttribute('data-loader-inert');
    });
    document.dispatchEvent(new Event('portfolio:ready'));
  }, 100);
})();`;