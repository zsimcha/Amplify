// When an email link (signup confirmation, password reset, invite) fails —
// expired, already used, or pre-opened by a mail scanner — Supabase Auth
// redirects back with error details in the URL fragment or query string
// instead of a session. Returns { code, description } for such a URL, or null.
export function parseAuthRedirectError({ hash = '', search = '' } = {}) {
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  const pick = (key) => fragment.get(key) || query.get(key);

  const code = pick('error_code') || pick('error');
  const description = pick('error_description');
  if (!code && !description) return null;
  return { code: code || null, description: description || null };
}
