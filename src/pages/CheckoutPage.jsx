// src/pages/CheckoutPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, CheckCircle, ChevronDown, ChevronUp, Search, Plus, AlertCircle, Check, CreditCard, Landmark, Smartphone, Lock, Info } from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", 
  "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", 
  "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", 
  "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

// Stripe processing fee for cards. Adjust to match your actual Stripe contract.
const STRIPE_FEE_RATE = 0.029;
const STRIPE_FEE_FIXED = 0.30;

const CheckoutPage = ({ appData, setAppData }) => {
  const location = useLocation();
  const initialTier = location.state?.tier || 'silver';

  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [selectedCommunity, setSelectedCommunity] = useState("General");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const [checkoutForm, setCheckoutForm] = useState({ 
    fullName: '', 
    displayName: '', 
    isAnonymous: false,
    email: '', 
    phone: '', 
    address: '', 
    city: '', 
    state: '', 
    zipCode: '' 
  });
  const [hasEditedDisplayName, setHasEditedDisplayName] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false); 
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // ---- NEW: Payment state ----
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'bank' | 'wallet'
  const [coverFee, setCoverFee] = useState(true);
  const [billingSameAsAccount, setBillingSameAsAccount] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    line1: '', line2: '', city: '', state: '', zipCode: ''
  });

  // ---- Mobile summary collapse state with auto-close on scroll ----
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // When the summary is expanded on mobile, collapse it on scroll so the user
  // can scroll the form without the panel awkwardly staying open underneath.
  useEffect(() => {
    if (!summaryExpanded) return;
    const onScroll = () => setSummaryExpanded(false);
    window.addEventListener('scroll', onScroll, { passive: true, once: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [summaryExpanded]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); 
    const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toTitleCaseForCommunity = (str) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  
  const handlePhoneChange = (e) => {
    const input = e.target.value;
    if (/^[\d\s()+-]*$/.test(input) || input === '') {
       setCheckoutForm({...checkoutForm, phone: input});
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setCheckoutForm(prev => ({
      ...prev,
      fullName: newName,
      displayName: (!hasEditedDisplayName && !prev.isAnonymous) ? newName : prev.displayName
    }));
  };

  const handleAnonymousChange = (e) => {
    const isAnon = e.target.checked;
    setCheckoutForm(prev => ({
      ...prev,
      isAnonymous: isAnon,
      displayName: isAnon ? 'Anonymous' : (hasEditedDisplayName ? prev.displayName : prev.fullName)
    }));
  };

  const handleDisplayNameChange = (e) => {
    setHasEditedDisplayName(true);
    setCheckoutForm(prev => ({ ...prev, displayName: e.target.value }));
  };

  const filteredCommunities = appData.allCommunityNames.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  const exactMatch = appData.allCommunityNames.some(c => c.toLowerCase() === searchQuery.trim().toLowerCase());

  const handleCreateCommunity = () => {
     const rawName = searchQuery.trim();
     if (!rawName || rawName.length > 50) return; 
     const newName = toTitleCaseForCommunity(rawName);

     setSelectedCommunity(newName);
     setDropdownOpen(false); 
     setSearchQuery(''); 
     setFocusedIndex(-1);
  };

  const handleDropdownKeyDown = (e) => {
      if (!dropdownOpen) { if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); setDropdownOpen(true); } return; }
      const maxIndex = filteredCommunities.length + (!exactMatch && searchQuery.trim() !== '' ? 0 : -1);
      if (e.key === 'Escape') { setDropdownOpen(false); setFocusedIndex(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(prev => Math.min(prev + 1, maxIndex)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(prev => Math.max(prev - 1, 0)); }
      else if (e.key === 'Enter') {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredCommunities.length) { setSelectedCommunity(filteredCommunities[focusedIndex]); setDropdownOpen(false); setSearchQuery(''); setFocusedIndex(-1); } 
          else if (focusedIndex === filteredCommunities.length) { handleCreateCommunity(); }
      }
  };

  // ---- Pricing calculations ----
  const basePrice = appData.tierData[selectedTier].price;
  const processingFee = paymentMethod === 'bank' 
    ? 0 
    : (basePrice * STRIPE_FEE_RATE) + STRIPE_FEE_FIXED;
  const feeBeingCovered = (paymentMethod !== 'bank') && coverFee;
  const totalCharged = feeBeingCovered ? basePrice + processingFee : basePrice;

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    const zipRegex = /^\d{5}(-\d{4})?$/;
    const cleanPhone = checkoutForm.phone.replace(/\D/g, '');
    const isInvalidPhone = cleanPhone.length < 10 || /^(\d)\1{9}$/.test(cleanPhone); 
    
    if (!checkoutForm.fullName.trim()) errors.fullName = "Full name is required.";
    if (!checkoutForm.displayName.trim() && !checkoutForm.isAnonymous) errors.displayName = "Display name is required.";
    if (!emailRegex.test(checkoutForm.email)) errors.email = "Enter a valid email.";
    if (isInvalidPhone) errors.phone = "Enter a valid 10-digit phone number.";
    if (!checkoutForm.address.trim()) errors.address = "Address is required.";
    if (!checkoutForm.city.trim()) errors.city = "City is required.";
    if (!checkoutForm.state) errors.state = "Select a state.";
    if (!zipRegex.test(checkoutForm.zipCode)) errors.zipCode = "Enter a valid zip code.";

    // Billing address validation (only if user opted out of "same as above")
    if (!billingSameAsAccount) {
      if (!billingAddress.line1.trim()) errors.billingLine1 = "Billing address is required.";
      if (!billingAddress.city.trim()) errors.billingCity = "Billing city is required.";
      if (!billingAddress.state) errors.billingState = "Select a billing state.";
      if (!zipRegex.test(billingAddress.zipCode)) errors.billingZip = "Enter a valid billing zip.";
    }

    if (!agreedToTerms) errors.terms = "You must agree to the terms to proceed.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      // ============================================================
      // TODO: Stripe / Givinga Payment Integration
      // 
      // When ready to wire up:
      //  1. POST /partners/{accountId}/authenticate -> get jwt + Stripe publicKey
      //  2. POST /customers (Givinga) -> get customerId
      //  3. Confirm payment via Stripe's PaymentElement (it returns a paymentMethodId)
      //  4. POST /customers/{customerId}/checkout (or /payment-intents) with:
      //       mode: 'subscription'
      //       amount: basePrice * 100 (in cents)
      //       customerCoveringFee: coverFee
      //       paymentMethodId: <from Stripe>
      //  5. Then call the Supabase RPC below with the resulting Stripe customer id
      // 
      // For now we just fire the existing Supabase RPC.
      // ============================================================

      const { error } = await supabase.rpc('process_checkout', {
        p_full_name: checkoutForm.fullName,
        p_display_name: checkoutForm.displayName || checkoutForm.fullName, 
        p_is_anonymous: checkoutForm.isAnonymous, 
        p_email: checkoutForm.email,
        p_phone: checkoutForm.phone,
        p_address: checkoutForm.address,
        p_city: checkoutForm.city,
        p_state: checkoutForm.state,
        p_zip_code: checkoutForm.zipCode,
        p_tier: selectedTier,
        p_community_name: selectedCommunity
      });

      if (error) {
        console.error("Checkout Error:", error);
        throw new Error("Something went wrong processing your request. Please try again.");
      }

      // Optimistic UI Update with Community Race Condition Fix
      const tierPrice = appData.tierData[selectedTier].price;
      setAppData(prev => {
        const isNewCommunity = !prev.allCommunityNames.includes(selectedCommunity);
        const updatedNames = isNewCommunity 
            ? ["General", ...prev.allCommunityNames.filter(c => c !== "General"), selectedCommunity].sort((a, b) => a === "General" ? -1 : b === "General" ? 1 : a.localeCompare(b))
            : prev.allCommunityNames;

        return {
          ...prev,
          allCommunityNames: updatedNames,
          communities: {
            ...prev.communities,
            [selectedCommunity]: {
              ...prev.communities[selectedCommunity],
              members: (prev.communities[selectedCommunity]?.members || 0) + 1,
              monthly: (prev.communities[selectedCommunity]?.monthly || 0) + tierPrice,
              [selectedTier]: (prev.communities[selectedCommunity]?.[selectedTier] || 0) + 1
            }
          }
        };
      });
      
      setSignupSuccess(true);

    } catch (err) {
      setSubmitError(err.message || "An unexpected error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // SUMMARY CONTENT — used in both the desktop sticky card and the mobile expanded view.
  // Pulled from your existing summary box, so styling stays identical.
  // ============================================================================
  const SummaryContent = () => {
    const tierColor = selectedTier === 'silver' ? 'text-slate-300' : selectedTier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]';

    return (
      <>
        <div className="space-y-4 md:space-y-6">
          <div>
            <p className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Selected Circle</p>
            <p className={`text-2xl md:text-3xl font-black uppercase italic tracking-tighter ${tierColor}`}>{selectedTier}</p>
          </div>
          <div className="w-full h-px bg-white/10"></div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Monthly Gift</p>
              <p className="text-lg md:text-xl font-bold">${basePrice.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Grand Prize</p>
              <p className={`text-lg md:text-xl font-bold ${tierColor}`}>{appData.tierData[selectedTier].prize}</p>
            </div>
          </div>

          {/* Fee line — only when card/wallet selected with cover-fee on */}
          {feeBeingCovered && (
            <>
              <div className="w-full h-px bg-white/10"></div>
              <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] md:text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Processing Fee</p>
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">Covered</span>
                </div>
                <p className="text-sm md:text-base font-bold tabular-nums">+${processingFee.toFixed(2)}</p>
              </div>
            </>
          )}

          {/* Total */}
          <div className="w-full h-px bg-white/10"></div>
          <div className="flex justify-between items-center pt-1">
            <p className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Total / Month</p>
            <p className="text-2xl md:text-3xl font-black tabular-nums">${totalCharged.toFixed(2)}</p>
          </div>

          {/* Odds boxes */}
          <div className="w-full h-px bg-white/10"></div>
<div className="grid grid-cols-2 gap-3 md:gap-4">
  <div className="bg-white/5 p-3 rounded-xl">
    <p className="text-[10px] md:text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Grand Prize Odds</p>
    <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-300/60 leading-none mb-0.5">Up to</p>
    <p className="font-bold text-sm md:text-base">1 / 400</p>
  </div>
  <div className="bg-white/5 p-3 rounded-xl border border-indigo-400/30">
    <p className="text-[10px] md:text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">Winning Odds</p>
    <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-300/60 leading-none mb-0.5">Up to</p>
    <p className="font-bold text-sm md:text-base">{appData.tierData[selectedTier].totalOdds}</p>
  </div>
</div>        </div>

        <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 bg-indigo-900/50 rounded-xl md:rounded-2xl border border-indigo-800/50 text-center">
            <p className="text-[9px] md:text-[10px] text-indigo-200 font-medium leading-relaxed">
              Your contribution goes directly into the active pool. The drawing activates the moment your circle reaches 400 members.
            </p>
          </div>
          <p className="text-[10px] md:text-[11px] text-indigo-300/70 font-medium leading-relaxed text-center px-2">
  Actual odds of winning depend on the total number of eligible entries received. No purchase necessary. See <Link to="/rules" className="underline hover:text-indigo-200 transition-colors">official rules</Link> for details.
</p>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />

      {/* ============================================================
          MOBILE-ONLY: Sticky compact summary bar at the top
          z-40 so it always sits above page content (community dropdown is z-30)
          ============================================================ */}
      {!signupSuccess && (
        <div className="lg:hidden sticky top-12 z-40 bg-indigo-950 text-white shadow-md">
          <button 
            type="button"
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
            aria-expanded={summaryExpanded}
            aria-controls="mobile-summary-detail"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${selectedTier === 'silver' ? 'bg-slate-300' : selectedTier === 'gold' ? 'bg-[#eab308]' : 'bg-[#818cf8]'}`}></div>
              <div className="min-w-0">
                <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${selectedTier === 'silver' ? 'text-slate-300' : selectedTier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]'}`}>{selectedTier} Circle</p>
                <p className="text-sm font-bold truncate">${totalCharged.toFixed(2)}<span className="font-medium text-indigo-300">/mo</span></p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest">{summaryExpanded ? 'Hide' : 'Details'}</span>
              {summaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>
          {summaryExpanded && (
            <div id="mobile-summary-detail" className="px-4 pb-5 pt-2 border-t border-indigo-900 animate-in slide-in-from-top-2 duration-200">
              {SummaryContent()}
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-20 flex-grow w-full">
        <div className="max-w-5xl mx-auto">
          {signupSuccess ? (
            <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-xl p-8 md:p-24 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
                <div className="bg-green-100 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-10"><CheckCircle size={48} className="text-green-600 md:w-16 md:h-16" /></div>
                <h4 className="text-3xl md:text-5xl font-black text-indigo-950 mb-4 md:mb-6 italic uppercase tracking-tighter">You're in.</h4>
                <p className="text-slate-500 text-base md:text-xl font-medium max-w-md mx-auto leading-relaxed mb-8 md:mb-12">
              Welcome to the {selectedCommunity} community. Your monthly impact starts today.

                </p>
                <Link to="/" className="inline-block px-12 py-4 md:py-5 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Return Home</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
              {/* ============================================================
                  FORM COLUMN
                  ============================================================ */}
              <div className="lg:col-span-7 space-y-6 md:space-y-8">
                <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-soft p-6 md:p-8 space-y-6">
                  <h2 className="text-2xl md:text-3xl font-black uppercase italic text-indigo-950 mb-6 md:mb-8 tracking-tight">Join Your Circle</h2>
                  
                  {/* ---- Community selector (existing) ---- */}
                  <div className="mb-6 md:mb-8 relative z-30">
                      <label id="community-label" className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 md:mb-3">Select Community</label>
                      <div className="relative" ref={dropdownRef}>
                        <button type="button" aria-haspopup="listbox" aria-expanded={dropdownOpen} onClick={() => { setDropdownOpen(!dropdownOpen); setFocusedIndex(-1); }} onKeyDown={handleDropdownKeyDown} className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 font-bold text-sm md:text-base text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none text-left flex justify-between items-center transition-all hover:bg-slate-100">
                          <span className="truncate pr-4">{selectedCommunity}</span>
                          <ChevronDown className={`text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} size={20}/>
                        </button>
                        {dropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl md:rounded-2xl shadow-2xl z-30 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 md:p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 md:gap-3">
                              <Search size={16} className="text-slate-400 ml-2"/>
                              <input type="text" aria-label="Search or add cities" className="w-full bg-transparent outline-none text-xs md:text-sm font-bold text-slate-700 placeholder-slate-400 py-2" placeholder="Search or add cities" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setFocusedIndex(-1); }} onKeyDown={handleDropdownKeyDown} autoFocus />
                            </div>
                            <ul role="listbox" className="max-h-56 overflow-y-auto p-1.5 md:p-2 scroll-smooth bg-white">
                              {filteredCommunities.map((name, index) => (
                                  <li key={name} role="option" aria-selected={selectedCommunity === name} onClick={() => { setSelectedCommunity(name); setDropdownOpen(false); setSearchQuery(''); setFocusedIndex(-1); }} className={`cursor-pointer w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-colors ${selectedCommunity === name ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'} ${focusedIndex === index ? 'ring-2 ring-indigo-500 bg-slate-50' : ''}`}>{name}</li>
                              ))}
                              {!exactMatch && searchQuery.trim() !== '' && (
                                  <li role="option" aria-selected="false" onClick={handleCreateCommunity} className={`cursor-pointer w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2 md:gap-3 mt-1 border border-indigo-100 bg-indigo-50/50 ${focusedIndex === filteredCommunities.length ? 'ring-2 ring-indigo-500' : ''}`}><div className="bg-indigo-200 text-indigo-700 rounded-md p-1"><Plus size={14} strokeWidth={3}/></div>Create "{toTitleCaseForCommunity(searchQuery.trim())}"</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                      
                      {/* ============ SECTION 1: YOUR DETAILS ============ */}
                      <section className="space-y-4">
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-indigo-950 mb-4 border-b border-slate-200 pb-4 flex items-center gap-2"><Shield size={18} className="text-slate-400"/> Your Details</h3>
                        
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-2 animate-in fade-in">
                                <AlertCircle size={16} className="mt-0.5 shrink-0"/> <p>{submitError}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="fullName" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                            <input id="fullName" name="name" autoComplete="name" type="text" value={checkoutForm.fullName} onChange={handleNameChange} className={`w-full bg-slate-50 border ${validationErrors.fullName ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="John Doe" />
                            {validationErrors.fullName && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.fullName}</p>}
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email</label>
                            <input id="email" name="email" autoComplete="email" type="email" value={checkoutForm.email} onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})} className={`w-full bg-slate-50 border ${validationErrors.email ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="john@example.com" />
                            {validationErrors.email && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.email}</p>}
                          </div>

                          {/* DISPLAY NAME SECTION */}
                          <div className="md:col-span-2">
                            <div className="flex justify-between items-end mb-2">
                              <label htmlFor="displayName" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">Display Name</label>
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={checkoutForm.isAnonymous} onChange={handleAnonymousChange} className="accent-indigo-900 w-3.5 h-3.5 cursor-pointer rounded-sm" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors select-none">Make Anonymous</span>
                              </label>
                            </div>
                            <input 
                              id="displayName" 
                              type="text" 
                              value={checkoutForm.displayName} 
                              disabled={checkoutForm.isAnonymous}
                              onChange={handleDisplayNameChange}
                              className={`w-full bg-slate-50 border ${validationErrors.displayName ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all ${checkoutForm.isAnonymous ? 'bg-slate-100 text-slate-400 italic' : 'text-slate-900'}`} 
                              placeholder="How you'll appear to others" 
                            />
                            {validationErrors.displayName ? (
                              <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.displayName}</p>
                            ) : (
                              <p className="text-[9px] text-slate-400 mt-1.5 font-medium">This is how your name will appear on the public community roster.</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label htmlFor="phone" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Phone</label>
                            <input id="phone" name="phone" autoComplete="tel" type="tel" value={checkoutForm.phone} onChange={handlePhoneChange} className={`w-full bg-slate-50 border ${validationErrors.phone ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="555-123-4567" />
                            {validationErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.phone}</p>}
                          </div>
                          <div>
                            <label htmlFor="address" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Address</label>
                            <input id="address" name="street-address" autoComplete="street-address" type="text" value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className={`w-full bg-slate-50 border ${validationErrors.address ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="123 Main St" />
                            {validationErrors.address && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.address}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-6 gap-4">
                          <div className="col-span-6 md:col-span-3">
                            <label htmlFor="city" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">City</label>
                            <input id="city" name="address-level2" autoComplete="address-level2" type="text" value={checkoutForm.city} onChange={e => setCheckoutForm({...checkoutForm, city: e.target.value})} className={`w-full bg-slate-50 border ${validationErrors.city ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="New York" />
                            {validationErrors.city && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.city}</p>}
                          </div>
                          <div className="col-span-3 md:col-span-1">
                            <label htmlFor="state" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">State</label>
                            <div className="relative">
                              <select id="state" name="address-level1" value={checkoutForm.state} onChange={e => setCheckoutForm({...checkoutForm, state: e.target.value})} className={`w-full bg-slate-50 border appearance-none ${validationErrors.state ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all cursor-pointer`}>
                                <option value="" disabled>--</option>
                                {US_STATES.map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                            {validationErrors.state && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.state}</p>}
                          </div>
                          <div className="col-span-3 md:col-span-2">
                            <label htmlFor="zip" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Zip Code</label>
                            <input id="zip" name="postal-code" autoComplete="postal-code" type="text" value={checkoutForm.zipCode} onChange={e => setCheckoutForm({...checkoutForm, zipCode: e.target.value.replace(/[^\d-]/g, '')})} maxLength="10" className={`w-full bg-slate-50 border ${validationErrors.zipCode ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="10001" />
                            {validationErrors.zipCode && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.zipCode}</p>}
                          </div>
                        </div>
                      </section>

                      {/* ============ SECTION 2: PAYMENT METHOD (NEW) ============ */}
                      <section className="space-y-4 pt-2">
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-indigo-950 mb-2 border-b border-slate-200 pb-4 flex items-center gap-2">
                          <Lock size={18} className="text-slate-400"/> Payment Method
                        </h3>

                        {/* Express checkout — Apple Pay / Google Pay placeholder.
                            Stripe's PaymentElement auto-renders these when supported. */}
                        <div>
                          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 text-center">Express Checkout</p>
                          <div id="stripe-express-checkout-element" className="min-h-[44px] bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium px-4 text-center">
                            Apple Pay / Google Pay buttons render here automatically
                          </div>
                          <div className="flex items-center gap-3 mt-4">
                            <div className="flex-grow h-px bg-slate-200"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">or pay another way</span>
                            <div className="flex-grow h-px bg-slate-200"></div>
                          </div>
                        </div>

                        {/* Method tabs: Card / Bank / Wallet */}
                        <div className="grid grid-cols-3 gap-2">
                          <PaymentMethodTab icon={<CreditCard size={18} />} label="Card" sublabel="Credit / Debit" active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} />
                          <PaymentMethodTab icon={<Landmark size={18} />} label="Bank" sublabel="ACH · No Fee" active={paymentMethod === 'bank'} onClick={() => setPaymentMethod('bank')} />
                          <PaymentMethodTab icon={<Smartphone size={18} />} label="Wallet" sublabel="Apple / Google" active={paymentMethod === 'wallet'} onClick={() => setPaymentMethod('wallet')} />
                        </div>

                        {/* Stripe element placeholder — swap for <PaymentElement /> when wired up */}
                        <StripeElementPlaceholder method={paymentMethod} />

                        {/* Cover-fee toggle (only when fee applies) */}
                        {paymentMethod !== 'bank' ? (
                          <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-transparent cursor-pointer hover:bg-slate-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={coverFee}
                              onChange={(e) => setCoverFee(e.target.checked)}
                              className="mt-0.5 w-4 h-4 accent-indigo-900 cursor-pointer shrink-0"
                            />
                            <div className="flex-grow text-sm">
                              <p className="font-bold text-slate-900">
                                Cover the ${processingFee.toFixed(2)} processing fee
                              </p>
                              <p className="text-slate-600 font-medium mt-0.5 text-[13px] leading-relaxed">
                                So your full <span className="font-bold text-slate-900">${basePrice.toFixed(2)}</span> reaches the giving pool. None absorbed by card processing costs.
                              </p>
                            </div>
                          </label>
                        ) : (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                            <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-bold text-emerald-900">No processing fee</p>
                              <p className="text-emerald-800/80 font-medium mt-0.5 text-[13px] leading-relaxed">
                                Bank transfers are essentially free. Your full ${basePrice.toFixed(2)} goes directly into the giving pool.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Billing address toggle */}
                        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-transparent cursor-pointer hover:bg-slate-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={billingSameAsAccount}
                            onChange={(e) => setBillingSameAsAccount(e.target.checked)}
                            className="w-4 h-4 accent-indigo-900 cursor-pointer"
                          />
                          <span className="text-sm font-bold text-slate-900">Billing address same as above</span>
                        </label>

                        {!billingSameAsAccount && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 p-4 rounded-xl bg-slate-50 border border-transparent">
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Billing Address</p>
                            <div>
                              <input type="text" value={billingAddress.line1} onChange={e => setBillingAddress({...billingAddress, line1: e.target.value})} autoComplete="billing street-address" className={`w-full bg-slate-50 border ${validationErrors.billingLine1 ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="Street address" />
                              {validationErrors.billingLine1 && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.billingLine1}</p>}
                            </div>
                            <input type="text" value={billingAddress.line2} onChange={e => setBillingAddress({...billingAddress, line2: e.target.value})} autoComplete="billing address-line2" className="w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100 rounded-xl p-3 text-sm outline-none transition-all" placeholder="Apt, suite, etc. (optional)" />
                            <div className="grid grid-cols-6 gap-3">
                              <div className="col-span-6 md:col-span-3">
                                <input type="text" value={billingAddress.city} onChange={e => setBillingAddress({...billingAddress, city: e.target.value})} autoComplete="billing address-level2" className={`w-full bg-slate-50 border ${validationErrors.billingCity ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="City" />
                                {validationErrors.billingCity && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.billingCity}</p>}
                              </div>
                              <div className="col-span-3 md:col-span-1">
                                <div className="relative">
                                  <select value={billingAddress.state} onChange={e => setBillingAddress({...billingAddress, state: e.target.value})} className={`w-full bg-slate-50 border appearance-none ${validationErrors.billingState ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all cursor-pointer`}>
                                    <option value="" disabled>--</option>
                                    {US_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                                {validationErrors.billingState && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.billingState}</p>}
                              </div>
                              <div className="col-span-3 md:col-span-2">
                                <input type="text" value={billingAddress.zipCode} onChange={e => setBillingAddress({...billingAddress, zipCode: e.target.value.replace(/[^\d-]/g, '')})} maxLength="10" autoComplete="billing postal-code" className={`w-full bg-slate-50 border ${validationErrors.billingZip ? 'border-red-400 ring-1 ring-red-400 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:shadow-soft hover:bg-slate-100'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="ZIP" />
                                {validationErrors.billingZip && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.billingZip}</p>}
                              </div>
                            </div>
                          </div>
                        )}
                      </section>

                      {/* ============ SECTION 3: AGREEMENT & SUBMIT (existing) ============ */}
                      <div className="pt-6 mt-6 border-t border-slate-200">
                        <label className="flex items-start gap-3 cursor-pointer group mb-6">
                          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                            <input 
                              type="checkbox" 
                              className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-indigo-900 checked:border-indigo-900 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                              checked={agreedToTerms}
                              onChange={(e) => setAgreedToTerms(e.target.checked)}
                            />
                            <Check size={14} strokeWidth={3} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                          </div>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed select-none">
                            I agree to the <Link to="/rules" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Official Rules</Link>, <Link to="/terms" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Terms of Service</Link>, and <Link to="/privacy" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Privacy Policy</Link>, and authorize this recurring monthly contribution.
                          </p>
                        </label>

                        {validationErrors.terms && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in">
                                <AlertCircle size={14} className="mt-0.5 shrink-0"/> <p>{validationErrors.terms}</p>
                            </div>
                        )}

                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-all uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 disabled:opacity-70 disabled:cursor-not-allowed active:bg-black">
                          {isLoading ? <span className="animate-pulse italic">Processing Securely...</span> : <><Lock size={16} /> Pay ${totalCharged.toFixed(2)} / Month</>}
                        </button>

                        <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4">
                          <span className="flex items-center gap-1.5"><Shield size={12} /> Secured by Stripe</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>501(c)(3) via (Nonprofit)</span>
                        </div>
                      </div>
                  </form>
                  
                </div>
              </div>

              {/* ============================================================
                  DESKTOP-ONLY SUMMARY COLUMN
                  Mobile uses the sticky bar at the top instead.
                  ============================================================ */}
              <div className="hidden lg:block lg:col-span-5">
                <div className="sticky top-24 bg-indigo-950 text-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-indigo-300">Summary</h3>
                    </div>
                    {SummaryContent()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

const PaymentMethodTab = ({ icon, label, sublabel, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative p-3 rounded-xl border-2 transition-all text-center ${
      active 
        ? 'border-indigo-900 bg-indigo-50 ring-2 ring-indigo-100' 
        : 'border-slate-200 bg-white hover:border-slate-300'
    }`}
  >
    {active && (
      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-900 flex items-center justify-center">
        <Check size={10} className="text-white" strokeWidth={3} />
      </div>
    )}
    <div className={`flex justify-center mb-1.5 ${active ? 'text-indigo-900' : 'text-slate-500'}`}>{icon}</div>
    <p className={`text-xs font-black uppercase tracking-wider ${active ? 'text-indigo-950' : 'text-slate-900'}`}>{label}</p>
    <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${active ? 'text-indigo-700' : 'text-slate-400'}`}>{sublabel}</p>
  </button>
);

// Placeholder for the Stripe PaymentElement.
// When you wire up Givinga, replace this with:
//
//   <Elements stripe={stripePromise} options={{ clientSecret }}>
//     <PaymentElement />
//   </Elements>
//
// You'll get the publicKey from POST /partners/{accountId}/authenticate
// and the clientSecret from POST /customers/{customerId}/setup-intents (for saving cards)
// or directly from POST /customers/{customerId}/payment-intents (for one-off + subscription).
const StripeElementPlaceholder = ({ method }) => {
  const config = {
    card: {
      title: 'Card details',
      hint: 'Stripe will render its secure card input here (number, expiry, CVC, billing ZIP).',
      fields: ['Card number', 'Expiry · CVC · ZIP']
    },
    bank: {
      title: 'Bank account',
      hint: 'Stripe will render the Plaid bank-link button here. One-time setup.',
      fields: ['Connect bank with Plaid']
    },
    wallet: {
      title: 'Digital wallet',
      hint: 'Stripe will show the Apple Pay or Google Pay button based on your device.',
      fields: ['Tap to pay']
    }
  }[method];

  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{config.title}</p>
      <div id={`stripe-payment-element-${method}`} className="space-y-2">
        {config.fields.map((field, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-400 font-medium">
            {field}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 font-medium mt-3 flex items-start gap-1.5 leading-relaxed">
        <Info size={11} className="shrink-0 mt-0.5" />
        <span>{config.hint}</span>
      </p>
    </div>
  );
};

export default CheckoutPage;