import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ---- Hoisted mock handles -------------------------------------------------
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useAuth: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  getMyCauses: vi.fn(),
  saveMyCauses: vi.fn(),
  applyPendingCauses: vi.fn(),
  hidePartners: { value: false },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => mocks.useAuth() }));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ order: mocks.order }) }),
    rpc: mocks.rpc,
    auth: { updateUser: mocks.updateUser, signOut: mocks.signOut },
  },
}));

vi.mock('../lib/charities', () => ({
  getMyCauses: mocks.getMyCauses,
  saveMyCauses: mocks.saveMyCauses,
  applyPendingCauses: mocks.applyPendingCauses,
}));

// The partner blackout flag flips over time; read it through a mutable handle
// so these tests describe behavior rather than today's flag value.
vi.mock('../config/siteConfig', () => ({
  get HIDE_PARTNER_IDENTITIES() {
    return mocks.hidePartners.value;
  },
}));

vi.mock('../components/layout/SecondaryNavbar', () => ({ default: () => <nav /> }));
vi.mock('../components/layout/Footer', () => ({ default: () => <footer /> }));
vi.mock('../components/RequestCauseModal', () => ({
  default: ({ open }) => (open ? <div data-testid="request-modal" /> : null),
}));
vi.mock('../components/CharitySelector', () => ({
  default: ({ value, onChange }) => (
    <div data-testid="charity-selector">
      <span data-testid="draft">{value.join(',')}</span>
      <button onClick={() => onChange([...value, 'aish'])}>pick aish</button>
    </div>
  ),
}));

import AccountPage from './AccountPage';

const USER = { email: 'jane@example.com' };

function sub(overrides = {}) {
  return {
    id: 'sub-1',
    tier: 'gold',
    status: 'active',
    display_name: 'Jane',
    is_anonymous: false,
    created_at: '2026-01-01T00:00:00Z',
    communities: { name: 'Springfield' },
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>
  );
}

