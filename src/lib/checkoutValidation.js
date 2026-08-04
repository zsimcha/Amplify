// Pure validation logic for the checkout form. Extracted from CheckoutPage so
// it can be unit tested without rendering the page, and reused if another
// entry point ever needs the same checks.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
export const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export function isValidZip(zip) {
  return ZIP_REGEX.test(zip);
}

function isInvalidPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length < 10 || /^(\d)\1{9}$/.test(cleaned);
}

// Derives the current error set from checkout state. No side effects, so it
// can be called on every render/keystroke for live validation as well as at
// submit time.
export function computeCheckoutErrors({
  checkoutForm,
  isSignedIn,
  accountPassword,
  accountPasswordConfirm,
  billingSameAsAccount,
  billingAddress,
  agreedToTerms,
}) {
  const errors = {};

  if (!checkoutForm.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!checkoutForm.displayName.trim() && !checkoutForm.isAnonymous) errors.displayName = 'Display name is required.';
  if (!EMAIL_REGEX.test(checkoutForm.email)) errors.email = 'Enter a valid email.';
  if (isInvalidPhone(checkoutForm.phone)) errors.phone = 'Enter a valid 10-digit phone number.';
  if (!checkoutForm.address.trim()) errors.address = 'Address is required.';
  if (!checkoutForm.city.trim()) errors.city = 'City is required.';
  if (!checkoutForm.state) errors.state = 'Select a state.';
  if (!isValidZip(checkoutForm.zipCode)) errors.zipCode = 'Enter a valid zip code.';

  // Account credentials (new visitors only — signed-in members already have one)
  if (!isSignedIn) {
    if (accountPassword.length < 8) errors.accountPassword = 'Password must be at least 8 characters.';
    if (accountPassword !== accountPasswordConfirm) errors.accountPasswordConfirm = 'Passwords do not match.';
  }

  // Billing address validation (only if user opted out of "same as above")
  if (!billingSameAsAccount) {
    if (!billingAddress.line1.trim()) errors.billingLine1 = 'Billing address is required.';
    if (!billingAddress.city.trim()) errors.billingCity = 'Billing city is required.';
    if (!billingAddress.state) errors.billingState = 'Select a billing state.';
    if (!isValidZip(billingAddress.zipCode)) errors.billingZip = 'Enter a valid billing zip.';
  }

  if (!agreedToTerms) errors.terms = 'You must agree to the terms to proceed.';

  return errors;
}
