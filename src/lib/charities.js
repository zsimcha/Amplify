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
export function getPendingCauses() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setPendingCauses(slugs) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(slugs));
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

// Flush any locally-stashed selection to the account. Call once a session is
// known to exist. Returns the applied slugs, or null if there were none.
export async function applyPendingCauses() {
  const pending = getPendingCauses();
  if (!pending || !pending.length) return null;
  await saveMyCauses(pending);
  clearPendingCauses();
  return pending;
}
