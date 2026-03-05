import React from 'react';

const RulesContent = () => (
  <>
    <p className="uppercase font-bold text-xs md:text-sm tracking-wider text-slate-500 mb-10 md:mb-14">
      NO PURCHASE, PAYMENT, OR DONATION OF ANY KIND IS NECESSARY TO ENTER OR WIN. NEITHER A PURCHASE NOR A DONATION WILL INCREASE YOUR CHANCES OF WINNING. VOID WHERE PROHIBITED BY LAW.
    </p>
    
    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">1 &nbsp;&nbsp; Sponsor, Administrator, and Designated Beneficiary</h3>
    <p className="mb-6">The Amplify Founders Circle Sweepstakes (the "Sweepstakes") is sponsored and administered by Amplify Ltd., [Insert Address] ("Sponsor"). Voluntary contributions are remitted to a donor-advised fund administered by the Change Foundation, [Insert Address] ("DAF Administrator"), which subsequently grants net proceeds to a designated charitable beneficiary specifically identified on the Platform for each separate Promotional Period.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">2 &nbsp;&nbsp; Promotional Periods</h3>
    <p className="mb-6">The Sweepstakes operates through a series of distinct, recurring calendar-month promotional periods (each, a "Promotional Period"). Each Promotional Period commences on the first day of the calendar month at 12:00:00 AM Eastern Time ("ET") and concludes on the last day of the calendar month at 11:59:59 PM ET.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">3 &nbsp;&nbsp; Eligibility</h3>
    <p className="mb-6">The Sweepstakes is strictly open to legal residents of the fifty (50) United States and the District of Columbia who have reached the age of eighteen (18) years or older (or the age of majority in their jurisdiction of residence) at the time of entry. Employees, independent contractors, officers, and directors of the Sponsor, the DAF Administrator, the designated charitable beneficiary, their respective affiliates, advertising agencies, and immediate family members (spouse, parents, siblings, children) or persons living in the same household are ineligible to participate. Entrants must not be listed on any state or federal sanctions lists and must successfully pass all required identity verification protocols.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">4 &nbsp;&nbsp; Circle Mechanics and Draw Triggers</h3>
    <p className="mb-6">The Sweepstakes utilizes a tiered structure ($250, $500, and $1,000 Tiers). Within each Tier, entries are organized into groups defined as "Circles."</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>Capacity:</strong> Each Circle is capped at exactly four hundred (400) paid participants. Multiple Circles may be generated and filled concurrently within a single Tier.</li>
      <li className="pl-2"><strong>Active Status:</strong> A Circle achieves "Active Circle" status solely when four hundred (400) paid memberships have been successfully verified and funds have cleared. Alternative Method of Entry (AMOE) submissions do not count toward this 400-participant trigger.</li>
      <li className="pl-2"><strong>Draw Execution:</strong> A drawing is triggered and executed for a Circle only if it achieves Active Circle status prior to the conclusion of the current Promotional Period. All drawings for Active Circles will occur on the first (1st) day of the month immediately following the end of the Promotional Period.</li>
      <li className="pl-2"><strong>Rollover Provision:</strong> If a Circle fails to reach the 400-paid-participant threshold by the end date of the Promotional Period, the Sponsor reserves the absolute right to either (a) roll the existing participants into the corresponding filling Circle for the subsequent Promotional Period, or (b) execute the drawing for the partially filled Circle. No participant is entitled to a drawing or prize until a Circle achieves Active status.</li>
    </ul>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">5 &nbsp;&nbsp; Methods of Entry</h3>
    <p className="mb-6">Participants may enter the Sweepstakes via one of the following two methods:</p>
    
    <h4 className="text-base md:text-lg font-bold text-slate-800 mt-8 mb-3 uppercase tracking-tight">Method A: Paid Voluntary Contribution</h4>
    <p className="mb-6">During a Promotional Period, eligible individuals may visit the Platform, select a specific Tier, and authorize a voluntary contribution. Upon successful clearance of funds, the participant is allocated sequentially to the currently filling Circle in the selected Tier. Limit: One (1) paid entry per person, per Tier, per calendar month.</p>
    
    <h4 className="text-base md:text-lg font-bold text-slate-800 mt-8 mb-3 uppercase tracking-tight">Method B: Alternative Method of Entry (AMOE) – Free Mail-In</h4>
    <p className="mb-6">To enter without making a financial contribution, eligible individuals must handwrite their complete first and last name, valid email address, physical mailing address (no P.O. Boxes), telephone number, date of birth, the specific Calendar Month of entry, the unique monthly phrase (posted on the Platform on the 1st of each month), and the Specific Tier ($250, $500, or $1,000) they wish to enter on a standard 3.5" x 5" postcard.</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>Mailing Address:</strong> Mail the postcard with proper postage affixed to: Amplify Founders Circle AMOE, [Insert Address].</li>
      <li className="pl-2"><strong>Limits and Processing:</strong> Limit one (1) AMOE entry per person, per month. Postcards must be postmarked by the end date of the applicable Promotional Period and received no later than five (5) business days prior to the Drawing Date. Mechanically reproduced, photocopied, illegible, or incomplete entries are strictly void.</li>
      <li className="pl-2"><strong>AMOE Allocation Algorithm:</strong> Valid AMOE entries are aggregated by Tier. Immediately prior to the Drawing Date, the Sponsor will utilize a deterministic algorithm to allocate the AMOE entries in a round-robin fashion across all Active Circles within that specific Tier. In the event of a tie during allocation, postmark dates and digital scan timestamps will be utilized to determine placement. This protocol ensures that all AMOE entries are treated with equal dignity and possess the exact same mathematical probability of winning as paid entries within their assigned Circle.</li>
    </ul>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">6 &nbsp;&nbsp; Prize Structure and Odds of Winning</h3>
    <p className="mb-6">For each Active Circle successfully drawn, the following prizes will be awarded based on the Tier:</p>
    <div className="overflow-x-auto my-10">
      <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-slate-100 text-slate-900 uppercase text-xs tracking-wider">
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold">Tier</th>
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold">Prize Level</th>
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold text-center">Winners</th>
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold text-right">Prize Amount</th>
            <th className="p-3 md:p-4 border-b border-slate-200 font-bold text-right">Base Odds*</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm md:text-base">
          <tr><td className="p-3 md:p-4 font-bold text-slate-800">$250 Tier</td><td className="p-3 md:p-4 text-slate-600">Grand Prize</td><td className="p-3 md:p-4 text-center text-slate-600">1</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$25,000</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 400</td></tr>
          <tr><td className="p-3 md:p-4 font-bold text-slate-800">$250 Tier</td><td className="p-3 md:p-4 text-slate-600">Second Prize</td><td className="p-3 md:p-4 text-center text-slate-600">1</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$1,250</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 400</td></tr>
          <tr className="bg-slate-50"><td className="p-3 md:p-4 font-bold text-slate-800">$250 Tier</td><td className="p-3 md:p-4 text-slate-600">Third Prize</td><td className="p-3 md:p-4 text-center text-slate-600">2</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$750</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 200</td></tr>
          
          <tr><td className="p-3 md:p-4 font-bold text-slate-800">$500 Tier</td><td className="p-3 md:p-4 text-slate-600">Grand Prize</td><td className="p-3 md:p-4 text-center text-slate-600">1</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$50,000</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 400</td></tr>
          <tr><td className="p-3 md:p-4 font-bold text-slate-800">$500 Tier</td><td className="p-3 md:p-4 text-slate-600">Second Prize</td><td className="p-3 md:p-4 text-center text-slate-600">1</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$2,500</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 400</td></tr>
          <tr className="bg-slate-50"><td className="p-3 md:p-4 font-bold text-slate-800">$500 Tier</td><td className="p-3 md:p-4 text-slate-600">Third Prize</td><td className="p-3 md:p-4 text-center text-slate-600">6</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$1,000</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 66.6</td></tr>

          <tr><td className="p-3 md:p-4 font-bold text-slate-800">$1,000 Tier</td><td className="p-3 md:p-4 text-slate-600">Grand Prize</td><td className="p-3 md:p-4 text-center text-slate-600">1</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$100,000</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 400</td></tr>
          <tr><td className="p-3 md:p-4 font-bold text-slate-800">$1,000 Tier</td><td className="p-3 md:p-4 text-slate-600">Second Prize</td><td className="p-3 md:p-4 text-center text-slate-600">1</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$5,000</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 400</td></tr>
          <tr><td className="p-3 md:p-4 font-bold text-slate-800">$1,000 Tier</td><td className="p-3 md:p-4 text-slate-600">Third Prize</td><td className="p-3 md:p-4 text-center text-slate-600">2</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$3,000</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 200</td></tr>
          <tr className="bg-slate-50"><td className="p-3 md:p-4 font-bold text-slate-800">$1,000 Tier</td><td className="p-3 md:p-4 text-slate-600">Fourth Prize</td><td className="p-3 md:p-4 text-center text-slate-600">12</td><td className="p-3 md:p-4 text-right font-bold text-slate-800">$2,000</td><td className="p-3 md:p-4 text-right text-slate-500">1 in 33.3</td></tr>
        </tbody>
      </table>
    </div>
    <p className="text-sm text-slate-500 italic mb-6"><strong>*Odds Disclosure:</strong> The "Mathematical Base Odds" listed above represent the probability based strictly on the 400-paid-participant cap per Circle. However, the actual odds of winning depend entirely on the total number of eligible entries received for the specific drawing, including all allocated free AMOE entries. The injection of AMOE entries into an Active Circle mathematically dilutes the odds equally for all participants within that Circle.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">7 &nbsp;&nbsp; Winner Selection and Prize Allocation</h3>
    <p className="mb-6">On the designated Drawing Date, the Sponsor will execute a drawing for each Active Circle utilizing a provably fair, deterministically seeded Random Number Generator (RNG) or a certified third-party auditing service.</p>
    <p className="mb-6">For a given Active Circle, the Sponsor will randomly select <em>k</em> unique eligible entries (where <em>k</em> represents the total number of prize slots for that specific Tier) from the combined pool of paid and AMOE entries assigned to that Circle, forming the "Winners Pool." No entrant may be selected more than once in the same monthly drawing. Following the population of the Winners Pool, the specific prizes (Grand, Second, Third, etc.) will be randomly assigned to the unique individuals within the pool without replacement until all prizes are exhausted.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">8 &nbsp;&nbsp; Winner Notification, Verification, and Taxation</h3>
    <p className="mb-6">Potential Winners will be notified via email and/or telephone within forty-eight (48) hours following the drawing.</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>Response and Verification:</strong> Potential Winners must respond within three (3) business days. Verification requires the execution and return of an Affidavit of Eligibility, a Liability Release, and a Publicity Release (where permitted by law).</li>
      <li className="pl-2"><strong>Identity and Tax Documentation:</strong> Potential Winners must pass rigorous identity verification protocols, including the provision of a government-issued photo ID. Furthermore, because all prizes exceed the federal reporting threshold, all Winners must submit a completed and valid IRS Form W-9.</li>
      <li className="pl-2"><strong>Tax Liability:</strong> All federal, state, and local taxes, and any other costs associated with prize acceptance, are the sole responsibility of the Winner. The Sponsor will issue an IRS Form 1099-MISC to all Winners. If a Winner fails to respond, fails identity verification, or refuses to provide a W-9, the prize is forfeited, and an alternate winner will be selected.</li>
    </ul>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">9 &nbsp;&nbsp; State Registration and Bonding</h3>
    <p className="mb-6">In compliance with state regulations governing high-value promotions, this Sweepstakes has been formally registered, and a surety bond covering the aggregate retail value of all prizes has been posted with the Florida Department of Agriculture and Consumer Services and the New York State Department of State.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">10 &nbsp;&nbsp; General Conditions</h3>
    <p className="mb-6">The Sponsor reserves the right to suspend, modify, or cancel the Sweepstakes in the event of technical failure, network attacks, fraud, force majeure, or any other circumstance that destroys the integrity or viability of the promotion. Disputes will be governed by the laws of Florida and resolved via binding arbitration as stipulated in the Platform Terms of Service.</p>
  </>
);

export default RulesContent;