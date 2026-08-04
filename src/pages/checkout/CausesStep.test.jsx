import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CausesStep from './CausesStep';

vi.mock('../../components/CharitySelector', () => ({
  default: ({ value, onChange, max }) => (
    <div data-testid="charity-selector" data-max={max}>
      <button onClick={() => onChange([...value, 'new-slug'])}>add cause</button>
    </div>
  ),
}));

describe('CausesStep', () => {
  it('renders the heading and passes causeSlugs through to the selector', () => {
    render(
      <CausesStep
        causeSlugs={['slug-a']}
        onChangeCauseSlugs={() => {}}
        savingCauses={false}
        causesError={null}
        onSave={() => {}}
        onSkip={() => {}}
      />
    );
    expect(screen.getByText('Pick your causes.')).toBeInTheDocument();
    expect(screen.getByTestId('charity-selector')).toHaveAttribute('data-max', '4');
  });

  it('disables Continue when no causes are selected', () => {
    render(
      <CausesStep
        causeSlugs={[]}
        onChangeCauseSlugs={() => {}}
        savingCauses={false}
        causesError={null}
        onSave={() => {}}
        onSkip={() => {}}
      />
    );
    expect(screen.getByText('Continue')).toBeDisabled();
  });

  it('calls onSave when Continue is clicked with causes selected', () => {
    const onSave = vi.fn();
    render(
      <CausesStep
        causeSlugs={['slug-a']}
        onChangeCauseSlugs={() => {}}
        savingCauses={false}
        causesError={null}
        onSave={onSave}
        onSkip={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Continue'));
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onSkip when the skip link is clicked', () => {
    const onSkip = vi.fn();
    render(
      <CausesStep
        causeSlugs={[]}
        onChangeCauseSlugs={() => {}}
        savingCauses={false}
        causesError={null}
        onSave={() => {}}
        onSkip={onSkip}
      />
    );
    fireEvent.click(screen.getByText('Skip, split among all'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('shows the saving state and disables both actions', () => {
    render(
      <CausesStep
        causeSlugs={['slug-a']}
        onChangeCauseSlugs={() => {}}
        savingCauses={true}
        causesError={null}
        onSave={() => {}}
        onSkip={() => {}}
      />
    );
    expect(screen.getByText('Saving...')).toBeDisabled();
    expect(screen.getByText('Skip, split among all')).toBeDisabled();
  });

  it('shows the error message when causesError is set', () => {
    render(
      <CausesStep
        causeSlugs={['slug-a']}
        onChangeCauseSlugs={() => {}}
        savingCauses={false}
        causesError="Could not save your causes just now."
        onSave={() => {}}
        onSkip={() => {}}
      />
    );
    expect(screen.getByText('Could not save your causes just now.')).toBeInTheDocument();
  });
});