// The tier name appears both in the membership card and in the cancel prompt
// at the bottom, so wait on the price line instead — it appears exactly once.
async function renderLoaded() {
  const result = renderPage();
  await screen.findByText(/· \$\d+\/month/);
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hidePartners.value = false;
  mocks.useAuth.mockReturnValue({ user: USER, loading: false });
  mocks.order.mockResolvedValue({ data: [sub()], error: null });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.getMyCauses.mockResolvedValue([]);
  mocks.saveMyCauses.mockResolvedValue(undefined);
  mocks.applyPendingCauses.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
describe('AccountPage route guard', () => {
  it('redirects to /login once auth resolves with no user', async () => {
    mocks.useAuth.mockReturnValue({ user: null, loading: false });
    renderPage();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true }));
  });

  it('does not redirect while auth is still loading', () => {
    mocks.useAuth.mockReturnValue({ user: null, loading: true });
    renderPage();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe('AccountPage membership loading', () => {
  it('shows the membership once subscriptions load', async () => {
    await renderLoaded();
    expect(screen.getByText(/Springfield · \$500\/month/)).toBeInTheDocument();
    expect(screen.getAllByText('gold').length).toBeGreaterThan(0);
  });

  it('shows an error message when the subscriptions query fails', async () => {
    mocks.order.mockResolvedValue({ data: null, error: new Error('nope') });
    renderPage();
    expect(await screen.findByText('Could not load your membership. Please refresh the page.')).toBeInTheDocument();
  });

  it('shows the empty state when no membership is linked', async () => {
    mocks.order.mockResolvedValue({ data: [], error: null });
    renderPage();
    expect(await screen.findByText('No membership is linked to this account yet.')).toBeInTheDocument();
  });

  it('sends members with no membership to the circles page', async () => {
    mocks.order.mockResolvedValue({ data: [], error: null });
    renderPage();
    await userEvent.click(await screen.findByText(/Join a circle/));
    expect(mocks.navigate).toHaveBeenCalledWith('/circles');
  });
});

// ---------------------------------------------------------------------------
describe('AccountPage cancellation', () => {
  it('offers the retention modal first for tiers above silver', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('Cancel membership'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Before you go')).toBeInTheDocument();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('goes straight to the confirm prompt for silver, which has nothing lower to offer', async () => {
    mocks.order.mockResolvedValue({ data: [sub({ tier: 'silver' })], error: null });
    renderPage();
    await userEvent.click(await screen.findByText('Cancel membership'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Yes, Cancel')).toBeInTheDocument();
  });

  it('calls cancel_my_subscription and reports success', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('Cancel membership'));
    await userEvent.click(screen.getByText('Cancel my membership'));

    await waitFor(() =>
      expect(mocks.rpc).toHaveBeenCalledWith('cancel_my_subscription', { p_subscription_id: 'sub-1' })
    );
    expect(
      await screen.findByText('Your membership has been cancelled. You will not be charged again.')
    ).toBeInTheDocument();
  });

  it('refetches subscriptions after a successful cancellation', async () => {
    await renderLoaded();
    const callsBefore = mocks.order.mock.calls.length;

    await userEvent.click(screen.getByText('Cancel membership'));
    await userEvent.click(screen.getByText('Cancel my membership'));

    await waitFor(() => expect(mocks.order.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it('surfaces an error and does not claim success when the cancel RPC fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('denied') });
    renderPage();
    await userEvent.click(await screen.findByText('Cancel membership'));
    await userEvent.click(screen.getByText('Cancel my membership'));

    expect(
      await screen.findByText('Could not cancel your membership. Please try again or contact us.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/has been cancelled/)).not.toBeInTheDocument();
  });

  it('dismisses the retention modal without cancelling', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('Cancel membership'));
    await userEvent.click(screen.getByLabelText('Close'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe('AccountPage plan changes', () => {
  async function openPlanPicker() {
    renderPage();
    await userEvent.click(await screen.findByText('Change plan'));
  }

  it('calls change_my_tier with the selected tier', async () => {
    await openPlanPicker();
    await userEvent.click(screen.getByText('diamond'));
    await userEvent.click(screen.getByText('Confirm Change'));

    await waitFor(() =>
      expect(mocks.rpc).toHaveBeenCalledWith('change_my_tier', {
        p_subscription_id: 'sub-1',
        p_new_tier: 'diamond',
      })
    );
  });

  it('does not call the RPC until the change is confirmed', async () => {
    await openPlanPicker();
    await userEvent.click(screen.getByText('diamond'));
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('treats a { success: false } RPC payload as a failure and shows its message', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: false, message: 'Circle is full.' }, error: null });
    await openPlanPicker();
    await userEvent.click(screen.getByText('diamond'));
    await userEvent.click(screen.getByText('Confirm Change'));

    expect(await screen.findByText('Circle is full.')).toBeInTheDocument();
    expect(screen.queryByText(/Your plan has been changed/)).not.toBeInTheDocument();
  });

  it('falls back to a generic message when a rejected change carries no message', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: false }, error: null });
    await openPlanPicker();
    await userEvent.click(screen.getByText('diamond'));
    await userEvent.click(screen.getByText('Confirm Change'));

    expect(await screen.findByText('Could not change your plan.')).toBeInTheDocument();
  });

  it('reports success and refetches on an accepted change', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });
    await openPlanPicker();
    const callsBefore = mocks.order.mock.calls.length;
    await userEvent.click(screen.getByText('diamond'));
    await userEvent.click(screen.getByText('Confirm Change'));

    expect(await screen.findByText(/Your plan has been changed to diamond/)).toBeInTheDocument();
    await waitFor(() => expect(mocks.order.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it('surfaces an error when the change RPC itself fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('boom') });
    await openPlanPicker();
    await userEvent.click(screen.getByText('diamond'));
    await userEvent.click(screen.getByText('Confirm Change'));

    expect(
      await screen.findByText('Could not change your plan. Please try again or contact us.')
    ).toBeInTheDocument();
  });

  it('disables the tier the member is already on', async () => {
    await openPlanPicker();
    const picker = screen.getByText('Choose your plan').parentElement;
    expect(within(picker).getByText('gold').closest('button')).toBeDisabled();
    expect(within(picker).getByText('diamond').closest('button')).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
describe('AccountPage email change', () => {
  // The input is type="email" required, so the browser blocks plainly malformed
  // values before the handler runs. The app's regex is stricter than HTML5's —
  // it also demands a dot + TLD — and this is the gap it actually covers.
  it('rejects a domain with no TLD, which native validation lets through', async () => {
    await renderLoaded();
    await userEvent.type(screen.getByLabelText('New Email'), 'jane@example');
    await userEvent.click(screen.getByText('Update Email'));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('submits a valid address and clears the field', async () => {
    await renderLoaded();
    const field = screen.getByLabelText('New Email');
    await userEvent.type(field, 'new@example.com');
    await userEvent.click(screen.getByText('Update Email'));

    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ email: 'new@example.com' }));
    expect(await screen.findByText(/confirmation links were sent/)).toBeInTheDocument();
    expect(field).toHaveValue('');
  });

  it('surfaces the Supabase error message', async () => {
    mocks.updateUser.mockResolvedValue({ error: { message: 'Email already in use.' } });
    await renderLoaded();
    await userEvent.type(screen.getByLabelText('New Email'), 'new@example.com');
    await userEvent.click(screen.getByText('Update Email'));

    expect(await screen.findByText('Email already in use.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe('AccountPage password change', () => {
  async function fillPassword(pw, confirm) {
    await renderLoaded();
    await userEvent.type(screen.getByLabelText('New Password'), pw);
    await userEvent.type(screen.getByLabelText('Confirm Password'), confirm);
    await userEvent.click(screen.getByText('Change Password'));
  }

  it('rejects a password under 8 characters without calling Supabase', async () => {
    await fillPassword('short', 'short');
    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords without calling Supabase', async () => {
    await fillPassword('longenoughpw', 'differentpw1');
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('submits a valid password and clears both fields', async () => {
    await fillPassword('longenoughpw', 'longenoughpw');
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'longenoughpw' }));
    expect(await screen.findByText('Your password has been updated.')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm Password')).toHaveValue('');
  });

  it('surfaces the Supabase error message', async () => {
    mocks.updateUser.mockResolvedValue({ error: { message: 'Password is too weak.' } });
    await fillPassword('longenoughpw', 'longenoughpw');
    expect(await screen.findByText('Password is too weak.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe('AccountPage causes', () => {
  it('flushes any pending checkout selection before reading the saved set', async () => {
    renderPage();
    await waitFor(() => expect(mocks.getMyCauses).toHaveBeenCalled());
    expect(mocks.applyPendingCauses).toHaveBeenCalled();
    expect(mocks.applyPendingCauses.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.getMyCauses.mock.invocationCallOrder[0]);
  });

  it('still loads the saved set when flushing the pending selection fails', async () => {
    mocks.applyPendingCauses.mockRejectedValue(new Error('offline'));
    mocks.getMyCauses.mockResolvedValue(['aish']);
    renderPage();
    expect(await screen.findByText('Aish')).toBeInTheDocument();
  });

  it('shows a load error when the saved set cannot be read', async () => {
    mocks.getMyCauses.mockRejectedValue(new Error('rls'));
    renderPage();
    expect(await screen.findByText('Could not load your causes. Please refresh the page.')).toBeInTheDocument();
  });

  it('lists the saved causes by name', async () => {
    mocks.getMyCauses.mockResolvedValue(['aish', 'atime']);
    renderPage();
    expect(await screen.findByText('Aish')).toBeInTheDocument();
    expect(screen.getByText('A Time')).toBeInTheDocument();
  });

  it('keeps Save disabled until the draft actually differs from what is saved', async () => {
    mocks.getMyCauses.mockResolvedValue(['aish']);
    renderPage();
    await userEvent.click(await screen.findByText('Change causes'));

    expect(screen.getByText('Save Changes')).toBeDisabled();
    await userEvent.click(screen.getByText('pick aish'));
    expect(screen.getByText('Save Changes')).toBeEnabled();
  });

  it('saves the edited draft and reports success', async () => {
    mocks.getMyCauses.mockResolvedValue([]);
    renderPage();
    await userEvent.click(await screen.findByText('Choose causes'));
    await userEvent.click(screen.getByText('pick aish'));
    await userEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => expect(mocks.saveMyCauses).toHaveBeenCalledWith(['aish']));
    expect(await screen.findByText('Your causes have been updated.')).toBeInTheDocument();
  });

  it('reports an error and stays in edit mode when saving fails', async () => {
    mocks.saveMyCauses.mockRejectedValue(new Error('offline'));
    mocks.getMyCauses.mockResolvedValue([]);
    renderPage();
    await userEvent.click(await screen.findByText('Choose causes'));
    await userEvent.click(screen.getByText('pick aish'));
    await userEvent.click(screen.getByText('Save Changes'));

    expect(await screen.findByText('Could not update your causes. Please try again.')).toBeInTheDocument();
    expect(screen.getByTestId('charity-selector')).toBeInTheDocument();
  });

  it('discards the draft when the edit is cancelled', async () => {
    mocks.getMyCauses.mockResolvedValue([]);
    renderPage();
    await userEvent.click(await screen.findByText('Choose causes'));
    await userEvent.click(screen.getByText('pick aish'));
    await userEvent.click(screen.getByText('Cancel'));

    expect(mocks.saveMyCauses).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('Choose causes'));
    expect(screen.getByTestId('draft')).toHaveTextContent('');
  });

  it('hides the causes picker entirely during the partner blackout', async () => {
    mocks.hidePartners.value = true;
    mocks.getMyCauses.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/opens as soon as our partner organizations are announced/)).toBeInTheDocument();
    expect(screen.queryByText('Choose causes')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
describe('AccountPage sign out', () => {
  it('signs out and returns to the homepage', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('Sign Out'));

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalled());
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });
});
