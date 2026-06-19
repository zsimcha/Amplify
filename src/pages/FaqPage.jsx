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
        { q: "What is Amplify?", a: "Amplify is a monthly giving platform where members contribute to a shared fund that is distributed as a single grant to a vetted nonprofit each cycle. Each cycle also includes a prize drawing designed to support ongoing participation in the giving model." },
          { q: "Why prizes? Doesn't that take money from charity?", a: "The prizes are what keep members showing up month after month, and that consistency is what lets Amplify deliver significantly larger grants than traditional monthly giving programs. Plus, we spend less on prizes than most charities spend just to find a new donor."
 },
        { q: "How does the circle model work?", a: "Each circle is a fixed group of 400 members whose monthly contributions are coordinated into a single grant. When the circle fills, that month’s grant is deployed and the cycle begins again. Each cycle also includes a prize drawing as part of the participation model." },
        { q: "How many circles run at once?", a: "Multiple circles can run simultaneously across all three tiers. As Amplify grows, the total monthly grant impact grows with it." },
        { q: "Who selects the charities?", a: <>We vet every partner in full before a dollar moves, and we look for organizations where one large grant hits a real milestone. <Link to="/grant" className="text-indigo-600 hover:underline">The full process is on The Grant page.</Link></> },
        { q: "Why not just give directly?", a: "Direct giving is powerful and encouraged. Amplify is designed for people who want their monthly contributions coordinated into a single, larger recurring grant." }
      ]
    },
    {
      title: "Ma'aser & Halacha",
      faqs: [
        { q: "Can I use Ma'aser toward my Amplify membership?", a: <>This is an important question and one we take seriously. Our Rabbinic Panel has reviewed the model and approved the use of Ma'aser funds for it. <Link to="/about#rabbinic-panel" className="text-indigo-600 hover:underline">Learn more on our About page →</Link><br/><br/>We also encourage you to check with your own posek if you have specific questions about your situation.</> },
        { q: "Has the model been reviewed by Rabbinic authorities?", a: <>Yes. Amplify's structure, including using Ma'aser, prize allocation, and charitable disbursement, has been formally reviewed and endorsed by our Rabbinic Panel. <Link to="/about#rabbinic-panel" className="text-indigo-600 hover:underline">Meet our Rabbinic Panel →</Link></> }
      ]
    },
    {
      title: "Membership & Payments",
      faqs: [
        { q: "When am I charged?", a: "Your first contribution processes immediately upon joining. Subsequent charges occur on the same date each month, after your circle reaches 400 members and goes live." },
        { q: "Can I cancel?", a: <>Yes. Memberships can be paused or canceled at any time before your next scheduled monthly charge. Just send a quick email to <a href="mailto:support@amplifygive.com" className="text-indigo-600 hover:underline">support@amplifygive.com</a> and we'll take care of it.</> },
        { q: "Is my contribution tax-deductible?", a: "Contributions are made to (Nonprofit), a registered 501(c)(3) donor-advised fund, and are tax-deductible to the extent permitted by law. Prize winnings are subject to applicable tax regulations. We recommend consulting your tax advisor for your specific situation." },
        { q: "How are winners notified?", a: "Winners are contacted directly via the email on their account and announced publicly on our Winners page with their consent." },
        { q: "Is my payment information secure?", a: "Yes. All payments are processed via Stripe. Your card details are never stored on Amplify's servers." }
      ]
    },
    {
      title: "The Prizes",
      faqs: [
        { q: "What are the odds of winning?", a: <>Members receive one entry per monthly cycle. When a circle fills, total odds of winning a prize reach up to 1 in 25, depending on the tier. Each circle awards a grand prize plus several secondary prizes. <Link to="/circles" className="text-indigo-600 hover:underline">Check the tier breakdown for exact odds →</Link></> },
        { q: "When does the drawing happen?", a: "Monthly, once a circle reaches 400 members. The drawing date is published in advance for each active circle." },
        { q: "Who administers the drawings?", a: "Drawings are conducted in compliance with U.S. sweepstakes regulations and are fully documented." },
        { q: "No purchase necessary?", a: <>Correct. <Link to="/rules" className="text-indigo-600 hover:underline">See official rules</Link> for free entry details.</> }
      ]
    }
  ];

  return (
    <PageLayout title="Frequently Asked Questions" intro="Everything you need to know about Amplify.">
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