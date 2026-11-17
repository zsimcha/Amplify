import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalyticsOptOut, { OPT_OUT_KEY } from './AnalyticsOptOut';

describe('AnalyticsOptOut', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.clarity;
    delete window['ga-disable-G-L9BB1FT5GE'];
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: undefined, configurable: true });
  });
  afterEach(() => {
    document.cookie.split(';').forEach((c) => {
      document.cookie = `${c.split('=')[0].trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  it('remembers the opt-out, stops both tools on the current page, and clears their cookies', async () => {
    window.clarity = vi.fn();
    document.cookie = '_ga=GA1.1.123; path=/';
    document.cookie = '_clck=abc; path=/';
    document.cookie = 'unrelated=keep; path=/';

    render(<AnalyticsOptOut />);
    await userEvent.click(screen.getByRole('button', { name: 'Opt out of analytics' }));

    // This flag is what the loader in index.html checks on every page load.
    expect(localStorage.getItem(OPT_OUT_KEY)).toBe('1');
    expect(window['ga-disable-G-L9BB1FT5GE']).toBe(true);
    expect(window.clarity).toHaveBeenCalledWith('stop');
    expect(document.cookie).not.toMatch(/_ga=/);
    expect(document.cookie).not.toMatch(/_clck=/);
    expect(document.cookie).toMatch(/unrelated=keep/);
    expect(screen.getByText(/You've opted out/)).toBeInTheDocument();
  });

  it('shows the opted-out state on a later visit and lets the visitor opt back in', () => {
    localStorage.setItem(OPT_OUT_KEY, '1');
    render(<AnalyticsOptOut />);
    expect(screen.getByText(/You've opted out/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turn analytics back on' })).toBeInTheDocument();
  });

  it('explains that analytics are already off when the browser sends Global Privacy Control', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true });
    render(<AnalyticsOptOut />);
    expect(screen.getByText(/Global Privacy Control/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
