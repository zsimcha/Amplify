import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Check, Menu, X, Users, Sparkles, Rocket, TrendingUp, Gift, Heart, Building, ChevronUp, ChevronDown, HelpCircle } from 'lucide-react';
import { LogoIcon } from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';

const HomePage = ({ appData }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHowCard, setActiveHowCard] = useState(0);
  const [activeWhyCard, setActiveWhyCard] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const handleCarouselScroll = (e, setCardIndex) => {
    const { scrollLeft, clientWidth } = e.target;
    const index = Math.round(scrollLeft / clientWidth);
    setCardIndex(index);
  };

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const element = document.getElementById(id);
    if (element) {
      const offset = 70; 
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const handleJoinClick = (tier, e) => {
    if (e) e.stopPropagation();
    navigate('/checkout', { state: { tier } }); 
  };

  const getTierColor = (tier) => {
    if (tier === 'silver') return 'text-slate-500';
    if (tier === 'gold') return 'text-[#eab308]'; 
    if (tier === 'diamond') return 'text-[#818cf8]'; 
    return 'text-slate-900';
  };

  const primaryFaqs = [
    { q: "What is Amplify?", a: "Amplify is a community-powered giving platform that pools monthly Tzedakah to create greater collective impact. Members give consistently, support new charitable organizations each month, and receive access to optional appreciation perks as a thank-you for their giving." },
    { q: "How much of my contribution actually goes to the charity?", a: "The majority of your gift goes directly to our charity partners, while a portion funds our prize pool and operations. Offering these prizes allows us to attract thousands of consistent monthly donors and ultimately issue much larger grants than traditional models would." },
    { q: "Where do the raffle prizes come from?", a: "The prizes are funded from each circle’s pooled donations. Amplify intentionally allocates a portion of each pool toward appreciation draws because they meaningfully increase participation and retention." },
    { q: "How does the 400-member cap work?", a: "Each circle is strictly capped at 400 paid members. The moment a circle reaches this cap, the massive monthly prize drawing is unlocked and activated for those members." }
  ];
  const secondaryFaqs = [
    { q: "Why not just give directly?", a: "Direct giving is powerful and encouraged. Amplify exists for those who want their consistent monthly giving to become part of a coordinated collective effort capable of issuing larger, strategic grants." },
    { q: "Who selects the charities?", a: "Charities are vetted in advance based on impact and financial transparency. We focus on organizations where a single large grant can reach a critical milestone." },
    { q: "When am I charged?", a: "Your first contribution is processed immediately upon joining. Subsequent recurring donations will be charged on the same day each month." },
    { q: "Can I cancel at any time?", a: "Yes. Memberships can be paused or canceled at any time before your next scheduled monthly charge." },
    { q: "Is my contribution tax-deductible?", a: "Donations benefiting a 501(c)(3) organization are tax-deductible in the US to the extent permitted by law." },
    { q: "Are the drawings required?", a: "No. Participation in any drawings or appreciation rewards is provided solely as a thank-you for consistent giving. You may opt out of the sweepstakes at any time." }
  ];

  const renderTierCardContent = (tier) => (
    <div className="flex flex-col h-full relative z-10">
        <div 
            className="hidden md:block absolute inset-0 z-0 cursor-pointer" 
            onClick={(e) => handleJoinClick(tier, e)}
            aria-hidden="true"
        ></div>

        <div className="flex justify-between items-center mb-5 md:mb-6 relative z-10 pointer-events-none">
            <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tighter drop-shadow-sm ${getTierColor(tier)}`}>{tier}</h3>
            <span className="text-xs md:text-sm font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">${appData.tierData[tier].price.toLocaleString()} / mo</span>
        </div>
        <div className="text-center py-6 md:py-8 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100 mb-5 md:mb-6 shadow-inner relative z-10 pointer-events-none">
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Monthly Grand Prize</p>
            <p className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-sm ${getTierColor(tier)}`}>{appData.tierData[tier].prize}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6 shrink-0 relative z-20">
             <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 text-center pointer-events-none">
                 <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Raffle Odds</p>
                 <p className="font-black text-slate-800 text-sm md:text-base">1 / 400</p>
             </div>
             <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 text-center relative group/odds">
                 <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1 cursor-help">
                   Total Odds <HelpCircle size={10} className="text-slate-400 md:group-hover/odds:text-indigo-600 transition-colors" />
                 </p>
                 <p className="font-black text-slate-800 text-sm md:text-base pointer-events-none">{appData.tierData[tier].totalOdds}</p>
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white border border-slate-200 p-3 rounded-2xl shadow-xl text-[10px] leading-relaxed font-medium text-slate-500 normal-case opacity-0 invisible md:group-hover/odds:opacity-100 md:group-hover/odds:visible transition-all duration-200 z-50 text-center pointer-events-none">
                    The estimated probability of winning <em>any</em> prize in this tier.
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                 </div>
             </div>
        </div>
        <div className="space-y-4 md:space-y-5 mb-6 md:mb-8 flex-grow text-center relative z-10 pointer-events-none">
            <div>
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] md:text-[10px] mb-2 md:mb-3">Other Monthly Prizes</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {appData.tierData[tier].otherPrizes.map((p, idx) => (
                        <span key={idx} className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs md:text-sm font-black text-slate-700 shadow-sm">{p}</span>
                    ))}
                </div>
            </div>
        </div>
        <button 
            onClick={(e) => handleJoinClick(tier, e)} 
            className="w-full py-4 md:py-4 px-2 md:px-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm shadow-lg transition-all mt-auto bg-slate-900 text-white md:hover:bg-indigo-900 flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap active:bg-indigo-900 relative z-20 cursor-pointer"
        >
            <span>Select</span><span className="text-white/40 font-normal opacity-70">•</span><span>${appData.tierData[tier].price.toLocaleString()}/mo</span>
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 scroll-smooth relative">
      <style>{`img { background-color: #f1f5f9; min-height: 20px; }`}</style>
      <div id="top" className="absolute top-0"></div>

      <nav className="fixed w-full z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => scrollToSection('top')} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left" aria-label="Go to Top">
            <div className="bg-indigo-900 text-white p-1 md:p-1.5 rounded-lg md:rounded-xl"><LogoIcon /></div>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
          </button>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">
            <button onClick={() => scrollToSection('how')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">How it works</button>
            <button onClick={() => scrollToSection('why')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">Why Amplify</button>
            <button onClick={() => scrollToSection('beneficiary')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">Beneficiary</button>
            <button onClick={() => scrollToSection('tiers')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">The Circles</button>
            {/* Added FAQ to desktop nav below */}
            <button onClick={() => scrollToSection('faq')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">FAQ</button>
          </div>
          <button className="md:hidden p-2 text-indigo-900" onClick={() => setIsMenuOpen(true)} aria-label="Open Menu"><Menu size={24} /></button>
          <button onClick={() => scrollToSection('tiers')} className="hidden md:block bg-indigo-900 text-white px-6 py-2.5 rounded-full text-xs font-black hover:bg-black transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest">Reserve My Spot</button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white animate-in slide-in-from-right duration-300 flex flex-col" role="dialog" aria-modal="true">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 shrink-0 text-left">
                <span className="text-xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-indigo-950 p-2" aria-label="Close Menu"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-lg font-black text-slate-900 uppercase tracking-tighter text-left">
                <button onClick={() => scrollToSection('how')} className="text-left border-b border-slate-50 pb-3">How it works</button>
                <button onClick={() => scrollToSection('why')} className="text-left border-b border-slate-50 pb-3">Why Amplify</button>
                <button onClick={() => scrollToSection('beneficiary')} className="text-left border-b border-slate-50 pb-3">Beneficiary</button>
                <button onClick={() => scrollToSection('tiers')} className="text-left border-b border-slate-50 pb-3">The Circles</button>
                <button onClick={() => scrollToSection('faq')} className="text-left border-b border-slate-50 pb-3">FAQ</button>
            </div>
            <div className="p-6 border-t border-slate-50 shrink-0 text-left">
                <button onClick={() => { setIsMenuOpen(false); scrollToSection('tiers'); }} className="w-full py-5 bg-indigo-900 text-white rounded-full font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 text-sm">Join the Circle</button>
            </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="pt-20 pb-12 md:pt-24 md:pb-24 px-4 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-center">
            <div className="text-left lg:col-span-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-4 md:mb-8 leading-[0.9] md:leading-[0.85] uppercase">
                Give Together. <br /><div className="relative inline-block mt-1 md:mt-0"><span className="text-indigo-900 italic">Amplify</span><div className="absolute left-[-1%] bottom-[-2px] md:-bottom-2 w-[102%] h-1.5 md:h-2.5 bg-indigo-200 rounded-full"></div></div> <span className="italic text-indigo-900 block xl:inline mt-2 xl:mt-0 xl:ml-3">Your Impact.</span>
              </h1>
              <p className="text-lg md:text-2xl text-slate-600 mb-6 md:mb-8 font-medium max-w-2xl leading-snug">
                Pool your monthly donation with a global community to make a massive impact. <strong>Win Up To $100,000</strong> <em>every month</em> as a reward for your commitment.
              </p>
              <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 text-left">
                {["Pooled Tzedakah for transformational monthly grants", "Each drawing pool is capped at 400 members", "Combined winning odds up to 1/25"].map((text, i) => (
                  <div key={i} className="flex items-start md:items-center gap-3"><div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5 md:mt-0 shrink-0"><Check size={14} className="md:w-4 md:h-4" strokeWidth={3}/></div><span className="text-[11px] md:text-sm font-bold text-slate-700 uppercase tracking-tight leading-snug">{text}</span></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-left">
                <button onClick={() => scrollToSection('tiers')} className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl md:hover:shadow-2xl md:hover:bg-black transition-all transform md:hover:-translate-y-1 uppercase tracking-tighter active:bg-black">Join the Circle</button>
              </div>
            </div>
            <div className="lg:col-span-6 relative mt-6 md:mt-0">
              <div className="aspect-[4/3] md:aspect-video w-full rounded-2xl md:rounded-[3rem] overflow-hidden shadow-2xl md:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border-[6px] md:border-[12px] border-white bg-slate-900 relative">
                <video className="w-full h-full object-contain bg-slate-900" controls playsInline aria-label="Promotional video about Amplify" onError={(e) => e.currentTarget.style.display = 'none'}><source src="amplify-video.mp4" type="video/mp4" /></video>
              </div>
              <div className="absolute -top-4 -right-2 md:-top-8 md:right-auto md:-left-8 bg-[#eab308] p-3 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl md:shadow-2xl flex flex-col items-center justify-center border-4 border-white z-20 rotate-[-5deg] scale-90 md:scale-100 pointer-events-none">
                <p className="text-[8px] md:text-xs font-black uppercase tracking-widest text-indigo-950 mb-0.5 md:mb-1 leading-none text-center">Collective Goal</p>
                <div className="w-full h-px bg-indigo-950/10 mb-0.5 md:mb-1"></div>
                <p className="text-xl md:text-4xl font-black text-indigo-950 tracking-tighter leading-none whitespace-nowrap">$4.8M+<span className="text-[9px] md:text-sm font-bold text-indigo-900/60 ml-0.5 md:ml-1">/year</span></p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How it Works Section */}
      <section id="how" className="py-16 md:py-24 bg-indigo-950 text-white px-4 text-center md:text-left overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 md:mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 tracking-tight uppercase italic text-white">How it Works</h2>
            <p className="text-indigo-200 text-base md:text-lg font-medium max-w-2xl mx-auto">Strategic Tzedakah, simplified and amplified.</p>
          </div>
          
          <div 
            onScroll={(e) => handleCarouselScroll(e, setActiveHowCard)}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          >
            <div className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-indigo-900/40 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-col items-center md:items-center text-center transition-all duration-300 md:hover:bg-indigo-900 md:hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] md:hover:-translate-y-1">
              <div className="bg-white/10 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 mb-4 md:mb-8 text-center"><Users className="text-[#eab308] w-6 h-6 md:w-8 md:h-8" /></div>
              <div><h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-tighter text-white">We Join Forces</h3><p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium">Donors join specialized circles, pooling recurring contributions to create a transformational monthly gift.</p></div>
            </div>
            
            <div className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-indigo-900/40 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-col items-center md:items-center text-center transition-all duration-300 md:hover:bg-indigo-900 md:hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] md:hover:-translate-y-1">
              <div className="bg-white/10 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 mb-4 md:mb-8 text-center"><Sparkles className="text-[#eab308] w-6 h-6 md:w-8 md:h-8" /></div>
              <div><h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-tighter text-white">Huge Impact</h3><p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium">Combined donations are issued as a single massive grant, empowering our rotating charity partners to achieve critical milestones.</p></div>
            </div>
            
            <div className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-indigo-900/40 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-col items-center md:items-center text-center transition-all duration-300 md:hover:bg-indigo-900 md:hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] md:hover:-translate-y-1">
              <div className="bg-white/10 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 mb-4 md:mb-8 text-center"><Trophy className="text-[#eab308] w-6 h-6 md:w-8 md:h-8" /></div>
              <div><h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-tighter text-white">Monthly Appreciation</h3><p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium">As a thank you for your commitment, you receive entry into a drawing that triggers the moment your circle reaches 400 members, offering total odds up to 1/25.</p></div>
            </div>
          </div>
          
          <div className="md:hidden flex justify-center gap-2 mt-4">
            {[0, 1, 2].map(idx => (
               <div key={idx} className={`w-2 h-2 rounded-full transition-colors duration-300 ${activeHowCard === idx ? 'bg-[#eab308]' : 'bg-white/20'}`}></div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Amplify Section */}
      <section id="why" className="py-16 md:py-24 bg-white px-4 border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-indigo-950 mb-3 md:mb-4 tracking-tighter uppercase leading-none italic">Why Amplify?</h2>
              <p className="text-base md:text-xl text-slate-500 font-medium max-w-2xl mx-auto">A smarter, more rewarding way to give back to the community.</p>
           </div>
           
           <div 
             onScroll={(e) => handleCarouselScroll(e, setActiveWhyCard)}
             className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:gap-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
           >
              <div className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-slate-50 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row items-start transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] md:hover:bg-white md:hover:border-indigo-200">
                 <div className="bg-indigo-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-indigo-600 mb-4 sm:mb-0 sm:mr-6"><Rocket size={24} className="md:w-8 md:h-8" strokeWidth={2.5}/></div>
                 <div><h3 className="text-lg md:text-2xl font-black uppercase text-indigo-950 mb-2 md:mb-4 tracking-tight">Transformational Impact</h3><p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">Huge grants make a huge difference. By pooling resources, we fund critical, massive milestones rather than just being a drop in the bucket.</p></div>
              </div>
              
              <div className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-slate-50 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row items-start transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] md:hover:bg-white md:hover:border-indigo-200">
                 <div className="bg-amber-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-amber-600 mb-4 sm:mb-0 sm:mr-6"><TrendingUp size={24} className="md:w-8 md:h-8" strokeWidth={2.5}/></div>
                 <div><h3 className="text-lg md:text-2xl font-black uppercase text-indigo-950 mb-2 md:mb-4 tracking-tight">The Multiplier Effect</h3><p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">Our reward model drives unprecedented volume and consistency. By combining our giving, we create a multiplier effect that empowers charities to tackle their biggest challenges.</p></div>
              </div>
              
              <div className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-slate-50 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row items-start transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] md:hover:bg-white md:hover:border-indigo-200">
                 <div className="bg-blue-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-blue-600 mb-4 sm:mb-0 sm:mr-6"><Users size={24} className="md:w-8 md:h-8" strokeWidth={2.5}/></div>
                 <div><h3 className="text-lg md:text-2xl font-black uppercase text-indigo-950 mb-2 md:mb-4 tracking-tight">Jewish Unity</h3><p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">We are fundamentally stronger together. Amplify unites communities globally, combining our Tzedakah to achieve a massive shared vision.</p></div>
              </div>
              
              <div className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center bg-slate-50 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row items-start transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] md:hover:bg-white md:hover:border-indigo-200">
                 <div className="bg-rose-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-rose-600 mb-4 sm:mb-0 sm:mr-6"><Gift size={24} className="md:w-8 md:h-8" strokeWidth={2.5}/></div>
                 <div><h3 className="text-lg md:text-2xl font-black uppercase text-indigo-950 mb-2 md:mb-4 tracking-tight">Meaningful Appreciation</h3><p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">Life-changing prizes are our way of saying thank you. Providing immense value in appreciation encourages our members to give continuously and consistently.</p></div>
              </div>
           </div>
           
           <div className="md:hidden flex justify-center gap-2 mt-4">
              {[0, 1, 2, 3].map(idx => (
                 <div key={idx} className={`w-2 h-2 rounded-full transition-colors duration-300 ${activeWhyCard === idx ? 'bg-indigo-900' : 'bg-slate-200'}`}></div>
              ))}
          </div>
        </div>
      </section>

      {/* Beneficiary Section */}
      <section id="beneficiary" className="py-16 md:py-24 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-stretch">
            <div className="bg-white rounded-3xl md:rounded-[3rem] p-8 md:p-16 border border-slate-100 flex flex-col justify-center text-center md:text-left shadow-sm">
              <p className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-[0.4em] mb-3 md:mb-4">This Month's Mission</p>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 md:mb-8 tracking-tighter uppercase italic">Chai Lifeline</h2>
              <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-8 md:mb-10">
                Chai Lifeline provides comprehensive, unparalleled support to children battling cancer and other life-threatening illnesses. Our collective grant funds vital services—from medical transportation and crisis counseling to joyful camp experiences—ensuring no family fights alone. Every dollar goes toward restoring hope, stability, and childhood magic in their darkest hours.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 justify-center md:justify-start">
                <div className="flex items-center gap-2 md:gap-3 text-slate-400"><Building size={24} className="md:w-7 md:h-7" /><p className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-none text-left">Vetted 501(c)(3) Partner</p></div>
                <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                <div className="flex items-center gap-2 md:gap-3 text-red-500 text-left"><Heart size={24} className="md:w-7 md:h-7 fill-current text-left" /><p className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-none text-slate-700 text-left">Impact Goal: $400,000</p></div>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-3xl md:rounded-[3rem] shadow-2xl bg-slate-900 min-h-[250px] md:min-h-[400px]">
               <img src="/impact-photo.jpg" alt="Impact" className="absolute inset-0 w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.style.display='none'; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent"></div>
               <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl py-2 px-6 md:py-3 md:px-8 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                  <img src="/ChaiLifeline.png" alt="Chai Lifeline Logo" className="h-10 md:h-14 w-auto object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section id="tiers" className="py-16 md:py-24 bg-white px-4 text-center overflow-hidden border-t border-slate-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-3 md:mb-4 tracking-tight uppercase text-indigo-950 leading-none">Pick Your Impact</h2>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] italic">Join a dedicated circle to maximize the reach of your monthly Tzedakah.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left max-w-5xl mx-auto relative">
            {['silver', 'gold', 'diamond'].map((tier) => (
                <div key={tier} className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-200 relative overflow-hidden flex flex-col shadow-sm transition-all duration-300 md:hover:-translate-y-2 md:hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] md:hover:border-indigo-200 group">
                    {renderTierCardContent(tier)}
                </div>
            ))}
          </div>
          
          <div className="mt-12 md:mt-16 text-center px-4">
            <p className="text-slate-400 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] max-w-2xl mx-auto leading-relaxed text-center">
              * Actual odds of winning depend on the total number of eligible entries received. No purchase necessary. See <Link to="/rules" className="underline hover:text-slate-600 transition-colors">official rules</Link> for details.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-slate-50 border-t border-slate-100 px-4 text-center">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 uppercase text-indigo-950 italic text-center">Questions?</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-8 md:mb-12 text-[10px] md:text-xs text-center">Everything you need to know</p>
          <div className="space-y-3 md:space-y-4 text-left">
            {primaryFaqs.map((faq, i) => (
              <div key={i} className="border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden bg-white">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                  style={{ WebkitTapHighlightColor: 'transparent' }} 
                  className="w-full p-5 md:p-8 text-left flex justify-between items-center outline-none bg-white" 
                  aria-expanded={openFaq === i}
                >
                  <span className="font-black text-indigo-950 text-sm md:text-lg uppercase pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={20} className="md:w-6 md:h-6 shrink-0" /> : <ChevronDown size={20} className="md:w-6 md:h-6 shrink-0" />}
                </button>
                {openFaq === i && <div className="p-5 md:p-8 pt-0 text-slate-600 font-medium leading-relaxed text-sm md:text-base bg-white">{faq.a}</div>}
              </div>
            ))}
            {showAllFaqs && secondaryFaqs.map((faq, i) => (
              <div key={`sec-${i}`} className="border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden bg-white animate-in fade-in slide-in-from-top-4">
                <button 
                  onClick={() => setOpenFaq(openFaq === `sec-${i}` ? null : `sec-${i}`)} 
                  style={{ WebkitTapHighlightColor: 'transparent' }} 
                  className="w-full p-5 md:p-8 text-left flex justify-between items-center transition-colors outline-none bg-white" 
                  aria-expanded={openFaq === `sec-${i}`}
                >
                  <span className="font-black text-indigo-950 pr-4 text-sm md:text-lg uppercase tracking-tight">{faq.q}</span>
                  {openFaq === `sec-${i}` ? <ChevronUp size={20} className="md:w-6 md:h-6 shrink-0 text-indigo-900" /> : <ChevronDown size={20} className="md:w-6 md:h-6 shrink-0 text-slate-300" />}
                </button>
                {openFaq === `sec-${i}` && <div className="p-5 md:p-8 pt-0 text-slate-600 leading-relaxed text-sm md:text-base font-medium bg-white">{faq.a}</div>}
              </div>
            ))}
          </div>
          <button onClick={() => setShowAllFaqs(!showAllFaqs)} className="mt-8 md:mt-12 px-6 md:px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs hover:bg-slate-100 transition-all text-center">{showAllFaqs ? "See Fewer Questions" : "See All Questions"}</button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;