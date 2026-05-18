import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight, Heart, Phone, Tent, Siren } from 'lucide-react';

const ImpactPage = () => {
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

  const vetScrollerRef = useRef(null);
  const [vetActiveIdx, setVetActiveIdx] = useState(0);
  const handleVetScroll = () => {
    const el = vetScrollerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const cards = el.querySelectorAll('[data-card]');
    if (!cards.length) return;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setVetActiveIdx(closest);
  };

  return (
    <PageLayout title="Our Impact" intro="One organization. One transformational grant. Every month.">
      
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto reveal">
          <p className="text-2xl md:text-4xl text-slate-900 font-black leading-tight tracking-tight">
            The best grant isn't just money.<br/>
            <span className="text-slate-400 italic font-medium">It's the right amount, to the right organization, at the right moment.</span>
          </p>
        </div>
      </section>

      {/* Partner — quote now compact, sits inline */}
      <section className="py-16 md:py-24 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
            
            {/* Image column */}
            <div className="order-1 md:order-2 reveal" style={{ transitionDelay: '150ms' }}>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-soft-xl relative bg-slate-900">
                <img src="/impact-photo.jpg" alt="Impact" className="absolute inset-0 w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.style.display='none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white py-2 md:py-3 px-7 md:px-8 rounded-lg flex items-center justify-center shadow-xl">
                  <img src="/ChaiLifeline.png" alt="Chai Lifeline" className="h-9 md:h-11 w-auto object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
                </div>
              </div>
            </div>
            
            {/* Copy column */}
            <div className="order-2 md:order-1 reveal">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-3">This Month's Partner</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-5">Chai Lifeline</h2>
              
              <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6 md:mb-8">
                <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 text-center md:text-left">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Grant</p>
                  <p className="font-black text-slate-900 text-sm md:text-lg tracking-tight">$400K</p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 text-center md:text-left">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                  <p className="font-black text-slate-900 text-sm md:text-lg tracking-tight">501(c)(3)</p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 text-center md:text-left">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Rated</p>
                  <p className="font-black text-slate-900 text-sm md:text-lg tracking-tight">4/4 ★</p>
                </div>
              </div>

              <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-4">
                Chai Lifeline supports families the moment a child is diagnosed with cancer or a life-threatening illness. Transportation, counseling, summer camp, crisis support.
              </p>
              <p className="text-base md:text-lg text-slate-900 font-bold leading-relaxed mb-6">
                Our grant goes directly to making sure no family faces this alone.
              </p>

              {/* Compact quote — sits inline, doesn't extend the section */}
              <div className="relative bg-white border-l-4 border-amber-400 rounded-r-2xl p-5 md:p-6 shadow-soft mb-6">
                <p className="text-sm md:text-base text-slate-700 font-medium italic leading-relaxed mb-3">
                  "[Short, punchy quote from Chai Lifeline leadership about what this grant enables — keep to ~2 sentences max.]"
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">— Director Name, Chai Lifeline</p>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Grants administered through <span className="text-slate-700 font-bold">Givinga</span>, a registered 501(c)(3) donor-advised fund.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* AMPLIFY IN MOTION — percent-based breakdown, no specific dollar amounts */}
<section className="py-20 md:py-28 px-4 bg-white">
  <div className="max-w-6xl mx-auto">
    <div className="mb-12 md:mb-16 max-w-3xl reveal">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4">Where the grant goes</p>
      <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-[1.05]">
        Amplify in motion.
      </h2>
      <p className="text-lg text-slate-600 font-medium leading-relaxed">
        Here's exactly how this month's grant gets deployed at Chai Lifeline.
      </p>
    </div>

    {/* Visual allocation bar (no dollar labels) */}
    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 md:p-8 mb-6 md:mb-8 reveal">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Allocation</p>
      <div className="flex h-3 md:h-4 rounded-full overflow-hidden">
        <div className="bg-indigo-500" style={{width: '38%'}} title="Family Transportation"></div>
        <div className="bg-amber-400" style={{width: '25%'}} title="Mental Health Support"></div>
        <div className="bg-emerald-500" style={{width: '20%'}} title="Summer Camp"></div>
        <div className="bg-rose-500" style={{width: '17%'}} title="Crisis Intervention"></div>
      </div>
      {/* Inline legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Family Transport</span>
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Mental Health</span>
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Summer Camp</span>
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Crisis Response</span>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {[
        { 
          icon: <Heart size={22} strokeWidth={2} />, 
          bar: 'bg-indigo-500',
          accent: 'text-indigo-600 bg-indigo-50',
          percent: '38%', 
          label: 'Family Transportation', 
          detail: 'Rides to treatment for hundreds of families across the year.'
        },
        { 
          icon: <Phone size={22} strokeWidth={2} />, 
          bar: 'bg-amber-400',
          accent: 'text-amber-700 bg-amber-50',
          percent: '25%', 
          label: 'Mental Health Support', 
          detail: '24/7 counseling hotline staffed by licensed clinicians.'
        },
        { 
          icon: <Tent size={22} strokeWidth={2} />, 
          bar: 'bg-emerald-500',
          accent: 'text-emerald-700 bg-emerald-50',
          percent: '20%', 
          label: 'Summer Camp', 
          detail: 'Full scholarships for children to attend Camp Simcha.'
        },
        { 
          icon: <Siren size={22} strokeWidth={2} />, 
          bar: 'bg-rose-500',
          accent: 'text-rose-700 bg-rose-50',
          percent: '17%', 
          label: 'Crisis Intervention', 
          detail: 'Emergency response funding for new diagnoses and trauma.'
        },
      ].map((item, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-shadow flex flex-col reveal" style={{transitionDelay: `${i * 100}ms`}}>
          <div className={`h-1.5 ${item.bar}`}></div>
          <div className="p-6 md:p-7 flex-1 flex flex-col">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.accent} mb-5`}>
              {item.icon}
            </div>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2 tabular-nums leading-none">{item.percent}</p>
            <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight mb-2">{item.label}</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>

    <p className="text-xs text-slate-500 font-medium mt-8 max-w-3xl leading-relaxed">
      Allocation determined in coordination with Chai Lifeline leadership. A detailed impact report is shared with all members at month's end.
    </p>
  </div>
</section>

      {/* Vetting Process — unchanged */}
      <section className="py-20 md:py-28 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 md:mb-16 reveal">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4">The Process</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Our vetting process.</h2>
          </div>

          {(() => {
            const steps = [
              { num: '01', title: 'Financials',     border: 'border-indigo-600',  body: 'We review audited financials, 990 filings, and overhead ratios. We only partner with organizations that can account for every single dollar.' },
              { num: '02', title: 'Clear Impact',   border: 'border-amber-400',   body: "Not 'it helps our general fund.' We look for organizations that can tell us exactly what program this grant funds, and how many families it will reach." },
              { num: '03', title: 'Ready to Scale', border: 'border-blue-400',    body: "Some nonprofits aren't structured to deploy a huge lump-sum gift effectively. We look for partners where this grant acts as a true catalyst." },
              { num: '04', title: 'Proven Trust',   border: 'border-emerald-400', body: 'We prioritize organizations with an established track record in the communities we serve. Trust is earned, and we rely on partners who have already earned it.' },
            ];

            return (
              <>
                <div className="hidden md:block space-y-16">
                  {steps.map((step, i) => (
                    <div key={step.num} className="grid md:grid-cols-12 gap-8 items-start reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                      <div className="md:col-span-3">
                        <span className="text-7xl font-black text-slate-200 block tracking-tighter">{step.num}</span>
                      </div>
                      <div className={`md:col-span-9 pt-2 border-t-4 ${step.border}`}>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">{step.title}</h3>
                        <p className="text-xl text-slate-600 font-medium leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="md:hidden -mx-4">
                  <div ref={vetScrollerRef} onScroll={handleVetScroll} className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-[10%] pb-4 scrollbar-none">
                    {steps.map((step) => (
                      <div key={step.num} data-card className="snap-center shrink-0 w-[80%] bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden flex flex-col">
                        <div className={`border-t-4 ${step.border} p-6 flex-1 flex flex-col`}>
                          <span className="text-5xl font-black text-slate-200 block tracking-tighter mb-3">{step.num}</span>
                          <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{step.title}</h3>
                          <p className="text-base text-slate-600 font-medium leading-relaxed">{step.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-2 mt-3">
                    {steps.map((_, i) => (
                      <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === vetActiveIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300'}`} />
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

          <div className="mt-16 md:mt-20 pt-12 md:pt-16 border-t border-slate-200 text-center reveal">
            <Link to="/circles" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors uppercase tracking-widest text-sm bg-white px-8 py-4 rounded-xl shadow-soft">
              See the Circles & Prizes <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default ImpactPage;