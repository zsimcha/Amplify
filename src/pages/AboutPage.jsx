import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight, ShieldCheck, Lock, CreditCard, Landmark, FileText, TrendingUp, Building, Check, Gift, ArrowRight, DollarSign, Heart } from 'lucide-react';

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

  useEffect(() => {
    const observerOnce = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observerOnce.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });

    document.querySelectorAll('.reveal').forEach((el) => observerOnce.observe(el));
    return () => observerOnce.disconnect();
  }, []);

  return (
    <PageLayout title="About Amplify" intro="How we're building the future of collective giving.">
      
      {/* The Mission - cleaner, punchier headline + visual proof */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="reveal">
            <div className="w-16 h-1.5 bg-amber-400 mb-8"></div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter mb-10 leading-[0.95]">
              Bigger together.
            </h2>
          </div>

          <div className="grid md:grid-cols-12 gap-10 lg:gap-16 items-center mt-12">
            
            {/* Visual: the multiplication - shown not described */}
            <div className="md:col-span-7 reveal" style={{transitionDelay: '100ms'}}>
              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-3xl p-8 md:p-12">
                <div className="flex items-stretch gap-4 md:gap-8">
                  
                  {/* You alone */}
                  <div className="flex-1 text-center">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">One Person</p>
                    <p className="text-4xl md:text-6xl font-black text-slate-300 tracking-tighter leading-none mb-2 tabular-nums">$250</p>
                    <p className="text-[11px] md:text-xs font-medium text-slate-400">monthly gift</p>
                  </div>

                  {/* Multiplier */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <span className="text-2xl md:text-4xl font-black text-amber-400 tracking-tighter">×</span>
                    <span className="text-base md:text-2xl font-black text-slate-700 tracking-tighter mt-1">400</span>
                  </div>

                  {/* Pooled */}
                  <div className="flex-1 text-center">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">A Circle</p>
                    <p className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-2 tabular-nums">$100K</p>
                    <p className="text-[11px] md:text-xs font-medium text-slate-500">monthly grant</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tighter prose */}
            <div className="md:col-span-5 reveal" style={{transitionDelay: '200ms'}}>
              <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-5">
                Most of us give sporadically. We mean to give more consistently. Life gets in the way.
              </p>
              <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
                Amplify combines hundreds of monthly gifts into one massive grant. <span className="text-slate-900 font-bold">No gala required.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Amplify Section */}
      <section id="why" className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-6 md:gap-16">
            <div className="md:col-span-5 reveal">
              <div className="md:sticky md:top-32">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">
                  The Amplify Advantage
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 italic tracking-tight leading-tight">
                  Why pooling changes everything.
                </h2>
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col divide-y divide-slate-200 pt-2 md:pt-0">
              {[
                {
                  icon: <TrendingUp size={24} className="text-indigo-600" />,
                  title: "The Multiplier Effect",
                  body: "Hundreds of donors uniting creates a multiplier that funds transformational projects no individual gift could."
                },
                {
                  icon: <Building size={24} className="text-amber-500" />,
                  title: "A Real, Verified Nonprofit",
                  body: "Every charity is vetted: financials, impact reports, the works. We pick organizations where one large grant moves the needle."
                },
                {
                  icon: <Check size={24} className="text-indigo-600" />,
                  title: "Effortless Giving",
                  body: "Same amount, same day, every month. No reminders, no forgetting."
                },
                {
                  icon: <Gift size={24} className="text-amber-500" />,
                  title: "The Ultimate Win-Win",
                  body: "When your circle fills, the drawing goes live. Everyone in it has a real shot at winning big."
                }
              ].map((item, i) => (
                <div key={i} className="py-8 md:py-10 first:pt-2 md:first:pt-10 flex gap-6 md:gap-8 group reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:border-indigo-200 group-hover:shadow-md">
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

      {/* Compliance & Trust — Bento grid (mobile: stacked auto-height; desktop: bento) */}
      <section className="py-16 md:py-24 px-4 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 reveal">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-4">Compliance</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">Trust & Transparency.</h2>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">Enterprise-grade infrastructure ensures your data, payments, and impact are fully secure.</p>
          </div>

          {/* Mobile: vertical stack with natural heights. Desktop: bento grid. */}
          <div className="flex flex-col gap-4 md:grid md:grid-cols-4 md:gap-5 md:auto-rows-[220px]">

            {/* HERO CARD — money flow visualization. No more decorative circles. */}
            <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl p-6 md:p-10 reveal flex flex-col justify-between relative overflow-hidden">
              <div className="relative">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-indigo-200 mb-3">Where your money goes</p>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] text-white mb-2">A clear path. <span className="italic">Every step audited.</span></h3>
              </div>

              {/* Money flow: You → 501(c)(3) → Charity */}
              <div className="relative my-8 md:my-6">
                <div className="flex items-stretch gap-2 md:gap-3">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-2">
                      <DollarSign size={22} className="text-amber-300" strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white text-center">You</p>
                    <p className="text-[9px] md:text-[10px] font-medium text-indigo-200 text-center mt-0.5">Monthly gift</p>
                  </div>

                  <div className="flex-shrink-0 flex items-center pb-6">
                    <ArrowRight size={18} className="text-amber-300/70" />
                  </div>

                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-amber-400/15 border-2 border-amber-300 flex items-center justify-center mb-2 shadow-lg shadow-amber-500/20">
                      <ShieldCheck size={22} className="text-amber-300" strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white text-center">501(c)(3) DAF</p>
                    <p className="text-[9px] md:text-[10px] font-medium text-indigo-200 text-center mt-0.5">Givinga</p>
                  </div>

                  <div className="flex-shrink-0 flex items-center pb-6">
                    <ArrowRight size={18} className="text-amber-300/70" />
                  </div>

                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-2">
                      <Heart size={22} className="text-pink-300" strokeWidth={2.5} fill="currentColor" />
                    </div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white text-center">Charity</p>
                    <p className="text-[9px] md:text-[10px] font-medium text-indigo-200 text-center mt-0.5">Vetted partner</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <p className="text-sm md:text-base text-indigo-100 font-medium leading-relaxed mb-3 max-w-md">Every dollar flows through a registered donor-advised fund directly to our vetted charity partner.</p>
                <Link to="/impact" className="inline-flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-widest hover:gap-2.5 transition-all">
                  How partners are vetted <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Stat: 100% Compliant — pattern: ICON + BIG NUMBER + small descriptor */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 reveal flex flex-col justify-between min-h-[180px]" style={{ transitionDelay: '50ms' }}>
              <ShieldCheck size={28} className="text-emerald-400" />
              <div>
                <p className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1.5 leading-none">100%</p>
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-400">US Federal & State Compliant</p>
              </div>
            </div>

            {/* Stat: Stripe — same big-headline pattern */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 reveal flex flex-col justify-between min-h-[180px]" style={{ transitionDelay: '100ms' }}>
              <CreditCard size={28} className="text-amber-400" />
              <div>
                <p className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1.5 leading-none">Stripe</p>
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Payment Processing</p>
              </div>
            </div>

            {/* Stat: Locked — same pattern */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 reveal flex flex-col justify-between min-h-[180px]" style={{ transitionDelay: '150ms' }}>
              <Lock size={28} className="text-indigo-300" />
              <div>
                <p className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1.5 leading-none">Held Apart</p>
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Prize Pool · Audited Account</p>
              </div>
            </div>

            {/* Stat: Documented — same pattern + link */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 reveal flex flex-col justify-between hover:bg-white/10 transition-colors min-h-[180px]" style={{ transitionDelay: '200ms' }}>
              <FileText size={28} className="text-slate-300" />
              <div>
                <p className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1.5 leading-none">Documented</p>
                <Link to="/rules" className="inline-flex items-center gap-1 text-amber-400 font-bold text-[11px] md:text-xs uppercase tracking-widest hover:gap-1.5 transition-all">
                  Official rules <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rabbinic Panel */}
      <section id="rabbinic-panel" className="py-20 md:py-32 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-20 reveal">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">Rabbinic Endorsement</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Our Rabbinic Panel</h2>
            <p className="text-lg text-slate-600 font-medium">Amplify's model, including using Ma'aser, prize allocation, and charitable disbursement, has been formally reviewed and endorsed by leading Poskim.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10 pb-12">
            {[0, 1, 2].map((item, index) => {
              return (
                <div key={index} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center reveal" style={{ transitionDelay: `${index * 100}ms` }}>
                  <div className="w-28 h-28 bg-slate-200 rounded-full mb-6 shrink-0 shadow-inner"></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Rabbi Name</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 pb-6 border-b border-slate-200 w-full">Title / Community</p>
                  <div className="prose text-slate-600 font-medium italic text-sm leading-relaxed">
                    <p>"Excerpt from their Haskama goes here. A paragraph detailing their review of the model, sweepstakes mechanics, and validity of using Ma'aser funds for this platform."</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto text-center mt-8 bg-indigo-50 rounded-2xl p-8 border border-indigo-100 reveal">
            <p className="text-indigo-900 font-medium">We take the halachic integrity of your giving seriously. If you have specific questions about how your Amplify membership interacts with your Ma'aser obligations, we encourage you to speak with your own posek.</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-20 bg-indigo-950 px-4 text-center">
        <div className="max-w-3xl mx-auto reveal">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Ready to give bigger?
          </h2>
          <p className="text-indigo-200 font-medium text-lg md:text-xl mb-10 leading-relaxed">
            Join a circle. Pool your Tzedakah.<br />Win up to $100,000 every month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/circles" className="px-10 py-4 bg-amber-400 text-slate-900 rounded-lg font-bold text-sm md:text-base hover:bg-amber-300 transition-colors uppercase tracking-widest shadow-lg shadow-amber-400/20 inline-flex items-center justify-center">
              Join the Circle
            </Link>
            <Link to="/how-it-works" className="px-10 py-4 bg-transparent border border-indigo-700 text-indigo-200 rounded-lg font-bold text-sm md:text-base hover:border-indigo-500 hover:text-white transition-colors uppercase tracking-widest inline-flex items-center justify-center">
              How It Works
            </Link>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default AboutPage;