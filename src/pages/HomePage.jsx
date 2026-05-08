import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Check, Heart, Building, HelpCircle, ChevronRight, TrendingUp, Gift, ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';
import MainNavbar from '../components/layout/MainNavbar';
import Footer from '../components/layout/Footer';

const HomePage = ({ appData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  const howSectionRef = useRef(null);
  const [howScroll, setHowScroll] = useState(0);

  // Handle hash navigation (e.g. /#tiers from "Back to Home" on checkout)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      // Slight delay to let the layout settle before scrolling
      const t = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 70, behavior: 'auto' });
        }
      }, 60);
      return () => clearTimeout(t);
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      if (howSectionRef.current) {
        const rect = howSectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const scrollDistance = -rect.top;
        const maxScroll = rect.height - windowHeight;
        
        if (maxScroll > 0) {
          let progress = scrollDistance / maxScroll;
          setHowScroll(Math.max(0, Math.min(1, progress)));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 

    const observerOnce = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observerOnce.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });

    document.querySelectorAll('.reveal').forEach((el) => observerOnce.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observerOnce.disconnect();
    };
  }, []);

  const handleJoinClick = (tier, e) => {
    if (e) e.stopPropagation();
    // Pass `from` so the back-to-home link on checkout returns to the tier cards
    navigate('/checkout', { state: { tier, from: '/#tiers' } }); 
  };

  const handleCardClick = (tier, e) => {
    if (window.innerWidth >= 768) {
      handleJoinClick(tier, e);
    }
  };

  const lineProgress = Math.max(0, Math.min(100, (howScroll - 0.02) * 130));
  const showStep1 = howScroll > 0.01;   
  // Tightened: "2" now appears as soon as the line reaches its position rather than past it.
  const showStep2 = lineProgress >= 33; 
  const showStep3 = lineProgress >= 88; 

  const primaryFaqs = [
    { q: "What is Amplify?", a: "Amplify is a giving platform that pools your monthly Tzedakah with a circle of donors into one massive grant, and as a thank-you, members get a shot at winning up to $100,000 every month." },
    { q: "Why prizes? Doesn't that take money from charity?", a: "It's actually the opposite. The prize model is what makes the grant transformational in the first place. A giving circle without prizes might raise $40,000 in a good month. With prizes attracting and retaining consistent donors, it raises $400,000, delivered to a charity that spent nothing to acquire it. A smaller percentage of a much larger pool does more good than 100% of a small one. That's not a compromise. That's the model." },
    { q: "How does the circle model work?", a: "Each circle has exactly 400 spots. The moment a circle fills up, the massive monthly prize drawing goes live for those members. It keeps the odds incredible. The pooled contributions form both the monthly grant and the prize pool." },
    { q: "Who selects the charities?", a: "Charities are properly vetted in advance. Financials, impact, the works. We focus on organizations where a single large grant can reach a critical milestone." }
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 scroll-smooth relative" onClick={() => setActiveTooltip(null)}>
      <div id="top" className="absolute top-0"></div>

      <MainNavbar />

      {/* DARK HERO */}
      <header className="bg-indigo-950 pt-20 md:pt-24 pb-0 flex flex-col overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 pb-4 md:pb-6 relative z-10 flex-grow">
          <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-center">
            <div className="text-left lg:col-span-6 animate-hero">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-6 leading-[0.9] uppercase">
                Give Together.<br/>
                <span className="text-amber-400 italic">Amplify</span>
                <span className="text-amber-400 italic"> Your Impact.</span>
              </h1>
              
              <p className="text-indigo-200 text-lg md:text-xl mb-8 font-medium leading-relaxed max-w-2xl">
                Amplify pools your monthly giving with an exclusive circle of donors to make a massive impact. <strong className="text-white">Win Up To $100,000</strong> <em className="text-white font-bold not-italic">every month</em> as a thank you for your commitment.
              </p>
              
              <div className="space-y-4 mb-10 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></div>
                  <span className="text-sm md:text-base font-medium text-indigo-100 leading-snug">Join a community of donors pooling their Tzedakah into a six-figure grant every month</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></div>
                  <span className="text-sm md:text-base font-medium text-indigo-100 leading-snug">Exclusive drawings with odds as strong as 1 in 25</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></div>
                  <span className="text-sm md:text-base font-medium text-indigo-100 leading-snug">You were going to give Ma'aser anyway. Now it could win you $100,000.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 text-left">
                <button onClick={() => { const el = document.getElementById('tiers'); if(el) window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth'}); }} className="w-full md:w-auto px-10 py-4 bg-amber-400 text-slate-900 rounded-lg font-bold text-sm md:text-base hover:bg-amber-300 transition-all uppercase tracking-widest shadow-lg shadow-amber-400/20">
                  Join the Circle
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 relative mt-8 md:mt-0 animate-hero flex justify-center">
              <div className="aspect-[4/3] md:aspect-video w-full rounded-2xl overflow-hidden bg-indigo-900 relative shadow-2xl ring-1 ring-white/10">
                <iframe 
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/T6RxmZmNZME?rel=0&modestbranding=1" 
                  title="Amplify Promotional Video" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="w-full flex flex-col mt-auto relative z-10 reveal">
          <div className="w-full h-12 md:h-16 bg-gradient-to-b from-indigo-950 to-slate-700"></div>
          <div className="w-full bg-slate-700 border-b border-slate-600 pb-8 md:pb-10 pt-2">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 md:gap-x-8 items-center justify-items-center">
              {[
                { top: "Up to", num: "$100K", label: "Monthly Prize", colorClass: "text-amber-400", labelClass: "text-amber-400/90" },
                { top: "Goal", num: "$5M+", label: "Yearly to Charity", colorClass: "text-white", labelClass: "text-slate-300" },
                { top: "Up to", num: "1/25", label: "Winning Odds", colorClass: "text-white md:text-amber-400", labelClass: "text-slate-300 md:text-amber-400/90" },
                { top: "Over", num: "$200K", label: "Total Monthly Prizes", colorClass: "text-amber-400 md:text-white", labelClass: "text-amber-400/90 md:text-slate-300" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center w-full">
                  <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest mb-1 min-h-[14px] leading-none ${stat.labelClass}`}>{stat.top}</p>
                  <p className={`text-3xl sm:text-4xl md:text-5xl font-black tabular-nums leading-none tracking-tighter ${stat.colorClass}`}>{stat.num}</p>
                  <p className={`text-[9px] md:text-[11px] font-bold uppercase tracking-widest mt-2 md:mt-3 ${stat.labelClass}`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* How it Works Section */}
      <section id="how" className="relative bg-white border-t border-slate-100">
        <div ref={howSectionRef} className="h-[150vh]">
          <div className="sticky top-16 md:top-[80px] min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-start max-w-7xl mx-auto px-4 overflow-hidden pt-10 md:pt-16 pb-12">
            
            <div className="mb-10 md:mb-16 text-center md:text-left transition-opacity duration-500">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">The Mechanics</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-tight md:leading-tight">
                Strategic giving, simplified.<br className="hidden md:block"/>
                <span className="block mt-3 md:mt-0 md:inline md:ml-2 italic text-indigo-600">And amplified.</span>
              </h2>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-[52px] left-[10%] right-[16%] h-0.5 bg-transparent z-0">
                <div className="h-full bg-indigo-500 rounded-full transition-[width] duration-100 ease-linear" style={{ width: `${lineProgress}%` }}></div>
              </div>
              <div className="md:hidden absolute top-[15%] bottom-[15%] left-1/2 -translate-x-1/2 w-0.5 bg-transparent z-0">
                <div className="w-full bg-indigo-500 rounded-full transition-[height] duration-100 ease-linear" style={{ height: `${lineProgress}%` }}></div>
              </div>
              
              <div className="flex flex-col md:grid md:grid-cols-3 gap-16 md:gap-12 relative z-10">
                  <div className={`flex flex-col items-center md:items-start text-center md:text-left transition-all duration-[250ms] ease-out transform ${showStep1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="text-6xl md:text-8xl font-black text-slate-200 leading-none select-none mb-3 md:mb-5 relative z-10 tabular-nums bg-white px-2 rounded-xl">01</div>
                    <div className="bg-white px-2 py-1 relative z-10">
                      <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">Everyone pools in</h3>
                      <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">Donors join a circle and combine their monthly giving into one massive fund.</p>
                    </div>
                  </div>
                  
                  <div className={`flex flex-col items-center md:items-start text-center md:text-left transition-all duration-[250ms] ease-out transform ${showStep2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="text-6xl md:text-8xl font-black text-slate-200 leading-none select-none mb-3 md:mb-5 relative z-10 tabular-nums bg-white px-2 rounded-xl">02</div>
                    <div className="bg-white px-2 py-1 relative z-10">
                      <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">One grant. One charity.</h3>
                      <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">The pool funds a single, transformational grant to one vetted nonprofit. Every month.</p>
                    </div>
                  </div>
                  
                  <div className={`flex flex-col items-center md:items-start text-center md:text-left transition-all duration-[250ms] ease-out transform ${showStep3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="text-6xl md:text-8xl font-black text-slate-200 leading-none select-none mb-3 md:mb-5 relative z-10 tabular-nums bg-white px-2 rounded-xl">03</div>
                    <div className="bg-white px-2 py-1 relative z-10">
                      <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">Win Big</h3>
                      <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">When your circle hits 400, the drawing unlocks. Winning odds up to 1 in 25. Prizes up to $100,000.</p>
                    </div>
                  </div>
              </div>
            </div>

            <div className={`mt-12 md:mt-20 text-center relative z-20 transition-opacity duration-500 ${showStep3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <Link to="/how-it-works" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors uppercase tracking-widest text-sm">
                Want the full breakdown? See exactly how it works <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto Section - tighter sizing per user feedback (was too big on desktop) */}
      <section className="py-20 md:py-24 lg:py-28 bg-indigo-950 px-6 md:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="w-16 h-1.5 bg-amber-400 mb-10 md:mb-12"></div>
          <h2 className="text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-[1.02] mb-10 md:mb-12">
            <span className="text-white">People give.</span><br/>
            <span className="text-indigo-300 italic">That's not the problem.</span>
          </h2>
          <p className="text-2xl md:text-2xl lg:text-3xl text-indigo-100 font-medium leading-[1.3] mb-10 md:mb-12 max-w-3xl">
            What changes things is showing up the same way, every month. Together.
          </p>
          <p className="text-2xl md:text-2xl lg:text-3xl text-white font-medium leading-[1.3] max-w-3xl">
            One massive grant. One charity.<br className="hidden md:block"/> Win up to <span className="text-amber-400 font-black">$100,000</span> as a thank-you.
          </p>
        </div>
      </section>


      {/* Rabbinic Endorsement — compact bar (full panel lives on /about) */}
      <section className="py-12 md:py-20 bg-white border-t border-slate-100 px-4">
        <div className="max-w-5xl mx-auto reveal">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl md:rounded-3xl p-6 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            {/* Visual mark — ShieldCheck implies verified/endorsed (consistent w/ trust iconography elsewhere) */}
            <div className="shrink-0 flex md:flex-col items-center md:items-start gap-4 md:gap-3">
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-950 flex items-center justify-center shadow-md">
                <ShieldCheck size={28} className="text-amber-400" strokeWidth={2.25} />
              </div>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 md:mt-1">Rabbinic Endorsement</p>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-[1.1] mb-2 md:mb-3">
                Reviewed and endorsed by leading <span className="italic">Poskim</span>.
              </h2>
              <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">Our Rabbinic Panel has formally approved the model, including the use of Ma'aser, prize allocation, and charitable disbursement.</p>
            </div>

            <Link to="/about#rabbinic-panel" className="shrink-0 inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors uppercase tracking-widest text-xs md:text-sm self-start md:self-center whitespace-nowrap">
              See the panel <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Beneficiary Section */}
      <section id="beneficiary" className="py-20 md:py-28 bg-slate-900 px-4 text-white">
        <div className="max-w-7xl mx-auto reveal">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="flex flex-col justify-center text-center md:text-left">
              <p className="text-[10px] md:text-xs font-bold text-indigo-400 uppercase tracking-[0.4em] mb-4">Who We're Helping This Month</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 md:mb-8 tracking-tight uppercase italic">Chai Lifeline</h2>
              <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed mb-8 md:mb-10">
                Chai Lifeline is there for families the moment a child is diagnosed with cancer or a life-threatening illness. Transportation, counseling, summer camp, crisis support. Whatever a family needs. Our grant goes directly to making sure no child or family faces this alone.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 justify-center md:justify-start mb-6">
                <div className="flex items-center gap-3">
                  <Building size={20} className="text-slate-400" />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-300">Verified Nonprofit</p>
                </div>
                <div className="hidden sm:block w-px h-6 bg-slate-700"></div>
                <div className="flex items-center gap-3">
                  <Heart size={20} className="text-red-400 fill-current" />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-300">Impact Goal: $400,000</p>
                </div>
              </div>

              <p className="text-[11px] md:text-xs text-slate-400 font-medium mb-10 leading-relaxed">
                Grants administered through <span className="text-slate-200 font-bold">Givinga</span>, a registered 501(c)(3) donor-advised fund.
              </p>

              <div className="text-center md:text-left">
                <Link to="/impact" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-widest text-xs md:text-sm">
                  Learn about how we select our charity partners <ChevronRight size={16} />
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-2xl min-h-[300px] md:min-h-[450px] border border-slate-700 transition-transform duration-500 hover:scale-[1.02]">
               <img src="/impact-photo.jpg" alt="Impact" className="absolute inset-0 w-full h-full object-cover opacity-70" onError={(e) => { e.currentTarget.style.display='none'; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
               {/* Mobile: more compact box */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white py-2 md:py-3 px-8 md:px-8 rounded-lg flex items-center justify-center shadow-xl">
                  <img src="/ChaiLifeline.png" alt="Chai Lifeline Logo" className="h-10 md:h-12 w-auto object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers Section (No Stagger) */}
      <section id="tiers" className="py-16 md:py-24 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase mb-4">Pick your <span className="italic">impact.</span></h2>
            <p className="text-slate-500 text-sm md:text-base font-bold uppercase tracking-widest">Each circle funds one massive grant. With real odds of winning big.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto pb-8">
            {['silver', 'gold', 'diamond'].map((tier, index) => {
              const totalPool = (appData.tierData[tier].price * 400).toLocaleString();
              const headerColor = tier === 'silver' ? 'text-slate-500' : tier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]';
              const dotColor = tier === 'silver' ? 'bg-slate-400' : tier === 'gold' ? 'bg-[#eab308]' : 'bg-[#818cf8]';

              return (
                <div key={tier} onClick={(e) => handleCardClick(tier, e)} className="bg-white border border-slate-200 rounded-2xl flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 reveal md:cursor-pointer group/card" style={{ transitionDelay: `${index * 100}ms` }}>
                  <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                      <span className={`text-xs font-black uppercase tracking-widest ${headerColor}`}>{tier} Circle</span>
                    </div>
                    <span className="text-base font-black text-slate-900">
                      ${appData.tierData[tier].price.toLocaleString()}
                      <span className="text-xs font-semibold text-slate-400">/mo</span>
                    </span>
                  </div>

                  <div className="px-6 pt-8 pb-6 text-center flex flex-col items-center justify-center bg-white">
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Monthly Grand Prize</p>
                    <p className={`text-5xl md:text-6xl font-black tracking-tighter leading-none ${headerColor}`}>{appData.tierData[tier].prize}</p>
                  </div>

                  <div className="mx-6 py-4 border-t border-b border-slate-200 flex flex-col gap-4 relative z-20">
                    <div className="flex justify-between items-center relative">
                      <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">Grand Prize Odds</span>
                      <span className="text-base md:text-lg font-black text-slate-700 flex items-center gap-1.5">
                        <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Up to</span> 1 / 400
                      </span>
                    </div>
                    <div className="flex justify-between items-center relative">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Winning Odds</span>
                        <div className="relative inline-flex items-center" onMouseEnter={() => setActiveTooltip(`${tier}-tot`)} onMouseLeave={() => setActiveTooltip(null)} onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === `${tier}-tot` ? null : `${tier}-tot`); }}>
                          <HelpCircle size={14} className="text-slate-400 cursor-pointer" />
                          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 max-w-[80vw] bg-slate-900 text-white p-3 rounded-xl shadow-xl text-[10px] leading-relaxed font-medium normal-case transition-all duration-200 z-[100] text-center pointer-events-none ${activeTooltip === `${tier}-tot` ? 'opacity-100 visible' : 'opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible'}`}>
                              The estimated probability of winning any prize when the circle fills.
                              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-slate-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-base md:text-lg font-black text-slate-700 flex items-center gap-1.5">
                        <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Up to</span> {appData.tierData[tier].totalOdds}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-3 border-t border-slate-200">
                      <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Combined Tzedakah Pool</span>
                      <span className="text-lg md:text-xl font-black text-slate-700">${totalPool}</span>
                    </div>
                  </div>

                  <div className="px-6 py-5 flex-grow bg-white">
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Other Monthly Prizes</p>
                    <div className="space-y-0 relative z-10">
                      {appData.tierData[tier].otherPrizes.map((p, i) => {
                        let qty = '1 winner';
                        let amount = p;
                        const lowerP = p.toLowerCase();
                        if (lowerP.includes('x')) {
                          const parts = lowerP.split('x');
                          const count = parseInt(parts[0].trim());
                          qty = count === 1 ? '1 winner' : `${count} winners`;
                          amount = p.substring(lowerP.indexOf('x') + 1).trim();
                        }
                        
                        return (
                          <div key={i} className="flex justify-between items-center text-sm py-2.5 border-b border-slate-50 last:border-0">
                            <span className="text-slate-500 font-bold text-sm md:text-base">{qty}</span>
                            <span className="font-black text-slate-800 tabular-nums text-base md:text-lg">{amount}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-5 pt-3 bg-white rounded-b-2xl relative z-10 overflow-hidden mt-auto">
                    <button onClick={(e) => handleJoinClick(tier, e)} className="w-full py-4 rounded-lg font-bold text-base lg:text-sm uppercase tracking-wider lg:tracking-widest transition-all whitespace-nowrap bg-slate-900 text-white hover:bg-indigo-900 shadow-lg group-hover/card:bg-indigo-900">
                      Join Now • ${appData.tierData[tier].price.toLocaleString()}/mo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-10 text-center px-4 reveal">
            <p className="text-slate-500 text-[11px] md:text-xs font-medium leading-relaxed text-center max-w-2xl mx-auto">
              Actual odds of winning depend on total eligible entries. No purchase necessary. See <Link to="/rules" className="underline hover:text-slate-700 transition-colors">official rules</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Upgraded CTA Section */}
      <section className="py-12 md:py-16 bg-slate-900 px-4 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10 reveal">
          <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            Your circle is waiting.
          </h2>
          <p className="text-slate-300 font-medium text-lg md:text-xl mb-10 leading-relaxed">
            Pick a circle. Give every month.<br />
            And win up to $100,000 while you're at it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => { const el = document.getElementById('tiers'); if(el) window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth'}); }} className="px-10 py-4 bg-amber-400 text-slate-900 rounded-lg font-bold text-sm md:text-base hover:bg-amber-300 transition-colors uppercase tracking-widest shadow-lg shadow-amber-400/10">
              Join the Circle
            </button>
            <Link to="/faq" className="px-10 py-4 bg-transparent border border-slate-700 text-slate-300 rounded-lg font-bold text-sm md:text-base hover:border-slate-500 hover:text-white transition-colors uppercase tracking-widest inline-flex items-center justify-center">
              Have Questions?
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Homepage FAQ block */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-100 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="reveal">
            <h2 className="text-4xl md:text-5xl font-black mb-3 md:mb-4 text-slate-900 tracking-tight italic">Questions?</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-10 md:mb-12 text-[10px] md:text-xs">A few quick answers</p>
          </div>
          
          <div className="space-y-4 text-left">
            {primaryFaqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-200 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-6 md:p-8 text-left flex justify-between items-center outline-none bg-white">
                  <span className="font-bold text-slate-900 text-sm md:text-base pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={20} className="shrink-0 text-indigo-600" /> : <ChevronDown size={20} className="shrink-0 text-slate-400" />}
                </button>
                {openFaq === i && <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 text-slate-600 font-medium leading-relaxed text-sm md:text-base bg-white">{faq.a}</div>}
              </div>
            ))}
          </div>
          <Link to="/faq" className="inline-flex mt-10 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 transition-all shadow-sm reveal">
            See All Questions
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;