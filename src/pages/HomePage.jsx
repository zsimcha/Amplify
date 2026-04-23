import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Menu, X, Heart, Building, ChevronUp, ChevronDown, HelpCircle, TrendingUp, Gift } from 'lucide-react';
import { LogoIcon } from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';

const HomePage = ({ appData }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // Scrollytelling State for "How it Works"
  const howSectionRef = useRef(null);
  const [howScroll, setHowScroll] = useState(0);
  const scrollTimeout = useRef(null);

  // Seamless Scroll Restoration (Fires BEFORE the browser paints)
  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem('homeScrollPosition');
    if (savedScroll && savedScroll !== '0') {
      const targetScroll = parseInt(savedScroll, 10);
      window.scrollTo(0, targetScroll);
      
      // Fallback lock-in to prevent any minor layout shifts from bouncing it back up
      requestAnimationFrame(() => {
        window.scrollTo(0, targetScroll);
      });
    }
  }, []);

  // Scroll Handling for Navbar & Animations
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // "How It Works" Scrollytelling Logic
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

      // Debounce saving scroll position to avoid capturing '0' when navigating away
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        sessionStorage.setItem('homeScrollPosition', window.scrollY);
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 

    // Intersection Observer for scroll reveal animations (Fades in once, stays permanently)
    const observerOnce = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observerOnce.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });

    // Apply to all elements
    document.querySelectorAll('.reveal').forEach((el) => observerOnce.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      observerOnce.disconnect();
    };
  }, []);

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
    // Explicitly lock in the scroll position before routing kicks in
    sessionStorage.setItem('homeScrollPosition', window.scrollY);
    navigate('/checkout', { state: { tier } }); 
  };

  const handleCardClick = (tier, e) => {
    if (window.innerWidth >= 768) {
      handleJoinClick(tier, e);
    }
  };

  // Flawless Math for How It Works line sync 
  const lineProgress = Math.max(0, Math.min(100, (howScroll - 0.02) * 130));
  const showStep1 = howScroll > 0.01;   
  const showStep2 = lineProgress >= 44; 
  const showStep3 = lineProgress >= 80; 

  const primaryFaqs = [
    { q: "What is Amplify?", a: "Amplify is a community-powered giving platform that pools monthly Tzedakah to create greater collective impact. Members give consistently, support new charitable organizations each month, and receive access to optional appreciation perks as a thank-you for their giving." },
    { q: "What's the 400-member thing about?", a: "Each circle has exactly 400 spots. The moment a circle fills up, the massive monthly prize drawing goes live for those members. It keeps the odds incredible." },
    { q: "Why prizes? Doesn't that take from the charity?", a: "It's actually the opposite. The prizes are the engine. By allocating a portion of the pool to massive rewards, we attract and keep thousands of donors who might otherwise give sporadically. This allows us to deliver transformational, six-figure grants every month." },
    { q: "Where does my money actually go?", a: "The majority of your gift goes directly to our charity partners, while a portion funds our prize pool and operations. Offering these prizes allows us to attract thousands of consistent monthly donors." }
  ];
  
  const secondaryFaqs = [
    { q: "Who selects the charities?", a: "Charities are properly vetted in advance — financials, impact, the works. We focus on organizations where a single large grant can reach a critical milestone." },
    { q: "Why not just give directly?", a: "Direct giving is powerful and encouraged. Amplify exists for those who want their consistent monthly giving to combine into a massive, coordinated grant that changes the game." },
    { q: "Is my contribution tax-deductible?", a: "Donations benefiting a 501(c)(3) organization are tax-deductible in the US to the extent permitted by law. Prize winnings may be subject to standard tax regulations." },
    { q: "When am I charged?", a: "Your first contribution is processed immediately upon joining. Subsequent recurring donations will be charged on the same day each month." },
    { q: "Can I cancel at any time?", a: "Yes. Memberships can be paused or canceled at any time before your next scheduled monthly charge." }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 scroll-smooth relative" onClick={() => setActiveTooltip(null)}>
      <div id="top" className="absolute top-0"></div>

      {/* Dynamic Navbar */}
      <nav className={`fixed w-full z-40 top-0 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm py-0' : 'bg-transparent py-2'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => scrollToSection('top')} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left" aria-label="Go to Top">
            <div className={`p-1.5 rounded-lg transition-all duration-300 ${isScrolled ? 'bg-indigo-950 text-white' : 'bg-white/15 backdrop-blur-sm text-white'}`}>
              <LogoIcon />
            </div>
            <span className={`text-xl md:text-2xl font-black tracking-tighter uppercase transition-colors ${isScrolled ? 'text-indigo-950' : 'text-white'}`}>
              Amplify
            </span>
          </button>
          
          <div className={`hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-left transition-colors ${isScrolled ? 'text-slate-500' : 'text-indigo-200'}`}>
            <button onClick={() => scrollToSection('how')} className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>How it works</button>
            <button onClick={() => scrollToSection('why')} className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>Why Amplify</button>
            <button onClick={() => scrollToSection('beneficiary')} className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>Beneficiary</button>
            <button onClick={() => scrollToSection('tiers')} className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>The Circles</button>
            <button onClick={() => scrollToSection('faq')} className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>FAQ</button>
          </div>
          
          <button className={`md:hidden p-2 transition-colors ${isScrolled ? 'text-indigo-900' : 'text-white'}`} onClick={() => setIsMenuOpen(true)} aria-label="Open Menu">
            <Menu size={24} />
          </button>
          
          <button onClick={() => scrollToSection('tiers')} className="hidden md:block bg-amber-400 text-slate-900 px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-amber-300 transition-all uppercase tracking-widest shadow-lg shadow-amber-400/20">
            Join the Circle
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white animate-in slide-in-from-right duration-300 flex flex-col" role="dialog">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 shrink-0 text-left">
                <span className="text-xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-indigo-950 p-2"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-base font-bold text-slate-900 uppercase tracking-widest text-left">
                <button onClick={() => { setIsMenuOpen(false); scrollToSection('how'); }} className="text-left border-b border-slate-50 pb-3">How it works</button>
                <button onClick={() => { setIsMenuOpen(false); scrollToSection('why'); }} className="text-left border-b border-slate-50 pb-3">Why Amplify</button>
                <button onClick={() => { setIsMenuOpen(false); scrollToSection('beneficiary'); }} className="text-left border-b border-slate-50 pb-3">Beneficiary</button>
                <button onClick={() => { setIsMenuOpen(false); scrollToSection('tiers'); }} className="text-left border-b border-slate-50 pb-3">The Circles</button>
                <button onClick={() => { setIsMenuOpen(false); scrollToSection('faq'); }} className="text-left border-b border-slate-50 pb-3">FAQ</button>
            </div>
            <div className="p-6 border-t border-slate-50 shrink-0 text-left">
                <button onClick={() => { setIsMenuOpen(false); scrollToSection('tiers'); }} className="w-full py-5 bg-amber-400 text-slate-900 rounded-lg font-bold uppercase tracking-widest text-sm shadow-xl shadow-amber-400/20">Join the Circle</button>
            </div>
        </div>
      )}

      {/* DARK HERO */}
      <header className="bg-indigo-950 pt-24 md:pt-28 pb-0 flex flex-col overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 pb-4 md:pb-6 relative z-10 flex-grow">
          <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-center">
            
            <div className="text-left lg:col-span-6 animate-hero">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-6 leading-[0.9] uppercase">
                Give Together.<br/>
                <span className="text-amber-400 italic">Amplify</span>
                <span className="text-amber-400 italic"> Your Impact.</span>
              </h1>
              
              <p className="text-indigo-200 text-lg md:text-xl mb-8 font-medium leading-relaxed max-w-2xl">
                Amplify pools your monthly giving with an exclusive circle of donors to make a massive impact. <strong className="text-white">Win Up To $100,000</strong> <em className="text-white">every month</em> as a reward for your commitment.
              </p>
              
              <div className="space-y-4 mb-10 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></div>
                  <span className="text-sm md:text-base font-medium text-indigo-100 leading-snug">Your monthly Tzedakah becomes part of a six-figure grant</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></div>
                  <span className="text-sm md:text-base font-medium text-indigo-100 leading-snug">Drawings are capped at only 400 members for incredible odds</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></div>
                  <span className="text-sm md:text-base font-medium text-indigo-100 leading-snug">Up to a 1 in 25 chance to win</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 text-left">
                <button onClick={() => scrollToSection('tiers')} className="w-full md:w-auto px-10 py-4 bg-amber-400 text-slate-900 rounded-lg font-bold text-sm md:text-base hover:bg-amber-300 transition-all uppercase tracking-widest shadow-lg shadow-amber-400/20">
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

        {/* Pewter Gray Stats Ribbon */}
        <div className="w-full flex flex-col mt-auto relative z-10 reveal">
          <div className="w-full h-12 md:h-16 bg-gradient-to-b from-indigo-950 to-slate-700"></div>
          
          <div className="w-full bg-slate-700 border-b border-slate-600 pb-8 md:pb-10 pt-2">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 md:gap-x-8 items-center justify-items-center">
              {[
                { top: "Up to", num: "$100K", label: "Monthly Prize", isGold: true },
                { top: "", num: "$200K+", label: "Monthly Prizes", isGold: false },
                { top: "Up to", num: "1/25", label: "Winning Odds", isGold: true },
                { top: "Goal", num: "$5M+", label: "Yearly to Charity", isGold: false }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center w-full">
                  <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 min-h-[14px] md:min-h-[16px] leading-none ${stat.isGold ? 'text-amber-400/90' : 'text-slate-300'}`}>{stat.top}</p>
                  <p className={`text-3xl sm:text-4xl md:text-5xl font-black tabular-nums leading-none tracking-tighter ${stat.isGold ? 'text-amber-400' : 'text-white'}`}>{stat.num}</p>
                  <p className={`text-[9px] md:text-[11px] font-bold uppercase tracking-widest mt-2 md:mt-3 ${stat.isGold ? 'text-amber-400/90' : 'text-slate-300'}`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* How it Works Section (SMOOTH SCROLLYTELLING ANIMATION) */}
      <section id="how" className="relative bg-white border-t border-slate-100">
        <div ref={howSectionRef} className="h-[200vh]">
          <div className="sticky top-16 md:top-[80px] max-w-7xl mx-auto px-4 overflow-hidden pt-8 pb-12 md:pt-16 md:pb-16">
            
            <div className="mb-10 md:mb-20 text-center md:text-left transition-opacity duration-500">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">The Mechanics</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-tight md:leading-tight">
                Strategic giving, simplified.<br className="hidden md:block"/>
                <span className="block mt-3 md:mt-0 md:inline md:ml-2 italic text-indigo-600">And amplified.</span>
              </h2>
            </div>
            
            <div className="relative">
              {/* Desktop Horizontal Line (Starts explicitly from the right of 01) */}
              <div className="hidden md:block absolute top-[52px] left-[10%] right-[16%] h-0.5 bg-transparent z-0">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-[width] duration-100 ease-linear" 
                  style={{ width: `${lineProgress}%` }}
                ></div>
              </div>

              {/* Mobile Vertical Line */}
              <div className="md:hidden absolute top-[15%] bottom-[15%] left-1/2 -translate-x-1/2 w-0.5 bg-transparent z-0">
                <div 
                  className="w-full bg-indigo-500 rounded-full transition-[height] duration-100 ease-linear" 
                  style={{ height: `${lineProgress}%` }}
                ></div>
              </div>
              
              <div className="flex flex-col md:grid md:grid-cols-3 gap-16 md:gap-12 relative z-10">
                  {/* Step 1 */}
                  <div className={`flex flex-col items-center md:items-start text-center md:text-left transition-all duration-[250ms] ease-out transform ${showStep1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="text-6xl md:text-8xl font-black text-slate-200 leading-none select-none mb-3 md:mb-5 relative z-10 tabular-nums bg-white px-2 rounded-xl">01</div>
                    <div className="bg-white px-2 py-1 relative z-10">
                      <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">Everyone pools in</h3>
                      <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">Donors join a circle and combine their monthly giving to create one massive fund.</p>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className={`flex flex-col items-center md:items-start text-center md:text-left transition-all duration-[250ms] ease-out transform ${showStep2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="text-6xl md:text-8xl font-black text-slate-200 leading-none select-none mb-3 md:mb-5 relative z-10 tabular-nums bg-white px-2 rounded-xl">02</div>
                    <div className="bg-white px-2 py-1 relative z-10">
                      <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">One grant, One charity</h3>
                      <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">The whole thing goes directly to one vetted nonprofit as a single, massive gift.</p>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div className={`flex flex-col items-center md:items-start text-center md:text-left transition-all duration-[250ms] ease-out transform ${showStep3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="text-6xl md:text-8xl font-black text-slate-200 leading-none select-none mb-3 md:mb-5 relative z-10 tabular-nums bg-white px-2 rounded-xl">03</div>
                    <div className="bg-white px-2 py-1 relative z-10">
                      <h3 className="text-lg md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">Monthly Rewards</h3>
                      <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">The moment 400 members join a circle, the monthly drawings go live with odds up to 1 in 25.</p>
                    </div>
                  </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why Amplify Section */}
      <section id="why" className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-12 gap-12 md:gap-16">
            
            {/* Sticky Left Column */}
            <div className="md:col-span-4 reveal">
              <div className="md:sticky md:top-32">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">
                  The Amplify Advantage
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 italic tracking-tight leading-tight">
                  Why pooling changes everything.
                </h2>
                <button
                  onClick={() => scrollToSection('tiers')}
                  className="hidden md:block mt-10 px-10 py-4 bg-slate-900 text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-indigo-900 transition-colors shadow-lg"
                >
                  Join the Circle
                </button>
              </div>
            </div>

            {/* Right Column: Staggered Reveal Items */}
            <div className="md:col-span-8 flex flex-col divide-y divide-slate-200">
              
              {[
                {
                  icon: <TrendingUp size={24} className="text-indigo-600" />,
                  title: "The Multiplier Effect",
                  body: "We believe in going big. Uniting a massive community of donors creates a multiplier effect, funding huge, transformational projects that wouldn't have been possible otherwise."
                },
                {
                  icon: <Building size={24} className="text-amber-500" />,
                  title: "A Real, Verified Nonprofit",
                  body: "Never wonder where your money goes. Every charity is vetted, financials, impact reports, the works. We look for organizations where one large grant can make a big difference, not just cover admin costs."
                },
                {
                  icon: <Check size={24} className="text-indigo-600" />,
                  title: "Effortless Giving",
                  body: "Consistency is the hardest part of philanthropy. Your membership puts your giving on autopilot, ensuring you make a powerful impact every month without a second thought."
                },
                {
                  icon: <Gift size={24} className="text-amber-500" />,
                  title: "The Ultimate Win-Win",
                  body: "Giving consistently is hard. So we made it fun! When your circle fills, a massive drawing goes live and everyone in it has a real shot at winning big."
                }
              ].map((item, i) => (
                <div key={i} className="py-8 md:py-10 flex gap-6 md:gap-8 group reveal" style={{ transitionDelay: `${i * 120}ms` }}>
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:border-indigo-200 group-hover:shadow-md">
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

      {/* Beneficiary Section */}
      <section id="beneficiary" className="py-12 md:py-16 bg-slate-900 px-4 text-white">
        <div className="max-w-7xl mx-auto reveal">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="flex flex-col justify-center text-center md:text-left">
              <p className="text-[10px] md:text-xs font-bold text-indigo-400 uppercase tracking-[0.4em] mb-4">Who We're Helping This Month</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 md:mb-8 tracking-tight uppercase italic">Chai Lifeline</h2>
              <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed mb-8 md:mb-10">
                Chai Lifeline is there for families the moment a child is diagnosed with cancer or a life-threatening illness — transportation, counseling, summer camp, crisis support. Whatever a family needs. Our grant goes directly to making sure no child or family faces this alone.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 justify-center md:justify-start">
                <div className="flex items-center gap-3">
                  <Building size={20} className="text-slate-400" />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-300">Verified 501(c)(3) Nonprofit</p>
                </div>
                <div className="hidden sm:block w-px h-6 bg-slate-700"></div>
                <div className="flex items-center gap-3">
                  <Heart size={20} className="text-red-400 fill-current" />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-300">We're raising $400,000 for them</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-2xl min-h-[300px] md:min-h-[450px] border border-slate-700 transition-transform duration-500 hover:scale-[1.02]">
               <img src="/impact-photo.jpg" alt="Impact" className="absolute inset-0 w-full h-full object-cover opacity-70" onError={(e) => { e.currentTarget.style.display='none'; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white py-3 px-8 rounded-lg flex items-center justify-center shadow-xl">
                  <img src="/ChaiLifeline.png" alt="Chai Lifeline Logo" className="h-12 w-auto object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section id="tiers" className="py-20 md:py-28 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase mb-4">Pick Your Impact</h2>
            <p className="text-slate-500 text-sm md:text-base font-bold uppercase tracking-widest">Pick a circle. Set up your monthly gift. Give every month, automatically.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {['silver', 'gold', 'diamond'].map((tier, index) => {
              
              const totalPool = (appData.tierData[tier].price * 400).toLocaleString();
              const headerColor = tier === 'silver' ? 'text-slate-500' : tier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]';
              const dotColor = tier === 'silver' ? 'bg-slate-400' : tier === 'gold' ? 'bg-[#eab308]' : 'bg-[#818cf8]';

              return (
                <div 
                  key={tier} 
                  onClick={(e) => handleCardClick(tier, e)}
                  className="bg-white border border-slate-200 rounded-2xl flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 reveal md:cursor-pointer group/card" 
                  style={{ transitionDelay: `${index * 150}ms` }}
                >

                  <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                      <span className={`text-xs font-black uppercase tracking-widest ${headerColor}`}>
                        {tier} Circle
                      </span>
                    </div>
                    {/* Restored Header Price */}
                    <span className="text-base font-black text-slate-900">
                      ${appData.tierData[tier].price.toLocaleString()}
                      <span className="text-xs font-semibold text-slate-400">/mo</span>
                    </span>
                  </div>

                  <div className="px-6 pt-8 pb-6 text-center flex flex-col items-center justify-center bg-white">
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Monthly Grand Prize
                    </p>
                    <div className="w-full text-center">
                        <p className={`text-5xl md:text-6xl font-black tracking-tighter leading-none mx-auto ${headerColor}`}>
                          {appData.tierData[tier].prize}
                        </p>
                    </div>
                  </div>

                  {/* Restored Odds & Impact Summary Fonts */}
                  <div className="mx-6 py-4 border-t border-b border-slate-200 flex flex-col gap-4 relative z-20">
                    <div className="flex justify-between items-center relative">
                      <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        Grand Prize Odds*
                      </span>
                      <span className="text-sm md:text-base font-black text-slate-700 flex items-center gap-1.5">
                        <span className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest">Up to</span> 1 / 400
                      </span>
                    </div>

                    <div className="flex justify-between items-center relative">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Total Odds*
                        </span>
                        <div className="relative inline-flex items-center" onMouseEnter={() => setActiveTooltip(`${tier}-tot`)} onMouseLeave={() => setActiveTooltip(null)} onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === `${tier}-tot` ? null : `${tier}-tot`); }}>
                          <HelpCircle size={14} className="text-slate-400 cursor-pointer" />
                          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 max-w-[80vw] bg-slate-900 text-white p-3 rounded-xl shadow-xl text-[10px] leading-relaxed font-medium normal-case transition-all duration-200 z-[100] text-center pointer-events-none ${activeTooltip === `${tier}-tot` ? 'opacity-100 visible' : 'opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible'}`}>
                              The estimated probability of winning any prize when the circle fills.
                              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-slate-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm md:text-base font-black text-slate-700 flex items-center gap-1.5">
                        <span className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest">Up to</span> {appData.tierData[tier].totalOdds}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-1 pt-3 border-t border-slate-200">
                      <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Combined Tzedakah Pool
                      </span>
                      <span className="text-base md:text-lg font-black text-slate-700">
                        ${totalPool}
                      </span>
                    </div>
                  </div>

                  {/* Restored Parsed Prizes Fonts */}
                  <div className="px-6 py-5 flex-grow bg-white">
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Other Monthly Prizes
                    </p>
                    <div className="space-y-0 relative z-10">
                      {appData.tierData[tier].otherPrizes.map((p, i) => {
                        const isMultiple = p.includes('x ');
                        let qty = '1 winner';
                        let amount = p;
                        if (isMultiple) {
                           const parts = p.split('x ');
                           qty = `${parts[0]} winners`; 
                           amount = parts[1];
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

                  <div className="p-5 pt-3 bg-white rounded-b-2xl relative z-10 overflow-hidden">
                    <button
                      onClick={(e) => handleJoinClick(tier, e)}
                      className="w-full py-3.5 rounded-lg font-bold text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-wider lg:tracking-widest transition-all whitespace-nowrap bg-slate-900 text-white hover:bg-indigo-900 shadow-lg group-hover/card:bg-indigo-900"
                    >
                      Join {tier.charAt(0).toUpperCase() + tier.slice(1)} Circle • ${appData.tierData[tier].price.toLocaleString()}/mo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-10 text-center px-4 reveal">
            <p className="text-slate-400 text-[10px] font-medium leading-relaxed text-center max-w-2xl mx-auto">
              * Actual odds of winning depend on the total number of eligible entries received. No purchase necessary. See <Link to="/rules" className="underline hover:text-slate-600 transition-colors">official rules</Link> for details.
            </p>
          </div>
        </div>
      </section>

      {/* Upgraded CTA Section */}
      <section className="py-10 md:py-14 bg-slate-900 px-4 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10 reveal">
          <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            Your circle is waiting.
          </h2>
          <p className="text-slate-300 font-medium text-lg md:text-xl mb-10 leading-relaxed">
            Pick a circle. Give every month.<br />
            And maybe win up to $100,000 while you're at it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollToSection('tiers')} className="px-10 py-4 bg-amber-400 text-slate-900 rounded-lg font-bold text-sm md:text-base hover:bg-amber-300 transition-colors uppercase tracking-widest shadow-lg shadow-amber-400/10">
              Join the Circle
            </button>
            <button onClick={() => scrollToSection('faq')} className="px-10 py-4 bg-transparent border border-slate-700 text-slate-300 rounded-lg font-bold text-sm md:text-base hover:border-slate-500 hover:text-white transition-colors uppercase tracking-widest">
              Have Questions?
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-32 bg-slate-50 border-t border-slate-100 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="reveal">
            <h2 className="text-4xl md:text-5xl font-black mb-3 md:mb-4 text-slate-900 tracking-tight">Questions?</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-10 md:mb-12 text-[10px] md:text-xs">Everything you need to know</p>
          </div>
          
          <div className="space-y-4 text-left">
            {primaryFaqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-200 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                  className="w-full p-6 md:p-8 text-left flex justify-between items-center outline-none bg-white" 
                  aria-expanded={openFaq === i}
                >
                  <span className="font-bold text-slate-900 text-sm md:text-base pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={20} className="md:w-6 md:h-6 shrink-0 text-indigo-600" /> : <ChevronDown size={20} className="md:w-6 md:h-6 shrink-0 text-slate-400" />}
                </button>
                {openFaq === i && <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 text-slate-600 font-medium leading-relaxed text-sm md:text-base bg-white">{faq.a}</div>}
              </div>
            ))}
            {showAllFaqs && secondaryFaqs.map((faq, i) => (
              <div key={`sec-${i}`} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm animate-in fade-in slide-in-from-top-4 transition-all hover:shadow-md hover:border-indigo-200">
                <button 
                  onClick={() => setOpenFaq(openFaq === `sec-${i}` ? null : `sec-${i}`)} 
                  className="w-full p-6 md:p-8 text-left flex justify-between items-center outline-none bg-white" 
                  aria-expanded={openFaq === `sec-${i}`}
                >
                  <span className="font-bold text-slate-900 text-sm md:text-base pr-4">{faq.q}</span>
                  {openFaq === `sec-${i}` ? <ChevronUp size={20} className="md:w-6 md:h-6 shrink-0 text-indigo-600" /> : <ChevronDown size={20} className="md:w-6 md:h-6 shrink-0 text-slate-400" />}
                </button>
                {openFaq === `sec-${i}` && <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 text-slate-600 font-medium leading-relaxed text-sm md:text-base bg-white">{faq.a}</div>}
              </div>
            ))}
          </div>
          <button onClick={() => setShowAllFaqs(!showAllFaqs)} className="mt-10 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-50 transition-all shadow-sm reveal">
            {showAllFaqs ? "See Fewer Questions" : "See All Questions"}
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;