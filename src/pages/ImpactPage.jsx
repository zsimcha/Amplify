import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Building, Heart, Check, ChevronRight } from 'lucide-react';

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

      {/* This Month's Partner — quote moved to full-width band below for balanced layout */}
      <section className="py-16 md:py-24 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          
          {/* Two balanced columns — image and copy */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            
            {/* Image column */}
            <div className="order-1 md:order-2 reveal" style={{ transitionDelay: '150ms' }}>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-soft-xl relative bg-slate-900">
                <img src="/impact-photo.jpg" alt="Impact" className="absolute inset-0 w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.style.display='none'; }} />
                {/* Logo overlay so the visual feels intentional */}
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
                  <p className="font-black text-slate-900 text-sm md:text-lg tracking-tight">4 ★</p>
                </div>
              </div>

              <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-4">
                Chai Lifeline supports families the moment a child is diagnosed with cancer or a life-threatening illness. Transportation, counseling, summer camp, crisis support.
              </p>
              <p className="text-base md:text-lg text-slate-900 font-bold leading-relaxed mb-6">
                Our grant goes directly to making sure no family faces this alone.
              </p>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Grants administered through <span className="text-slate-700 font-bold">Givinga</span>, a registered 501(c)(3) donor-advised fund.
              </p>
            </div>

          </div>

          {/* Quote — full-width band below the two columns */}
          <div className="mt-12 md:mt-16 reveal" style={{ transitionDelay: '300ms' }}>
            <div className="bg-indigo-950 text-white p-8 md:p-12 lg:p-16 rounded-3xl shadow-soft-xl relative overflow-hidden">
              {/* Decorative quote mark */}
              <svg className="absolute top-6 left-6 md:top-8 md:left-10 text-indigo-800 w-12 h-12 md:w-16 md:h-16 opacity-50" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.896 3.456-8.352 9.12-8.352 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
              {/* Subtle right-side accent */}
              <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 md:pl-16 lg:pl-20 max-w-4xl">
                <p className="text-xl md:text-2xl lg:text-3xl font-medium italic leading-[1.4] text-indigo-50 mb-6 md:mb-8">
                  "[Quote from Chai Lifeline leadership about what this grant enables.]"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-px bg-amber-400"></div>
                  <div>
                    <p className="text-sm md:text-base font-bold text-white">Director Name</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mt-0.5">Chai Lifeline</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vetting Process */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 md:mb-16 reveal">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4">The Process</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Our vetting process.</h2>
          </div>

          {(() => {
            const steps = [
              { num: '01', title: 'Financials',    border: 'border-indigo-600',  body: 'We review audited financials, 990 filings, and overhead ratios. We only partner with organizations that can account for every single dollar.' },
              { num: '02', title: 'Clear Impact',  border: 'border-amber-400',   body: "Not 'it helps our general fund.' We look for organizations that can tell us exactly what program this grant funds, and how many families it will reach." },
              { num: '03', title: 'Ready to Scale', border: 'border-blue-400',    body: "Some nonprofits aren't structured to deploy a huge lump-sum gift effectively. We look for partners where this grant acts as a true catalyst." },
              { num: '04', title: 'Proven Trust',  border: 'border-emerald-400', body: 'We prioritize organizations with an established track record in the communities we serve. Trust is earned, and we rely on partners who have already earned it.' },
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
                  <div
                    ref={vetScrollerRef}
                    onScroll={handleVetScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-[10%] pb-4 scrollbar-none"
                  >
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
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${i === vetActiveIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

          <div className="mt-16 md:mt-20 pt-12 md:pt-16 border-t border-slate-100 text-center reveal">
            <Link to="/circles" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors uppercase tracking-widest text-sm bg-indigo-50 px-8 py-4 rounded-xl">
              See the Circles & Prizes <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default ImpactPage;