import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Heart, Trophy, CheckCircle, Info, Star, Building, 
  ChevronDown, ChevronUp, Play, Presentation, ExternalLink, 
  CreditCard, FileText, Award, Users, Gift, Sparkles, Check, 
  MapPin, BarChart3, ArrowRight, X, Search, Menu, ArrowLeft,
  Mail, Phone, Globe, HelpCircle, Plus, Rocket, TrendingUp
} from 'lucide-react';

const INTEGRATION_CONFIG = {
  // SECURITY NOTE: In production, do not use a hardcoded link. 
  // Call your backend to generate a Stripe Checkout Session ID.
  stripeCheckoutUrl: "#", 
  jotformId: "241234567890123", // Replace with your actual Form ID
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

// Separate General Circle from the rest for sorting
const OTHER_COMMUNITIES = EXTENDED_COMMUNITIES.filter(c => c !== "General Circle").sort();
const INITIAL_COMMUNITY_LIST = ["General Circle", ...OTHER_COMMUNITIES];

// Initialize all extended communities with zero data
const initialCommunityData = {};
EXTENDED_COMMUNITIES.forEach(name => {
  initialCommunityData[name] = { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 };
});

const tierData = {
  silver: { 
    price: 250, prize: "$25,000", totalOdds: "1 / 100", 
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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const App = () => {
  // Views: 'home', 'checkout', 'privacy', 'terms', 'contact'
  const [currentView, setCurrentView] = useState('home'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [selectedTier, setSelectedTier] = useState('silver');
  const [showTierModal, setShowTierModal] = useState(false);
  
  const [openFaq, setOpenFaq] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState("General Circle");
  
  // State for Community Data and Dropdown Options
  const [communities, setCommunities] = useState(initialCommunityData);
  const [allCommunityNames, setAllCommunityNames] = useState(INITIAL_COMMUNITY_LIST);

  // Dropdown UI State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Refs to track selection for event listeners/timeouts without stale closures
  const selectionRef = useRef({ tier: 'silver', community: 'General Circle' });

  // Update refs whenever selection changes
  useEffect(() => {
    selectionRef.current = { tier: selectedTier, community: selectedCommunity };
  }, [selectedTier, selectedCommunity]);

  // Handle clicking outside of custom dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset scroll when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentView]);

  // Function to handle successful signup (updates state)
  const handleSignupComplete = () => {
    const { tier, community } = selectionRef.current;
    const tierPrice = tierData[tier].price;

    setCommunities(prev => ({
      ...prev,
      [community]: {
        ...prev[community],
        members: prev[community].members + 1,
        monthly: prev[community].monthly + tierPrice,
        [tier]: prev[community][tier] + 1
      }
    }));
    setSignupSuccess(true);
    setIsLoading(false);
  };

  // Handle JotForm submission success via postMessage
  useEffect(() => {
    const handleJotFormMessage = (e) => {
      // JotForm sends various messages, checking for submission ID is a common validation
      if (typeof e.data === 'object' && (e.data.action === 'submission-completed' || e.data.submission_id)) {
        handleSignupComplete();
      }
    };

    window.addEventListener('message', handleJotFormMessage);
    return () => window.removeEventListener('message', handleJotFormMessage);
  }, []);

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    if (currentView !== 'home') {
      setCurrentView('home');
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
      const offset = 90;
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
    // Reset success state so they can sign up again
    setSignupSuccess(false);
    if (activeCommunity) {
      setSelectedCommunity(activeCommunity);
    }
    setCurrentView('checkout');
  };

  // Logic: Only used if NOT using JotForm, or for manual override
  const handleRedirectToPayment = () => {
    setIsLoading(true);
    
    // Safety timeout - clear it if component unmounts
    const timer = setTimeout(() => {
      if (!INTEGRATION_CONFIG.useJotform) {
        // In production, fetch this URL from backend to avoid security risks
        if(INTEGRATION_CONFIG.stripeCheckoutUrl !== "#") {
           window.open(INTEGRATION_CONFIG.stripeCheckoutUrl, '_blank');
        } else {
           console.log("Stripe URL not configured");
        }
      }
      handleSignupComplete();
    }, 1500);

    return () => clearTimeout(timer);
  };

  const primaryFaqs = [
    {
      q: "What is Amplify?",
      a: "Amplify is a community-powered giving platform that pools monthly Tzedakah to create greater collective impact. Members give consistently, support new charitable organizations each month, and receive access to optional appreciation perks as a thank-you for their giving."
    },
    {
      q: "Where do the raffle prizes come from?",
      a: "The prizes are funded from each circle’s pooled donations. Amplify intentionally allocates a portion of each pool toward appreciation draws because they meaningfully increase participation and retention. That expanded participation allows the collective to direct significantly larger grants than individuals typically could alone."
    },
    {
      q: "Why not just give directly?",
      a: "Direct giving is powerful and encouraged. Amplify exists for those who want their consistent monthly giving to become part of a coordinated collective effort capable of issuing larger, strategic grants."
    },
    {
      q: "Who selects the charities?",
      a: "Charities are vetted in advance based on impact and financial transparency. We focus on organizations where a single large grant can reach a critical milestone."
    }
  ];

  const secondaryFaqs = [
    {
      q: "Is my contribution tax-deductible?",
      a: "Donations benefiting a 501(c)(3) organization are tax-deductible in the US to the extent permitted by law. The Federal Tax Identification Number is provided post-transaction where applicable."
    },
    {
      q: "When am I charged?",
      a: "Your first contribution is processed immediately upon joining. Subsequent recurring donations will be charged on the same day each month. Drawings occur every time a circle accumulates 400 paid member entries."
    },
    {
      q: "Can I cancel at any time?",
      a: "Yes. Memberships can be paused or canceled at any time before your next scheduled monthly charge."
    },
    {
        q: "Are the drawings required?",
        a: "No. Participation in any drawings or appreciation rewards is provided solely as a thank-you for consistent giving. You may opt out of the sweepstakes at any time."
    }
  ];

  const LogoIcon = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" aria-label="Amplify Logo">
      <rect x="28" y="55" width="8" height="15" rx="2" fill="white" />
      <rect x="40" y="40" width="8" height="30" rx="2" fill="white" />
      <rect x="52" y="25" width="8" height="45" rx="2" fill="#fbbf24" />
      <rect x="64" y="40" width="8" height="30" rx="2" fill="white" />
      <path d="M25 75H75" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );

  // --- REUSABLE NAVBAR FOR SUB-PAGES ---
  const SecondaryNavbar = () => (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Go to Homepage">
          <div className="bg-indigo-900 text-white p-1.5 rounded-xl"><LogoIcon /></div>
          <span className="text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
        </button>
        <button onClick={() => setCurrentView('home')} className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:text-indigo-900">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>
    </nav>
  );

  // --- TIER SELECTION MODAL ---
  const TierSelectionModal = () => {
    if (!showTierModal) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
         <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md" onClick={() => setShowTierModal(false)}></div>
         <div className="relative bg-slate-50 w-full max-w-5xl rounded-[3rem] p-6 md:p-12 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <button onClick={() => setShowTierModal(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-400 hover:text-indigo-900 transition-colors z-20 bg-white rounded-full p-2 shadow-sm" aria-label="Close">
               <X size={24} />
            </button>
            <div className="text-center mb-8 md:mb-12">
               <h3 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-indigo-950 mb-3">Select Your Tier</h3>
               <p className="text-slate-500 font-medium md:text-lg">Choose your impact level for the <strong className="text-indigo-900">{activeCommunity}</strong> community.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
               {['silver', 'gold', 'diamond'].map((tier) => (
                  <div key={tier} className="bg-white rounded-3xl p-6 md:p-8 border flex flex-col h-full border-slate-200">
                      <div className="flex justify-between items-start mb-6 text-left">
                          <div>
                              <h3 className={`text-xl font-black uppercase tracking-tighter ${tier === 'diamond' ? 'text-indigo-900' : 'text-slate-900'}`}>{tier} Tier</h3>
                              <p className="text-3xl font-black text-slate-900 mt-2">${tierData[tier].price}<span className="text-sm font-bold text-slate-400 tracking-normal uppercase">/mo</span></p>
                          </div>
                      </div>
                      <div className="space-y-4 mb-8 border-t border-slate-50 pt-6 flex-grow">
                          <div className="flex justify-between text-sm"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Monthly Grand Prize</span><span className="font-black text-indigo-900">{tierData[tier].prize}</span></div>
                          <div className="flex justify-between text-sm"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Grand Prize Odds (As high as)</span><span className="font-black text-slate-900">1 / 400</span></div>
                          <div className="border-t border-slate-50 pt-4">
                              <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-3">Other Monthly Prizes</p>
                              <div className="space-y-1">{tierData[tier].otherPrizes.map((p, idx) => <p key={idx} className="text-sm font-bold text-slate-800">{p}</p>)}</div>
                          </div>
                          <div className="flex justify-between text-sm border-t border-slate-50 pt-4"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Combined Odds (As high as)</span><span className="font-black text-indigo-950">{tierData[tier].totalOdds}</span></div>
                          <div className="border-t border-slate-50 pt-4">
                              <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-3">Exclusive Perks</p>
                              <div className="space-y-1">{tierData[tier].perks.map((p, idx) => <p key={idx} className={`text-xs uppercase tracking-tight ${tier === 'diamond' ? 'font-black text-indigo-900' : 'font-bold text-slate-600'}`}>• {p}</p>)}</div>
                          </div>
                      </div>
                      <button onClick={() => { handleJoinClick(tier); setShowTierModal(false); }} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all mt-auto bg-slate-900 text-white hover:bg-indigo-900">
                          Select {tier}
                      </button>
                  </div>
               ))}
            </div>
         </div>
      </div>
    );
  };

  // --- CHECKOUT PAGE COMPONENT ---
  const CheckoutPage = () => {
    const filteredCommunities = allCommunityNames.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const exactMatch = allCommunityNames.some(c => c.toLowerCase() === searchQuery.trim().toLowerCase());

    const handleCreateCommunity = () => {
       const newName = searchQuery.trim();
       if (!allCommunityNames.includes(newName)) {
           setAllCommunityNames(prev => {
               const others = prev.filter(c => c !== "General Circle");
               return ["General Circle", ...[...others, newName].sort()];
           });
           setCommunities(prev => ({
               ...prev,
               [newName]: { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 }
           }));
       }
       setSelectedCommunity(newName);
       setDropdownOpen(false);
       setSearchQuery('');
    };

    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <SecondaryNavbar />
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="max-w-5xl mx-auto">
            {signupSuccess ? (
              <div className="bg-white rounded-[3rem] shadow-xl p-12 md:p-24 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
                  <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10"><CheckCircle size={64} className="text-green-600" /></div>
                  <h4 className="text-4xl md:text-5xl font-black text-indigo-950 mb-6 italic uppercase tracking-tighter">You're in.</h4>
                  <p className="text-slate-500 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed mb-12">
                    Welcome to the {selectedCommunity !== 'General Circle' ? selectedCommunity : 'General'} Circle. Your monthly impact starts today.
                  </p>
                  <button onClick={() => { setSignupSuccess(false); setCurrentView('home'); }} className="px-12 py-5 bg-indigo-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Return Home</button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
                {/* Left Column: Form */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <h2 className="text-3xl font-black uppercase italic text-indigo-950 mb-8 tracking-tight">Secure Your Spot</h2>
                    
                    <div className="mb-8">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Select Community</label>
                        
                        {/* CUSTOM SEARCHABLE DROPDOWN */}
                        <div className="relative" ref={dropdownRef}>
                          <button 
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none text-left flex justify-between items-center transition-all hover:bg-slate-100"
                          >
                            {selectedCommunity}
                            <ChevronDown className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} size={20}/>
                          </button>

                          {dropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                              <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                                <Search size={18} className="text-slate-400 ml-2"/>
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 placeholder-slate-400 py-2" 
                                  placeholder="Search cities or communities..." 
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-64 overflow-y-auto p-2 scroll-smooth">
                                {filteredCommunities.map(name => (
                                    <button 
                                      key={name}
                                      onClick={() => { setSelectedCommunity(name); setDropdownOpen(false); setSearchQuery(''); }}
                                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${selectedCommunity === name ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                    >
                                      {name}
                                    </button>
                                ))}
                                
                                {/* Create Community Button */}
                                {!exactMatch && searchQuery.trim() !== '' && (
                                    <button 
                                      onClick={handleCreateCommunity}
                                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-3 mt-1 border border-indigo-100 bg-indigo-50/50"
                                    >
                                      <div className="bg-indigo-200 text-indigo-700 rounded-lg p-1"><Plus size={16} strokeWidth={3}/></div>
                                      Create "{searchQuery.trim()}" Community
                                    </button>
                                )}
                                
                                {filteredCommunities.length === 0 && exactMatch && (
                                  <div className="px-4 py-6 text-sm text-slate-400 font-medium text-center">Community selected.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                    </div>

                    {INTEGRATION_CONFIG.useJotform ? (
                        <div className="w-full rounded-[2rem] border border-slate-200 bg-white overflow-hidden relative">
                          <div className="aspect-[4/5] w-full relative">
                              {/* NOTE: Ensure iframe content sends a postMessage on success to trigger signupSuccess state */}
                              <iframe 
                                id={`jotform-iframe-${INTEGRATION_CONFIG.jotformId}`} 
                                title="Amplify Enrollment Form" 
                                src={`https://form.jotform.com/${INTEGRATION_CONFIG.jotformId}`} 
                                className="w-full h-full border-none absolute inset-0"
                              ></iframe>
                          </div>
                          {/* Fallback button for demo purposes if iframe doesn't load or doesn't message back in this preview environment */}
                          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Demo Mode Only</p>
                              <button onClick={handleRedirectToPayment} className="w-full py-4 bg-slate-200 text-slate-500 hover:text-indigo-900 rounded-xl font-black transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                                {isLoading ? <span className="animate-pulse italic">Verifying...</span> : "Simulate Success (Dev)"}
                              </button>
                          </div>
                        </div>
                    ) : (
                        <div className="p-12 bg-indigo-50/50 rounded-[2rem] border-2 border-indigo-100/50 flex flex-col items-center text-center">
                            <CreditCard size={48} className="text-indigo-900 mb-6" />
                            <h4 className="text-2xl font-black text-indigo-950 mb-3 uppercase tracking-tighter">Reserve Spot</h4>
                            <p className="text-sm text-indigo-900/60 mb-8 max-w-xs font-medium">Secure your place in the {selectedCommunity} Circle. Your monthly impact begins today.</p>
                            <button onClick={handleRedirectToPayment} className="w-full py-4 bg-indigo-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 transform hover:-translate-y-1">
                              {isLoading ? <span className="animate-pulse italic">Connecting...</span> : <><Shield size={18} /> Join the Circle</>}
                            </button>
                        </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-indigo-950 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                      <div className="relative z-10">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black uppercase tracking-widest text-indigo-300">Summary</h3>
                            <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white">Pre-Launch</div>
                          </div>

                          <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Selected Circle</p>
                                <p className="text-3xl font-black uppercase italic tracking-tighter">{selectedTier}</p>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Monthly Gift</p>
                                  <p className="text-xl font-bold">${tierData[selectedTier].price}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Grand Prize</p>
                                  <p className="text-xl font-bold text-amber-400">{tierData[selectedTier].prize}</p>
                                </div>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Raffle Odds</p>
                                    <p className="font-bold">1 / 400</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-amber-400/30">
                                    <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1">Total Odds</p>
                                    <p className="font-bold">{tierData[selectedTier].totalOdds}</p>
                                </div>
                            </div>
                          </div>

                          <div className="mt-8 p-4 bg-indigo-900/50 rounded-2xl border border-indigo-800/50 text-center">
                            <p className="text-[10px] text-indigo-200 font-medium leading-relaxed">
                              Your contribution goes directly into the active pool. The drawing activates the moment your circle reaches 400 paid members.
                            </p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Included Perks</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {tierData[selectedTier].perks.map((perk, i) => (
                            <span key={i} className="bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-600 tracking-wide">{perk}</span>
                        ))}
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

  // --- CONTENT PAGES (Privacy, Terms, Contact) ---
  const ContentPage = ({ title, content }) => (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <SecondaryNavbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-black text-indigo-950 mb-12 uppercase italic tracking-tighter">{title}</h1>
        <div className="prose prose-lg prose-indigo max-w-none text-slate-600 font-medium leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );

  const ContactPage = () => (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <SecondaryNavbar />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-indigo-950 mb-6 uppercase italic tracking-tighter">Get in Touch</h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Have questions about joining a circle or starting your own? We're here to help.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
              <h3 className="text-2xl font-black uppercase tracking-tight text-indigo-950 mb-8">Contact Information</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-900"><Mail size={24} /></div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg mb-1">Email Us</p>
                    <p className="text-slate-500">support@amplify.org</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-900"><Phone size={24} /></div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg mb-1">Call Us</p>
                    <p className="text-slate-500">+1 (800) 555-0123</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-900"><Globe size={24} /></div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg mb-1">Headquarters</p>
                    <p className="text-slate-500">New York, NY</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-900 p-10 rounded-[2.5rem] shadow-xl text-white">
               <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Send a Message</h3>
               <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Name</label>
                   <input type="text" className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-4 text-white placeholder-indigo-400 focus:ring-2 focus:ring-amber-400 outline-none" placeholder="Your Name" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Email</label>
                   <input type="email" className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-4 text-white placeholder-indigo-400 focus:ring-2 focus:ring-amber-400 outline-none" placeholder="john@example.com" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Message</label>
                   <textarea className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-4 text-white placeholder-indigo-400 h-32 focus:ring-2 focus:ring-amber-400 outline-none" placeholder="How can we help?"></textarea>
                 </div>
                 <button className="w-full py-4 bg-amber-400 text-indigo-950 font-black uppercase tracking-widest rounded-xl hover:bg-white transition-colors">Send Message</button>
               </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PrivacyPolicyContent = () => (
    <div className="space-y-6">
      <p>
        <strong>Introduction and Scope</strong><br />
        The Privacy Policy for Amplify governs the collection, use, retention, and sharing of personal data across our digital platform, recurring charitable pledge systems, and sweepstakes administration services. This policy applies to all visitors, registered donors, Alternate Means of Entry (AMOE) sweepstakes participants, and platform users residing within the United States. Amplify adopts a comprehensive compliance posture designed to satisfy the rigorous requirements of the California Privacy Rights Act (CPRA), the Virginia Consumer Data Protection Act (VCDPA), the Colorado Privacy Act (CPA), and all allied state consumer privacy frameworks taking effect through 2025 and 2026. By utilizing the Amplify platform to initiate a charitable pledge or enter a promotional sweepstakes, you acknowledge the data practices described within this document. We are committed to transparency, and this policy explicitly details the categories of personal information we collect, the specific business purposes for that collection, and the strictly vetted third parties with whom your data may be shared to facilitate charitable regranting and legal sweepstakes compliance.
      </p>
  
      <h3 className="text-2xl font-black text-indigo-900 mb-4 mt-10 uppercase tracking-tight">Categories of Personal Information Collected</h3>
      <p>In the preceding twelve months, Amplify has collected the following categories of personal information from its users, as defined by applicable state privacy laws. We limit the information we collect to what is strictly necessary for our mission and sweepstakes administration.</p>
      <ul className="list-disc pl-6 space-y-4">
        <li><strong>Identifiers:</strong> We collect real names, postal addresses, unique personal identifiers, online identifiers, Internet Protocol (IP) addresses, and email addresses. This information is sourced directly from you during account creation, donation checkout, or Alternate Means of Entry (AMOE) sweepstakes participation.</li>
        <li><strong>Commercial Information:</strong> We maintain records of your charitable pledges, including donation amounts, transaction histories, selected recipient charities, and any optional notes or memos you provide alongside your pledge.</li>
        <li><strong>Internet or Electronic Network Activity Information:</strong> We collect data regarding your interaction with our platform via cookies and web beacons. This includes browsing history, search history, and page interaction data, utilized strictly to maintain platform security, prevent fraudulent sweepstakes entries, and optimize user experience.</li>
        <li><strong>Geolocation Data:</strong> We capture geographic data derived from your IP address to detect fraudulent activity and to ensure that you reside in a jurisdiction where participation in our specific sweepstakes promotions is legally permissible.</li>
        <li><strong>Financial Information:</strong> While you provide payment card details to initiate recurring pledges, Amplify never directly sees, processes, or stores raw payment card information on our servers. This data is transmitted directly via end-to-end encryption to our PCI Level 1 compliant payment processors.</li>
      </ul>
      <p>We utilize this information to process transactions, screen for potential risk or fraud, distribute funds to the organizations identified in your regrant recommendations, and administer monthly appreciation raffles fairly and legally.</p>
  
      <h3 className="text-2xl font-black text-indigo-900 mb-4 mt-10 uppercase tracking-tight">Use and Disclosure of Sensitive Personal Information</h3>
      <p>In the administration of our monthly appreciation raffles, Amplify awards prizes of substantial value. In strict accordance with United States federal tax laws, any participant who wins a prize valued at $600 or more is required to be issued an IRS Form 1099-MISC. To comply with this legal obligation, Amplify must collect the winner's Social Security Number (SSN) or Taxpayer Identification Number (TIN) prior to the disbursement of any prize funds.</p>
      <p>Under the California Privacy Rights Act (CPRA) and allied state laws, an SSN constitutes Sensitive Personal Information (SPI). Amplify collects and processes this SPI exclusively for the business purpose of satisfying federal and state tax reporting obligations and verifying the identity of prize winners to prevent financial fraud. We do not use, sell, or share Sensitive Personal Information for any secondary purposes, including marketing or behavioral profiling. You have the right to limit the use of your sensitive data beyond what is necessary for these legally mandated business operations. To exercise this right, please utilize the "Limit the Use of My Sensitive Personal Information" link located in the footer of our website. Please note, however, that refusal to provide an SSN when claiming a prize valued at $600 or more will result in the forfeiture of the prize, as Amplify cannot legally disburse funds without satisfying IRS reporting requirements.</p>
  
      <h3 className="text-2xl font-black text-indigo-900 mb-4 mt-10 uppercase tracking-tight">How We Share Your Information with Third Parties</h3>
      <p>Amplify operates as an intermediary to facilitate your charitable impact and administer appreciation sweepstakes. We do not sell, rent, or lease your personal data to third-party data brokers. We share your information strictly in the following operational contexts:</p>
      <ul className="list-disc pl-6 space-y-4">
        <li><strong>Recipient Charities:</strong> When you make a pledge, we provide the recipient charity with your regrant recommendation, donation location, donation date, and the donation amount. Unless you explicitly choose to make your donation anonymous or opt-out of information sharing during the checkout process, we will also share your name and email address with the charity so they may acknowledge your gift. Please note that any personal information added to an optional note or memo field will be transmitted directly to the charity. Once your information is shared with a recipient charity, its subsequent use is governed by that specific organization's privacy policy.</li>
        <li><strong>Payment Processors:</strong> To ensure the highest level of financial security, Amplify does not natively store your credit card or bank account information. We utilize PCI Level 1 compliant third-party payment processors, such as Stripe, to handle all transactions safely. We share your name, email address, and IP address with our payment processors to facilitate the authorization of your recurring pledge, reduce the risk of fraudulent transactions, and assist with dispute resolution.</li>
        <li><strong>Infrastructure and Communication Providers:</strong> We share necessary data elements with vetted third-party service providers who operate under strict Data Processing Addendums. This includes cloud infrastructure providers (such as Amazon Web Services) for encrypted data storage, and communication platforms (such as Mailgun or Twilio) to send you donation receipts, sweepstakes updates, and customer support communications.</li>
        <li><strong>Legal and Safety Obligations:</strong> We may disclose personal information to external entities, including law enforcement or state and federal tax authorities, when such disclosure is legally necessary to comply with subpoenas, investigate potential violations of civil or criminal law, or protect the integrity of our platform against fraud.</li>
      </ul>
  
      <h3 className="text-2xl font-black text-indigo-900 mb-4 mt-10 uppercase tracking-tight">Sweepstakes Transparency and Publicity Rights</h3>
      <p>By participating in the monthly appreciation raffles administered by Amplify, you acknowledge that specific data processing practices are governed by state and federal sweepstakes laws, which may supersede certain general privacy rights regarding data deletion.</p>
      <ul className="list-disc pl-6 space-y-4">
        <li><strong>Winners List Mandate:</strong> To demonstrate the fairness and legality of our promotions, state laws require Amplify to maintain a ledger of major prize winners. If you win a prize, your first name, last initial, city, and state of residence will be included on a publicly available Winners List. While you hold the right to request the deletion of your personal data under the CPRA, Amplify is legally obligated to retain and disclose this specific Winner List information to comply with state regulatory audits and legal obligations.</li>
        <li><strong>Publicity Release:</strong> Putting a name and face to our winning entrants helps build trust in our community. If you are selected as a winner, we may request that you execute a separate Declaration of Compliance and Publicity Release. By signing this release, you grant Amplify permission to use your name, likeness, and details of your win for advertising and promotional purposes without further compensation, unless prohibited by law. Please note that residents of certain jurisdictions are expressly exempted from making publicity releases a precondition of receiving a prize, and your legal rights in those specific states will be fully honored.</li>
      </ul>
  
      <h3 className="text-2xl font-black text-indigo-900 mb-4 mt-10 uppercase tracking-tight">Your State Privacy Rights and How to Exercise Them</h3>
      <p>Depending on your state of residence, including under the California Privacy Rights Act (CPRA), you are granted specific legal rights regarding your personal data. Amplify respects these rights and provides mechanisms for all U.S. users to exercise them equally:</p>
      <ul className="list-disc pl-6 space-y-4">
        <li><strong>The Right to Know and Access:</strong> You have the right to request that we disclose the specific pieces of personal information we have collected about you, the sources of that information, our business purposes for collecting it, and the categories of third parties with whom it is shared.</li>
        <li><strong>The Right to Deletion:</strong> You may request that we delete the personal information we have collected from you. Please note that we may deny your deletion request if retaining the information is legally necessary for us to fulfill the terms of a charitable pledge, comply with IRS tax reporting for sweepstakes prizes, or comply with state laws mandating the retention of sweepstakes records.</li>
        <li><strong>The Right to Correction:</strong> You have the right to request that we correct any inaccurate personal information we maintain about you in our systems.</li>
        <li><strong>The Right to Opt-Out and Limit Use:</strong> You have the right to direct us not to sell or share your personal information. Furthermore, you hold the right to limit our use of your Sensitive Personal Information strictly to what is necessary for our legal and business operations.</li>
        <li><strong>The Right to Non-Discrimination:</strong> Amplify will never deny you services, charge you different prices, or provide a different level of quality in our platform because you exercised any of your privacy rights.</li>
      </ul>
      <p>To exercise these rights, please submit a verifiable consumer request to us by either calling our toll-free number at [NUMBER] or emailing our privacy compliance team at privacy@amplify.com. We also automatically detect and honor opt-out preference signals, including the Global Privacy Control (GPC), broadcasted by your browser. We will respond to your verifiable request within the timeframes mandated by applicable state laws.</p>
  
      <h3 className="text-2xl font-black text-indigo-900 mb-4 mt-10 uppercase tracking-tight">Charitable Disclosures and State Reporting</h3>
      <p>Amplify operates transparently as an intermediary platform facilitating charitable pledges. In compliance with the fundraising laws of various states, we provide specific disclosures to educate prospective donors about the financial mechanics of our platform. When you make a pledge through Amplify, the exact financial breakdown of your contribution—including the percentage routed to the recipient charity, the percentage allocated to the appreciation raffle prize pool, and the platform administrative fee—is explicitly detailed at the point of checkout. We are registered as required under applicable state charitable solicitation acts. For a comprehensive list of state-specific disclosure statements mandated by the attorneys general of jurisdictions such as Colorado, Massachusetts, and South Carolina, please review our Charitable Solicitation Disclosure Addendum, accessible via the footer of our website.</p>
  
      <h3 className="text-2xl font-black text-indigo-900 mb-4 mt-10 uppercase tracking-tight">Data Security and Breach Notification</h3>
      <p>Amplify takes the security of your personal, financial, and tax information with the utmost seriousness. We implement and maintain industry-standard administrative, technical, and physical safeguards to protect your data against unauthorized access, loss, or misuse. All data transmitted between your browser and our platform is protected using secure end-to-end encryption (HTTPS/TLS). Furthermore, we ensure that our infrastructure partners and payment processors adhere to strict compliance frameworks, including PCI Level 1 compliance for financial transactions and SOC 2 audits for cloud hosting integrity.</p>
      <p>While we employ rigorous security measures, no digital platform is entirely invulnerable. In the event of a security incident that compromises your unencrypted personal information, Amplify maintains a comprehensive breach response protocol. We will act rapidly to secure our systems, investigate the scope of the incident, and provide timely, legally mandated notifications to all affected users and applicable state regulatory authorities as required by state data breach notification laws.</p>
  
      <h3 className="text-2xl font-black text-indigo-900 mb-4 mt-10 uppercase tracking-tight">Children's Privacy</h3>
      <p>The services provided by Amplify, including our charitable pledge systems and monthly appreciation raffles, are strictly intended for individuals who are 18 years of age or older (or the age of majority in your jurisdiction of residence). We do not knowingly solicit, collect, or maintain personal information from children under the age of 13, in strict compliance with the Children's Online Privacy Protection Act (COPPA), nor do we permit minors to utilize our platform. If you are a parent or guardian and discover that your child has provided us with personal information without your consent, please contact us immediately at privacy@amplify.com. Upon verification, we will take immediate steps to systematically delete such information from our databases and terminate the associated account.</p>
    </div>
  );

  // --- ROUTING LOGIC ---
  if (currentView === 'checkout') return <CheckoutPage />;
  if (currentView === 'contact') return <ContactPage />;
  if (currentView === 'privacy') return <ContentPage title="Privacy Policy" content={<PrivacyPolicyContent />} />;
  if (currentView === 'terms') return <ContentPage title="Terms of Service" content={<><p className="mb-6">Welcome to Amplify. By accessing or using our platform, you agree to be bound by these Terms of Service.</p><h3 className="text-2xl font-black text-indigo-900 mb-4 mt-8 uppercase tracking-tight">Membership</h3><p className="mb-4">Membership in an Amplify circle involves a recurring monthly contribution. You may cancel your membership at any time prior to the monthly charge.</p><h3 className="text-2xl font-black text-indigo-900 mb-4 mt-8 uppercase tracking-tight">Charitable Contributions</h3><p>All contributions are directed to verified 501(c)(3) organizations. While we vet all beneficiaries, Amplify does not warrant the activities of third-party charities.</p></>} />;

  // --- LANDING PAGE ---
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 scroll-smooth relative">
      <style>{`
        img { background-color: #f1f5f9; min-height: 20px; }
      `}</style>
      
      {/* Tier Selection Modal Component */}
      <TierSelectionModal />

      <div id="top" className="absolute top-0"></div>

      {/* Top Banner */}
      <div className="bg-indigo-900 text-white text-center py-2 text-[10px] font-black uppercase tracking-[0.3em] fixed w-full z-[100] top-0 px-4">
        The Founders Circle is Now Open • Reserve Your Spot
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-[90] bg-white/95 backdrop-blur-md border-b border-slate-100 top-[32px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => scrollToSection('top')} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left" aria-label="Go to Top">
            <div className="bg-indigo-900 text-white p-1.5 rounded-xl">
              <LogoIcon />
            </div>
            <span className="text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">
            <button onClick={() => scrollToSection('how')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">How it works</button>
            <button onClick={() => scrollToSection('why')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">Why Amplify</button>
            <button onClick={() => scrollToSection('beneficiary')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">Beneficiary</button>
            <button onClick={() => scrollToSection('communities')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">Communities</button>
            <button onClick={() => scrollToSection('tiers')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">The Circles</button>
          </div>

          <button className="md:hidden p-2 text-indigo-900" onClick={() => setIsMenuOpen(true)} aria-label="Open Menu">
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
        <div className="fixed inset-0 z-[150] md:hidden bg-white animate-in slide-in-from-right duration-300 flex flex-col" role="dialog" aria-modal="true">
            <div className="p-6 flex justify-between items-center border-b border-slate-100 shrink-0 text-left">
                <span className="text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-indigo-950 p-2" aria-label="Close Menu"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 text-xl font-black text-slate-900 uppercase tracking-tighter text-left">
                <button onClick={() => scrollToSection('how')} className="text-left border-b border-slate-50 pb-4">How it works</button>
                <button onClick={() => scrollToSection('why')} className="text-left border-b border-slate-50 pb-4">Why Amplify</button>
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
      <header className="pt-24 md:pt-28 pb-20 px-4 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
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
                  "Every 400 paid members instantly unlocks a massive prize drawing.",
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
              <div className="aspect-[16/11.25] w-full rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-[8px] md:border-[12px] border-white bg-slate-900 relative">
                <video 
                  className="w-full h-full object-cover"
                  controls 
                  playsInline
                  aria-label="Promotional video about Amplify"
                  onError={(e) => {
                      console.error("Video failed to load");
                      e.currentTarget.style.display = 'none';
                  }}
                >
                  <source src="amplify-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              
              <div className="absolute -top-6 -left-6 md:-top-10 md:-left-10 bg-amber-400 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl hidden sm:flex flex-col items-center justify-center border-4 border-white z-20 rotate-[-5deg]">
                <p className="text-[9px] md:text-xs font-black uppercase tracking-widest text-indigo-950 mb-1 leading-none text-center">Collective Goal</p>
                <div className="w-full h-px bg-indigo-950/10 mb-1"></div>
                <p className="text-2xl md:text-4xl font-black text-indigo-950 tracking-tighter leading-none whitespace-nowrap">
                  $4.8M+<span className="text-xs md:text-sm font-bold text-indigo-900/60 ml-1">/year</span>
                </p>
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
              <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-tighter text-center text-white w-full text-center">Huge Impact</h3>
              <p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium text-center">Combined donations are issued as a single massive grant, ensuring the majority of every dollar creates immediate change.</p>
            </div>
            <div className="bg-indigo-900/40 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 hover:bg-indigo-900 transition-all duration-500 group flex flex-col items-center">
              <div className="bg-white/10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 transition-transform text-center">
                <Trophy className="text-amber-400" size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-tighter text-center text-white w-full text-center">A Monthly Reward</h3>
              <p className="text-indigo-100/70 leading-relaxed text-sm md:text-base font-medium text-center">As a thank you for your commitment, you receive exclusive perks and entry into a drawing that triggers as soon as 400 paid members join.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Amplify Section */}
      <section id="why" className="py-24 bg-slate-50 px-4 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-indigo-950 mb-4 tracking-tighter uppercase leading-none italic">Why Amplify?</h2>
              <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto">A smarter, more rewarding way to give back to the community.</p>
           </div>
           
           <div className="grid md:grid-cols-2 gap-8">
              {/* Card 1 */}
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
                 <div className="bg-indigo-100 p-4 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                    <Rocket size={32} strokeWidth={2.5}/>
                 </div>
                 <h3 className="text-2xl font-black uppercase text-indigo-950 mb-4 tracking-tight">Transformational Impact</h3>
                 <p className="text-slate-600 font-medium leading-relaxed">Huge grants make a huge difference. By pooling resources, we fund critical, massive milestones for charities rather than just being a drop in the bucket.</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
                 <div className="bg-amber-100 p-4 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                    <TrendingUp size={32} strokeWidth={2.5}/>
                 </div>
                 <h3 className="text-2xl font-black uppercase text-indigo-950 mb-4 tracking-tight">The Multiplier Effect</h3>
                 <p className="text-slate-600 font-medium leading-relaxed">Amplify’s reward model is designed to drive unprecedented volume and consistency. By combining our giving into a massive collective pool, we create a net-positive multiplier that empowers our charity partners to take on their biggest challenges.</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
                 <div className="bg-blue-100 p-4 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                    <Users size={32} strokeWidth={2.5}/>
                 </div>
                 <h3 className="text-2xl font-black uppercase text-indigo-950 mb-4 tracking-tight">Jewish Unity</h3>
                 <p className="text-slate-600 font-medium leading-relaxed">We are fundamentally stronger together. Amplify unites communities across the globe, combining our Tzedakah to achieve a massive shared vision.</p>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
                 <div className="bg-rose-100 p-4 rounded-2xl flex items-center justify-center text-rose-600 mb-6">
                    <Gift size={32} strokeWidth={2.5}/>
                 </div>
                 <h3 className="text-2xl font-black uppercase text-indigo-950 mb-4 tracking-tight">Meaningful Appreciation</h3>
                 <p className="text-slate-600 font-medium leading-relaxed">Life-changing prizes are our way of saying thank you. Providing real, immense value in appreciation empowers our members to give even more generously.</p>
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
                 onError={(e) => { e.currentTarget.style.display='none'; }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent"></div>
               
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[70%] bg-white/95 backdrop-blur-xl py-1 rounded-xl flex items-center justify-center shadow-3xl border border-white/20">
                  <img src="/ChaiLifeline.png" alt="Chai Lifeline Logo" className="max-h-20 md:max-h-28 w-auto object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
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
            {FEATURED_COMMUNITIES.map((name, i) => (
              <button 
                key={i} 
                onClick={() => toggleCommunity(name)}
                className={`p-4 md:p-8 rounded-2xl md:rounded-[2rem] border transition-all flex flex-col items-center group ${activeCommunity === name ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg'} text-center`}
                aria-label={`View stats for ${name}`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 ${activeCommunity === name ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'} text-center`}>
                  <MapPin size={20} />
                </div>
                <h4 className="font-black text-indigo-950 uppercase tracking-tight text-xs md:text-sm mb-1 leading-tight text-center">{name}</h4>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{communities[name]?.members || 0} Givers</p>
              </button>
            ))}
          </div>
          
          {activeCommunity && (
             <>
                {/* DESKTOP VIEW: Inline Box */}
                <div className="hidden md:block bg-indigo-950 p-6 rounded-[2.5rem] text-white animate-in fade-in slide-in-from-top-4 relative overflow-hidden shadow-2xl text-left">
                    <button onClick={() => setActiveCommunity(null)} className="absolute top-4 right-6 text-white/40 hover:text-white transition-colors z-20 text-left" aria-label="Close Dashboard"><X size={20} /></button>
                    <div className="relative z-10 grid grid-cols-12 gap-8 items-center text-left">
                        <div className="col-span-7 text-left">
                            <div className="flex items-center gap-3 mb-2 text-left">
                                <div className="bg-amber-400 p-1.5 rounded-lg text-indigo-950 text-left"><BarChart3 size={20}/></div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-left">{activeCommunity} Dashboard</h3>
                            </div>
                            <p className="text-indigo-200 text-sm font-medium leading-relaxed max-w-md text-left">Currently generating {formatCurrency(communities[activeCommunity]?.monthly || 0)} in monthly throughput for our partner charities.</p>
                        </div>
                        <div className="col-span-5 grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-1 text-center">Silver</p>
                                <p className="text-lg font-black tracking-tighter text-center">{communities[activeCommunity]?.silver || 0}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-amber-400 mb-1 text-center">Gold</p>
                                <p className="text-lg font-black tracking-tighter text-center">{communities[activeCommunity]?.gold || 0}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-indigo-300 mb-1 text-center">Diamond</p>
                                <p className="text-lg font-black tracking-tighter text-center">{communities[activeCommunity]?.diamond || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10 flex justify-center text-center">
                        <button onClick={() => setShowTierModal(true)} className="px-10 py-3 bg-white text-indigo-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all flex items-center gap-3 shadow-lg text-center">Join Community <ArrowRight size={14}/></button>
                    </div>
                </div>

                {/* MOBILE VIEW: Pop-up Modal */}
                <div className="md:hidden fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-hidden text-center" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md text-center" onClick={() => setActiveCommunity(null)}></div>
                    <div className="relative bg-indigo-950 p-6 rounded-[2.5rem] text-white animate-in fade-in zoom-in-95 slide-in-from-bottom-6 w-full max-w-sm shadow-2xl border border-white/10 text-center">
                        <button onClick={() => setActiveCommunity(null)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-20 text-center" aria-label="Close Dashboard"><X size={24} /></button>
                        <div className="text-center mb-6 text-center">
                            <div className="bg-amber-400 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-950 mx-auto mb-4 text-center"><BarChart3 size={28}/></div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-center">{activeCommunity} Dashboard</h3>
                            <p className="text-indigo-200 text-sm mt-2 leading-snug text-center">Monthly impact: <span className="text-white font-black">{formatCurrency(communities[activeCommunity]?.monthly || 0)}</span></p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-1 text-center">Silver</p>
                                <p className="text-lg font-black text-center">{communities[activeCommunity]?.silver || 0}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[8px] font-black uppercase text-amber-400 mb-1 text-center">Gold</p>
                                <p className="text-lg font-black text-center">{communities[activeCommunity]?.gold || 0}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                                <p className="text-[8px] font-black uppercase text-indigo-300 mb-1 text-center">Diamond</p>
                                <p className="text-lg font-black text-center">{communities[activeCommunity]?.diamond || 0}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowTierModal(true)} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 text-center">Join Community <ArrowRight size={14}/></button>
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
                <div key={tier} className="bg-white rounded-3xl p-8 border border-slate-200 text-left">
                    <div className="flex justify-between items-start mb-6 text-left">
                        <div className="text-left">
                            <h3 className={`text-xl font-black uppercase tracking-tighter ${tier === 'diamond' ? 'text-indigo-900' : 'text-slate-900'} text-left`}>{tier} Tier</h3>
                            <p className="text-3xl font-black text-slate-900 mt-2 text-left">${tierData[tier].price}<span className="text-sm font-bold text-slate-400 tracking-normal uppercase text-left">/mo</span></p>
                        </div>
                    </div>
                    <div className="space-y-4 mb-8 border-t border-slate-50 pt-6 text-center">
                        <div className="flex justify-between text-sm text-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Monthly Grand Prize</span><span className="font-black text-indigo-900 text-center">{tierData[tier].prize}</span></div>
                        <div className="flex justify-between text-sm text-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center leading-tight">Grand Prize Odds<br/>(As high as)</span><span className="font-black text-slate-900 text-center flex items-center">1 / 400</span></div>
                        <div className="border-t border-slate-50 pt-4 text-center">
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-3 text-center">Other Monthly Prizes</p>
                            <div className="space-y-1 text-center">{tierData[tier].otherPrizes.map((p, idx) => <p key={idx} className="text-sm font-bold text-slate-800 text-center">{p}</p>)}</div>
                        </div>
                        <div className="flex justify-between text-sm border-t border-slate-50 pt-4 text-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center leading-tight">Combined Odds<br/>(As high as)</span><span className="font-black text-indigo-950 text-center flex items-center">{tierData[tier].totalOdds}</span></div>
                        <div className="border-t border-slate-50 pt-4 text-center">
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-3 text-center">Exclusive Perks</p>
                            <div className="space-y-1 text-center">{tierData[tier].perks.map((p, idx) => <p key={idx} className="text-xs uppercase tracking-tight text-center font-bold text-slate-600">• {p}</p>)}</div>
                        </div>
                    </div>
                    <button onClick={() => handleJoinClick(tier)} className="w-full py-4 bg-slate-900 text-white hover:bg-indigo-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all text-center">Select {tier} impact</button>
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
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest">Monthly Donation</td>
                  <td className="p-6 font-black text-2xl md:text-3xl border-r border-slate-200 text-center">$250</td>
                  <td className="p-6 font-black text-2xl md:text-3xl border-r border-slate-200 text-center">$500</td>
                  <td className="p-6 font-black text-2xl md:text-3xl text-center">$1,000</td>
                </tr>
                <tr className="text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest">Monthly Grand Prize</td>
                  <td className="p-6 font-bold text-xl md:text-2xl border-r border-slate-200 text-indigo-900 text-center">{tierData.silver.prize}</td>
                  <td className="p-6 font-bold text-xl md:text-2xl border-r border-slate-200 text-indigo-900 text-center">{tierData.gold.prize}</td>
                  <td className="p-6 font-bold text-xl md:text-2xl text-indigo-900 text-center">{tierData.diamond.prize}</td>
                </tr>
                <tr className="bg-slate-50 text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest leading-none">
                     Grand Prize Odds
                     <span className="block text-[10px] text-slate-400 mt-1 normal-case tracking-normal font-bold">As high as</span>
                  </td>
                  <td className="p-6 border-r border-slate-200 font-bold text-sm md:text-base text-center">1 / 400</td>
                  <td className="p-6 border-r border-slate-200 font-bold text-sm md:text-base text-center">1 / 400</td>
                  <td className="p-6 font-bold text-sm md:text-base text-center">1 / 400</td>
                </tr>
                <tr className="text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest">Other Monthly Prizes</td>
                  <td className="p-6 md:p-10 border-r border-slate-200 space-y-1 text-center">{tierData.silver.otherPrizes.map((p, i) => <p key={i} className="text-base font-bold text-slate-800 tracking-tight text-center">{p}</p>)}</td>
                  <td className="p-6 md:p-10 border-r border-slate-200 space-y-1 text-center">{tierData.gold.otherPrizes.map((p, i) => <p key={i} className="text-base font-bold text-slate-800 tracking-tight text-center">{p}</p>)}</td>
                  <td className="p-6 md:p-10 space-y-1 text-center">{tierData.diamond.otherPrizes.map((p, i) => <p key={i} className="text-base font-bold text-slate-800 tracking-tight text-center">{p}</p>)}</td>
                </tr>
                <tr className="bg-slate-50 text-center">
                  <td className="p-6 border-r border-slate-200 text-left align-top relative">
                    <div className="relative inline-block group">
                       <div className="flex flex-col cursor-help">
                           <span className="font-black text-slate-700 uppercase text-xs md:text-sm tracking-widest leading-none flex items-center gap-2">
                             Combined Odds
                             <HelpCircle size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                           </span>
                           <span className="block text-[10px] text-slate-400 mt-1 normal-case tracking-normal font-bold">As high as</span>
                       </div>
                       {/* Tooltip */}
                       <div className="absolute left-0 bottom-full mb-2 w-64 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl text-[10px] leading-relaxed font-medium text-slate-500 normal-case opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left">
                          The estimated probability of winning <em>any</em> prize in this tier. Actual odds depend on the total number of eligible entries received.
                          {/* Arrow */}
                          <div className="absolute left-6 -bottom-1 w-2 h-2 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                       </div>
                    </div>
                  </td>
                  <td className="p-6 font-black border-r border-slate-200 text-black text-sm md:text-lg text-center align-middle">{tierData.silver.totalOdds}</td>
                  <td className="p-6 font-black border-r border-slate-200 text-black text-sm md:text-lg text-center align-middle">{tierData.gold.totalOdds}</td>
                  <td className="p-6 font-black text-black text-sm md:text-lg text-center align-middle">{tierData.diamond.totalOdds}</td>
                </tr>
                <tr className="text-center">
                  <td className="p-6 font-black border-r border-slate-200 text-slate-700 text-left uppercase text-xs md:text-sm tracking-widest leading-none">Exclusive Perks</td>
                  <td className="p-6 md:p-10 border-r border-slate-200 space-y-3 text-xs font-black text-slate-500 uppercase tracking-tighter leading-relaxed text-center">{tierData.silver.perks.map((p, i) => <p key={i} className="text-center">{p}</p>)}</td>
                  <td className="p-6 md:p-10 border-r border-slate-200 space-y-3 text-xs font-black text-slate-500 uppercase tracking-tighter leading-relaxed text-center">{tierData.gold.perks.map((p, i) => <p key={i} className="text-center">{p}</p>)}</td>
                  <td className="p-6 md:p-10 space-y-3 text-xs font-black text-slate-500 uppercase tracking-tighter leading-relaxed text-center">{tierData.diamond.perks.map((p, i) => <p key={i} className="text-center">{p}</p>)}</td>
                </tr>
                <tr className="bg-slate-100 text-center">
                  <td className="p-6 border-r border-slate-200 text-center"></td>
                  <td className="p-6 border-r border-slate-200 text-center"><button onClick={() => handleJoinClick('silver')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-900 transition-all text-center">Select</button></td>
                  <td className="p-6 border-r border-slate-200 text-center"><button onClick={() => handleJoinClick('gold')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-900 transition-all">Select</button></td>
                  <td className="p-6 text-center"><button onClick={() => handleJoinClick('diamond')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-900 transition-all text-center">Select</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-16 text-center px-4">
            <p className="text-slate-400 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] max-w-2xl mx-auto leading-relaxed text-center">
              * Actual odds of winning depend on the total number of eligible entries received. No purchase necessary. See official rules for details.
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
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-6 md:p-8 text-left flex justify-between items-center text-left" aria-expanded={openFaq === i}>
                  <span className="font-black text-indigo-950 text-base md:text-lg uppercase pr-4 text-left">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
                {openFaq === i && <div className="p-6 md:p-8 pt-0 text-slate-600 font-medium leading-relaxed text-left">{faq.a}</div>}
              </div>
            ))}
            {showAllFaqs && secondaryFaqs.map((faq, i) => (
              <div key={`sec-${i}`} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-top-4 text-left">
                <button onClick={() => setOpenFaq(openFaq === `sec-${i}` ? null : `sec-${i}`)} className="w-full p-6 md:p-8 text-left flex justify-between items-center transition-colors text-left" aria-expanded={openFaq === `sec-${i}`}>
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
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-right">
              <button onClick={() => setCurrentView('privacy')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => setCurrentView('terms')} className="hover:text-white transition-colors">Terms</button>
              <button onClick={() => setCurrentView('contact')} className="hover:text-white transition-colors">Contact</button>
            </div>
        </div>
        <p className="text-[10px] leading-relaxed max-w-4xl opacity-40 uppercase tracking-widest font-bold mx-auto text-center">DISCLOSURE: Amplify sweepstakes are subject to official rules. Actual odds of winning depend on the total number of eligible entries received. No purchase necessary to enter or win. Void where prohibited.</p>
      </footer>
    </div>
  );
};

export default App;