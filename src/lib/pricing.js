// Card processing fee model. Adjust to match your actual Stripe contract.
export const STRIPE_FEE_RATE = 0.029;
export const STRIPE_FEE_FIXED = 0.30;

// The amount to charge a donor covering the fee so that, after Stripe deducts
// its percentage-plus-fixed cut from the amount actually charged, exactly
// `basePrice` is left for the giving pool.
//
// `basePrice + (basePrice * rate + fixed)` under-collects, because Stripe's
// percentage fee is taken from the full charged amount — including the
// fee-covering portion itself — not just from basePrice. Solving for the
// charge that survives that cut and nets basePrice:
//   charged - (charged * rate + fixed) = basePrice
//   charged * (1 - rate) = basePrice + fixed
//   charged = (basePrice + fixed) / (1 - rate)
export function totalWithFeeCovered(basePrice) {
  return (basePrice + STRIPE_FEE_FIXED) / (1 - STRIPE_FEE_RATE);
}

// The processing-fee portion of that grossed-up total — what's shown to the
// donor as "the fee you're covering".
export function feeCoveredAmount(basePrice) {
  return totalWithFeeCovered(basePrice) - basePrice;
}
