import React, { useState } from 'react';
import { 
  Shield, Heart, Trophy, CheckCircle, Info, Star, Building, 
  ChevronDown, ChevronUp, Play, Presentation, ExternalLink, 
  CreditCard, FileText, Award, Users, Gift, Sparkles, Check, 
  MapPin, BarChart3, ArrowRight, X, Search, Menu
} from 'lucide-react';

const INTEGRATION_CONFIG = {
  stripeCheckoutUrl: "https://buy.stripe.com/test_6oE7sC9vW5...",
  jotformId: "241234567890123",
  useJotform: true,
};

const communityData = {
  "General Circle": { members: 154, monthly: "$112,000", silver: 60, gold: 54, diamond: 40 },
  "Teaneck": { members: 42, monthly: "$28,500", silver: 15, gold: 12, diamond: 15 },
  "5 Towns": { members: 89, monthly: "$54,250", silver: 30, gold: 29, diamond: 30 },
  "Los Angeles": { members: 31, monthly: "$22,000", silver: 10, gold: 11, diamond: 10 },
  "Miami": { members: 12, monthly: "$9,500", silver: 4, gold: 4, diamond: 4 },
  "Lakewood": { members: 55, monthly: "$38,000", silver: 20, gold: 15, diamond: 20 },
  "Jerusalem": { members: 28, monthly: "$19,750", silver: 8, gold: 10, diamond: 10 }
};

