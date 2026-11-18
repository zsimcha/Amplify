import { describe, it, expect } from 'vitest';
import { describeCancellation, formatDrawingDate, upcomingEntriesBySubscription } from './membership';

describe('describeCancellation', () => {
  it('tells a member who paid for the upcoming drawing that they stay in it until it is held', () => {
    expect(describeCancellation({ status: 'cancelling', still_entered: true, drawing_date: '2026-12-07' }))
      .toBe("Your membership is cancelled and you won't be charged again. You're still in the drawing on December 7, 2026 you've already paid for, and your membership ends after it.");
  });

  it("keeps a filling circle's unscheduled first-drawing entry in the message", () => {
    expect(describeCancellation({ status: 'cancelled', still_entered: true, drawing_date: null }))
      .toBe("Your membership has been cancelled and you won't be charged again. Your entry in your circle's first drawing still counts.");
  });

  it('mentions a scheduled drawing that a cancelled member is still entered in', () => {
    expect(describeCancellation({ status: 'cancelled', still_entered: true, drawing_date: '2027-01-05' }))
      .toMatch(/still entered in the drawing on January 5, 2027/);
  });

  it('falls back to the plain message when nothing is still entered (or the server is older)', () => {
    expect(describeCancellation({ status: 'cancelled', still_entered: false })).toBe('Your membership has been cancelled. You will not be charged again.');
    expect(describeCancellation(null)).toBe('Your membership has been cancelled. You will not be charged again.');
  });
});

describe('formatDrawingDate', () => {
  it('formats a calendar date without shifting it across time zones', () => {
    expect(formatDrawingDate('2026-12-07')).toBe('December 7, 2026');
  });
});

describe('upcomingEntriesBySubscription', () => {
  it('keeps the earliest scheduled drawing per membership and ignores held ones', () => {
    const result = upcomingEntriesBySubscription([
      { subscription_id: 1, drawings: { drawing_date: '2026-12-07', status: 'held' } },
      { subscription_id: 1, drawings: { drawing_date: '2027-02-05', status: 'scheduled' } },
      { subscription_id: 1, drawings: { drawing_date: '2027-01-05', status: 'scheduled' } },
      { subscription_id: 2, drawings: { drawing_date: null, status: 'scheduled' } },
      { subscription_id: 3, drawings: null },
    ]);
    expect(result).toEqual({ 1: { date: '2027-01-05' }, 2: { date: null } });
  });

  it('tolerates a missing list', () => {
    expect(upcomingEntriesBySubscription(null)).toEqual({});
  });
});
