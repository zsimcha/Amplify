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
      
      {/* MISSION + CONSTELLATION ($400K + bigger glow) */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="reveal">
            <div className="w-16 h-1.5 bg-amber-400 mb-8"></div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight mb-10 leading-[0.95]">
              Bigger together.
            </h2>
          </div>

          <div className="grid md:grid-cols-12 gap-10 lg:gap-16 items-center mt-12">
            
            <div className="md:col-span-7 reveal" style={{transitionDelay: '100ms'}}>
              <div className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 rounded-3xl overflow-hidden aspect-[4/3] md:aspect-[5/4] shadow-soft-xl bg-hatch">
                <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    {/* Wider, more luminous glow so $400K reads clearly */}
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="55%">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
                      <stop offset="25%" stopColor="#fbbf24" stopOpacity="0.28" />
                      <stop offset="55%" stopColor="#fbbf24" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </radialGradient>
                    {/* Inner core: deeper amber for text legibility */}
                    <radialGradient id="centerCore" cx="50%" cy="50%" r="22%">
                      <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  <circle cx="200" cy="200" r="220" fill="url(#centerGlow)" />
                  <circle cx="200" cy="200" r="100" fill="url(#centerCore)" />
                  
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
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300 mb-3 drop-shadow-md">400 Diamond donors</p>
                  <p className="text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none mb-3" style={{textShadow: '0 4px 20px rgba(0,0,0,0.4)'}}>
                    $400K
                  </p>
                  <p className="text-sm md:text-base text-indigo-100 font-medium max-w-xs">
                    A single transformational grant.<br/>Every month.
                  </p>
                </div>
              </div>
            </div>

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

      {/* WHY POOLING CHANGES EVERYTHING */}
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
                  body: "We believe in going big. Hundreds of donors uniting creates a multiplier that funds transformational projects no individual gift could."
                },
                {
                  icon: <Building size={24} className="text-amber-500" />,
                  title: "A Real, Verified Nonprofit",
                  body: "Never wonder where your money goes. Every charity is vetted: financials, impact reports, the works. We pick organizations where one large grant actually makes a difference."
                },
                {
                  icon: <Check size={24} className="text-indigo-600" />,
                  title: "Effortless Giving",
                  body: "Same amount, same day, every month. No reminders, no forgetting."
                },
                {
                  icon: <Gift size={24} className="text-amber-500" />,
                  title: "The Ultimate Win-Win",
                  body: "Giving consistently is hard. So we made it fun! When your circle fills, a massive drawing goes live and everyone in it has a real shot at winning big."
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

      {/* TRUST & TRANSPARENCY — Lock icon bumped + stroke for visual weight */}
      <section className="py-16 md:py-24 px-4 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 reveal">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-4">Compliance</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">Trust & Transparency.</h2>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">Enterprise-grade infrastructure ensures your data, payments, and impact are fully secure.</p>
          </div>

          <div className="flex flex-col gap-4 md:grid md:grid-cols-4 md:gap-5 md:auto-rows-[220px]">

            <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-700 to-indigo-950 rounded-3xl p-6 md:p-10 reveal flex flex-col relative overflow-hidden">
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
                  { num: '02', label: 'Givinga · 501(c)(3) DAF', detail: 'Donor-advised fund', meta: 'Tax receipt issued', highlight: true },
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
                <Link to="/impact" className="inline-flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-widest hover:gap-2.5 transition-all">
                  How partners are vetted <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 reveal flex flex-col justify-between min-h-[180px]" style={{ transitionDelay: '50ms' }}>
              <ShieldCheck size={32} strokeWidth={2.25} className="text-emerald-400" />
              <div>
                <p className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1.5 leading-none">100%</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">US Federal & State Compliant</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 reveal flex flex-col justify-between min-h-[180px]" style={{ transitionDelay: '100ms' }}>
              <CreditCard size={32} strokeWidth={2.25} className="text-amber-400" />
              <div>
                <p className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1.5 leading-tight">Stripe-Secured</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Card details never touch our servers</p>
              </div>
            </div>

            {/* Lock card — bumped to size 36 + heavier stroke for proper visual weight */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 reveal flex flex-col justify-between min-h-[180px]" style={{ transitionDelay: '150ms' }}>
              <Lock size={32} strokeWidth={2.25} className="text-indigo-300" />
              <div>
                <p className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1.5 leading-tight">Separate<br/>Prize Pools</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">In a dedicated, audited account</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 reveal flex flex-col justify-between hover:bg-white/10 transition-colors min-h-[180px]" style={{ transitionDelay: '200ms' }}>
              <FileText size={32} strokeWidth={2.25} className="text-slate-300" />
              <div>
                <p className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1.5 leading-none">Documented</p>
                <Link to="/rules" className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs uppercase tracking-widest hover:gap-1.5 transition-all">
                  Official rules <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RABBINIC PANEL — redesigned editorial layout */}
      <section id="rabbinic-panel" className="py-20 md:py-32 px-4 bg-white relative overflow-hidden">
        {/* Subtle decorative dot pattern in background — gives the section presence */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #1e1b4b 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}></div>

        <div className="max-w-6xl mx-auto relative">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20 reveal">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">Rabbinic Endorsement</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Our Rabbinic Panel</h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              Amplify's model — including the use of Ma'aser, prize allocation, and charitable disbursement — has been formally reviewed and endorsed by leading Poskim.
            </p>
          </div>

          {/* Cards: quote-led editorial design with monogram avatars */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { initial: 'A', accent: 'from-indigo-100 to-indigo-50', textColor: 'text-indigo-700' },
              { initial: 'B', accent: 'from-amber-100 to-amber-50', textColor: 'text-amber-700' },
              { initial: 'C', accent: 'from-slate-100 to-slate-50', textColor: 'text-slate-700' }
            ].map((card, index) => (
              <div key={index} className="relative bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-soft hover:shadow-soft-lg transition-all flex flex-col reveal" style={{ transitionDelay: `${index * 100}ms` }}>
                {/* Decorative quote mark */}
                <svg className="text-amber-400 w-9 h-9 mb-6 shrink-0" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.896 3.456-8.352 9.12-8.352 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                
                {/* The Haskama text leads — this is the hero of the card */}
                <p className="text-slate-700 font-medium italic leading-relaxed text-base mb-8 flex-grow">
                  "Excerpt from their Haskama goes here. A paragraph detailing their review of the model, sweepstakes mechanics, and validity of using Ma'aser funds for this platform."
                </p>
                
                {/* Signature footer with monogram avatar */}
                <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.accent} border border-slate-200 flex items-center justify-center shrink-0`}>
                    <span className={`${card.textColor} font-black text-xl`}>{card.initial}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-900 font-bold text-base">Rabbi Name</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Title / Community</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Replaced the boring blue box with a "personal note" divider — much more editorial */}
          <div className="max-w-2xl mx-auto text-center mt-16 md:mt-24 reveal">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-slate-300"></div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">A Personal Note</span>
              <div className="w-12 h-px bg-slate-300"></div>
            </div>
            <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed italic">
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