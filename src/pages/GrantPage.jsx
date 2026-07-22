import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight, Plus } from 'lucide-react';
import { partners, partnerLogo } from '../data/partners';

// A single partner tile. The logo sits on the front; the description on the
// back, over a faded watermark of the same logo. Desktop flips on hover; touch
// devices flip on tap (and tap works on desktop too, so it's keyboard/click
// friendly). backface-visibility hides whichever face points away.
const PartnerTile = ({ partner }) => {
  const [flipped, setFlipped] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const src = partnerLogo(partner);

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-label={`${partner.name}. ${partner.category}. ${partner.description}`}
      className="group relative aspect-[5/4] sm:aspect-square [perspective:1000px] rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ease-out [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* FRONT — logo */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl border border-slate-200 bg-white shadow-soft flex items-center justify-center p-5 md:p-6">
          {logoFailed ? (
            <span className="text-sm md:text-lg font-black uppercase tracking-wide text-slate-700 text-center leading-tight">
              {partner.name}
            </span>
          ) : (
            <img
              src={src}
              alt={partner.name}
              onError={() => setLogoFailed(true)}
              className="max-h-[50%] max-w-[82%] w-auto object-contain"
            />
          )}
          <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
            <Plus size={12} strokeWidth={2.5} />
          </span>
        </div>

        {/* BACK — description over a faded logo watermark */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-indigo-800 bg-indigo-950 text-white overflow-hidden flex flex-col justify-center p-4 md:p-5 text-left">
          {!logoFailed && (
            <img
              src={src}
              alt=""
              aria-hidden
              className="absolute inset-0 m-auto w-4/5 h-4/5 object-contain opacity-25 pointer-events-none"
            />
          )}
          <div className="relative">
            <p className="text-[0.5625rem] md:text-[0.625rem] font-bold uppercase tracking-widest text-amber-300 mb-1 md:mb-1.5">
              {partner.category}
            </p>
            <h3 className="text-sm md:text-base font-bold tracking-tight mb-1 md:mb-2">{partner.name}</h3>
            <p className="text-[0.6875rem] md:text-[0.8125rem] text-indigo-100 font-medium leading-snug md:leading-relaxed">
              {partner.description}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
};

const GrantPage = () => {
  useEffect(() => {
    const observerOnce = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observerOnce.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('.reveal').forEach((el) => observerOnce.observe(el));
    return () => observerOnce.disconnect();
  }, []);

  // Mobile carousel state for the vetting steps
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

  const categories = [...new Set(partners.map((p) => p.category))];

  const vettingSteps = [
    { num: '01', title: 'Financials', border: 'border-indigo-600', body: 'We review audited financials, 990 filings, and overhead ratios. We only partner with organizations that can account for every single dollar.' },
    { num: '02', title: 'Clear Impact', border: 'border-amber-400', body: 'Not "it helps our general fund." We look for organizations that can tell us exactly what our grants fund and how many people they reach.' },
    { num: '03', title: 'Ready to Scale', border: 'border-blue-400', body: "Some nonprofits aren't built to deploy a large grant effectively. We look for partners where our funding acts as a true catalyst." },
    { num: '04', title: 'Proven Trust', border: 'border-emerald-400', body: 'We prioritize organizations with an established track record in the communities we serve. Trust is earned, and we rely on partners who have already earned it.' },
  ];

  return (
    <PageLayout title="Our Causes" intro="The verified nonprofits your circle funds, and how we choose them.">

      {/* LEAD — editorial intro + the breadth of cause areas */}
      <section className="py-16 md:py-24 px-4 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center reveal">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">Your Tzedakah at work</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-[1.05]">
            Every cause you stand behind.
          </h2>
          <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
            Each month, Amplify members choose where their giving goes, directing collective grants to a
            growing list of fully vetted Chessed organizations, spanning crisis care, medical breakthroughs,
            Torah education, campus life, and emergency response.
          </p>

          <div className="mt-10 md:mt-12 flex flex-wrap justify-center gap-2 md:gap-2.5">
            {categories.map((c) => (
              <span key={c} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-widest text-slate-500">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER DIRECTORY — flip tiles */}
      <section className="py-16 md:py-24 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14 reveal">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">Meet the causes.</h2>
            <p className="text-sm md:text-base text-slate-500 font-medium">
              <span className="md:hidden">Tap</span><span className="hidden md:inline">Hover or tap</span> any partner to learn more.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 reveal">
            {partners.map((p) => (
              <PartnerTile key={p.slug} partner={p} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE CHOOSE — vetting */}
      <section className="py-20 md:py-28 px-4 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 md:mb-16 reveal">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">How we choose</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">Our vetting process.</h2>
          </div>

          <div className="hidden md:block space-y-16">
            {vettingSteps.map((step, i) => (
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
              {vettingSteps.map((step) => (
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
              {vettingSteps.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === vetActiveIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300'}`} />
              ))}
            </div>
          </div>

          <div className="mt-16 md:mt-20 pt-12 md:pt-16 border-t border-slate-200 text-center reveal">
            <Link to="/circles" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors uppercase tracking-widest text-sm bg-slate-50 px-8 py-4 rounded-xl shadow-soft">
              See the Circles & Prizes <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default GrantPage;
