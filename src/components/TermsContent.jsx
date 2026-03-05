import React from 'react';

const TermsContent = () => (
  <>
    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">1 &nbsp;&nbsp; Binding Contract and Acceptance of Terms</h3>
    <p className="mb-6">These Terms of Service (the "Agreement") constitute a legally binding contract between you (the "User", "Participant", or "Ambassador") and Amplify Ltd., a for-profit limited liability company ("Amplify", "Sponsor", "we", or "us"). This Agreement governs your access to and use of the Amplify digital platform, website, and related promotional services (collectively, the "Services"). By registering an account, making a voluntary contribution, or accessing the Services, you unconditionally accept and agree to be bound by the terms herein, including the binding arbitration provision and class action waiver detailed in Section 10. If you do not agree to these terms, you must immediately cease use of the Services.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">2 &nbsp;&nbsp; Platform Operation and Financial Flow</h3>
    <p className="mb-6">Amplify is a for-profit promotional platform designed to facilitate philanthropic giving through incentivized sweepstakes. When a User makes a voluntary contribution through the Platform, one hundred percent (100%) of the gross contribution is remitted directly to a donor-advised fund ("DAF") administered by the Change Foundation, a nationally recognized 501(c)(3) public charity. The Change Foundation will subsequently deduct expenses and fees related to sweepstakes administration—which includes platform licensing fees, advertising costs, prize fulfillment reserves, and management operations—and grant the net proceeds to a designated charitable beneficiary identified for each monthly promotional period. While contributions are routed to a registered charity, Amplify itself is a for-profit entity, and Users are strongly advised to consult a qualified tax professional regarding the tax deductibility of any contribution.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">3 &nbsp;&nbsp; Account Registration and Eligibility</h3>
    <p className="mb-6">Access to the Services requires the creation of a registered account. The Services are intended solely for individuals who are at least eighteen (18) years of age, or the age of majority in their jurisdiction of legal residence, and who are legal residents of the fifty (50) United States and the District of Columbia. You represent and warrant that all information provided during registration is accurate, current, and complete. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities executing under your profile. Amplify reserves the absolute right to suspend or terminate any account suspected of utilizing false identities or engaging in fraudulent behavior.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">4 &nbsp;&nbsp; Subscription Billing, Payments, and Chargebacks</h3>
    <p className="mb-6">By electing to participate in a paid entry tier, you authorize Amplify and its designated third-party payment processors (e.g., Stripe) to immediately charge your provided payment method.</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>Recurring Billing:</strong> If you select a recurring subscription model, your payment method will be automatically charged on a recurring monthly cadence corresponding to the Promotional Periods. Charges will be initiated a designated number of days prior to the subsequent drawing to ensure the clearance of funds.</li>
      <li className="pl-2"><strong>Failed Transactions:</strong> A paid membership is strictly contingent upon the successful receipt of funds. If a recurring charge fails, the system will execute retry protocols. If funds are not successfully captured prior to the drawing trigger, your paid membership for that specific drawing is voided, and you will be removed from the active Circle.</li>
      <li className="pl-2"><strong>Refund Policy:</strong> All voluntary contributions are final and non-refundable. Refunds will only be issued in the event that a Circle fails to fill and the Sponsor elects to cancel the specific drawing rather than rolling the entries over, in which case a refund will be processed to the original payment method.</li>
      <li className="pl-2"><strong>Chargeback Liability:</strong> Users who initiate unauthorized chargebacks or payment reversals will be subject to immediate account termination, forfeiture of any pending sweepstakes prizes or referral payouts, and potential civil liability for processing fees and damages.</li>
    </ul>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">5 &nbsp;&nbsp; Sweepstakes Participation</h3>
    <p className="mb-6">All sweepstakes, drawings, and promotions conducted on the Platform are governed exclusively by the Official Rules applicable to that specific promotion. In the event of any direct conflict between this Agreement and the Official Rules, the Official Rules shall govern regarding sweepstakes mechanics. No purchase or voluntary donation is ever required to enter a sweepstakes.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">6 &nbsp;&nbsp; User Conduct and Anti-Abuse Policies</h3>
    <p className="mb-6">You agree to use the Services strictly for lawful, personal, and non-commercial purposes. You are expressly prohibited from:</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2">Utilizing automated scripts, bots, or robotic means to create accounts, submit entries, or scrape data from the Platform.</li>
      <li className="pl-2">Submitting forged, mechanically reproduced, or fraudulent Alternative Method of Entry (AMOE) mail-in requests.</li>
      <li className="pl-2">Circumventing geographic restrictions, geo-filtering mechanisms, or identity verification protocols.</li>
      <li className="pl-2">Engaging in activities that violate Anti-Money Laundering (AML) statutes or Office of Foreign Assets Control (OFAC) sanctions.</li>
    </ul>
    <p className="mb-6">Amplify employs sophisticated IP monitoring and behavioral analytics to detect abuse and reserves the right to void entries and report illicit activity to federal and state authorities.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">7 &nbsp;&nbsp; Intellectual Property Rights</h3>
    <p className="mb-6">All content, software code, visual interfaces, graphics, and trademarks associated with the Services are the exclusive intellectual property of Amplify or its licensors. You are granted a limited, revocable, non-exclusive license to utilize the Platform. Any User Content you submit, including testimonials or photographs, grants Amplify a perpetual, worldwide, royalty-free license to use, reproduce, and display such content in marketing and promotional materials without further compensation.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">8 &nbsp;&nbsp; Limitation of Liability and Disclaimers</h3>
    <p className="mb-6">To the maximum extent permitted by applicable law, the Services are provided on an "as-is" and "as-available" basis without warranties of any kind, whether express or implied. Amplify, the Change Foundation, the designated beneficiaries, and their respective officers, directors, and agents (the "Released Parties") shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or inability to access the Services. Users residing in California expressly waive California Civil Code Section 1542, which states: "A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party."</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">9 &nbsp;&nbsp; Indemnification</h3>
    <p className="mb-6">You agree to defend, indemnify, and hold harmless the Released Parties from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of this Agreement, your use of the Services, or your violation of any applicable laws or regulations.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">10 &nbsp;&nbsp; Dispute Resolution and Binding Arbitration</h3>
    <p className="mb-6">Please read this section carefully as it affects your legal rights. Any and all disputes, claims, or causes of action arising out of or connected with this Agreement, the Services, or any sweepstakes shall be resolved exclusively through final and binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, excluding any rules permitting class actions.</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>Class Action Waiver:</strong> You agree that any arbitration or litigation shall be conducted solely in your individual capacity, and you expressly waive any right to participate as a plaintiff or class member in any class, representative, or consolidated proceeding.</li>
      <li className="pl-2"><strong>Jurisdiction:</strong> The arbitration shall take place in the State of Florida, and this Agreement shall be governed by the laws of the State of Florida without regard to conflict of law principles.</li>
      <li className="pl-2"><strong>Small Claims Exception:</strong> Notwithstanding the foregoing, either party may seek relief in a small claims court for disputes within the scope of that court's jurisdiction.</li>
    </ul>
  </>
);

export default TermsContent;
