import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight, ShieldCheck, Lock, CreditCard, FileText, TrendingUp, Building, Check, Gift, ArrowRight } from 'lucide-react';

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
      
      {/* MISSION + CONSTELLATION - Standard reveal */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto reveal">
          <div>
            <div className="w-16 h-1.5 bg-amber-400 mb-8"></div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mb-10 leading-[0.95]">
              Tzedakah, Redesigned.
            </h2>
          </div>

          <div className="grid md:grid-cols-12 gap-10 lg:gap-16 items-center mt-12">
            
            <div className="md:col-span-7">
              <div className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-3xl overflow-hidden aspect-[4/3] md:aspect-[5/4] shadow-soft-xl bg-hatch">
                <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"  stopColor="#fbbf24" stopOpacity="0.95" />
                      <stop offset="55%" stopColor="#fbbf24" stopOpacity="0.9" />
                      <stop offset="78%" stopColor="#fbbf24" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <circle cx="200" cy="200" r="115" fill="url(#centerGlow)" />

                  {Array.from({length: 400}, (_, i) => {
                    let ringIndex, ringTotal, radius, opacity, r;
                    if (i < 200) {
                      ringIndex = i; ringTotal = 200;
                      radius = 175; opacity = 0.45; r = 1.6;
                    } else if (i < 330) {
                      ringIndex = i - 200; ringTotal = 130;
                      radius = 145; opacity = 0.65; r = 1.9;
                    } else {
                      ringIndex = i - 330; ringTotal = 70;
                      radius = 115; opacity = 0.85; r = 2.2;
                    }
                    
                    const ringOffset = ringIndex < 200 ? 0 : ringIndex < 130 ? 0.05 : 0.1;
                    const angle = (ringIndex / ringTotal) * Math.PI * 2 - Math.PI / 2 + ringOffset;
                    const x = 200 + Math.cos(angle) * radius;
                    const y = 200 + Math.sin(angle) * radius;
                    
                    return <circle key={i} cx={x} cy={y} r={r} fill="#fbbf24" opacity={opacity} />;
                  })}

                  {/* Center labels */}
                  <text x="200" y="205" textAnchor="middle" className="fill-white" 
                        style={{ fontSize: '52px', fontWeight: 900, letterSpacing: '-0.05em' }}>
                    $400K
                  </text>
                  <text x="200" y="232" textAnchor="middle" className="fill-white" 
                        style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Every Month
                  </text>
                  <text x="200" y="252" textAnchor="middle" className="fill-white/85" 
                        style={{ fontSize: '11px', fontWeight: 500 }}>
                    To a single charity.
                  </text>
                </svg>
              </div>
            </div>

            <div className="md:col-span-5">
              <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-5">
                Most of us give sporadically. We mean to give more consistently, but life gets in the way.
              </p>
              <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
                <span className="text-slate-900 font-bold">Amplify closes that gap. </span>Your giving becomes automatic, and pooled with hundreds of others, it turns into one major grant every month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY POOLING */}
      <section id="why" className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-6 md:gap-16">
            <div className="md:col-span-5 reveal">
              <div className="md:sticky md:top-32">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">
                  The Amplify Advantage
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Why pooling changes everything.
                </h2>
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col divide-y divide-slate-200 pt-2 md:pt-0">
              {[
                {
                  icon: <TrendingUp size={24} className="text-indigo-600" />,
                  title: "The Multiplier Effect",
                  body: "We believe in going big. Hundreds of members uniting funds transformational grants that individual givers can't."
                },
                {
                  icon: <Building size={24} className="text-amber-500" />,
                  title: "A Real, Verified Nonprofit",
                  body: "Never wonder where your money goes. We check the financials, impact reports, the works, ensuring our collective grant lands where it’s needed most."
                },
                {
                  icon: <Check size={24} className="text-indigo-600" />,
                  title: "Effortless Giving",
                  body: "Your membership puts your giving on autopilot, ensuring you make a powerful impact every month. No reminders, no forgetting."
                },
                {
                  icon: <Gift size={24} className="text-amber-500" />,
                  title: "Reliable Every Month",
                  body: "Monthly rewards keep members engaged, helping charities receive larger and more reliable funding."
                }
              ].map((item, i) => (
                <div key={i} className="py-8 md:py-10 first:pt-2 md:first:pt-10 flex gap-6 md:gap-8 group reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-soft flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:border-indigo-200 group-hover:shadow-soft-lg">
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

      {/* TRUST & TRANSPARENCY - Changed to grid-cols-2 for mobile */}
      <section className="py-16 md:py-24 px-4 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 reveal">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">Compliance & Transparency</h2>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">Bank-grade security ensures your data and payments are fully secure.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 md:auto-rows-[220px]">

            {/* Added col-span-2 for mobile so it spans the top row */}
            <div className="col-span-2 md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-700 to-indigo-950 rounded-3xl p-6 md:p-10 reveal flex flex-col relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-200 mb-3">Where your money goes</p>
                <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.05] text-white mb-2">
                  A clear path.<br/><span className="italic text-amber-300">Audited at every step.</span>
                </h3>
              </div>

              <div className="relative my-6 md:my-auto md:py-4 space-y-1">
                {[
                  { num: '01', label: 'You contribute', detail: 'Monthly via Stripe', meta: '100% transferred' },
                  { num: '02', label: '(Nonprofit) · 501(c)(3) DAF', detail: 'Donor-advised fund', meta: 'Tax receipt issued', highlight: true },
                  { num: '03', label: 'Vetted Charity', detail: 'Single grant. Full amount.', meta: 'Documented impact' },
                ].map((item, i, arr) => (
                  <React.Fragment key={i}>
                    <div className={`flex items-start gap-3 md:gap-4 py-2.5 md:py-3 px-3 md:px-4 rounded-xl border ${item.highlight ? 'bg-amber-400/10 border-amber-300/30' : 'bg-white/5 border-white/10'}`}>
                      <span className={`text-xl md:text-2xl font-black tabular-nums shrink-0 ${item.highlight ? 'text-amber-300' : 'text-white/30'}`}>{item.num}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${item.highlight ? 'text-amber-200' : 'text-white'}`}>{item.label}</p>
                        <p className="text-xs text-indigo-200/80 font-medium mt-0.5 leading-snug">{item.detail}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 self-center hidden sm:inline ${item.highlight ? 'text-amber-300/80' : 'text-indigo-300/60'}`}>{item.meta}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex justify-start pl-7 md:pl-8 -my-0.5">
                        <div className="w-px h-3 bg-amber-300/40"></div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="relative">
                <Link to="/grant" className="inline-flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-widest hover:gap-2.5 transition-all">
  How partners are vetted <ArrowRight size={14} />
</Link>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-8 reveal flex flex-col justify-between min-h-[160px] md:min-h-[180px]" style={{ transitionDelay: '50ms' }}>
              <ShieldCheck size={28} strokeWidth={2.25} className="text-emerald-400" />
              <div>
                <p className="text-2xl md:text-4xl font-black tracking-tight text-white mb-1 md:mb-1.5 leading-none">100%</p>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">US Federal & State Compliant</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-8 reveal flex flex-col justify-between min-h-[160px] md:min-h-[180px]" style={{ transitionDelay: '100ms' }}>
              <CreditCard size={28} strokeWidth={2.25} className="text-amber-400" />
              <div>
                <p className="text-lg md:text-3xl font-black tracking-tight text-white mb-1 md:mb-1.5 leading-tight">Stripe-Secured</p>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Card details never touch our servers</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-8 reveal flex flex-col justify-between min-h-[160px] md:min-h-[180px]" style={{ transitionDelay: '150ms' }}>
              <Lock size={28} strokeWidth={2.25} className="text-indigo-300" />
              <div>
                <p className="text-lg md:text-3xl font-black tracking-tight text-white mb-1 md:mb-1.5 leading-tight">Separate <br/> Prize Pools</p>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">In a dedicated, audited account</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-8 reveal flex flex-col justify-between hover:bg-white/10 transition-colors min-h-[160px] md:min-h-[180px]" style={{ transitionDelay: '200ms' }}>
              <FileText size={28} strokeWidth={2.25} className="text-slate-300" />
              <div>
                <p className="text-2xl md:text-4xl font-black tracking-tight text-white mb-1 md:mb-1.5 leading-none">Documented</p>
                <Link to="/rules" className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:gap-1.5 transition-all mt-1">
                  Official rules <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RABBINIC PANEL - Mobile grid-cols-3 + responsive sizing */}
      <section id="rabbinic-panel" className="py-20 md:py-32 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #1e1b4b 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20 reveal">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">Rabbinic Endorsement</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Reviewed and approved.</h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              Amplify's model, including the use of Ma'aser, prize allocation, and charitable disbursement, has been formally reviewed and approved by Poskim.
            </p>
          </div>

          {/* Portrait gallery - Updated grid */}
<div className="grid grid-cols-3 gap-3 md:gap-6 max-w-4xl mx-auto">
  {[
    { initial: '', accent: 'from-indigo-100 to-indigo-50' },
    { initial: '', accent: 'from-amber-100 to-amber-50' },
    { initial: '', accent: 'from-slate-100 to-slate-50' },
  ].map((rabbi, i) => (
    <div key={i} className="flex flex-col items-center text-center reveal" style={{ transitionDelay: `${i * 120}ms` }}>
      <div className="relative mb-4 md:mb-6 group w-full">
        {/* Aspect ratio locks the height relative to width so it scales down on phones gracefully */}
        <div className={`w-full aspect-[4/5] md:w-52 md:h-60 mx-auto rounded-xl md:rounded-3xl overflow-hidden bg-gradient-to-br ${rabbi.accent} shadow-soft-lg border border-slate-200 transition-transform duration-500 group-hover:scale-[1.02]`}>
          {/* When ready: <img src="/rabbi-1.jpg" alt="Rabbi Name" className="w-full h-full object-cover" /> */}
        </div>
      </div>
      
      {/* Scaled text for mobile */}
      <h3 className="text-sm md:text-2xl font-bold text-slate-900 mb-1 md:mb-1.5 tracking-tight">Rabbi Name</h3>
      <p className="text-[10px] md:text-sm text-slate-500 font-medium leading-relaxed">Title / Community</p>
    </div>
  ))}
</div>

         {/* Halachic Integrity */}
<div className="max-w-2xl mx-auto text-center mt-16 md:mt-24 reveal">
  <div className="flex justify-center mb-6">
    <div className="w-24 h-px bg-slate-300"></div>
  </div>
  <p className="text-sm md:text-lg text-slate-600 font-medium leading-relaxed italic">
    We take the halachic integrity of your giving seriously. If you have specific questions about how your Amplify membership interacts with your Ma'aser obligations, we encourage you to speak with your own posek.
  </p>
</div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-indigo-950 px-4 text-center">
        <div className="max-w-3xl mx-auto reveal">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Ready to give bigger?
          </h2>
          <p className="text-indigo-200 font-medium text-lg md:text-xl mb-10 leading-relaxed">
            Join a circle. Pool your Tzedakah.<br />Win up to $100,000 every month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/circles" className="px-10 py-4 bg-amber-400 text-slate-900 rounded-lg font-bold text-sm md:text-base hover:bg-amber-300 transition-colors uppercase tracking-widest shadow-amber-glow inline-flex items-center justify-center">
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