import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';

const FaqPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqSections = [
    {
      title: "The Model",
      faqs: [
        { q: "What is Amplify?", a: "Amplify is a giving platform that pools your monthly Tzedakah with a circle of donors into one massive grant, and as a thank-you, members get a shot at winning up to $100,000 every month." },
        { q: "Why prizes? Doesn't that take money from charity?", a: "It's actually the opposite. The prize model is what makes the grant transformational in the first place. A giving circle without prizes might raise $40,000 in a good month. With prizes attracting and retaining consistent donors, it raises $400,000 — delivered to a charity that spent nothing to acquire it. A smaller percentage of a much larger pool does more good than 100% of a small one. In fact, the amount we allocate to prizes is less than most organizations would spend to raise the same funds. That's not a compromise. That's the model." },
        { q: "How does the circle model work?", a: "Each circle has exactly 400 spots. The moment a circle fills up, the massive monthly prize drawing goes live for those members. It keeps the odds incredible. The pooled contributions form both the monthly grant and the prize pool." },
        { q: "How many circles run at once?", a: "Multiple circles can run simultaneously across all three tiers. As Amplify grows, the total monthly grant impact grows with it." },
        { q: "Who selects the charities?", a: <>Charities are properly vetted in advance — financials, impact, the works. We focus on organizations where a single large grant can reach a critical milestone. <Link to="/impact" className="text-indigo-600 hover:underline">Full details on our Impact page →</Link></> },
        { q: "Why not just give directly?", a: "Direct giving is powerful and encouraged. Amplify exists for those who want their consistent monthly giving to combine into a massive, coordinated grant that changes the game." }
      ]
    },
    {
      title: "Ma'aser & Halacha",
      faqs: [
        { q: "Does my Amplify membership count toward Ma'aser?", a: <>This is an important question and one we take seriously. Our Rabbinic Panel has reviewed the model and approved the use of Ma'aser funds for it. <Link to="/about#rabbinic-panel" className="text-indigo-600 hover:underline">See their guidance on our About page →</Link><br/><br/>We also encourage you to check with your own posek if you have specific questions about your situation.</> },
        { q: "Has the model been reviewed by Rabbinic authorities?", a: <>Yes. Amplify's structure, including using Ma'aser, prize allocation, and charitable disbursement, has been formally reviewed and endorsed by our Rabbinic Panel. <Link to="/about#rabbinic-panel" className="text-indigo-600 hover:underline">Meet our Rabbinic Panel →</Link></> }
      ]
    },
    {
      title: "Membership & Payments",
      faqs: [
        { q: "When am I charged?", a: "Your first contribution processes immediately upon joining. Subsequent charges occur on the same date each month, after your circle reaches 400 members and goes live." },
        { q: "Can I cancel?", a: "Yes. Memberships can be paused or canceled at any time before your next scheduled monthly charge." },
        { q: "Is my contribution tax-deductible?", a: "Contributions are made to Givinga, a registered 501(c)(3) donor-advised fund, and are tax-deductible to the extent permitted by law. Prize winnings are subject to applicable tax regulations. We recommend consulting your tax advisor for your specific situation." },
        { q: "How are winners notified?", a: "Winners are contacted directly via the email on their account and announced publicly on our Winners page with their consent." },
        { q: "Is my payment information secure?", a: "Yes. All payments are processed via Stripe. Your card details are never stored on Amplify's servers." }
      ]
    },
    {
      title: "The Prizes",
      faqs: [
        { q: "What are the odds of winning?", a: <>Each member receives one grand prize entry per month, odds of 1 in 400 per circle. With all secondary prizes included, total winning odds reach up to 1 in 25 when a circle is full. <Link to="/how-it-works" className="text-indigo-600 hover:underline">Check our tiers breakdown for exact odds →</Link></> },
        { q: "When does the drawing happen?", a: "Monthly, once a circle reaches 400 members. The drawing date is published in advance for each active circle." },
        { q: "Who administers the drawings?", a: "Drawings are conducted in compliance with US sweepstakes regulations. All results are documented and available for review." },
        { q: "No purchase necessary?", a: <>Correct. <Link to="/rules" className="text-indigo-600 hover:underline">See official rules</Link> for free entry details.</> }
      ]
    }
  ];

  return (
    <PageLayout title="Frequently Asked Questions" intro="Everything you need to know about the Amplify model, compliance, and mechanics.">
      <section className="py-16 md:py-24 px-4 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-16">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide mb-8 pl-4 border-l-4 border-indigo-500">{section.title}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {section.faqs.map((faq, itemIndex) => {
                  const id = `${sectionIndex}-${itemIndex}`;
                  return (
                    <div key={id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-200 h-max">
                      <button onClick={() => toggleFaq(id)} className="w-full p-6 text-left flex justify-between items-center outline-none bg-white">
                        <span className="font-bold text-slate-900 text-base pr-4">{faq.q}</span>
                        {openFaq === id ? <ChevronUp size={20} className="shrink-0 text-indigo-600" /> : <ChevronDown size={20} className="shrink-0 text-slate-400" />}
                      </button>
                      {openFaq === id && <div className="px-6 pb-6 pt-0 text-slate-600 font-medium leading-relaxed text-base bg-white">{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div className="text-center mt-12 pt-12 border-t border-slate-200">
            <p className="text-slate-600 font-medium mb-6">Still have questions?</p>
            <Link to="/contact" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors uppercase tracking-widest text-sm bg-white px-8 py-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md">
              Contact Support <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default FaqPage;