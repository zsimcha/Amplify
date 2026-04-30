import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight, ShieldCheck, Lock, CreditCard, Landmark, FileText, TrendingUp, Building, Check, Gift } from 'lucide-react';

const AboutPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <PageLayout title="About Amplify" intro="How we're building the future of collective giving.">
      
      {/* The Mission - Visual Math */}
      <section className="py-16 md:py-24 px-4 bg-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-8">
            400 Donors <span className="text-indigo-500 mx-2">×</span> $250 <span className="text-amber-400 mx-2">=</span> $100,000
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-slate-400 italic mb-8">
            Consistent, collective giving changes things that individual giving can't.
          </p>
          <p className="text-lg md:text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
            By pooling monthly giving into a single massive grant, Amplify turns individual generosity into collective power. And by making the act of giving consistently rewarding with real prizes and real odds — we make sure people actually stick with it.
          </p>
        </div>
      </section>

      {/* Why Amplify Section (Moved from Homepage) */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-4">
              <div className="md:sticky md:top-32">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">
                  The Advantage
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 italic tracking-tight leading-tight">
                  Why pooling changes everything.
                </h2>
              </div>
            </div>

            <div className="md:col-span-8 flex flex-col divide-y divide-slate-200">
              {[
                {
                  icon: <TrendingUp size={24} className="text-indigo-600" />,
                  title: "The Multiplier Effect",
                  body: "We believe in going big. Uniting a massive community of donors creates a multiplier effect, funding huge, transformational projects that wouldn't have been possible otherwise."
                },
                {
                  icon: <Building size={24} className="text-amber-500" />,
                  title: "A Real, Verified Nonprofit",
                  body: "Never wonder where your money goes. Every charity is vetted, financials, impact reports, the works. We look for organizations where one large grant can make a big difference, not just cover admin costs."
                },
                {
                  icon: <Check size={24} className="text-indigo-600" />,
                  title: "Effortless Giving",
                  body: "Most people want to give regularly. Life gets in the way. Your Amplify membership handles it automatically — same amount, same day, every month. No reminders, no forgetting."
                },
                {
                  icon: <Gift size={24} className="text-amber-500" />,
                  title: "The Ultimate Win-Win",
                  body: "Giving consistently is hard. So we made it fun! When your circle fills, a massive drawing goes live and everyone in it has a real shot at winning big."
                }
              ].map((item, i) => (
                <div key={i} className="py-8 md:py-10 flex gap-6 md:gap-8 group">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Trust */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">Trust & Transparency.</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">Enterprise-grade infrastructure ensures your data, payments, and impact are fully secure and legally compliant.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl">
              <ShieldCheck size={28} className="text-emerald-500 mb-6" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Legal Structure</h3>
              <p className="text-slate-600 font-medium leading-relaxed text-sm">Amplify operates as Amplify LLC. Sweepstakes are conducted in strict compliance with US federal and state regulations governing prize promotions.</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl">
              <Lock size={28} className="text-amber-500 mb-6" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Prize Security</h3>
              <p className="text-slate-600 font-medium leading-relaxed text-sm">Prize pools are held in a dedicated account and administered accordingly. Winners are verified independently before any prize is disbursed.</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl">
              <CreditCard size={28} className="text-indigo-500 mb-6" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Payment Processing</h3>
              <p className="text-slate-600 font-medium leading-relaxed text-sm">All contributions are processed securely via Stripe. Your payment information is never stored on Amplify's servers.</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl lg:col-span-2">
              <Landmark size={28} className="text-blue-500 mb-6" />
              <h3 className="text-xl font-bold mb-3 text-slate-900">Charitable Disbursement</h3>
              <p className="text-slate-600 font-medium leading-relaxed text-sm">Contributions are received and held by Givinga, a registered 501(c)(3) donor-advised fund. Grants are issued from Givinga directly to our vetted charity partner each month.</p>
            </div>
            <div className="bg-indigo-900 p-8 rounded-3xl flex flex-col justify-center items-center text-center">
              <FileText size={28} className="text-indigo-300 mb-4" />
              <p className="text-white font-bold mb-4">All drawings strictly documented.</p>
              <Link to="/rules" className="inline-flex items-center gap-2 text-white font-bold hover:text-indigo-200 transition-colors text-sm underline underline-offset-4">
                See official rules
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rabbinic Panel */}
      <section id="rabbinic-panel" className="py-16 md:py-24 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">Rabbinic Endorsement</p>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Our Rabbinic Panel</h2>
            <p className="text-lg text-slate-600 font-medium">Amplify's model, including its approach to Ma'aser, prize allocation, and charitable disbursement, has been formally reviewed and endorsed by the following Rabbinic authorities.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10 mb-16">
            {[1, 2, 3].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-28 h-28 bg-slate-200 rounded-full mb-6 shrink-0 shadow-inner"></div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Rabbi Name</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 pb-6 border-b border-slate-100 w-full">Title / Community</p>
                <div className="prose text-slate-600 font-medium italic text-sm leading-relaxed">
                  <p>"Excerpt from their Haskama goes here. A paragraph detailing their review of the model, sweepstakes mechanics, and validity of using Ma'aser funds for this platform."</p>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center bg-indigo-50 rounded-2xl p-8 border border-indigo-100">
            <p className="text-indigo-900 font-medium">We take the halachic integrity of your giving seriously. If you have specific questions about how your Amplify membership interacts with your Ma'aser obligations, we encourage you to speak with your own posek.</p>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default AboutPage;