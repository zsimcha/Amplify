import { describe, it, expect } from 'vitest';
import { totalWithFeeCovered, feeCoveredAmount, STRIPE_FEE_RATE, STRIPE_FEE_FIXED } from './pricing';

describe('totalWithFeeCovered', () => {
  it.each([250, 500, 1000, 33.33, 1])('nets exactly the base price after Stripe deducts its fee (base=%d)', (basePrice) => {
    const charged = totalWithFeeCovered(basePrice);
    const stripeCut = charged * STRIPE_FEE_RATE + STRIPE_FEE_FIXED;
    const netToPool = charged - stripeCut;
    expect(netToPool).toBeCloseTo(basePrice, 9);
  });

  it('matches known dollar amounts for the three membership tiers', () => {
    expect(totalWithFeeCovered(250)).toBeCloseTo(257.78, 2);
    expect(totalWithFeeCovered(500)).toBeCloseTo(515.24, 2);
    expect(totalWithFeeCovered(1000)).toBeCloseTo(1030.18, 2);
  });

  it('is not satisfied by the naive base + base*rate + fixed formula (regression guard)', () => {
    const basePrice = 500;
    const naiveCharge = basePrice + (basePrice * STRIPE_FEE_RATE + STRIPE_FEE_FIXED);
    const stripeCutOnNaive = naiveCharge * STRIPE_FEE_RATE + STRIPE_FEE_FIXED;
    const netToPool = naiveCharge - stripeCutOnNaive;
    // The naive formula under-collects — this pins the bug the gross-up fixes.
    expect(netToPool).toBeLessThan(basePrice);
    expect(basePrice - netToPool).toBeCloseTo(0.43, 2);
  });
});

describe('feeCoveredAmount', () => {
  it('equals the difference between the grossed-up total and the base price', () => {
    for (const basePrice of [250, 500, 1000]) {
      expect(feeCoveredAmount(basePrice)).toBeCloseTo(totalWithFeeCovered(basePrice) - basePrice, 9);
    }
  });

  it('matches known dollar amounts for the three membership tiers', () => {
    expect(feeCoveredAmount(250)).toBeCloseTo(7.78, 2);
    expect(feeCoveredAmount(500)).toBeCloseTo(15.24, 2);
    expect(feeCoveredAmount(1000)).toBeCloseTo(30.18, 2);
  });
});
