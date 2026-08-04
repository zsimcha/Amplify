import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CheckoutSummary from './CheckoutSummary';

const tierData = {
  silver: { price: 250, prize: '$25,000', totalOdds: '1 / 100' },
  gold: { price: 500, prize: '$50,000', totalOdds: '1 / 50' },
  diamond: { price: 1000, prize: '$100,000', totalOdds: '1 / 25' },
};

function renderSummary(props) {
  return render(
    <MemoryRouter>
      <CheckoutSummary tierData={tierData} {...props} />
    </MemoryRouter>
  );
}

describe('CheckoutSummary', () => {
  it('shows the selected tier, price, and prize', () => {
    renderSummary({ selectedTier: 'gold', basePrice: 500, feeBeingCovered: false, processingFee: 0, totalCharged: 500 });
    expect(screen.getByText('gold')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('1 / 50')).toBeInTheDocument();
  });

  it('hides the processing fee line when the fee is not being covered', () => {
    renderSummary({ selectedTier: 'silver', basePrice: 250, feeBeingCovered: false, processingFee: 7.55, totalCharged: 250 });
    expect(screen.queryByText('Processing Fee')).not.toBeInTheDocument();
  });

  it('shows the processing fee line and total when the fee is covered', () => {
    renderSummary({ selectedTier: 'silver', basePrice: 250, feeBeingCovered: true, processingFee: 7.55, totalCharged: 257.55 });
    expect(screen.getByText('Processing Fee')).toBeInTheDocument();
    expect(screen.getByText('+$7.55')).toBeInTheDocument();
    expect(screen.getByText('$257.55')).toBeInTheDocument();
  });
});
