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

// Annual billing charges monthlyPrice * 12 as a single basePrice through the
// exact same functions above -- no separate annual formula. These pin the
// resulting dollar amounts and the one real economic difference: Stripe's
// $0.30 fixed fee is paid once per annual charge instead of once per month.
describe('annual billing (12x monthly base, same functions)', () => {
  it.each([250, 500, 1000])('nets exactly 12x the monthly price after Stripe\'s cut (monthly=%d)', (monthlyPrice) => {
    const annualBase = monthlyPrice * 12;
    const charged = totalWithFeeCovered(annualBase);
    const stripeCut = charged * STRIPE_FEE_RATE + STRIPE_FEE_FIXED;
    expect(charged - stripeCut).toBeCloseTo(annualBase, 9);
  });

  it('matches known dollar amounts for the three membership tiers', () => {
    expect(totalWithFeeCovered(250 * 12)).toBeCloseTo(3089.91, 2);
    expect(totalWithFeeCovered(500 * 12)).toBeCloseTo(6179.51, 2);
    expect(totalWithFeeCovered(1000 * 12)).toBeCloseTo(12358.70, 2);
  });

  it('covering the fee annually costs less than covering it monthly 12 times, since the $0.30 fixed fee is only paid once', () => {
    for (const monthlyPrice of [250, 500, 1000]) {
      const annualFee = feeCoveredAmount(monthlyPrice * 12);
      const twelveMonthlyFees = feeCoveredAmount(monthlyPrice) * 12;
      expect(annualFee).toBeLessThan(twelveMonthlyFees);
      expect(twelveMonthlyFees - annualFee).toBeCloseTo(3.40, 2);
    }
  });
});
