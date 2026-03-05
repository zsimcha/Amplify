import React from 'react';

const ReferralProgramContent = () => (
  <>
    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">1 &nbsp;&nbsp; Program Overview and Eligibility</h3>
    <p className="mb-6">The Amplify Referral Program (the "Program") provides eligible registered Users ("Referrers") the opportunity to earn financial compensation by referring new, unique paying participants ("Referred Users") to the Amplify platform. To participate, Referrers must maintain an active, verified account in good standing and be legal residents of the United States, eighteen (18) years of age or older.</p>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">2 &nbsp;&nbsp; Compensation Structure and Payout Mechanics</h3>
    <p className="mb-6">Referrers are provided with a unique, trackable digital referral link. Compensation is triggered when a Referred User clicks the link, registers a new account, and successfully completes a paid contribution to enter an active Sweepstakes Tier. The compensation is distributed in two structured tranches to ensure retention and mitigate fraud:</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>Tranche 1:</strong> $25 paid after the Referred User successfully completes their Month 1 subscription charge, provided the funds have fully cleared the payment processor and no chargeback has been initiated.</li>
      <li className="pl-2"><strong>Tranche 2:</strong> An additional $25 paid after the Referred User successfully completes their Month 2 recurring subscription charge, subject to the identical fund clearance and anti-fraud conditions. Payouts are processed on a net-30 day schedule following the successful clearance of the qualifying transaction.</li>
    </ul>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">3 &nbsp;&nbsp; Anti-Fraud Policy and Clawback Provisions</h3>
    <p className="mb-6">Amplify maintains a strict zero-tolerance policy regarding referral fraud.</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>Prohibitions:</strong> Referrers are expressly prohibited from engaging in self-referrals, which includes the creation of synthetic accounts, the use of aliases, or the manipulation of IP addresses to artificially trigger referral bonuses. Referred Users must be genuine, independent individuals.</li>
      <li className="pl-2"><strong>Spam and Communication Abuse:</strong> Referrers must not utilize spam, deceptive marketing tactics, or unauthorized mass communication networks. The distribution of referral links via unsolicited SMS text messages or email campaigns that violate the Telephone Consumer Protection Act (TCPA) or the CAN-SPAM Act is strictly prohibited and will result in immediate termination.</li>
      <li className="pl-2"><strong>Clawback Execution:</strong> If a Referred User requests a refund, initiates a credit card chargeback, or is discovered to have utilized fraudulent or stolen payment methods, any referral compensation previously paid to the Referrer connected to that specific User will be immediately clawed back. Amplify reserves the unequivocal right to deduct clawed-back amounts from the Referrer's future payouts or to charge the Referrer's payment method on file to recover the illicitly gained funds.</li>
    </ul>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">4 &nbsp;&nbsp; FTC Compliance and Required Endorsement Disclosures</h3>
    <p className="mb-6">Referrers act as independent promoters and are legally mandated to comply with the Federal Trade Commission (FTC) Guides Concerning the Use of Endorsements and Testimonials in Advertising.</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>Material Connection Disclosure:</strong> When sharing referral links on social media platforms, blogs, or digital channels, Referrers must clearly and conspicuously disclose their material financial connection to Amplify. Acceptable disclosures must be visible without requiring the user to click "read more" and include hashtags such as #AmplifyReferral, #AmplifyPartner, or #ad.</li>
      <li className="pl-2"><strong>Prohibited Claims:</strong> Referrers are strictly prohibited from making false, misleading, or exaggerated claims regarding the Sweepstakes. Referrers must never state or imply that participants are guaranteed to win, misrepresent the mathematical odds of the sweepstakes, or misrepresent the charitable flow of funds to the Change Foundation.</li>
    </ul>

    <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 mt-12 md:mt-16 mb-4 tracking-tight">5 &nbsp;&nbsp; Tax Compliance and Reporting Obligations</h3>
    <p className="mb-6">Referrers operate as independent contractors; participation in the Program does not establish an employer-employee relationship, partnership, or joint venture.</p>
    <ul className="list-disc pl-6 space-y-4 mb-6">
      <li className="pl-2"><strong>1099-NEC Issuance:</strong> In strict compliance with Internal Revenue Service (IRS) regulations, any Referrer who earns $600 or more in cumulative referral payouts during a single calendar year will be issued an IRS Form 1099-NEC (Nonemployee Compensation).</li>
      <li className="pl-2"><strong>W-9 Verification:</strong> Prior to the disbursement of cumulative payouts approaching the $600 regulatory threshold, the Referrer will be required to complete, electronically sign, and submit a valid IRS Form W-9. Failure to provide the required tax documentation will result in the immediate suspension of payouts and the potential forfeiture of accumulated funds subject to backup withholding regulations. Referrers bear sole responsibility for reporting and remitting all applicable federal, state, and local income taxes derived from Program earnings.</li>
    </ul>
  </>
);

export default ReferralProgramContent;
