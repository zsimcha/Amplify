import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import HeroBackdrop from './HeroBackdrop';

const mocks = vi.hoisted(() => ({ hidePartners: { value: false } }));

// Read the blackout flag through a mutable handle so these tests describe
// behavior rather than today's flag value.
vi.mock('../config/siteConfig', () => ({
  get HIDE_PARTNER_IDENTITIES() {
    return mocks.hidePartners.value;
  },
}));

const stubReducedMotion = (reduce) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce });
};

const photos = (container) => [...container.querySelectorAll('img.hero-photo')];
const visible = (container) => photos(container).filter((img) => img.classList.contains('opacity-100'));

describe('HeroBackdrop', () => {
  beforeEach(() => {
    mocks.hidePartners.value = false;
    stubReducedMotion(false);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests only the first photo until it has loaded, then the rest', () => {
    const { container } = render(<HeroBackdrop />);
    expect(photos(container)).toHaveLength(1);

    fireEvent.load(photos(container)[0]);
    expect(photos(container).length).toBeGreaterThan(1);
  });

  it('shows the first photo once it loads, and rotates on the timer', () => {
    const { container } = render(<HeroBackdrop />);
    const first = photos(container)[0];
    expect(visible(container)).toHaveLength(0);

    fireEvent.load(first);
    photos(container).forEach((img) => fireEvent.load(img));
    expect(visible(container)).toEqual([first]);

    act(() => { vi.advanceTimersByTime(3400); });
    expect(visible(container)).toHaveLength(1);
    expect(visible(container)[0]).not.toBe(first);
  });

  it('still loads the rest, and shows one, when the first photo fails', () => {
    const { container } = render(<HeroBackdrop />);
    fireEvent.error(photos(container)[0]);

    const rest = photos(container).slice(1);
    expect(rest.length).toBeGreaterThan(0);
    fireEvent.load(rest[1]);
    expect(visible(container)).toEqual([rest[1]]);
  });

  it('cycles through only the photos that loaded, in order', () => {
    const { container } = render(<HeroBackdrop />);
    fireEvent.load(photos(container)[0]);
    const all = photos(container);
    // Load every other photo; the rest 404.
    all.forEach((img, i) => (i % 2 === 0 ? fireEvent.load(img) : fireEvent.error(img)));
    const good = all.map((_, i) => i).filter((i) => i % 2 === 0);

    // Assert the exact sequence, not just "something loaded is showing" — a
    // rotation that lands on a 404 falls back to the first photo, which would
    // still pass a weaker check while visibly flashing back to it.
    const seen = [all.indexOf(visible(container)[0])];
    for (let tick = 0; tick < good.length * 2 - 1; tick++) {
      act(() => { vi.advanceTimersByTime(3400); });
      seen.push(all.indexOf(visible(container)[0]));
    }
    expect(seen).toEqual([...good, ...good]);
  });

  it('requests no photos at all during the partner blackout', () => {
    mocks.hidePartners.value = true;
    const { container } = render(<HeroBackdrop />);
    expect(photos(container)).toHaveLength(0);
    // The grade and scrim still render, so the hero isn't a flat block.
    expect(container.querySelector('.hero-grade')).not.toBeNull();
    expect(container.querySelector('.hero-scrim')).not.toBeNull();
  });

  it('under reduced motion, fetches and holds only the first photo', () => {
    stubReducedMotion(true);
    const { container } = render(<HeroBackdrop />);
    const first = photos(container)[0];
    fireEvent.load(first);

    expect(photos(container)).toEqual([first]);
    act(() => { vi.advanceTimersByTime(3400 * 3); });
    expect(visible(container)).toEqual([first]);
  });
});
