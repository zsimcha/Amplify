import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Heart, Trophy, CheckCircle, Info, Star, Building, 
  ChevronDown, ChevronUp, Play, Presentation, ExternalLink, 
  CreditCard, FileText, Award, Users, Gift, Sparkles, Check, 
  MapPin, BarChart3, ArrowRight, X, Search, Menu, ArrowLeft,
  Mail, Phone, Globe, HelpCircle, Plus, Rocket, TrendingUp
} from 'lucide-react';

const INTEGRATION_CONFIG = {
  stripeCheckoutUrl: "#", 
  jotformId: "241234567890123",
  useJotform: true,
};

const FEATURED_COMMUNITIES = [
  "General Circle", "Teaneck", "5 Towns", "Los Angeles", 
  "Miami", "Lakewood", "Jerusalem"
];

const EXTENDED_COMMUNITIES = [
  ...FEATURED_COMMUNITIES,
  "Baltimore", "Silver Spring", "Chicago", "Boston", "Monsey", 
  "Passaic", "Brooklyn", "Queens", "Boca Raton", "Dallas", 
  "Atlanta", "Cleveland", "Detroit", "Philadelphia", "Toronto", 
  "Montreal", "London", "Houston", "Seattle", "Denver"
];

// Instantly initialize platform data
const initialTierData = {
  silver: { price: 250, prize: "$25,000", totalOdds: "1 / 100", otherPrizes: ["1 × $1,250", "2 × $750"] },
  gold: { price: 500, prize: "$50,000", totalOdds: "1 / 50", otherPrizes: ["1 × $2,500", "6 × $1,000"] },
  diamond: { price: 1000, prize: "$100,000", totalOdds: "1 / 25", otherPrizes: ["1 × $5,000", "2 × $3,000", "12 × $2,000"] }
};

const initialNames = ["General Circle", ...EXTENDED_COMMUNITIES.filter(c => c !== "General Circle").sort()];
const initialCommunityData = {};
initialNames.forEach(name => {
  initialCommunityData[name] = { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 };
});

