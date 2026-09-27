import { describe, it, expect } from 'vitest';
import { computeCheckoutErrors, isValidZip, calculateAge } from './checkoutValidation';

const validForm = {
  fullName: 'Jane Doe',
  displayName: 'Jane',
  isAnonymous: false,
  email: 'jane@example.com',
  phone: '555-123-4567',
  address: '123 Main St',
  city: 'Springfield',
  state: 'IL',
  zipCode: '62704',
  dateOfBirth: '1990-01-01',
};

const validBilling = { line1: '456 Oak Ave', line2: '', city: 'Springfield', state: 'IL', zipCode: '62704' };

function baseArgs(overrides = {}) {
  return {
    checkoutForm: validForm,
    isSignedIn: false,
    accountPassword: 'longenoughpassword',
    accountPasswordConfirm: 'longenoughpassword',
    billingSameAsAccount: true,
    billingAddress: validBilling,
    agreedToTerms: true,
    ...overrides,
  };
}

describe('computeCheckoutErrors', () => {
  it('returns no errors for a fully valid, signed-out submission', () => {
    expect(computeCheckoutErrors(baseArgs())).toEqual({});
  });

  it('requires full name', () => {
    const errors = computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, fullName: '  ' } }));
    expect(errors.fullName).toBeDefined();
  });

  it('requires display name unless anonymous', () => {
    const errors = computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, displayName: '' } }));
    expect(errors.displayName).toBeDefined();

    const anonErrors = computeCheckoutErrors(
      baseArgs({ checkoutForm: { ...validForm, displayName: '', isAnonymous: true } })
    );
    expect(anonErrors.displayName).toBeUndefined();
  });

  it('validates email format', () => {
    expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, email: 'not-an-email' } })).email).toBeDefined();
    expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, email: 'valid@example.com' } })).email).toBeUndefined();
  });

  it('rejects phone numbers under 10 digits', () => {
    expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, phone: '555-1234' } })).phone).toBeDefined();
  });

  it('rejects obviously fake repeated-digit phone numbers', () => {
    expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, phone: '1111111111' } })).phone).toBeDefined();
  });

  it('accepts a valid 10-digit phone number with formatting characters', () => {
    expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, phone: '(555) 123-4567' } })).phone).toBeUndefined();
  });

  it('requires address, city, and state', () => {
    const errors = computeCheckoutErrors(
      baseArgs({ checkoutForm: { ...validForm, address: '', city: '', state: '' } })
    );
    expect(errors.address).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.state).toBeDefined();
  });

  it('validates zip code format (5-digit and zip+4)', () => {
    expect(isValidZip('62704')).toBe(true);
    expect(isValidZip('62704-1234')).toBe(true);
    expect(isValidZip('abcde')).toBe(false);
    expect(isValidZip('1234')).toBe(false);
  });

  it('requires account password and confirmation when signed out', () => {
    const shortPw = computeCheckoutErrors(baseArgs({ accountPassword: 'short', accountPasswordConfirm: 'short' }));
    expect(shortPw.accountPassword).toBeDefined();

    const mismatched = computeCheckoutErrors(baseArgs({ accountPasswordConfirm: 'somethingelse12' }));
    expect(mismatched.accountPasswordConfirm).toBeDefined();
  });

  it('skips account password validation entirely when signed in', () => {
    const errors = computeCheckoutErrors(
      baseArgs({ isSignedIn: true, accountPassword: '', accountPasswordConfirm: 'mismatch' })
    );
    expect(errors.accountPassword).toBeUndefined();
    expect(errors.accountPasswordConfirm).toBeUndefined();
  });

  it('skips billing address validation when billing matches account address', () => {
    const errors = computeCheckoutErrors(
      baseArgs({ billingSameAsAccount: true, billingAddress: { line1: '', line2: '', city: '', state: '', zipCode: '' } })
    );
    expect(errors.billingLine1).toBeUndefined();
    expect(errors.billingCity).toBeUndefined();
    expect(errors.billingState).toBeUndefined();
    expect(errors.billingZip).toBeUndefined();
  });

  it('validates billing address fields when billing differs from account address', () => {
    const errors = computeCheckoutErrors(
      baseArgs({ billingSameAsAccount: false, billingAddress: { line1: '', line2: '', city: '', state: '', zipCode: 'bad' } })
    );
    expect(errors.billingLine1).toBeDefined();
    expect(errors.billingCity).toBeDefined();
    expect(errors.billingState).toBeDefined();
    expect(errors.billingZip).toBeDefined();
  });

  it('requires agreement to terms', () => {
    expect(computeCheckoutErrors(baseArgs({ agreedToTerms: false })).terms).toBeDefined();
  });

  describe('date of birth / minimum age', () => {
    it('requires a date of birth', () => {
      expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, dateOfBirth: '' } })).dateOfBirth).toBeDefined();
    });

    it('rejects an unparseable date of birth', () => {
      expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, dateOfBirth: 'not-a-date' } })).dateOfBirth).toBeDefined();
    });

    it('accepts an 18-year-old in a default-minimum-age state', () => {
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      const dob = eighteenYearsAgo.toISOString().slice(0, 10);
      expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, state: 'NY', dateOfBirth: dob } })).dateOfBirth).toBeUndefined();
    });

    it('rejects someone a day short of 18', () => {
      const almostEighteen = new Date();
      almostEighteen.setFullYear(almostEighteen.getFullYear() - 18);
      almostEighteen.setDate(almostEighteen.getDate() + 1);
      const dob = almostEighteen.toISOString().slice(0, 10);
      expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, state: 'NY', dateOfBirth: dob } })).dateOfBirth).toBeDefined();
    });

    it('rejects an 18-year-old in Alabama, Nebraska, and Mississippi (19/19/21 minimum)', () => {
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      const dob = eighteenYearsAgo.toISOString().slice(0, 10);
      for (const state of ['AL', 'NE', 'MS']) {
        expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, state, dateOfBirth: dob } })).dateOfBirth).toBeDefined();
      }
    });

    it('accepts a 21-year-old in Mississippi', () => {
      const twentyOneYearsAgo = new Date();
      twentyOneYearsAgo.setFullYear(twentyOneYearsAgo.getFullYear() - 21);
      const dob = twentyOneYearsAgo.toISOString().slice(0, 10);
      expect(computeCheckoutErrors(baseArgs({ checkoutForm: { ...validForm, state: 'MS', dateOfBirth: dob } })).dateOfBirth).toBeUndefined();
    });
  });
});

describe('calculateAge', () => {
  it('computes whole years elapsed', () => {
    expect(calculateAge('1990-06-15', new Date('2026-06-15'))).toBe(36);
  });

  it('has not turned the year yet if the birthday has not occurred', () => {
    expect(calculateAge('1990-06-15', new Date('2026-06-14'))).toBe(35);
  });

  it('returns null for missing or invalid input', () => {
    expect(calculateAge('')).toBeNull();
    expect(calculateAge(null)).toBeNull();
    expect(calculateAge('not-a-date')).toBeNull();
  });
});
