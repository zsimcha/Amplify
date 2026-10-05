// The three membership Tiers and their current prize schedule. Single source
// of truth for the live prize numbers shown on the Circles/Home tier cards,
// the checkout flow, and the Drawing Addendum published on the Rules page —
// so the addendum can never drift out of sync with what the site actually
// offers.
export const TIER_DATA = {
  silver: { price: 250, prize: "$25,000", totalOdds: "1 / 100", otherPrizes: ["1x $1,250", "2x $750"] },
  gold: { price: 500, prize: "$50,000", totalOdds: "1 / 50", otherPrizes: ["1x $2,500", "6x $1,000"] },
  diamond: { price: 1000, prize: "$100,000", totalOdds: "1 / 25", otherPrizes: ["1x $5,000", "2x $3,000", "12x $2,000"] },
};

// Ordinal labels for each prize position after the Grand Prize, matching the
// order `otherPrizes` lists them in.
const ORDINAL_LABELS = ["Second", "Third", "Fourth", "Fifth"];

// Parse a tier-card entry like "2x $750" into { count, amount }.
function parsePrizeEntry(entry) {
  const [countPart, amountPart] = entry.split('x');
  const count = parseInt(countPart.trim(), 10);
  const amount = parseInt(amountPart.replace(/[^\d]/g, ''), 10);
  return { count, amount };
}

// Full prize schedule for a Tier, Grand Prize first, as
// { label, count, amount }[] — used to render a Drawing Addendum's
// Section 7/4 prize table without hand-copying numbers from the tier cards.
export function prizeSchedule(tierKey) {
  const tier = TIER_DATA[tierKey];
  const grandAmount = parseInt(tier.prize.replace(/[^\d]/g, ''), 10);
  const rest = tier.otherPrizes.map((entry, i) => {
    const { count, amount } = parsePrizeEntry(entry);
    return { label: `${ORDINAL_LABELS[i]} Prize`, count, amount };
  });
  return [{ label: 'Grand Prize', count: 1, amount: grandAmount }, ...rest];
}

// Total approximate retail value for a Tier: every prize amount times its
// winner count, summed.
export function tierTotalARV(tierKey) {
  return prizeSchedule(tierKey).reduce((sum, p) => sum + p.amount * p.count, 0);
}

// Combined ARV across all Tiers, for a Monthly Drawing Addendum that covers
// every Tier at once.
export function combinedTotalARV() {
  return Object.keys(TIER_DATA).reduce((sum, key) => sum + tierTotalARV(key), 0);
}

const money = (n) => `$${n.toLocaleString()}`;
export const formatMoney = money;
