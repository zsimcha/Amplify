import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConfirmationStep from './ConfirmationStep';

function renderStep(props) {
  return render(
    <MemoryRouter>
      <ConfirmationStep {...props} />
    </MemoryRouter>
  );
}

describe('ConfirmationStep', () => {
  it('welcomes the member to their selected community', () => {
    renderStep({ selectedCommunity: 'Springfield', causesSaved: false, causeSlugs: [], isSignedIn: true });
    expect(screen.getByText(/Welcome to the Springfield circle/)).toBeInTheDocument();
  });

  it('shows the even-split message when no causes were saved', () => {
    renderStep({ selectedCommunity: 'General', causesSaved: false, causeSlugs: [], isSignedIn: true });
    expect(screen.getByText(/split evenly among all of our partner organizations/)).toBeInTheDocument();
  });

  it('shows the signed-in causes-saved message with singular wording for one cause', () => {
    renderStep({ selectedCommunity: 'General', causesSaved: true, causeSlugs: ['a'], isSignedIn: true });
    expect(screen.getByText(/You're supporting 1 organization\./)).toBeInTheDocument();
  });

  it('shows the signed-in causes-saved message with plural wording for multiple causes', () => {
    renderStep({ selectedCommunity: 'General', causesSaved: true, causeSlugs: ['a', 'b'], isSignedIn: true });
    expect(screen.getByText(/You're supporting 2 organizations\./)).toBeInTheDocument();
  });

  it('shows the pending-confirmation causes message when signed out', () => {
    renderStep({ selectedCommunity: 'General', causesSaved: true, causeSlugs: ['a'], isSignedIn: false });
    expect(screen.getByText(/We've saved your 1 cause and will apply them/)).toBeInTheDocument();
  });

  it('shows the account-creation notice only when signed out', () => {
    const { rerender } = renderStep({ selectedCommunity: 'General', causesSaved: false, causeSlugs: [], isSignedIn: false });
    expect(screen.getByText(/We've created your account/)).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ConfirmationStep selectedCommunity="General" causesSaved={false} causeSlugs={[]} isSignedIn={true} />
      </MemoryRouter>
    );
    expect(screen.queryByText(/We've created your account/)).not.toBeInTheDocument();
  });

  it('links back home', () => {
    renderStep({ selectedCommunity: 'General', causesSaved: false, causeSlugs: [], isSignedIn: true });
    expect(screen.getByText('Return Home')).toHaveAttribute('href', '/');
  });
});
