import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Heart, Trophy, CheckCircle, Info, Star, Building, 
  ChevronDown, ChevronUp, Play, Presentation, ExternalLink, 
  CreditCard, FileText, Award, Users, Gift, Sparkles, Check, 
  MapPin, BarChart3, ArrowRight, X, Search, Menu, ArrowLeft,
  Mail, Phone, Globe
} from 'lucide-react';

const INTEGRATION_CONFIG = {
  // SECURITY NOTE: In production, do not use a hardcoded link. 
  // Call your backend to generate a Stripe Checkout Session ID.
  stripeCheckoutUrl: "#", 
  jotformId: "241234567890123", // Replace with your actual Form ID
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
  // Views: 'home', 'checkout', 'privacy', 'terms', 'contact'
  const [currentView, setCurrentView] = useState('home'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // UX Improvement: Default to Silver (lowest friction) instead of Diamond
  const [selectedTier, setSelectedTier] = useState('silver');
  
  const [openFaq, setOpenFaq] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState("General Circle");

  // Reset scroll when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentView]);

  // Handle JotForm submission success via postMessage
  useEffect(() => {
    const handleJotFormMessage = (e) => {
      // JotForm sends various messages, checking for submission ID is a common validation
      if (typeof e.data === 'object' && (e.data.action === 'submission-completed' || e.data.submission_id)) {
        setSignupSuccess(true);
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
      setSignupSuccess(true);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
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

  // --- CHECKOUT PAGE COMPONENT ---
  const CheckoutPage = () => (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <SecondaryNavbar />
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          {signupSuccess ? (
             <div className="bg-white rounded-[3rem] shadow-xl p-12 md:p-24 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
                <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10"><CheckCircle size={64} className="text-green-600" /></div>
                <h4 className="text-4xl md:text-5xl font-black text-indigo-950 mb-6 italic uppercase tracking-tighter">You're in.</h4>
                <p className="text-slate-500 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed mb-12">
                  We've reserved your spot{selectedCommunity !== 'General Circle' ? ` in the ${selectedCommunity} community` : ''}. We will notify you once the circle reaches capacity.
                </p>
                <button onClick={() => setCurrentView('home')} className="px-12 py-5 bg-indigo-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Return Home</button>
             </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
              {/* Left Column: Form */}
              <div className="lg:col-span-7 space-y-8">
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                   <h2 className="text-3xl font-black uppercase italic text-indigo-950 mb-8 tracking-tight">Secure Your Spot</h2>
                   
                   <div className="mb-8">
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Select Community</label>
                      <div className="relative">
                        <select 
                          value={selectedCommunity} 
                          onChange={(e) => setSelectedCommunity(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                        >
                          {Object.keys(communityData).map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20}/>
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
                          <p className="text-sm text-indigo-900/60 mb-8 max-w-xs font-medium">Secure your place in the {selectedCommunity} Circle. You will be notified before your first charge.</p>
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
                             Your first monthly contribution will only be processed once this circle reaches full capacity.
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

  // --- ROUTING LOGIC ---
  if (currentView === 'checkout') return <CheckoutPage />;
  if (currentView === 'contact') return <ContactPage />;
  if (currentView === 'privacy') return <ContentPage title="Privacy Policy" content={<><p className="mb-6">At Amplify, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you join our giving circles.</p><h3 className="text-2xl font-black text-indigo-900 mb-4 mt-8 uppercase tracking-tight">Information We Collect</h3><p className="mb-4">We collect information necessary to process your contributions and membership, including name, email address, and payment information. We do not sell your personal data to third parties.</p><h3 className="text-2xl font-black text-indigo-900 mb-4 mt-8 uppercase tracking-tight">Security</h3><p>We implement industry-standard security measures to protect your data. Payment processing is handled by secure third-party providers.</p></>} />;
  if (currentView === 'terms') return <ContentPage title="Terms of Service" content={<><p className="mb-6">Welcome to Amplify. By accessing or using our platform, you agree to be bound by these Terms of Service.</p><h3 className="text-2xl font-black text-indigo-900 mb-4 mt-8 uppercase tracking-tight">Membership</h3><p className="mb-4">Membership in an Amplify circle involves a recurring monthly contribution. You may cancel your membership at any time prior to the monthly charge.</p><h3 className="text-2xl font-black text-indigo-900 mb-4 mt-8 uppercase tracking-tight">Charitable Contributions</h3><p>All contributions are directed to verified 501(c)(3) organizations. While we vet all beneficiaries, Amplify does not warrant the activities of third-party charities.</p></>} />;

  // --- LANDING PAGE ---
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 scroll-smooth">
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
          <button onClick={() => scrollToSection('top')} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left" aria-label="Go to Top">
            <div className="bg-indigo-900 text-white p-1.5 rounded-xl">
              <LogoIcon />
            </div>
            <span className="text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left">
            <button onClick={() => scrollToSection('how')} className="hover:text-indigo-900 transition-colors uppercase tracking-[0.2em]">How it works</button>
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
              <div className="aspect-[16/11.25] w-full rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-[8px] md:border-[12px] border-white bg-slate-900 relative">
                <video 
                  className="w-full h-full object-cover"
                  controls 
                  playsInline
                  aria-label="Promotional video about Amplify"
                  onError={(e) => {
                      // Fix: Provide better error logging and UI feedback
                      console.error("Video failed to load");
                      e.currentTarget.style.display = 'none';
                  }}
                >
                  {/* Using relative path to correct for potential subfolder deployment issues */}
                  <source src="amplify-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              
              {/* Updated Collective Goal Box: Sticker Style at Top-Left */}
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
                 onError={(e) => { e.currentTarget.style.display='none'; }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent"></div>
               
               {/* Updated Logo Overlay - Reduced height (py-1) but kept width (w-[70%]) and logo size */}
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
            {Object.keys(communityData).map((name, i) => (
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
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{communityData[name].members} Givers</p>
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
                        <button onClick={() => { handleJoinClick(selectedTier); }} className="px-10 py-3 bg-white text-indigo-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all flex items-center gap-3 shadow-lg text-center">Join Community <ArrowRight size={14}/></button>
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
                        <button onClick={() => { handleJoinClick(selectedTier); setActiveCommunity(null); }} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 text-center">Join Community <ArrowRight size={14}/></button>
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
                    <button onClick={() => handleJoinClick(tier)} className="w-full py-4 bg-indigo-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 text-center">Select {tier} impact</button>
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
                  <td className="p-6 border-r border-slate-200 text-center"><button onClick={() => handleJoinClick('silver')} className="px-8 py-3 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all text-center">Select</button></td>
                  <td className="p-6 border-r border-slate-200 text-center"><button onClick={() => handleJoinClick('gold')} className="px-8 py-3 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all">Select</button></td>
                  <td className="p-6 text-center"><button onClick={() => handleJoinClick('diamond')} className="px-8 py-3 bg-indigo-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all text-center">Select</button></td>
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
        <p className="text-[10px] leading-relaxed max-w-4xl opacity-40 uppercase tracking-widest font-bold mx-auto text-center">DISCLOSURE: Amplify is currently in pre-launch. Monthly contributions begin only once your circle reaches capacity. Official rules provided upon activation.</p>
      </footer>
    </div>
  );
};

export default App;