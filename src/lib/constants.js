export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
  "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
  "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX",
  "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

// Minimum entry age by state of residence (Official Rules §3: "eighteen (18)
// ... or older (19 in Alabama and Nebraska, and 21 in Mississippi)"). Default
// is 18; only the three exceptions are listed here.
const MIN_AGE_OVERRIDES = { AL: 19, NE: 19, MS: 21 };
export const DEFAULT_MIN_AGE = 18;
export function minAgeForState(state) {
  return MIN_AGE_OVERRIDES[state] || DEFAULT_MIN_AGE;
}

// Accent color per membership tier, shared by any UI that shows a tier badge.
export const TIER_ACCENT = {
  silver: { text: 'text-slate-300', dot: 'bg-slate-300' },
  gold: { text: 'text-[#eab308]', dot: 'bg-[#eab308]' },
  diamond: { text: 'text-[#818cf8]', dot: 'bg-[#818cf8]' },
};
