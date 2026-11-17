// Member charity selection (up to 4). Reads are RLS-scoped to the signed-in
// user; writes go through the set_my_causes RPC (or, right after a guest
// checkout, set_checkout_causes), which enforce auth + the cap server-side.
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

// --- Selection made right after a guest checkout ----------------------------
// A brand-new member has no session yet at the post-checkout causes step
// (their email isn't confirmed), so set_my_causes can't be used. Instead,
// process_checkout returns a one-time token for the new membership; sending
// the selection with it stores it server-side, and it's applied to the
// account the moment the email is confirmed, on whatever device that happens.
// Returns { applied } — true if the account was already confirmed and the
// selection is live now.
export async function saveCheckoutCauses({ subscriptionId, token, slugs }) {
  const { data, error } = await supabase.rpc('set_checkout_causes', {
    p_subscription_id: subscriptionId,
    p_token: token,
    p_slugs: slugs,
  });
  if (error) throw error;
  return { applied: !!data?.applied };
}
