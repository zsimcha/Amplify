import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CheckoutPage from './CheckoutPage';

// ---- Hoisted mock handles -------------------------------------------------
// This suite covers the one piece of CheckoutPage that has no test coverage
// elsewhere: the orchestration in handleCheckoutSubmit that sequences
// auth.signUp -> the process_checkout RPC -> the optimistic appData update.
// A bug here either charges nothing for a "successful" signup, or leaves an
// auth user with no membership row, so the sequencing itself is what matters.
const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  signUp: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => mocks.useAuth() }));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signUp: mocks.signUp },
    rpc: mocks.rpc,
  },
}));

// Real siteConfig defaults to showing the causes step after signup; skip it
// here so a successful checkout lands directly on ConfirmationStep.
vi.mock('../config/siteConfig', () => ({ HIDE_PARTNER_IDENTITIES: true }));

vi.mock('../components/layout/SecondaryNavbar', () => ({ default: () => <nav /> }));
vi.mock('../components/layout/Footer', () => ({ default: () => <footer /> }));

const appDataStub = {
  tierData: {
    silver: { price: 250, prize: '$25,000', totalOdds: '1 / 100', otherPrizes: [] },
    gold: { price: 500, prize: '$50,000', totalOdds: '1 / 50', otherPrizes: [] },
    diamond: { price: 1000, prize: '$100,000', totalOdds: '1 / 25', otherPrizes: [] },
  },
  allCommunityNames: ['General'],
  communities: { General: { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 } },
};

function renderCheckout({ setAppData = vi.fn() } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/checkout', state: { tier: 'silver' } }]}>
      <CheckoutPage appData={appDataStub} setAppData={setAppData} />
    </MemoryRouter>
  );
}

async function fillRequiredFields({ includeAccountCredentials }) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Full Name'), 'Jane Donor');
  // Signed-in members get their email pre-filled from the session; clear it
  // first so typing doesn't append to that value.
  await user.clear(screen.getByLabelText('Email'));
  await user.type(screen.getByLabelText('Email'), 'jane@example.com');
  await user.type(screen.getByLabelText('Phone'), '5551234567');
  await user.type(screen.getByLabelText('Address'), '123 Main St');
  await user.type(screen.getByLabelText('City'), 'New York');
  await user.selectOptions(screen.getByLabelText('State'), 'NY');
  await user.type(screen.getByLabelText('Zip Code'), '10001');

  if (includeAccountCredentials) {
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
  }

  // The terms checkbox has no accessible <label>; it's the last checkbox in
  // the default form state (Cover fee, Billing-same-as-account precede it).
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  await user.click(checkboxes[checkboxes.length - 1]);

  return user;
}

async function submit(user) {
  await user.click(screen.getByRole('button', { name: /pay \$/i }));
}

describe('CheckoutPage submit orchestration', () => {
  beforeEach(() => {
    mocks.useAuth.mockReset();
    mocks.signUp.mockReset();
    mocks.rpc.mockReset();
  });

  it('signs up, then calls process_checkout with the signed-up name, then applies the optimistic update and shows confirmation', async () => {
    mocks.useAuth.mockReturnValue({ user: null });
    mocks.signUp.mockResolvedValue({ data: { user: { identities: [{}] } }, error: null });
    mocks.rpc.mockResolvedValue({ error: null });
    const setAppData = vi.fn();

    renderCheckout({ setAppData });
    const user = await fillRequiredFields({ includeAccountCredentials: true });
    await submit(user);

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled());

    // signUp must run, and must run before the RPC (order matters: the RPC
    // relies on the freshly created auth session to link the membership).
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'jane@example.com',
      password: 'password123',
      options: expect.objectContaining({ data: { full_name: 'Jane Donor' } }),
    }));
    const signUpOrder = mocks.signUp.mock.invocationCallOrder[0];
    const rpcOrder = mocks.rpc.mock.invocationCallOrder[0];
    expect(signUpOrder).toBeLessThan(rpcOrder);

    expect(mocks.rpc).toHaveBeenCalledWith('process_checkout', expect.objectContaining({
      p_full_name: 'Jane Donor',
      p_display_name: 'Jane Donor',
      p_email: 'jane@example.com',
      p_tier: 'silver',
      p_community_name: 'General',
    }));

    // Optimistic update: run the updater the component handed to setAppData
    // against the stub state and check the resulting shape.
    expect(setAppData).toHaveBeenCalledTimes(1);
    const updater = setAppData.mock.calls[0][0];
    const next = updater(appDataStub);
    expect(next.communities.General.members).toBe(1);
    expect(next.communities.General.monthly).toBe(250);
    expect(next.communities.General.silver).toBe(1);

    await waitFor(() => expect(screen.getByText("You're in.")).toBeInTheDocument());
  });

  it('does not call process_checkout when signUp fails, and surfaces the error instead of the confirmation screen', async () => {
    mocks.useAuth.mockReturnValue({ user: null });
    mocks.signUp.mockResolvedValue({ data: null, error: { message: 'Something exploded' } });
    const setAppData = vi.fn();

    renderCheckout({ setAppData });
    const user = await fillRequiredFields({ includeAccountCredentials: true });
    await submit(user);

    await waitFor(() => expect(screen.getByText('Something exploded')).toBeInTheDocument());
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(setAppData).not.toHaveBeenCalled();
    expect(screen.queryByText("You're in.")).not.toBeInTheDocument();
  });

  it('treats a signUp for an already-registered email as an error and never calls the RPC', async () => {
    mocks.useAuth.mockReturnValue({ user: null });
    // Supabase returns a 200 with an obfuscated user (no identities) for an
    // email that already has an account, rather than an explicit error.
    mocks.signUp.mockResolvedValue({ data: { user: { identities: [] } }, error: null });
    const setAppData = vi.fn();

    renderCheckout({ setAppData });
    const user = await fillRequiredFields({ includeAccountCredentials: true });
    await submit(user);

    await waitFor(() => expect(screen.getByText(/already exists for this email/i)).toBeInTheDocument());
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('surfaces an error and stops at the form when signUp succeeds but process_checkout fails, instead of showing confirmation', async () => {
    mocks.useAuth.mockReturnValue({ user: null });
    mocks.signUp.mockResolvedValue({ data: { user: { identities: [{}] } }, error: null });
    mocks.rpc.mockResolvedValue({ error: { message: 'db exploded' } });
    const setAppData = vi.fn();

    renderCheckout({ setAppData });
    const user = await fillRequiredFields({ includeAccountCredentials: true });
    await submit(user);

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled());
    // The auth user now exists with no membership row (the orphan case flagged
    // in review) — this test locks in that the UI at least never claims
    // success for it, rather than silently treating it as done.
    expect(setAppData).not.toHaveBeenCalled();
    expect(screen.queryByText("You're in.")).not.toBeInTheDocument();
    expect(screen.getByText(/something went wrong processing your request/i)).toBeInTheDocument();
  });

  it('skips auth.signUp entirely for an already-signed-in member and checks out under their account', async () => {
    mocks.useAuth.mockReturnValue({ user: { email: 'existing@example.com' } });
    mocks.rpc.mockResolvedValue({ error: null });
    const setAppData = vi.fn();

    renderCheckout({ setAppData });
    const user = await fillRequiredFields({ includeAccountCredentials: false });
    await submit(user);

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled());
    expect(mocks.signUp).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("You're in.")).toBeInTheDocument());
  });
});
