// Member charity selection (up to 4). Reads are RLS-scoped to the signed-in
// user; writes go through the set_my_causes RPC, which enforces auth + the cap
// server-side.
import { supabase } from './supabase';

const PENDING_KEY = 'amplify_pending_causes';

// Ordered list of the caller's selected org slugs. Requires a session.
export async function getMyCauses() {
  const { data, error } = await supabase
    .from('member_causes')
    .select('org_slug')
    .order('rank', { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => r.org_slug);
}

// Atomically replace the caller's selection (array order = display order).
export async function saveMyCauses(slugs) {
  const { error } = await supabase.rpc('set_my_causes', { p_slugs: slugs });
  if (error) throw error;
}

// --- Organization requests ----------------------------------------------------
// Members can nominate an organization for the roster. Validation (name, URL
// shape, open-request cap) is enforced server-side by the request_cause RPC.
export async function submitCauseRequest({ name, url, note }) {
  const { error } = await supabase.rpc('request_cause', {
    p_org_name: name,
    p_org_url: url,
    p_note: note || null,
  });
  if (error) throw error;
}

// --- Pending selection bridge -------------------------------------------------
// A brand-new member checking out may not have a session yet (email
// confirmation pending), so their post-checkout selection can't be written
// server-side. We stash it locally and flush it the next time a session exists.
//
// The stash records whose selection it is, so on a shared computer it is only
// ever applied to that member's account — not to whoever signs in next.
function readPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // Older stashes were a bare array with no owner.
    if (Array.isArray(parsed)) return { email: null, slugs: parsed };
    if (parsed && Array.isArray(parsed.slugs)) {
      return { email: typeof parsed.email === 'string' ? parsed.email : null, slugs: parsed.slugs };
    }
    return null;
  } catch {
    return null;
  }
}

export function getPendingCauses() {
  return readPending()?.slugs ?? null;
}

export function setPendingCauses(slugs, email = null) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({
      email: email ? email.trim().toLowerCase() : null,
      slugs,
    }));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function clearPendingCauses() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* non-fatal */
  }
}

// Session start fires this from more than one place at once (initial session,
// the auth-state event, My Account's own load); share a single save.
let inFlight = null;

// Flush any locally-stashed selection to the signed-in account. Returns the
// applied slugs, or null if there was nothing to apply for this account.
export function applyPendingCauses(email = null) {
  if (inFlight) return inFlight;

  const pending = readPending();
  if (!pending || !pending.slugs.length) return Promise.resolve(null);
  if (pending.email && email && pending.email !== email.trim().toLowerCase()) {
    // Someone else's selection: leave it for them.
    return Promise.resolve(null);
  }

  inFlight = (async () => {
    await saveMyCauses(pending.slugs);
    clearPendingCauses();
    return pending.slugs;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
