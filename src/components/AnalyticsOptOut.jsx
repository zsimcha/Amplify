import React, { useState } from 'react';

// Per-browser opt-out from Google Analytics and Microsoft Clarity. The flag is
// read by the loader script in index.html, so once it's set neither tool is
// loaded on any later page view in this browser. Opting out also stops
// whatever already loaded on the current page and clears their first-party
// cookies.
export const OPT_OUT_KEY = 'amplify_analytics_opt_out';
const GA_ID = 'G-L9BB1FT5GE';

function readOptOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

// Expire every cookie whose name matches, across the domain variants it may
// have been set on (GA sets its cookies on the registrable domain).
function clearCookies(test) {
  const host = window.location.hostname;
  const parts = host.split('.');
  const domains = ['', host, `.${host}`];
  if (parts.length > 2) domains.push(`.${parts.slice(-2).join('.')}`);
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (!name || !test(name)) return;
    domains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ''}`;
    });
  });
}

const AnalyticsOptOut = () => {
  const gpcOn = typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;
  const [optedOut, setOptedOut] = useState(readOptOut);
  const [storageBlocked, setStorageBlocked] = useState(false);

  const optOut = () => {
    try {
      localStorage.setItem(OPT_OUT_KEY, '1');
    } catch {
      setStorageBlocked(true);
    }
    // Stop anything already running on this page.
    window[`ga-disable-${GA_ID}`] = true;
    try { window.clarity?.('stop'); } catch { /* not loaded */ }
    clearCookies((n) => n === '_ga' || n.startsWith('_ga_') || n === '_gid' || n === '_clck' || n === '_clsk');
    setOptedOut(true);
  };

  const optBackIn = () => {
    try { localStorage.removeItem(OPT_OUT_KEY); } catch { /* nothing stored */ }
    window.location.reload();
  };

  let status;
  let action = null;
  if (gpcOn) {
    status = "Your browser is sending a Global Privacy Control signal, so analytics are already off for you.";
  } else if (optedOut) {
    status = storageBlocked
      ? "Analytics are off for this visit. Your browser is blocking storage, so we couldn't remember this choice; you may need to opt out again next time."
      : "You've opted out. Analytics won't load in this browser.";
    if (!storageBlocked) {
      action = (
        <button type="button" onClick={optBackIn} className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-900 transition-colors">
          Turn analytics back on
        </button>
      );
    }
  } else {
    status = 'Opting out stops Google Analytics and Microsoft Clarity in this browser. Repeat it on each browser or device you use.';
    action = (
      <button type="button" onClick={optOut} className="px-5 py-2.5 bg-indigo-900 text-white rounded-lg font-black uppercase tracking-widest text-[0.625rem] md:text-xs hover:bg-black transition-colors">
        Opt out of analytics
      </button>
    );
  }

  return (
    <span className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200" role="status">
      <span className="text-sm text-slate-600 font-medium leading-relaxed flex-1">{status}</span>
      {action && <span className="shrink-0">{action}</span>}
    </span>
  );
};

export default AnalyticsOptOut;
