// Membership display helpers shared by My Account (kept out of the page file
// so they can be unit tested on their own).

// "2026-12-07" -> "December 7, 2026" (drawing dates are calendar dates, not instants).
export const formatDrawingDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// What a member is told right after cancelling. Contributions are never
// refunded, so anything already paid for still counts (Official Rules §6):
// in an Active circle that keeps them in the upcoming drawing until it's held;
// in a Filling circle their first-drawing entry stays valid.
export function describeCancellation(result) {
  const when = result?.drawing_date ? ` on ${formatDrawingDate(result.drawing_date)}` : '';
  if (result?.status === 'cancelling') {
    return `Your membership is cancelled and you won't be charged again. You're still in the drawing${when} you've already paid for, and your membership ends after it.`;
  }
  if (result?.still_entered) {
    return result.drawing_date
      ? `Your membership has been cancelled and you won't be charged again. You're still entered in the drawing${when} you've already paid for.`
      : "Your membership has been cancelled and you won't be charged again. Your entry in your circle's first drawing still counts.";
  }
  return 'Your membership has been cancelled. You will not be charged again.';
}

// Earliest not-yet-held drawing each membership has a paid entry in, keyed by
// subscription id ({ date: 'YYYY-MM-DD' | null }; null = a first drawing that
// isn't scheduled yet).
export function upcomingEntriesBySubscription(entries) {
  const result = {};
  (entries || []).forEach((e) => {
    const d = e.drawings;
    if (!d || d.status !== 'scheduled') return;
    const prev = result[e.subscription_id];
    if (!prev || (d.drawing_date && (!prev.date || d.drawing_date < prev.date))) {
      result[e.subscription_id] = { date: d.drawing_date || null };
    }
  });
  return result;
}
