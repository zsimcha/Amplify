// src/lib/referral.js
// Referral attribution storage.
//
// A visitor arriving at amplifygive.com/{slug} gets the ambassador's slug
// stashed here; checkout reads it back and hands it to process_checkout, which
// is where the slug is actually validated. Nothing here is trusted — the slug
// is a public identifier, and the database re-checks that it belongs to a live
// affiliate, that it isn't a self-referral, and that the person isn't already
// a donor before any referral is recorded.
//
// Written to both a cookie and localStorage: the cookie survives across
// subdomains and is what makes the 90-day window a real window, while
// localStorage covers the case where cookies get cleared but site data doesn't.

const COOKIE_NAME = 'amp_ref';
const STORAGE_KEY = 'amp_ref';
const WINDOW_DAYS = 90;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

// Only widen the cookie to the registrable domain on production, so that
// amplifygive.com and www.amplifygive.com share attribution. Vercel preview
// hosts and localhost keep the default host-only cookie — `.vercel.app` is a
// public suffix and browsers reject cookies set on it.
const PROD_DOMAIN = 'amplifygive.com';

const cookieDomain = () => {
  const host = window.location.hostname;
  return host === PROD_DOMAIN || host.endsWith(`.${PROD_DOMAIN}`) ? `; domain=.${PROD_DOMAIN}` : '';
};

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Stores the referring ambassador's slug and starts the attribution window.
 * Called by the vanity-link landing page once the slug is confirmed real.
 */
export const captureReferral = (slug) => {
  if (!slug) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  try {
    document.cookie =
      `${COOKIE_NAME}=${encodeURIComponent(slug)}` +
      `; path=/; max-age=${Math.floor(WINDOW_MS / 1000)}; SameSite=Lax${secure}${cookieDomain()}`;
  } catch {
    // Cookies unavailable (rare privacy settings) — localStorage still covers us.
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ slug, ts: Date.now() }));
  } catch {
    // Storage unavailable (Safari private mode) — the cookie still covers us.
  }
};

/**
 * Returns the stored slug, or null if there isn't one or the window has closed.
 * The cookie expires on its own; the localStorage copy is age-checked here.
 */
export const getReferralSlug = () => {
  const fromCookie = readCookie(COOKIE_NAME);
  if (fromCookie) return fromCookie;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { slug, ts } = JSON.parse(raw);
    if (!slug || !ts || Date.now() - ts > WINDOW_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return slug;
  } catch {
    return null;
  }
};

/**
 * Clears attribution after a completed checkout, so a shared browser doesn't
 * credit the same ambassador for an unrelated person signing up later.
 */
export const clearReferral = () => {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  try {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${secure}${cookieDomain()}`;
  } catch {
    // Nothing to do — a stale cookie is harmless, the server dedupes anyway.
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Same.
  }
};

/** The full shareable link for an ambassador's slug. */
export const referralUrl = (slug) => `${window.location.origin}/${slug}`;