const App = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('diamond');
  const [openFaq, setOpenFaq] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState("General Circle");

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const toggleCommunity = (name) => {
    setActiveCommunity(prev => prev === name ? null : name);
  };

  const handleRedirectToPayment = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (!INTEGRATION_CONFIG.useJotform) {
        window.open(INTEGRATION_CONFIG.stripeCheckoutUrl, '_blank');
      }
      setSignupSuccess(true);
      setIsLoading(false);
    }, 1500);
  };

  const primaryFaqs = [
    {
      q: "What is Amplify?",
      a: "Amplify is a community-powered giving platform that pools monthly Tzedakah to create greater collective impact. Members give consistently, support new charitable organizations each month, and receive access to optional appreciation perks as a thank-you for their giving."
    },
    {
      q: "Is my contribution tax-deductible?",
      a: "Donations benefiting a 501(c)(3) organization are tax-deductible in the US to the extent permitted by law. The Federal Tax Identification Number is provided post-transaction where applicable."
    },
    {
      q: "Who selects the charities?",
      a: "Charities are vetted in advance based on impact and financial transparency. We focus on organizations where a single large grant can reach a critical milestone."
    }
  ];

  const secondaryFaqs = [
    {
      q: "When am I charged?",
      a: "Members are only charged once a giving circle is filled. We will notify you via email before your first scheduled contribution is processed."
    },
    {
      q: "Can I cancel at any time?",
      a: "Yes. Memberships can be paused or canceled at any time before a scheduled monthly charge."
    },
    {
        q: "Are the drawings required?",
        a: "No. Participation in any drawings or appreciation rewards is provided solely as a thank-you for consistent giving."
    }
  ];

  const tierData = {
    silver: { 
      price: 250, prize: "$20,000", totalOdds: "1 / 100", 
      otherPrizes: ["1 × $1,250", "2 × $750"], 
      perks: ["Impact Reports", "Member Events"]
    },
    gold: { 
      price: 500, prize: "$50,000", totalOdds: "1 / 50", 
      otherPrizes: ["1 × $2,500", "6 × $1,000"], 
      perks: ["Impact Reports", "Member Events", "Impact Book"]
    },
    diamond: { 
      price: 1000, prize: "$100,000", totalOdds: "1 / 25", 
      otherPrizes: ["1 × $5,000", "2 × $3,000", "12 × $2,000"], 
      perks: ["Impact Reports", "VIP Event Access", "Seasonal Gifts", "Founder Plaque"]
    }
  };

  const LogoIcon = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none">
      <rect x="28" y="55" width="8" height="15" rx="2" fill="white" />
      <rect x="40" y="40" width="8" height="30" rx="2" fill="white" />
      <rect x="52" y="25" width="8" height="45" rx="2" fill="#fbbf24" />
      <rect x="64" y="40" width="8" height="30" rx="2" fill="white" />
      <path d="M25 75H75" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 scroll-smooth">
      {/* Placeholder CSS for missing local images */}
      <style>{`
        img { background-color: #f1f5f9; min-height: 20px; }
      `}</style>
      
      <div id="top" className="absolute top-0"></div>

      {/* Top Banner */}
      <div className="bg-indigo-900 text-white text-center py-2 text-[10px] font-black uppercase tracking-[0.3em] fixed w-full z-[100] top-0 px-4">
        The Founders Circle is Now Open • Reserve Your Spot
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-[90] bg-white/95 backdrop-blur-md border-b border-slate-100 top-[32px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => scrollToSection('top')} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left">
            <div className="bg-indigo-900 text-white p-1.5 rounded-xl">
              <LogoIcon />
            </div>
            <span className="text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">
            <button onClick={() => scrollToSection('how')} className="hover:text-indigo-900 transition-colors">How it works</button>
            <button onClick={() => scrollToSection('beneficiary')} className="hover:text-indigo-900 transition-colors">Beneficiary</button>
            <button onClick={() => scrollToSection('communities')} className="hover:text-indigo-900 transition-colors">Communities</button>
            <button onClick={() => scrollToSection('tiers')} className="hover:text-indigo-900 transition-colors">The Circles</button>
          </div>

          <button className="md:hidden p-2 text-indigo-900" onClick={() => setIsMenuOpen(true)}>
            <Menu size={28} />
          </button>

          <button 
            onClick={() => scrollToSection('tiers')}
            className="hidden md:block bg-indigo-900 text-white px-6 py-2.5 rounded-full text-xs font-black hover:bg-black transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest"
          >
            Reserve My Spot
          </button>
        </div>
      </nav>

      {/* Mobile Menu Sidebar */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] md:hidden bg-white animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 flex justify-between items-center border-b border-slate-100 shrink-0 text-left">
                <span className="text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-indigo-950 p-2"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 text-xl font-black text-slate-900 uppercase tracking-tighter text-left">
                <button onClick={() => scrollToSection('how')} className="text-left border-b border-slate-50 pb-4">How it works</button>
                <button onClick={() => scrollToSection('beneficiary')} className="text-left border-b border-slate-50 pb-4">Beneficiary</button>
                <button onClick={() => scrollToSection('communities')} className="text-left border-b border-slate-50 pb-4">Communities</button>
                <button onClick={() => scrollToSection('tiers')} className="text-left border-b border-slate-50 pb-4">The Circles</button>
                <button onClick={() => scrollToSection('faq')} className="text-left border-b border-slate-50 pb-4">FAQ</button>
            </div>
            <div className="p-8 border-t border-slate-50 shrink-0 text-left">
                <button 
                    onClick={() => { setIsMenuOpen(false); scrollToSection('tiers'); }}
                    className="w-full py-6 bg-indigo-900 text-white rounded-full font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 text-sm"
                >
                    Join the Circle
                </button>
            </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="pt-44 md:pt-56 pb-20 px-4 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="text-left lg:col-span-7">
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-4 md:mb-8 leading-[0.9] md:leading-[0.85] uppercase">
                Give Together. <br />
                <div className="relative inline-block mt-1 md:mt-0">
                    <span className="text-indigo-900 italic">Amplify</span>
                    <div className="absolute left-[-1%] bottom-[-2px] md:-bottom-2 w-[102%] h-1.5 md:h-2.5 bg-indigo-200 rounded-full"></div>
                </div> 
                <span className="italic text-indigo-900 inline-block md:inline md:ml-4 mt-1 md:mt-0">Your Impact.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-6 font-medium max-w-2xl leading-snug">
                Pool your monthly donation with a global community to make a massive impact. <strong>Win Up To $100,000</strong> <em>every month</em> as a reward for your commitment.
              </p>
              
              <div className="space-y-4 mb-10 text-left">
                {[
                  "Pooled Tzedakah for transformational monthly grants.",
                  "Fixed 1-in-400 odds per raffle. Never diluted.",
                  "Combined winning odds as high as 1/25."
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-1 rounded-full text-indigo-600"><Check size={16} strokeWidth={3}/></div>
                    <span className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-tight">{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 text-left">
                <button 
                  onClick={() => scrollToSection('tiers')}
                  className="w-full md:w-auto px-12 py-5 bg-indigo-900 text-white rounded-2xl font-black text-xl hover:shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1 uppercase tracking-tighter"
                >
                  Join the Circle
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="aspect-square w-full rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-[8px] md:border-[12px] border-white bg-slate-900 relative">
                <video 
                  className="w-full h-full object-cover"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  poster="/impact-photo.jpg" 
                >
                  {/* Added cache buster ?v=1 to force reload and simplified path */}
                  <source src="amplify-video.mp4?v=1" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="absolute -bottom-6 -right-4 md:-bottom-8 md:-right-8 bg-amber-400 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl hidden sm:block border-4 md:border-8 border-white text-center">
                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-indigo-950 mb-1 text-center">Collective Goal</p>
                <p className="text-3xl md:text-4xl font-black text-indigo-950 tracking-tighter text-center">$4.5M+ <span className="text-base md:text-lg uppercase">/ Year</span></p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How it Works Section */}
      <section id="how" className="py-24 bg-indigo-950 text-white px-4 text-center">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight uppercase italic text-white text-center">How it Works</h2>
            <p className="text-indigo-200 text-lg font-medium max-w-2xl mx-auto text-center">Strategic Tzedakah, simplified and amplified.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="bg-indigo-900/40 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 hover:bg-indigo-900 transition-all duration-500 group flex flex-col items-center">
              <div className="bg-white/10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 transition-transform text-center">
                <Users className="text-amber-400" size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-tighter text-center">We Join Forces</h3>
              <p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium text-center">Donors join specialized circles, pooling recurring contributions to create a transformational monthly gift.</p>
            </div>
            <div className="bg-indigo-900/40 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 hover:bg-indigo-900 transition-all duration-500 group flex flex-col items-center">
              <div className="bg-white/10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 transition-transform text-center">
                <Sparkles className="text-amber-400" size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-tighter text-center text-white w-full">Huge Impact</h3>
              <p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium text-center">Combined donations are issued as a single massive grant, ensuring the majority of every dollar creates immediate change.</p>
            </div>
            <div className="bg-indigo-900/40 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 hover:bg-indigo-900 transition-all duration-500 group flex flex-col items-center">
              <div className="bg-white/10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 transition-transform text-center">
                <Trophy className="text-amber-400" size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-tighter text-center text-white w-full">A Monthly Reward</h3>
              <p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium text-center">As a thank you for your commitment, you receive exclusive perks and entry into a raffle capped at 400 members.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficiary Section */}
      <section id="beneficiary" className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-stretch">
            <div className="bg-slate-50 rounded-[3rem] p-10 md:p-16 border border-slate-100 flex flex-col justify-center text-center md:text-left">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 text-center md:text-left">This Month's Mission</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 md:mb-8 tracking-tighter uppercase italic text-center md:text-left">Chai Lifeline</h2>
              <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-10 text-center md:text-left">
                Our collective grant supports critical programs for children battling pediatric illness. Every dollar goes toward restoring hope and normalcy to families in their darkest hours.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center md:justify-start">
                <div className="flex items-center gap-3 text-slate-400">
                    <Building size={28} />
                    <p className="text-xs font-black uppercase tracking-widest leading-none text-left">Vetted 501(c)(3) Partner</p>
                </div>
                <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                <div className="flex items-center gap-3 text-red-500 text-left">
                    <Heart size={28} className="fill-current text-left" />
                    <p className="text-xs font-black uppercase tracking-widest leading-none text-slate-700 text-left">Impact Goal: $400,000</p>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl bg-slate-900 min-h-[400px]">
               <img 
                 src="/impact-photo.jpg" 
                 alt="Impact" 
                 className="absolute inset-0 w-full h-full object-cover opacity-80"
                 onError={(e) => { e.target.style.display='none'; }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent"></div>
               
               {/* Updated Logo Overlay - Reduced height (py-1) but kept width (w-[70%]) and logo size */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[70%] bg-white/95 backdrop-blur-xl py-1 rounded-xl flex items-center justify-center shadow-3xl border border-white/20">
                  <img src="/ChaiLifeline.png" alt="Logo" className="max-h-20 md:max-h-28 w-auto object-contain" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amplify Communities */}
      <section id="communities" className="py-24 bg-slate-50 border-t border-slate-100 px-4 text-center">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-none italic text-center">Amplify Communities</h2>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto text-center">Check out a local community to see their collective impact and current status.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mb-8 text-center">
            {Object.keys(communityData).map((name, i) => (
              <button 
                key={i} 
                onClick={() => toggleCommunity(name)}
                className={`p-4 md:p-8 rounded-2xl md:rounded-[2rem] border transition-all flex flex-col items-center group ${activeCommunity === name ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg'} text-center`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 ${activeCommunity === name ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'} text-center`}>
                  <MapPin size={20} />
                </div>
                <h4 className="font-black text-indigo-950 uppercase tracking-tight text-xs md:text-sm mb-1 leading-tight text-center">{name}</h4>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{communityData[name].members} Givers</p>
              </button>
            ))}
          </div>
          
          {activeCommunity && (
             <>
                {/* DESKTOP VIEW: Inline Box */}
                <div className="hidden md:block bg-indigo-950 p-6 rounded-[2.5rem] text-white animate-in fade-in slide-in-from-top-4 relative overflow-hidden shadow-2xl text-left">
                    <button onClick={() => setActiveCommunity(null)} className="absolute top-4 right-6 text-white/40 hover:text-white transition-colors z-20 text-left"><X size={20} /></button>
                    <div className="relative z-10 grid grid-cols-12 gap-8 items-center text-left">
                        <div className="col-span-7 text-left">
                            <div className="flex items-center gap-3 mb-2 text-left">
                                <div className="bg-amber-400 p-1.5 rounded-lg text-indigo-950 text-left"><BarChart3 size={20}/></div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-left">{activeCommunity} Dashboard</h3>
                            </div>
                            <p className="text-indigo-200 text-sm font-medium leading-relaxed max-w-md text-left">Currently generating {communityData[activeCommunity].monthly} in monthly throughput for our partner charities.</p>
                        </div>
                        <div className="col-span-5 grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-1 text-center">Silver</p>
                                <p className="text-lg font-black tracking-tighter text-center">{communityData[activeCommunity].silver}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-amber-400 mb-1 text-center">Gold</p>
                                <p className="text-lg font-black tracking-tighter text-center">{communityData[activeCommunity].gold}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-indigo-300 mb-1 text-center">Diamond</p>
                                <p className="text-lg font-black tracking-tighter text-center">{communityData[activeCommunity].diamond}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10 flex justify-center text-center">
                        <button onClick={() => { setSelectedCommunity(activeCommunity); scrollToSection('tiers'); }} className="px-10 py-3 bg-white text-indigo-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all flex items-center gap-3 shadow-lg text-center">Join Community <ArrowRight size={14}/></button>
                    </div>
                </div>

                {/* MOBILE VIEW: Pop-up Modal */}
                <div className="md:hidden fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-hidden text-center">
                    <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md text-center" onClick={() => setActiveCommunity(null)}></div>
                    <div className="relative bg-indigo-950 p-6 rounded-[2.5rem] text-white animate-in fade-in zoom-in-95 slide-in-from-bottom-6 w-full max-w-sm shadow-2xl border border-white/10 text-center">
                        <button onClick={() => setActiveCommunity(null)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-20 text-center"><X size={24} /></button>
                        <div className="text-center mb-6 text-center">
                            <div className="bg-amber-400 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-950 mx-auto mb-4 text-center"><BarChart3 size={28}/></div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-center">{activeCommunity} Dashboard</h3>
                            <p className="text-indigo-200 text-sm mt-2 leading-snug text-center">Monthly impact: <span className="text-white font-black">{communityData[activeCommunity].monthly}</span></p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-1 text-center">Silver</p>
                                <p className="text-lg font-black text-center">{communityData[activeCommunity].silver}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[8px] font-black uppercase text-amber-400 mb-1 text-center">Gold</p>
                                <p className="text-lg font-black text-center">{communityData[activeCommunity].gold}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[8px] font-black uppercase text-indigo-300 mb-1 text-center">Diamond</p>
                                <p className="text-lg font-black text-center">{communityData[activeCommunity].diamond}</p>
                            </div>
                        </div>
                        <button onClick={() => { setSelectedCommunity(activeCommunity); scrollToSection('tiers'); setActiveCommunity(null); }} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 text-center">Join Community <ArrowRight size={14}/></button>
                    </div>
                </div>
             </>
          )}
        </div>
      </section>

      {/* Founders Circle */}
      <section id="founders" className="py-12 bg-white border-y border-slate-100 px-4 text-center text-slate-600">
        <div className="max-w-5xl mx-auto text-center">
          <Award size={36} className="mx-auto text-amber-500 mb-4 text-center" />
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight uppercase text-indigo-950 italic text-center">The Founders Circle</h2>
          <div className="space-y-4 text-base md:text-lg font-medium leading-relaxed max-w-3xl mx-auto text-center">
            <p className="text-center">
              Becoming a founding member of Amplify is a statement of leadership. Founders are the cornerstone of a smarter way for us to give back, securing the mission with consistent support.
            </p>
            <p className="text-slate-400 text-sm md:text-base italic text-center">
              Permanent recognition on our donor wall, exclusive strategy briefings, and a custom Founder's Seal.
            </p>
          </div>
          <p className="mt-8 text-red-600 font-black uppercase tracking-[0.2em] text-[10px] text-center">
            Only a limited number of founding spots remaining.
          </p>
        </div>
      </section>

      {/* Circle Comparison Chart */}
      <section id="tiers" className="py-24 bg-slate-50 px-4 text-center">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight uppercase text-indigo-950 leading-none text-center">Pick Your Impact</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em] italic text-center">Join a dedicated circle to maximize the reach of your monthly Tzedakah.</p>
          </div>

          {/* MOBILE VIEW: Card-based selection with full details */}
          <div className="md:hidden space-y-6 text-left">
            {['silver', 'gold', 'diamond'].map((tier) => (
                <div key={tier} className={`bg-white rounded-3xl p-8 border ${tier === 'diamond' ? 'border-indigo-600 shadow-xl' : 'border-slate-200'} text-left`}>
                    <div className="flex justify-between items-start mb-6 text-left">
                        <div className="text-left">
                            <h3 className={`text-xl font-black uppercase tracking-tighter ${tier === 'diamond' ? 'text-indigo-900' : 'text-slate-900'} text-left`}>{tier} Tier</h3>
                            <p className="text-3xl font-black text-slate-900 mt-2 text-left">${tierData[tier].price}<span className="text-sm font-bold text-slate-400 tracking-normal uppercase text-left">/mo</span></p>
                        </div>
                        {tier === 'diamond' && <div className="bg-amber-400 p-2 rounded-lg text-indigo-950 shadow-md text-center"><Star size={20} fill="currentColor"/></div>}
                    </div>
                    <div className="space-y-4 mb-8 border-t border-slate-50 pt-6 text-center">
                        <div className="flex justify-between text-sm text-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Grand Prize</span><span className="font-black text-indigo-900 text-center">{tierData[tier].prize}</span></div>
                        <div className="flex justify-between text-sm text-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Grand Prize Odds</span><span className="font-black text-slate-900 text-center">1 / 400</span></div>
                        <div className="border-t border-slate-50 pt-4 text-center">
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-3 text-center">Other Monthly Prizes</p>
                            <div className="space-y-1 text-center">{tierData[tier].otherPrizes.map((p, idx) => <p key={idx} className="text-sm font-bold text-slate-800 text-center">{p}</p>)}</div>
                        </div>
                        <div className="flex justify-between text-sm border-t border-slate-50 pt-4 text-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Combined Odds</span><span className="font-black text-indigo-950 text-center">{tierData[tier].totalOdds}</span></div>
                        <div className="border-t border-slate-50 pt-4 text-center">
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-3 text-center">Exclusive Perks</p>
                            <div className="space-y-1 text-center">{tierData[tier].perks.map((p, idx) => <p key={idx} className={`text-xs uppercase tracking-tight text-center ${tier === 'diamond' ? 'font-black text-indigo-900' : 'font-bold text-slate-600'}`}>• {p}</p>)}</div>
                        </div>
                    </div>
                    <button onClick={() => { setSelectedTier(tier); setIsFormOpen(true); }} className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 text-center">Select {tier} impact</button>
                </div>
            ))}
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:block overflow-x-auto text-center">
            <table className="w-full text-left border-separate border-spacing-0 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 bg-white text-center">
              <thead>
                <tr className="bg-slate-900 text-white text-center">
                  <th className="p-10 text-xs font-black uppercase tracking-widest border-r border-slate-800 text-slate-400 text-left">The Benefit</th>
                  <th className="p-10 border-r border-slate-800 text-xs font-black uppercase text-slate-400 text-center">Silver</th>
                  <th className="p-10 border-r border-slate-800 text-xs font-black uppercase text-amber-400 text-center">Gold</th>
                  <th className="p-10 text-xs font-black uppercase text-indigo-300 text-center">Diamond</th>
                </tr>
              </thead>
              <tbody className="bg-white text-center">
                <tr className="bg-slate-50 text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest">Monthly Gift</td>
                  <td className="p-6 font-black text-2xl md:text-3xl border-r border-slate-200 text-center">$250</td>
                  <td className="p-6 font-black text-2xl md:text-3xl border-r border-slate-200 text-center">$500</td>
                  <td className="p-6 font-black text-2xl md:text-3xl text-center">$1,000</td>
                </tr>
                <tr className="text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest">Grand Prize</td>
                  <td className="p-6 font-bold text-xl md:text-2xl border-r border-slate-200 text-indigo-900 text-center">{tierData.silver.prize}</td>
                  <td className="p-6 font-bold text-xl md:text-2xl border-r border-slate-200 text-indigo-900 text-center">{tierData.gold.prize}</td>
                  <td className="p-6 font-black text-2xl md:text-3xl text-indigo-950 text-center">{tierData.diamond.prize}</td>
                </tr>
                <tr className="bg-slate-50 text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest leading-none">Grand Prize Odds</td>
                  <td className="p-6 border-r border-slate-200 font-bold text-sm md:text-base text-center">1 / 400</td>
                  <td className="p-6 border-r border-slate-200 font-bold text-sm md:text-base text-center">1 / 400</td>
                  <td className="p-6 font-bold text-sm md:text-base text-center">1 / 400</td>
                </tr>
                <tr className="text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest text-center">Other Prizes</td>
                  <td className="p-6 md:p-10 border-r border-slate-200 space-y-1 text-center">{tierData.silver.otherPrizes.map((p, i) => <p key={i} className="text-base font-bold text-slate-800 tracking-tight text-center">{p}</p>)}</td>
                  <td className="p-6 md:p-10 border-r border-slate-200 space-y-1 text-center">{tierData.gold.otherPrizes.map((p, i) => <p key={i} className="text-base font-bold text-slate-800 tracking-tight text-center">{p}</p>)}</td>
                  <td className="p-6 md:p-10 space-y-1 text-center">{tierData.diamond.otherPrizes.map((p, i) => <p key={i} className="text-base font-black text-indigo-950 tracking-tighter text-center">{p}</p>)}</td>
                </tr>
                <tr className="bg-slate-50 text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest text-center">Combined Odds</td>
                  <td className="p-6 font-black border-r border-slate-200 text-black text-sm md:text-lg text-center">{tierData.silver.totalOdds}</td>
                  <td className="p-6 font-black border-r border-slate-200 text-black text-sm md:text-lg text-center">{tierData.gold.totalOdds}</td>
                  <td className="p-6 font-black text-black text-lg md:text-2xl text-center">{tierData.diamond.totalOdds}</td>
                </tr>
                <tr className="text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest leading-none">Exclusive Perks</td>
                  <td className="p-6 md:p-10 border-r border-slate-200 space-y-3 text-xs font-black text-slate-500 uppercase tracking-tighter leading-relaxed text-center">{tierData.silver.perks.map((p, i) => <p key={i} className="text-center">{p}</p>)}</td>
                  <td className="p-6 md:p-10 border-r border-slate-200 space-y-3 text-xs font-black text-slate-500 uppercase tracking-tighter leading-relaxed text-center">{tierData.gold.perks.map((p, i) => <p key={i} className="text-center">{p}</p>)}</td>
                  <td className="p-6 md:p-10 space-y-3 text-xs font-black text-indigo-900 uppercase tracking-tighter leading-relaxed text-center">{tierData.diamond.perks.map((p, i) => <p key={i} className="text-center">{p}</p>)}</td>
                </tr>
                <tr className="bg-slate-100 text-center">
                  <td className="p-6 border-r border-slate-200 text-center"></td>
                  <td className="p-6 border-r border-slate-200 text-center"><button onClick={() => { setSelectedTier('silver'); setIsFormOpen(true); }} className="px-8 py-3 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all text-center">Select</button></td>
                  <td className="p-6 border-r border-slate-200 text-center"><button onClick={() => { setSelectedTier('gold'); setIsFormOpen(true); }} className="px-8 py-3 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all">Select</button></td>
                  <td className="p-6 text-center"><button onClick={() => { setSelectedTier('diamond'); setIsFormOpen(true); }} className="px-8 py-3 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all text-center">Select</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-16 text-center px-4">
            <p className="text-slate-400 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] max-w-2xl mx-auto leading-relaxed text-center">
              * Participation involves securing your recurring place in an exclusive circle. Pending regulatory approval. Monthly contributions begin only once your circle reaches its capacity.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white border-t border-slate-100 px-4 text-center">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase text-indigo-950 italic text-center">Questions?</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] mb-12 text-xs text-center">Everything you need to know</p>
          <div className="space-y-4 text-left">
            {primaryFaqs.map((faq, i) => (
              <div key={i} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors text-left">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-6 md:p-8 text-left flex justify-between items-center text-left">
                  <span className="font-black text-indigo-950 text-base md:text-lg uppercase pr-4 text-left">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
                {openFaq === i && <div className="p-6 md:p-8 pt-0 text-slate-600 font-medium leading-relaxed text-left">{faq.a}</div>}
              </div>
            ))}
            {showAllFaqs && secondaryFaqs.map((faq, i) => (
              <div key={`sec-${i}`} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-top-4 text-left">
                <button onClick={() => setOpenFaq(openFaq === `sec-${i}` ? null : `sec-${i}`)} className="w-full p-6 md:p-8 text-left flex justify-between items-center transition-colors text-left">
                  <span className="font-black text-indigo-950 pr-4 text-base md:text-lg uppercase tracking-tight text-left">{faq.q}</span>
                  {openFaq === `sec-${i}` ? <ChevronUp size={24} className="text-indigo-900" /> : <ChevronDown size={24} className="text-slate-300" />}
                </button>
                {openFaq === `sec-${i}` && <div className="p-6 md:p-8 pt-0 text-slate-600 leading-relaxed text-base md:text-lg font-medium text-left">{faq.a}</div>}
              </div>
            ))}
          </div>
          <button onClick={() => setShowAllFaqs(!showAllFaqs)} className="mt-12 px-8 py-3 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all text-center">{showAllFaqs ? "See Fewer Questions" : "See All Questions"}</button>
        </div>
      </section>

      {/* Trust Disclosure */}
      <section className="py-20 bg-indigo-950 text-white px-4 text-center">
        <div className="max-w-5xl mx-auto text-center">
          <Shield size={48} className="mx-auto mb-8 text-indigo-400 text-center" />
          <h2 className="text-3xl font-bold mb-6 uppercase text-indigo-100 text-center">Commitment to Integrity</h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto leading-relaxed text-center">
            Amplify is built on a foundation of transparency. We are currently pending regulatory approval and will complete all required registrations and bonding prior to circle activation.
          </p>
          <div className="inline-flex flex-wrap justify-center gap-4 md:gap-8 items-center px-6 md:px-10 py-6 border border-indigo-800 rounded-3xl bg-indigo-900/50 text-center">
            <div className="text-center md:text-left text-center"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1 text-center">Status</p><p className="font-bold text-sm text-center">Pending Approval</p></div>
            <div className="hidden md:block w-px h-10 bg-indigo-800 text-center"></div>
            <div className="text-center md:text-left text-center"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1 text-center text-center">Impact Vetting</p><p className="font-bold text-sm text-center text-center">Proven 501(c)(3) Partners</p></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-16 px-4 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 mb-12 text-center md:text-left">
            <div className="flex items-center gap-2 text-center md:text-left"><LogoIcon /><span className="text-2xl font-black text-white tracking-tighter uppercase text-center md:text-left">Amplify</span></div>
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-right"><button>Privacy</button><button>Terms</button><button>Contact</button></div>
        </div>
        <p className="text-[10px] leading-relaxed max-w-4xl opacity-40 uppercase tracking-widest font-bold mx-auto text-center">DISCLOSURE: Amplify is currently in pre-launch. Monthly contributions begin only once your circle reaches capacity. Official rules provided upon activation.</p>
      </footer>

      {/* SIGNUP MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4 overflow-y-auto pt-10 pb-10 text-center">
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xl text-center" onClick={() => !signupSuccess && setIsFormOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all border border-white/20 my-auto text-left">
            <div className="p-8 md:p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 text-left">
              <div className="text-left"><h3 className="text-3xl md:text-4xl font-black italic uppercase text-indigo-950 tracking-tighter leading-none text-left">Secure Your Spot</h3><p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.3em] mt-2 text-left">Welcome to the {selectedTier} Circle</p></div>
              {!signupSuccess && <button onClick={() => setIsFormOpen(false)} className="text-slate-300 hover:text-slate-600 font-bold text-4xl leading-none text-right">&times;</button>}
            </div>
            {signupSuccess ? (
              <div className="p-12 md:p-24 text-center animate-in zoom-in-95 duration-500 text-center"><div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 text-center"><CheckCircle size={64} className="text-green-600 text-center" /></div><h4 className="text-4xl md:text-5xl font-black text-indigo-950 mb-6 italic uppercase tracking-tighter text-center">You're in.</h4><p className="text-slate-500 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed text-center text-center">We've reserved your spot{selectedCommunity !== 'General Circle' ? ` in the ${selectedCommunity} community` : ''}. We will notify you once the circle reaches capacity.</p><div className="mt-12 pt-12 border-t border-slate-100 text-center"><button onClick={() => setIsFormOpen(false)} className="px-12 py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all text-center">Back to Site</button></div></div>
            ) : (
              <div className="flex flex-col md:flex-row h-full text-left">
                <div className="md:w-3/5 p-8 md:p-12 border-r border-slate-100 text-center md:text-left text-left">
                  <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center md:text-left text-left"><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 text-left">Select Your Community</label><select value={selectedCommunity} onChange={(e) => setSelectedCommunity(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none text-left">{Object.keys(communityData).map(name => <option key={name} value={name}>{name}</option>)}</select></div>
                  {INTEGRATION_CONFIG.useJotform ? (
                    <div className="h-[300px] md:h-[350px] w-full rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 bg-white shadow-inner overflow-hidden relative text-center"><iframe id={`jotform-iframe-${INTEGRATION_CONFIG.jotformId}`} title="Enrollment" src={`https://form.jotform.com/${INTEGRATION_CONFIG.jotformId}`} className="w-full h-full border-none text-center"></iframe><div className="absolute bottom-4 left-0 right-0 px-10 text-center text-center"><button onClick={handleRedirectToPayment} className="w-full py-5 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 text-center">{isLoading ? <span className="animate-pulse italic text-center">Securing...</span> : <><Shield size={20} /> Join the Circle</>}</button></div></div>
                  ) : (
                    <div className="space-y-6 text-center py-10 text-center"><div className="p-10 bg-indigo-50 rounded-3xl border-2 border-indigo-100 flex flex-col items-center text-center text-center"><CreditCard size={64} className="text-indigo-900 mb-8 text-center" /><h4 className="text-3xl font-black text-indigo-950 mb-4 uppercase tracking-tighter text-center">Reserve Spot</h4><p className="text-sm text-indigo-700/60 mb-8 text-center text-center text-center">Secure your place in the {selectedCommunity} Circle. You will be notified before your first charge.</p><button onClick={handleRedirectToPayment} className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 transform hover:-translate-y-1 text-center">{isLoading ? <span className="animate-pulse italic text-center text-center">Connecting...</span> : <><Shield size={20} /> Join the Circle</>}</button></div></div>
                  )}
                </div>
                <div className="md:w-2/5 p-8 md:p-12 bg-slate-50 flex flex-col justify-center text-center md:text-left text-left">
                  <div className="space-y-6 text-left">
                    <div className="text-left"><h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center md:text-left text-left">Membership Summary</h5><div className="space-y-4 text-left"><div className="flex justify-between text-sm font-black uppercase tracking-tighter text-left text-left"><span className="text-slate-500 text-left">Circle</span><span className="text-indigo-950 text-right">{selectedTier}</span></div>
                        {selectedCommunity !== 'General Circle' && <div className="flex justify-between text-sm font-black uppercase tracking-tighter text-left"><span className="text-slate-500 text-left">Community</span><span className="text-indigo-600 text-right">{selectedCommunity}</span></div>}
                        <div className="flex justify-between text-sm font-black uppercase tracking-tighter text-left"><span className="text-slate-500 text-left">Commitment</span><span className="text-indigo-900 text-right">${tierData[selectedTier].price}/mo</span></div>
                        <div className="pt-4 border-t border-slate-200 text-left"><div className="flex justify-between text-xs font-bold mb-1 text-left text-left"><span className="text-slate-400 uppercase tracking-tighter text-left">Grand Prize</span><span className="text-indigo-950 text-right">{tierData[selectedTier].prize}</span></div><div className="flex justify-between text-[10px] font-bold text-slate-500 text-left"><span className="text-left">Raffle Odds</span><span className="text-right">1 / 400</span></div><div className="flex justify-between text-[10px] font-black text-slate-900 mt-1 uppercase text-left text-left text-left"><span className="text-left tracking-widest text-left">Winning Odds</span><span className="text-right text-right">{tierData[selectedTier].totalOdds}</span></div></div></div></div>
                    <div className="pt-6 border-t border-slate-200 text-center text-center"><div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200 text-center text-center"><p className="text-[10px] text-indigo-950 font-black uppercase leading-tight tracking-tight text-center text-center mx-auto text-center text-center">First monthly contribution occurs only when circle reaches capacity.</p></div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;