import React from 'react';
import { TIER_DATA, prizeSchedule, tierTotalARV, combinedTotalARV, formatMoney } from '../data/tierData';

const TIER_LABELS = { silver: 'Silver', gold: 'Gold', diamond: 'Diamond' };

// The Monthly Drawing Addendum (Template B of the Drawing Addenda Templates)
// for the current period, covering all three Tiers at once. Per Master
// Rules §1/§2 and Terms §9, the Master Rules never state actual prize
// amounts or dates themselves — that detail lives in this separately filed
// instrument, posted alongside the Master Rules at /rules. Prize amounts and
// the ARV totals below are pulled live from `tierData.js`, the same data
// backing the Circles/Home tier cards, so this can't silently drift out of
// sync with what the site actually offers. Everything the Sponsor has to
// supply per filing (Addendum number, state registrations, exact entry
// period and Drawing Date) is left as a literal bracket placeholder, same
// convention as the Master Rules above — this is a template render, not yet
// a specific dated filing.
const DrawingAddendumContent = () => (
  <>
    <div className="my-14 md:my-20 border-t-2 border-slate-900" />

    <p className="text-xs md:text-sm font-bold text-slate-500 mb-2">
      Amplify Giving Circles — Supplemental Drawing Addendum No. [____]
    </p>
    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4">
      Monthly Drawing Addendum, [Month Year] Period
    </h2>
    <p className="uppercase font-bold text-xs md:text-sm tracking-wider text-slate-500 mb-10 md:mb-14">
      No purchase, payment, or donation is necessary to enter or win. A purchase, payment, or donation will not improve your chances of winning. Void where prohibited.
    </p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">1 &nbsp;&nbsp; Incorporation of Master Rules</h3>
    <p className="mb-6">This Addendum incorporates by reference the Amplify Giving Circles Master Official Rules, Version 1.0, dated [INSERT VERSION DATE] (the "Master Rules"), set out above and available at https://amplifygive.com/official-rules. Capitalized terms not defined here have the meanings given in the Master Rules. In the event of any conflict, this Addendum controls as to the Drawings described here.</p>
    <p className="mb-6">Once this Addendum commences, this Addendum and the incorporated Master Rules Version are fixed for these Drawings and will not be changed, modified, or altered.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">2 &nbsp;&nbsp; Sponsor</h3>
    <p className="mb-6">Amplify Give LLC, 7901 4th St N, Ste 32498, St. Petersburg, FL 33702.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">3 &nbsp;&nbsp; Registration and Bonding</h3>
    <p className="mb-6">This promotion is registered and bonded as a game promotion where required by applicable state law. [LIST STATES, GAME-PROMOTION REGISTRATION NUMBERS, AND BOND AMOUNT AS APPLICABLE.] The Sponsor's charitable solicitation registrations are listed separately at https://amplifygive.com/disclosures.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">4 &nbsp;&nbsp; Circles and Tiers Covered</h3>
    <div className="overflow-x-auto my-10">
      <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-slate-100 text-slate-900 uppercase text-xs tracking-wider">
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold">Tier</th>
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold">Circles Covered</th>
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold text-right">Monthly Contribution</th>
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold">Prize Schedule per Circle</th>
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold text-right">Total ARV for Tier</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm md:text-base">
          {Object.keys(TIER_DATA).map((key, i) => (
            <tr key={key} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
              <td className="p-3 md:p-4 font-bold text-slate-800 align-top">{TIER_LABELS[key]}</td>
              <td className="p-3 md:p-4 text-slate-500 align-top">[Insert active Circle numbers]</td>
              <td className="p-3 md:p-4 text-right font-bold text-slate-800 align-top">{formatMoney(TIER_DATA[key].price)}</td>
              <td className="p-3 md:p-4 text-slate-600 align-top">
                {prizeSchedule(key).map((p) => (
                  <div key={p.label}>{p.label}: {formatMoney(p.amount)} ({p.count} winner{p.count === 1 ? '' : 's'})</div>
                ))}
              </td>
              <td className="p-3 md:p-4 text-right font-bold text-slate-800 align-top">{formatMoney(tierTotalARV(key))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="mb-6">Each Circle listed above has its own separate entry pool and its own separate prize schedule. Entries are never shared between Circles.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">5 &nbsp;&nbsp; Entry Period</h3>
    <p className="mb-6">Opens: [DATE] at 12:00:01 a.m. Eastern Time. Closes: [DATE] at 11:59:59 p.m. Eastern Time.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">6 &nbsp;&nbsp; Drawing Date</h3>
    <p className="mb-6">[DATE]. Every Drawing covered by this Addendum will be held on this date. The Sponsor has no discretion to cancel or postpone.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">7 &nbsp;&nbsp; Total ARV of All Prizes Under This Addendum</h3>
    <p className="mb-6">{formatMoney(combinedTotalARV())}, consisting of the per-Tier totals set out in Section 4.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">8 &nbsp;&nbsp; AMOE</h3>
    <p className="mb-6">The free alternative method of entry is as described in Section 7 of the Master Rules. There is a strict limit of one (1) entry per person, per Tier, per Drawing period, regardless of the method of entry (Contribution or AMOE). AMOE entries are allocated among all Currently-Open Pools in the relevant Tier by the neutral round-robin rotation described in Master Rules Section 7. Postcards must be postmarked no later than seven (7) days before the Drawing Date stated in Section 6 and received no later than two (2) business days before that date.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">9 &nbsp;&nbsp; Odds</h3>
    <p className="mb-6">Odds of winning depend on the total number of eligible entries received for the applicable Circle. Paid entries and AMOE entries within the same Circle carry identical odds.</p>

    <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">10 &nbsp;&nbsp; Term of This Addendum</h3>
    <p className="mb-6">This Addendum commences on the date the entry period opens and terminates upon completion of all Drawings described here and fulfillment of all prizes awarded in them. Entries do not roll over into any subsequent Addendum.</p>
  </>
);

export default DrawingAddendumContent;