const App = () => {
  // --- STATE MANAGEMENT ---
  const [appData, setAppData] = useState({
    tierData: initialTierData,
    allCommunityNames: initialNames,
    communities: initialCommunityData
  }); 
  const [currentView, setCurrentView] = useState('home'); 
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('silver');
  const [showTierModal, setShowTierModal] = useState(false);
  
  // Mobile Tab State
  const [mobilePricingTab, setMobilePricingTab] = useState('silver');
  const [modalPricingTab, setModalPricingTab] = useState('silver');
  
  const [openFaq, setOpenFaq] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState("General Circle");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1); 
  const dropdownRef = useRef(null);

  const selectionRef = useRef({ tier: 'silver', community: 'General Circle' });

  // --- HASH ROUTING ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setCurrentView(hash);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); 
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view) => {
    window.location.hash = view;
  };

  useEffect(() => {
    selectionRef.current = { tier: selectedTier, community: selectedCommunity };
  }, [selectedTier, selectedCommunity]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignupComplete = () => {
    const { tier, community } = selectionRef.current;
    const tierPrice = appData.tierData[tier].price;

    setAppData(prev => ({
      ...prev,
      communities: {
        ...prev.communities,
        [community]: {
          ...prev.communities[community],
          members: prev.communities[community].members + 1,
          monthly: prev.communities[community].monthly + tierPrice,
          [tier]: prev.communities[community][tier] + 1
        }
      }
    }));
    setSignupSuccess(true);
    setIsLoading(false);
  };

  useEffect(() => {
    const handleJotFormMessage = (e) => {
      if (e.origin !== "https://form.jotform.com") return;
      if (typeof e.data === 'object' && (e.data.action === 'submission-completed' || e.data.submission_id)) {
        handleSignupComplete();
      }
    };
    window.addEventListener('message', handleJotFormMessage);
    return () => window.removeEventListener('message', handleJotFormMessage);
  }, [appData]); 

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    if (currentView !== 'home') {
      navigateTo('home');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const offset = 70; 
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const toggleCommunity = (name) => {
    setActiveCommunity(prev => prev === name ? null : name);
  };

  const handleJoinClick = (tier) => {
    setSelectedTier(tier);
    setSignupSuccess(false);
    if (activeCommunity) setSelectedCommunity(activeCommunity);
    navigateTo('checkout');
  };

  const handleRedirectToPayment = () => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (!INTEGRATION_CONFIG.useJotform && INTEGRATION_CONFIG.stripeCheckoutUrl !== "#") {
          window.open(INTEGRATION_CONFIG.stripeCheckoutUrl, '_blank');
      }
      handleSignupComplete();
    }, 1500);
    return () => clearTimeout(timer);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const getTierColor = (tier) => {
    if (tier === 'silver') return 'text-slate-500';
    if (tier === 'gold') return 'text-[#eab308]'; 
    if (tier === 'diamond') return 'text-[#818cf8]'; 
    return 'text-slate-900';
  };

  // --- REUSABLE COMPONENTS ---
  const LogoIcon = () => (
    <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-12 md:h-12" fill="none" aria-label="Amplify Logo">
      <rect x="28" y="55" width="8" height="15" rx="2" fill="white" />
      <rect x="40" y="40" width="8" height="30" rx="2" fill="white" />
      <rect x="52" y="25" width="8" height="45" rx="2" fill="#fbbf24" />
      <rect x="64" y="40" width="8" height="30" rx="2" fill="white" />
      <path d="M25 75H75" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );

  const SecondaryNavbar = () => (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <button onClick={() => navigateTo('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Go to Homepage">
          <div className="bg-indigo-900 text-white p-1 md:p-1.5 rounded-lg md:rounded-xl"><LogoIcon /></div>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
        </button>
        <button onClick={() => navigateTo('home')} className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2 hover:text-indigo-900">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to</span> Home
        </button>
      </div>
    </nav>
  );

  const renderTierCardContent = (tier) => (
    <div className="flex flex-col h-full relative z-10">
        <div className="flex justify-between items-center mb-5 md:mb-6">
            <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tighter drop-shadow-sm ${getTierColor(tier)}`}>{tier}</h3>
            <span className="text-xs md:text-sm font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">${appData.tierData[tier].price.toLocaleString()} / mo</span>
        </div>

        <div className="text-center py-6 md:py-8 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100 mb-5 md:mb-6 shadow-inner">
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Monthly Grand Prize</p>
            <p className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter drop-shadow-sm ${getTierColor(tier)}`}>{appData.tierData[tier].prize}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6 shrink-0">
             <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 text-center">
                 <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Raffle Odds</p>
                 <p className="font-black text-slate-800 text-sm md:text-base">1 / 400</p>
             </div>
             <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 text-center relative group/odds">
                 <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1 cursor-help">
                   Total Odds
                   <HelpCircle size={10} className="text-slate-400 group-hover/odds:text-indigo-600 transition-colors" />
                 </p>
                 <p className="font-black text-slate-800 text-sm md:text-base">{appData.tierData[tier].totalOdds}</p>
                 
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white border border-slate-200 p-3 rounded-2xl shadow-xl text-[10px] leading-relaxed font-medium text-slate-500 normal-case opacity-0 invisible group-hover/odds:opacity-100 group-hover/odds:visible transition-all duration-200 z-50 text-center">
                    The estimated probability of winning <em>any</em> prize in this tier.
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                 </div>
             </div>
        </div>

        <div className="space-y-4 md:space-y-5 mb-6 md:mb-8 flex-grow text-center">
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
          onClick={(e) => { e.stopPropagation(); handleJoinClick(tier); setShowTierModal(false); }} 
          className="w-full py-3.5 md:py-4 px-2 md:px-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[11px] md:text-sm shadow-lg transition-all mt-auto bg-slate-900 text-white group-hover:bg-indigo-900 flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap"
        >
            <span>Select</span>
            <span className="text-white/40 font-normal opacity-70">•</span>
            <span>${appData.tierData[tier].price.toLocaleString()}/mo</span>
        </button>
    </div>
  );

  const TierSelectionModal = () => {
    if (!showTierModal || !appData) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
         <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md" onClick={() => setShowTierModal(false)}></div>
         <div className="relative bg-slate-50 w-full max-w-6xl rounded-3xl md:rounded-[3rem] p-5 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <button onClick={() => setShowTierModal(false)} className="absolute top-4 right-4 md:top-8 md:right-8 text-slate-400 hover:text-indigo-900 transition-colors z-20 bg-white rounded-full p-2 shadow-sm" aria-label="Close">
               <X size={20} className="md:w-6 md:h-6" />
            </button>
            <div className="text-center mb-5 md:mb-10">
               <h3 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter text-indigo-950 mb-2 md:mb-3">Select Your Tier</h3>
               <p className="text-slate-500 font-medium text-sm md:text-lg">Choose your impact level for the <strong className="text-indigo-900">{activeCommunity}</strong> community.</p>
            </div>
            
            {/* Mobile Tab Toggle for Modal */}
            <div className="md:hidden flex bg-slate-200 p-1 rounded-2xl mb-5 max-w-sm mx-auto">
               {['silver', 'gold', 'diamond'].map((tier) => (
                   <button
                      key={tier}
                      onClick={() => setModalPricingTab(tier)}
                      className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${modalPricingTab === tier ? `bg-white shadow-sm ${getTierColor(tier)} drop-shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      {tier}
                   </button>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
               {['silver', 'gold', 'diamond'].map((tier) => (
                  <div 
                    key={tier} 
                    onClick={() => { handleJoinClick(tier); setShowTierModal(false); }}
                    className={`${modalPricingTab === tier ? 'flex animate-in fade-in slide-in-from-bottom-2' : 'hidden'} md:flex bg-white rounded-[1.5rem] md:rounded-3xl p-5 md:p-8 border flex-col h-full border-slate-200 relative overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(79,70,229,0.2)] hover:border-indigo-200 cursor-pointer group`}
                  >
                      {renderTierCardContent(tier)}
                  </div>
               ))}
            </div>
         </div>
      </div>
    );
  };

  // --- CHECKOUT PAGE ---
  const renderCheckoutPage = () => {
    const filteredCommunities = appData.allCommunityNames.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const exactMatch = appData.allCommunityNames.some(c => c.toLowerCase() === searchQuery.trim().toLowerCase());

    const handleCreateCommunity = () => {
       const newName = searchQuery.trim();
       if (!appData.allCommunityNames.includes(newName)) {
           setAppData(prev => {
               const others = prev.allCommunityNames.filter(c => c !== "General Circle");
               return {
                  ...prev,
                  allCommunityNames: ["General Circle", ...[...others, newName].sort()],
                  communities: { ...prev.communities, [newName]: { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 } }
               };
           });
       }
       setSelectedCommunity(newName);
       setDropdownOpen(false);
       setSearchQuery('');
       setFocusedIndex(-1);
    };

    const handleDropdownKeyDown = (e) => {
        if (!dropdownOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); setDropdownOpen(true); }
            return;
        }
        const maxIndex = filteredCommunities.length + (!exactMatch && searchQuery.trim() !== '' ? 0 : -1);
        if (e.key === 'Escape') { setDropdownOpen(false); setFocusedIndex(-1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(prev => Math.min(prev + 1, maxIndex)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(prev => Math.max(prev - 1, 0)); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredCommunities.length) {
                setSelectedCommunity(filteredCommunities[focusedIndex]); setDropdownOpen(false); setSearchQuery(''); setFocusedIndex(-1);
            } else if (focusedIndex === filteredCommunities.length) { handleCreateCommunity(); }
        }
    };

    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <SecondaryNavbar />
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-20">
          <div className="max-w-5xl mx-auto">
            {signupSuccess ? (
              <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-xl p-8 md:p-24 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
                  <div className="bg-green-100 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-10"><CheckCircle size={48} className="text-green-600 md:w-16 md:h-16" /></div>
                  <h4 className="text-3xl md:text-5xl font-black text-indigo-950 mb-4 md:mb-6 italic uppercase tracking-tighter">You're in.</h4>
                  <p className="text-slate-500 text-base md:text-xl font-medium max-w-md mx-auto leading-relaxed mb-8 md:mb-12">
                    Welcome to the {selectedCommunity !== 'General Circle' ? selectedCommunity : 'General'} Circle. Your monthly impact starts today.
                  </p>
                  <button onClick={() => { setSignupSuccess(false); navigateTo('home'); }} className="w-full md:w-auto px-12 py-4 md:py-5 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Return Home</button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-6 md:gap-12">
                <div className="lg:col-span-7 space-y-6 md:space-y-8">
                  <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-slate-100">
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic text-indigo-950 mb-6 md:mb-8 tracking-tight">Secure Your Spot</h2>
                    
                    <div className="mb-6 md:mb-8">
                        <label id="community-label" className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 md:mb-3">Select Community</label>
                        <div className="relative" ref={dropdownRef}>
                          <button 
                            type="button" aria-haspopup="listbox" aria-expanded={dropdownOpen} aria-labelledby="community-label"
                            onClick={() => { setDropdownOpen(!dropdownOpen); setFocusedIndex(-1); }} 
                            onKeyDown={handleDropdownKeyDown}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 font-bold text-sm md:text-base text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none text-left flex justify-between items-center transition-all hover:bg-slate-100"
                          >
                            <span className="truncate pr-4">{selectedCommunity}</span>
                            <ChevronDown className={`text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} size={20}/>
                          </button>

                          {dropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl md:rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                              <div className="p-2 md:p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 md:gap-3">
                                <Search size={16} className="text-slate-400 ml-2"/>
                                <input 
                                  type="text" aria-label="Search cities or communities"
                                  className="w-full bg-transparent outline-none text-xs md:text-sm font-bold text-slate-700 placeholder-slate-400 py-2" 
                                  placeholder="Search cities..." 
                                  value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setFocusedIndex(-1); }} onKeyDown={handleDropdownKeyDown} autoFocus
                                />
                              </div>
                              <ul role="listbox" aria-labelledby="community-label" className="max-h-56 overflow-y-auto p-1.5 md:p-2 scroll-smooth">
                                {filteredCommunities.map((name, index) => (
                                    <li key={name} role="option" aria-selected={selectedCommunity === name}
                                      onClick={() => { setSelectedCommunity(name); setDropdownOpen(false); setSearchQuery(''); setFocusedIndex(-1); }}
                                      className={`cursor-pointer w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-colors 
                                        ${selectedCommunity === name ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                        ${focusedIndex === index ? 'ring-2 ring-indigo-500 bg-slate-50' : ''}`}
                                    >
                                      {name}
                                    </li>
                                ))}
                                {!exactMatch && searchQuery.trim() !== '' && (
                                    <li role="option" aria-selected="false" onClick={handleCreateCommunity}
                                      className={`cursor-pointer w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2 md:gap-3 mt-1 border border-indigo-100 bg-indigo-50/50
                                        ${focusedIndex === filteredCommunities.length ? 'ring-2 ring-indigo-500' : ''}`}
                                    >
                                      <div className="bg-indigo-200 text-indigo-700 rounded-md p-1"><Plus size={14} strokeWidth={3}/></div>
                                      Create "{searchQuery.trim()}"
                                    </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                    </div>

                    {INTEGRATION_CONFIG.useJotform ? (
                        <div className="w-full rounded-2xl md:rounded-[2rem] border border-slate-200 bg-white overflow-hidden relative">
                          <div className="aspect-[3/4] md:aspect-[4/5] w-full relative">
                              <iframe 
                                id={`jotform-iframe-${INTEGRATION_CONFIG.jotformId}`} title="Amplify Enrollment Form" 
                                src={`https://form.jotform.com/${INTEGRATION_CONFIG.jotformId}`} 
                                className="w-full h-full border-none absolute inset-0"
                              ></iframe>
                          </div>
                          <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 text-center">
                              <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold mb-2">Demo Mode Only</p>
                              <button onClick={handleRedirectToPayment} className="w-full py-3 md:py-4 bg-slate-200 text-slate-500 hover:text-indigo-900 rounded-xl font-black transition-all uppercase tracking-widest text-[10px] md:text-sm flex items-center justify-center gap-2 md:gap-3">
                                {isLoading ? <span className="animate-pulse italic">Verifying...</span> : "Simulate Success"}
                              </button>
                          </div>
                        </div>
                    ) : (
                        <div className="p-8 md:p-12 bg-indigo-50/50 rounded-3xl md:rounded-[2rem] border-2 border-indigo-100/50 flex flex-col items-center text-center">
                            <CreditCard size={40} className="text-indigo-900 mb-4 md:mb-6 md:w-12 md:h-12" />
                            <h4 className="text-xl md:text-2xl font-black text-indigo-950 mb-2 md:mb-3 uppercase tracking-tighter">Reserve Spot</h4>
                            <p className="text-xs md:text-sm text-indigo-900/60 mb-6 md:mb-8 max-w-xs font-medium">Secure your place in the {selectedCommunity} Circle. Your monthly impact begins today.</p>
                            <button onClick={handleRedirectToPayment} className="w-full py-3 md:py-4 bg-indigo-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-all uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3">
                              {isLoading ? <span className="animate-pulse italic">Connecting...</span> : <><Shield size={16} /> Join the Circle</>}
                            </button>
                        </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4 md:space-y-6">
                  <div className="bg-indigo-950 text-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                      <div className="relative z-10">
                          <div className="flex items-center justify-between mb-6 md:mb-8">
                            <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-indigo-300">Summary</h3>
                            <div className="bg-white/10 px-2 py-1 md:px-3 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-white">Pre-Launch</div>
                          </div>

                          <div className="space-y-4 md:space-y-6">
                            <div>
                                <p className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Selected Circle</p>
                                <p className={`text-2xl md:text-3xl font-black uppercase italic tracking-tighter ${selectedTier === 'silver' ? 'text-slate-300' : selectedTier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]'}`}>{selectedTier}</p>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Monthly Gift</p>
                                  <p className="text-lg md:text-xl font-bold">${appData.tierData[selectedTier].price.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Grand Prize</p>
                                  <p className={`text-lg md:text-xl font-bold ${selectedTier === 'silver' ? 'text-slate-300' : selectedTier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]'}`}>{appData.tierData[selectedTier].prize}</p>
                                </div>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <p className="text-[8px] md:text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Raffle Odds</p>
                                    <p className="font-bold text-sm md:text-base">1 / 400</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-indigo-400/30">
                                    <p className="text-[8px] md:text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Total Odds</p>
                                    <p className="font-bold text-sm md:text-base">{appData.tierData[selectedTier].totalOdds}</p>
                                </div>
                            </div>
                          </div>

                          <div className="mt-6 md:mt-8 p-3 md:p-4 bg-indigo-900/50 rounded-xl md:rounded-2xl border border-indigo-800/50 text-center">
                            <p className="text-[9px] md:text-[10px] text-indigo-200 font-medium leading-relaxed">
                              Your contribution goes directly into the active pool. The drawing activates the moment your circle reaches 400 members.
                            </p>
                          </div>
                      </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ContentPage = ({ title, content }) => (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <SecondaryNavbar />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-5xl font-black text-indigo-950 mb-8 md:mb-12 uppercase italic tracking-tighter">{title}</h1>
        <div className="prose prose-sm md:prose-lg prose-indigo max-w-none text-slate-600 font-medium leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );

  const renderContactPage = () => (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <SecondaryNavbar />
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-black text-indigo-950 mb-4 md:mb-6 uppercase italic tracking-tighter">Get in Touch</h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">Have questions about joining a circle or starting your own? We're here to help.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-slate-100">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-indigo-950 mb-6 md:mb-8">Contact Information</h3>
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-900"><Mail size={20} className="md:w-6 md:h-6" /></div>
                  <div>
                    <p className="font-bold text-slate-900 text-base md:text-lg mb-0.5 md:mb-1">Email Us</p>
                    <p className="text-sm md:text-base text-slate-500">support@amplify.org</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-900"><Phone size={20} className="md:w-6 md:h-6" /></div>
                  <div>
                    <p className="font-bold text-slate-900 text-base md:text-lg mb-0.5 md:mb-1">Call Us</p>
                    <p className="text-sm md:text-base text-slate-500">+1 (800) 555-0123</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-900"><Globe size={20} className="md:w-6 md:h-6" /></div>
                  <div>
                    <p className="font-bold text-slate-900 text-base md:text-lg mb-0.5 md:mb-1">Headquarters</p>
                    <p className="text-sm md:text-base text-slate-500">New York, NY</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-900 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl text-white">
               <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-6">Send a Message</h3>
               <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                 <div>
                   <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Name</label>
                   <input type="text" className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-3 md:p-4 text-sm md:text-base text-white placeholder-indigo-400 focus:ring-2 focus:ring-[#eab308] outline-none" placeholder="Your Name" />
                 </div>
                 <div>
                   <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Email</label>
                   <input type="email" className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-3 md:p-4 text-sm md:text-base text-white placeholder-indigo-400 focus:ring-2 focus:ring-[#eab308] outline-none" placeholder="john@example.com" />
                 </div>
                 <div>
                   <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Message</label>
                   <textarea className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-3 md:p-4 text-sm md:text-base text-white placeholder-indigo-400 h-24 md:h-32 focus:ring-2 focus:ring-[#eab308] outline-none" placeholder="How can we help?"></textarea>
                 </div>
                 <button className="w-full py-3 md:py-4 bg-[#eab308] text-indigo-950 text-sm md:text-base font-black uppercase tracking-widest rounded-xl hover:bg-white transition-colors mt-2">Send Message</button>
               </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PrivacyPolicyContent = () => (
    <div className="space-y-4 md:space-y-6">
      <p>
        <strong>Introduction and Scope</strong><br />
        The Privacy Policy for Amplify governs the collection, use, retention, and sharing of personal data across our digital platform...
      </p>
    </div>
  );

  const renderHomePage = () => {
    // Reordered and refined FAQs
    const primaryFaqs = [
      { q: "What is Amplify?", a: "Amplify is a community-powered giving platform that pools monthly Tzedakah to create greater collective impact. Members give consistently, support new charitable organizations each month, and receive access to optional appreciation perks as a thank-you for their giving." },
      { q: "How does the 400-member cap work?", a: "Each circle is strictly capped at 400 paid members. The moment a circle reaches this cap, the massive monthly prize drawing is unlocked and activated for those members." },
      { q: "Why not just give directly?", a: "Direct giving is powerful and encouraged. Amplify exists for those who want their consistent monthly giving to become part of a coordinated collective effort capable of issuing larger, strategic grants." },
      { q: "Who selects the charities?", a: "Charities are vetted in advance based on impact and financial transparency. We focus on organizations where a single large grant can reach a critical milestone." }
    ];
    const secondaryFaqs = [
      { q: "Where do the raffle prizes come from?", a: "The prizes are funded from each circle’s pooled donations. Amplify intentionally allocates a portion of each pool toward appreciation draws because they meaningfully increase participation and retention. That expanded participation allows the collective to direct significantly larger grants than individuals typically could alone." },
      { q: "When am I charged?", a: "Your first contribution is processed immediately upon joining. Subsequent recurring donations will be charged on the same day each month." },
      { q: "Can I cancel at any time?", a: "Yes. Memberships can be paused or canceled at any time before your next scheduled monthly charge." },
      { q: "Is my contribution tax-deductible?", a: "Donations benefiting a 501(c)(3) organization are tax-deductible in the US to the extent permitted by law. The Federal Tax Identification Number is provided post-transaction where applicable." },
      { q: "Are the drawings required?", a: "No. Participation in any drawings or appreciation rewards is provided solely as a thank-you for consistent giving. You may opt out of the sweepstakes at any time." }
    ];

    return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 scroll-smooth relative">
      <style>{`
        img { background-color: #f1f5f9; min-height: 20px; }
      `}</style>
      
      <TierSelectionModal />
      <div id="top" className="absolute top-0"></div>

      <nav className="fixed w-full z-[90] bg-white/95 backdrop-blur-md border-b border-slate-100 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => scrollToSection('top')} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left" aria-label="Go to Top">
            <div className="bg-indigo-900 text-white p-1 md:p-1.5 rounded-lg md:rounded-xl"><LogoIcon /></div>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
          </button>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">
            <button onClick={() => scrollToSection('how')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">How it works</button>
            <button onClick={() => scrollToSection('why')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">Why Amplify</button>
            <button onClick={() => scrollToSection('beneficiary')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">Beneficiary</button>
            <button onClick={() => scrollToSection('communities')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">Communities</button>
            <button onClick={() => scrollToSection('tiers')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">The Circles</button>
          </div>

          <button className="md:hidden p-2 text-indigo-900" onClick={() => setIsMenuOpen(true)} aria-label="Open Menu"><Menu size={24} /></button>

          <button 
            onClick={() => scrollToSection('tiers')}
            className="hidden md:block bg-indigo-900 text-white px-6 py-2.5 rounded-full text-xs font-black hover:bg-black transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest"
          >
            Reserve My Spot
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] md:hidden bg-white animate-in slide-in-from-right duration-300 flex flex-col" role="dialog" aria-modal="true">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 shrink-0 text-left">
                <span className="text-xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-indigo-950 p-2" aria-label="Close Menu"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-lg font-black text-slate-900 uppercase tracking-tighter text-left">
                <button onClick={() => scrollToSection('how')} className="text-left border-b border-slate-50 pb-3">How it works</button>
                <button onClick={() => scrollToSection('why')} className="text-left border-b border-slate-50 pb-3">Why Amplify</button>
                <button onClick={() => scrollToSection('beneficiary')} className="text-left border-b border-slate-50 pb-3">Beneficiary</button>
                <button onClick={() => scrollToSection('communities')} className="text-left border-b border-slate-50 pb-3">Communities</button>
                <button onClick={() => scrollToSection('tiers')} className="text-left border-b border-slate-50 pb-3">The Circles</button>
                <button onClick={() => scrollToSection('faq')} className="text-left border-b border-slate-50 pb-3">FAQ</button>
            </div>
            <div className="p-6 border-t border-slate-50 shrink-0 text-left">
                <button 
                    onClick={() => { setIsMenuOpen(false); scrollToSection('tiers'); }}
                    className="w-full py-5 bg-indigo-900 text-white rounded-full font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 text-sm"
                >
                    Join the Circle
                </button>
            </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="pt-20 pb-12 md:pt-24 md:pb-20 px-4 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center">
            <div className="text-left lg:col-span-7">
              <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-4 md:mb-8 leading-[0.9] md:leading-[0.85] uppercase">
                Give Together. <br />
                <div className="relative inline-block mt-1 md:mt-0">
                    <span className="text-indigo-900 italic">Amplify</span>
                    <div className="absolute left-[-1%] bottom-[-2px] md:-bottom-2 w-[102%] h-1.5 md:h-2.5 bg-indigo-200 rounded-full"></div>
                </div> 
                <span className="italic text-indigo-900 inline-block md:inline md:ml-4 mt-1 md:mt-0">Your Impact.</span>
              </h1>
              <p className="text-lg md:text-2xl text-slate-600 mb-6 md:mb-8 font-medium max-w-2xl leading-snug">
                Pool your monthly donation with a global community to make a massive impact. <strong>Win Up To $100,000</strong> <em>every month</em> as a reward for your commitment.
              </p>
              
              <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 text-left">
                {[
                  "Pooled Tzedakah for transformational monthly grants",
                  "Each drawing pool is capped at 400 members",
                  "Combined winning odds up to 1/25"
                ].map((text, i) => (
                  <div key={i} className="flex items-start md:items-center gap-3">
                    <div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5 md:mt-0 shrink-0"><Check size={14} className="md:w-4 md:h-4" strokeWidth={3}/></div>
                    <span className="text-[11px] md:text-sm font-bold text-slate-700 uppercase tracking-tight leading-snug">{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 text-left">
                <button 
                  onClick={() => scrollToSection('tiers')}
                  className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl hover:shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1 uppercase tracking-tighter"
                >
                  Join the Circle
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative mt-4 md:mt-0">
              <div className="aspect-[16/11.25] w-full rounded-3xl md:rounded-[3rem] overflow-hidden shadow-[0_16px_32px_-12px_rgba(0,0,0,0.2)] md:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-[6px] md:border-[12px] border-white bg-slate-900 relative">
                <video className="w-full h-full object-cover" controls playsInline aria-label="Promotional video about Amplify" onError={(e) => e.currentTarget.style.display = 'none'}>
                  <source src="amplify-video.mp4" type="video/mp4" />
                </video>
              </div>
              
              <div className="absolute -top-3 -left-2 md:-top-10 md:-left-10 bg-[#eab308] p-2.5 md:p-6 rounded-xl md:rounded-[2rem] shadow-xl md:shadow-2xl flex flex-col items-center justify-center border-2 md:border-4 border-white z-20 rotate-[-5deg]">
                <p className="text-[7px] md:text-xs font-black uppercase tracking-widest text-indigo-950 mb-0.5 md:mb-1 leading-none text-center">Collective Goal</p>
                <div className="w-full h-px bg-indigo-950/10 mb-0.5 md:mb-1"></div>
                <p className="text-lg md:text-4xl font-black text-indigo-950 tracking-tighter leading-none whitespace-nowrap">
                  $4.8M+<span className="text-[8px] md:text-sm font-bold text-indigo-900/60 ml-0.5 md:ml-1">/year</span>
                </p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-indigo-900/40 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-row md:flex-col items-center md:items-center text-left md:text-center transition-all duration-300 hover:bg-indigo-900 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] hover:-translate-y-1">
              <div className="bg-white/10 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 mr-5 md:mr-0 md:mb-8 text-center"><Users className="text-[#eab308] w-6 h-6 md:w-8 md:h-8" /></div>
              <div>
                 <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-tighter text-white">We Join Forces</h3>
                 <p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium">Donors join specialized circles, pooling recurring contributions to create a transformational monthly gift.</p>
              </div>
            </div>
            <div className="bg-indigo-900/40 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-row md:flex-col items-center md:items-center text-left md:text-center transition-all duration-300 hover:bg-indigo-900 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] hover:-translate-y-1">
              <div className="bg-white/10 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 mr-5 md:mr-0 md:mb-8 text-center"><Sparkles className="text-[#eab308] w-6 h-6 md:w-8 md:h-8" /></div>
              <div>
                 <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-tighter text-white">Huge Impact</h3>
                 <p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium">Combined donations are issued as a single massive grant, empowering our rotating charity partners to achieve critical milestones.</p>
              </div>
            </div>
            <div className="bg-indigo-900/40 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-white/10 flex flex-row md:flex-col items-center md:items-center text-left md:text-center transition-all duration-300 hover:bg-indigo-900 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] hover:-translate-y-1">
              <div className="bg-white/10 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 mr-5 md:mr-0 md:mb-8 text-center"><Trophy className="text-[#eab308] w-6 h-6 md:w-8 md:h-8" /></div>
              <div>
                 <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-tighter text-white">Monthly Appreciation</h3>
                 <p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium">As a thank you for your commitment, you receive entry into a drawing that triggers the moment your circle reaches 400 members, offering total odds up to 1/25.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Amplify Section */}
      <section id="why" className="py-16 md:py-24 bg-slate-50 px-4 border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-indigo-950 mb-3 md:mb-4 tracking-tighter uppercase leading-none italic">Why Amplify?</h2>
              <p className="text-base md:text-xl text-slate-500 font-medium max-w-2xl mx-auto">A smarter, more rewarding way to give back to the community.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm md:shadow-xl border border-slate-100 flex flex-col sm:flex-row items-start transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] hover:border-indigo-200">
                 <div className="bg-indigo-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-indigo-600 mb-4 sm:mb-0 sm:mr-6"><Rocket size={24} className="md:w-8 md:h-8" strokeWidth={2.5}/></div>
                 <div>
                    <h3 className="text-lg md:text-2xl font-black uppercase text-indigo-950 mb-2 md:mb-4 tracking-tight">Transformational Impact</h3>
                    <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">Huge grants make a huge difference. By pooling resources, we fund critical, massive milestones rather than just being a drop in the bucket.</p>
                 </div>
              </div>
              <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm md:shadow-xl border border-slate-100 flex flex-col sm:flex-row items-start transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] hover:border-indigo-200">
                 <div className="bg-amber-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-amber-600 mb-4 sm:mb-0 sm:mr-6"><TrendingUp size={24} className="md:w-8 md:h-8" strokeWidth={2.5}/></div>
                 <div>
                    <h3 className="text-lg md:text-2xl font-black uppercase text-indigo-950 mb-2 md:mb-4 tracking-tight">The Multiplier Effect</h3>
                    <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">Our reward model drives unprecedented volume and consistency. By combining our giving, we create a multiplier effect that empowers charities to tackle their biggest challenges.</p>
                 </div>
              </div>
              <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm md:shadow-xl border border-slate-100 flex flex-col sm:flex-row items-start transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] hover:border-indigo-200">
                 <div className="bg-blue-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-blue-600 mb-4 sm:mb-0 sm:mr-6"><Users size={24} className="md:w-8 md:h-8" strokeWidth={2.5}/></div>
                 <div>
                    <h3 className="text-lg md:text-2xl font-black uppercase text-indigo-950 mb-2 md:mb-4 tracking-tight">Jewish Unity</h3>
                    <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">We are fundamentally stronger together. Amplify unites communities globally, combining our Tzedakah to achieve a massive shared vision.</p>
                 </div>
              </div>
              <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm md:shadow-xl border border-slate-100 flex flex-col sm:flex-row items-start transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] hover:border-indigo-200">
                 <div className="bg-rose-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 text-rose-600 mb-4 sm:mb-0 sm:mr-6"><Gift size={24} className="md:w-8 md:h-8" strokeWidth={2.5}/></div>
                 <div>
                    <h3 className="text-lg md:text-2xl font-black uppercase text-indigo-950 mb-2 md:mb-4 tracking-tight">Meaningful Appreciation</h3>
                    <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">Life-changing prizes are our way of saying thank you. Providing immense value in appreciation encourages our members to give continuously and consistently.</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Beneficiary Section */}
      <section id="beneficiary" className="py-16 md:py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-stretch">
            <div className="bg-slate-50 rounded-3xl md:rounded-[3rem] p-8 md:p-16 border border-slate-100 flex flex-col justify-center text-center md:text-left">
              <p className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-[0.4em] mb-3 md:mb-4">This Month's Mission</p>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 md:mb-8 tracking-tighter uppercase italic">Chai Lifeline</h2>
              <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-8 md:mb-10">
                Chai Lifeline provides comprehensive, unparalleled support to children battling cancer and other life-threatening illnesses. Our collective grant funds vital services—from medical transportation and crisis counseling to joyful camp experiences—ensuring no family fights alone. Every dollar goes toward restoring hope, stability, and childhood magic in their darkest hours.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 justify-center md:justify-start">
                <div className="flex items-center gap-2 md:gap-3 text-slate-400">
                    <Building size={24} className="md:w-7 md:h-7" />
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-none text-left">Vetted 501(c)(3) Partner</p>
                </div>
                <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                <div className="flex items-center gap-2 md:gap-3 text-red-500 text-left">
                    <Heart size={24} className="md:w-7 md:h-7 fill-current text-left" />
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-none text-slate-700 text-left">Impact Goal: $400,000</p>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-3xl md:rounded-[3rem] shadow-2xl bg-slate-900 min-h-[250px] md:min-h-[400px]">
               <img src="/impact-photo.jpg" alt="Impact" className="absolute inset-0 w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.style.display='none'; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent"></div>
               <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl p-2 md:p-3 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                  <img src="/ChaiLifeline.png" alt="Chai Lifeline Logo" className="h-20 md:h-28 w-auto object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Communities Section */}
      <section id="communities" className="py-16 md:py-24 bg-slate-50 border-t border-slate-100 px-4 text-center">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-10 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-3 md:mb-4 tracking-tighter uppercase leading-none italic">Amplify Communities</h2>
            <p className="text-base md:text-xl text-slate-500 font-medium max-w-2xl mx-auto">Check out a local community to see their collective impact and current status.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4 mb-8 text-center">
            {FEATURED_COMMUNITIES.map((name, i) => (
              <button 
                key={i} onClick={() => toggleCommunity(name)}
                className={`p-3 md:p-8 rounded-2xl md:rounded-[2rem] border transition-all duration-300 flex flex-col items-center group hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.15)] hover:border-indigo-200 ${activeCommunity === name ? 'border-indigo-600 bg-indigo-50 shadow-md md:shadow-xl' : 'border-slate-100 bg-white'}`}
              >
                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center mb-2 md:mb-4 ${activeCommunity === name ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}><MapPin size={16} className="md:w-5 md:h-5" /></div>
                <h4 className="font-black text-indigo-950 uppercase tracking-tight text-[11px] md:text-sm mb-1 leading-tight">{name}</h4>
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{appData.communities[name]?.members || 0} Givers</p>
              </button>
            ))}
          </div>
          
          {activeCommunity && (
             <>
                <div className="hidden md:block bg-indigo-950 p-6 rounded-[2.5rem] text-white animate-in fade-in slide-in-from-top-4 relative overflow-hidden shadow-2xl text-left">
                    <button onClick={() => setActiveCommunity(null)} className="absolute top-4 right-6 text-white/40 hover:text-white transition-colors z-20"><X size={20} /></button>
                    <div className="relative z-10 grid grid-cols-12 gap-8 items-center">
                        <div className="col-span-7">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-[#eab308] p-1.5 rounded-lg text-indigo-950"><BarChart3 size={20}/></div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{activeCommunity} Dashboard</h3>
                            </div>
                            <p className="text-indigo-200 text-sm font-medium leading-relaxed max-w-md">Currently generating {formatCurrency(appData.communities[activeCommunity]?.monthly || 0)} in monthly throughput for our partner charities.</p>
                        </div>
                        <div className="col-span-5 grid grid-cols-3 gap-4">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Silver</p>
                                <p className="text-lg font-black tracking-tighter">{appData.communities[activeCommunity]?.silver || 0}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-[#eab308] mb-1">Gold</p>
                                <p className="text-lg font-black tracking-tighter">{appData.communities[activeCommunity]?.gold || 0}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-[#818cf8] mb-1">Diamond</p>
                                <p className="text-lg font-black tracking-tighter">{appData.communities[activeCommunity]?.diamond || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10 flex justify-center">
                        <button onClick={() => setShowTierModal(true)} className="px-10 py-3 bg-white text-indigo-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#eab308] transition-all flex items-center gap-3 shadow-lg">Join Community <ArrowRight size={14}/></button>
                    </div>
                </div>

                <div className="md:hidden fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-hidden text-center" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md" onClick={() => setActiveCommunity(null)}></div>
                    <div className="relative bg-indigo-950 p-6 rounded-3xl text-white animate-in fade-in zoom-in-95 slide-in-from-bottom-6 w-full max-w-sm shadow-2xl border border-white/10">
                        <button onClick={() => setActiveCommunity(null)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-20"><X size={24} /></button>
                        <div className="mb-6">
                            <div className="bg-[#eab308] w-10 h-10 rounded-xl flex items-center justify-center text-indigo-950 mx-auto mb-3"><BarChart3 size={20}/></div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">{activeCommunity}</h3>
                            <p className="text-indigo-200 text-xs mt-2 leading-snug">Monthly impact: <span className="text-white font-black">{formatCurrency(appData.communities[activeCommunity]?.monthly || 0)}</span></p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Silver</p>
                                <p className="text-base font-black">{appData.communities[activeCommunity]?.silver || 0}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                                <p className="text-[8px] font-black uppercase text-[#eab308] mb-0.5">Gold</p>
                                <p className="text-base font-black">{appData.communities[activeCommunity]?.gold || 0}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                                <p className="text-[8px] font-black uppercase text-[#818cf8] mb-0.5">Diamond</p>
                                <p className="text-base font-black">{appData.communities[activeCommunity]?.diamond || 0}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowTierModal(true)} className="w-full py-3 bg-white text-indigo-900 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">Join Community <ArrowRight size={14}/></button>
                    </div>
                </div>
             </>
          )}
        </div>
      </section>

      {/* Tiers / Pricing (White Background) */}
      <section id="tiers" className="py-16 md:py-24 bg-white px-4 text-center overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 tracking-tight uppercase text-indigo-950 leading-none">Pick Your Impact</h2>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] italic">Join a dedicated circle to maximize the reach of your monthly Tzedakah.</p>
          </div>

          {/* Mobile Pricing Tabs */}
          <div className="md:hidden flex bg-slate-200 p-1 rounded-2xl mb-5 max-w-sm mx-auto">
             {['silver', 'gold', 'diamond'].map((tier) => (
                 <button
                    key={tier}
                    onClick={() => setMobilePricingTab(tier)}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${mobilePricingTab === tier ? `bg-white shadow-sm ${getTierColor(tier)} drop-shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    {tier}
                 </button>
             ))}
          </div>

          {/* Mobile Pricing Cards */}
          <div className="md:hidden">
            {['silver', 'gold', 'diamond'].map((tier) => (
                <div 
                  key={tier} 
                  onClick={() => { handleJoinClick(tier); setShowTierModal(false); }}
                  className={`${mobilePricingTab === tier ? 'flex animate-in fade-in slide-in-from-bottom-2 duration-300' : 'hidden'} bg-white rounded-3xl p-5 border border-slate-200 relative overflow-hidden flex-col shadow-sm cursor-pointer group hover:border-indigo-200`}
                >
                    {renderTierCardContent(tier)}
                </div>
            ))}
          </div>

          {/* Desktop Pricing Cards (3-Column Grid) */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 text-left max-w-5xl mx-auto">
            {['silver', 'gold', 'diamond'].map((tier) => (
                <div 
                  key={tier} 
                  onClick={() => { handleJoinClick(tier); setShowTierModal(false); }}
                  className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-200 relative overflow-hidden flex flex-col shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-200 cursor-pointer group"
                >
                    {renderTierCardContent(tier)}
                </div>
            ))}
          </div>
          
          <div className="mt-12 md:mt-16 text-center px-4">
            <p className="text-slate-400 text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] max-w-2xl mx-auto leading-relaxed text-center">
              * Actual odds of winning depend on the total number of eligible entries received. No purchase necessary. See official rules for details.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ (Slate Background) */}
      <section id="faq" className="py-16 md:py-24 bg-slate-50 border-t border-slate-100 px-4 text-center">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 uppercase text-indigo-950 italic text-center">Questions?</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-8 md:mb-12 text-[10px] md:text-xs text-center">Everything you need to know</p>
          <div className="space-y-3 md:space-y-4 text-left">
            {primaryFaqs.map((faq, i) => (
              <div key={i} className="border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden bg-white hover:bg-slate-50 transition-colors">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-5 md:p-8 text-left flex justify-between items-center" aria-expanded={openFaq === i}>
                  <span className="font-black text-indigo-950 text-sm md:text-lg uppercase pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={20} className="md:w-6 md:h-6 shrink-0" /> : <ChevronDown size={20} className="md:w-6 md:h-6 shrink-0" />}
                </button>
                {openFaq === i && <div className="p-5 md:p-8 pt-0 text-slate-600 font-medium leading-relaxed text-sm md:text-base">{faq.a}</div>}
              </div>
            ))}
            {showAllFaqs && secondaryFaqs.map((faq, i) => (
              <div key={`sec-${i}`} className="border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden bg-white hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-top-4">
                <button onClick={() => setOpenFaq(openFaq === `sec-${i}` ? null : `sec-${i}`)} className="w-full p-5 md:p-8 text-left flex justify-between items-center transition-colors" aria-expanded={openFaq === `sec-${i}`}>
                  <span className="font-black text-indigo-950 pr-4 text-sm md:text-lg uppercase tracking-tight">{faq.q}</span>
                  {openFaq === `sec-${i}` ? <ChevronUp size={20} className="md:w-6 md:h-6 shrink-0 text-indigo-900" /> : <ChevronDown size={20} className="md:w-6 md:h-6 shrink-0 text-slate-300" />}
                </button>
                {openFaq === `sec-${i}` && <div className="p-5 md:p-8 pt-0 text-slate-600 leading-relaxed text-sm md:text-base font-medium">{faq.a}</div>}
              </div>
            ))}
          </div>
          <button onClick={() => setShowAllFaqs(!showAllFaqs)} className="mt-8 md:mt-12 px-6 md:px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs hover:bg-slate-100 transition-all text-center">{showAllFaqs ? "See Fewer Questions" : "See All Questions"}</button>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-indigo-950 text-white px-4 text-center">
        <div className="max-w-5xl mx-auto">
          <Shield size={40} className="md:w-12 md:h-12 mx-auto mb-6 md:mb-8 text-indigo-400" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 uppercase text-indigo-100">Commitment to Integrity</h2>
          <p className="text-indigo-200 text-sm md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
            Amplify is built on a foundation of transparency. We are currently pending regulatory approval and will complete all required registrations and bonding prior to circle activation.
          </p>
          <div className="inline-flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-center px-6 md:px-10 py-5 md:py-6 border border-indigo-800 rounded-2xl md:rounded-3xl bg-indigo-900/50 w-full sm:w-auto">
            <div className="text-center md:text-left"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Status</p><p className="font-bold text-sm">Pending Approval</p></div>
            <div className="w-16 h-px md:w-px md:h-10 bg-indigo-800"></div>
            <div className="text-center md:text-left"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Impact Vetting</p><p className="font-bold text-sm">Proven 501(c)(3) Partners</p></div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-500 py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12 mb-8 md:mb-12">
            <div className="flex items-center gap-2"><LogoIcon /><span className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">Amplify</span></div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
              <button onClick={() => navigateTo('privacy')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => navigateTo('terms')} className="hover:text-white transition-colors">Terms</button>
              <button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors">Contact</button>
            </div>
        </div>
        <p className="text-[9px] md:text-[10px] leading-relaxed max-w-4xl opacity-40 uppercase tracking-widest font-bold mx-auto text-center">DISCLOSURE: Amplify sweepstakes are subject to official rules. Actual odds of winning depend on the total number of eligible entries received. No purchase necessary to enter or win. Void where prohibited.</p>
      </footer>
    </div>
    );
  };

  // --- CLEAN ROOT RENDER ---
  switch (currentView) {
    case 'checkout': return renderCheckoutPage();
    case 'contact': return renderContactPage();
    case 'privacy': return <ContentPage title="Privacy Policy" content={<PrivacyPolicyContent />} />;
    case 'terms': return <ContentPage title="Terms of Service" content={<><p className="mb-6">Welcome to Amplify. By accessing or using our platform, you agree to be bound by these Terms of Service.</p><h3 className="text-xl md:text-2xl font-black text-indigo-900 mb-3 md:mb-4 mt-8 uppercase tracking-tight">Membership</h3><p className="mb-4">Membership in an Amplify circle involves a recurring monthly contribution. You may cancel your membership at any time prior to the monthly charge.</p><h3 className="text-xl md:text-2xl font-black text-indigo-900 mb-3 md:mb-4 mt-8 uppercase tracking-tight">Charitable Contributions</h3><p>All contributions are directed to verified 501(c)(3) organizations. While we vet all beneficiaries, Amplify does not warrant the activities of third-party charities.</p></>} />;
    case 'home':
    default: return renderHomePage();
  }
};

export default App;