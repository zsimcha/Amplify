// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY PARTNER BLACKOUT
//
// While organizations are still confirming whether they want to be listed, the
// site must not show any partner name, logo, photo, or description anywhere.
//
//   ┌───────────────────────────────────────────────────────────────────┐
//   │  TO RESTORE THE FULL PARTNER ROSTER: set this to false.           │
//   │  That single change is the entire revert — nothing else to undo.  │
//   └───────────────────────────────────────────────────────────────────┘
//
// While true:
//   • Homepage  — logo marquee and org photos are replaced with a placeholder
//   • Causes    — the partner tile grid is replaced with a "coming soon" panel
//   • Checkout  — the "pick your causes" step is skipped entirely
//   • Account   — the causes picker is replaced with a notice
// Every underlying component and the partner data itself are left untouched.
// ─────────────────────────────────────────────────────────────────────────────
export const HIDE_PARTNER_IDENTITIES = true;
