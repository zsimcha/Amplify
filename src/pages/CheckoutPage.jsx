// src/pages/CheckoutPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, CheckCircle, ChevronDown, ChevronUp, Search, Plus, AlertCircle, Check, CreditCard, Landmark, Smartphone, Lock, Info, Eye, EyeOff } from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { saveMyCauses, setPendingCauses } from '../lib/charities';
import { HIDE_PARTNER_IDENTITIES } from '../config/siteConfig';
import { useAuth } from '../context/AuthContext';
import { US_STATES, TIER_ACCENT } from '../lib/constants';
import { fieldClass } from '../lib/formStyles';
import { computeCheckoutErrors } from '../lib/checkoutValidation';
import CheckoutSummary from './checkout/CheckoutSummary';
import CausesStep from './checkout/CausesStep';
import ConfirmationStep from './checkout/ConfirmationStep';
import { totalWithFeeCovered, feeCoveredAmount } from '../lib/pricing';

const CheckoutPage = ({ appData, setAppData }) => {
  const location = useLocation();
  const { user } = useAuth();
  const initialTier = location.state?.tier || 'silver';

  const [selectedTier] = useState(initialTier);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
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

  // Account credentials (only collected when the visitor isn't signed in).
  // The password goes straight to Supabase Auth (auth.signUp) — it is never
  // stored in application tables or sent anywhere else.
  const [accountPassword, setAccountPassword] = useState('');
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState('');
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [showAccountPasswordConfirm, setShowAccountPasswordConfirm] = useState(false);

  // Signed-in members check out under their existing account.
  useEffect(() => {
    if (user?.email) {
      setCheckoutForm(prev => (prev.email ? prev : { ...prev, email: user.email }));
    }
  }, [user]);
  
  const [validationErrors, setValidationErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({}); // fields the user has visited (by error key)
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Post-checkout charity selection (up to 4 orgs). This runs as its own step
  // between the payment form and the final confirmation screen.
  const [causeSlugs, setCauseSlugs] = useState([]);
  const [savingCauses, setSavingCauses] = useState(false);
  // During the partner blackout there's nothing to choose from, so the causes
  // step starts already complete and checkout goes straight to confirmation.
  const [causesStepDone, setCausesStepDone] = useState(HIDE_PARTNER_IDENTITIES);
  const [causesSaved, setCausesSaved] = useState(false);
  const [causesError, setCausesError] = useState(null);

  const handleSaveCauses = async () => {
    setCausesError(null);
    setSavingCauses(true);
    try {
      if (user) {
        // Session available (existing member, or signup returned a session).
        await saveMyCauses(causeSlugs);
      } else {
        // New member whose email confirmation is still pending — stash the
        // selection locally; it's applied the first time they sign in.
        setPendingCauses(causeSlugs);
      }
      setCausesSaved(true);
      setCausesStepDone(true);
    } catch {
      setCausesError('Could not save your causes just now. You can set them anytime from My Account.');
    } finally {
      setSavingCauses(false);
    }
  };

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

  // Each post-checkout step is its own screen — start them at the top.
  useEffect(() => {
    if (signupSuccess) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [signupSuccess, causesStepDone]);

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
  // Annual billing charges 12x the monthly price as a single basePrice through
  // the exact same fee math below -- no separate annual formula needed.
  const monthlyPrice = appData.tierData[selectedTier].price;
  const basePrice = billingCycle === 'annual' ? monthlyPrice * 12 : monthlyPrice;
  const processingFee = paymentMethod === 'bank'
    ? 0
    : feeCoveredAmount(basePrice);
  const feeBeingCovered = (paymentMethod !== 'bank') && coverFee;
  const totalCharged = feeBeingCovered ? totalWithFeeCovered(basePrice) : basePrice;

  // Pure: derives the current error set from form state (no side effects), so
  // it can be reused for both submit-time and live (on-change) validation.
  const computeErrors = useCallback(() => computeCheckoutErrors({
    checkoutForm,
    isSignedIn: !!user,
    accountPassword,
    accountPasswordConfirm,
    billingSameAsAccount,
    billingAddress,
    agreedToTerms,
  }), [checkoutForm, user, accountPassword, accountPasswordConfirm, billingSameAsAccount, billingAddress, agreedToTerms]);

  const validateForm = () => Object.keys(computeErrors()).length === 0;

  // A few input ids don't match their error key.
  const ID_TO_ERROR_KEY = { zip: 'zipCode' };

  // Mark a field visited once the user leaves it (React onBlur bubbles), so its
  // error can start showing. Delegated from the <form> so we don't wire every input.
  const handleFieldBlur = (e) => {
    const id = e.target?.id;
    if (!id) return;
    const key = ID_TO_ERROR_KEY[id] || id;
    setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  // Keep displayed errors in sync with the form. A field's error shows once it's
  // been visited (on blur) or after a submit attempt, and clears live as it's
  // fixed — so users see errors as they fill the form, not only on submit.
  useEffect(() => {
    const all = computeErrors();
    const visible = submitAttempted
      ? all
      : Object.fromEntries(Object.entries(all).filter(([key]) => touched[key]));
    setValidationErrors(visible);
  }, [computeErrors, submitAttempted, touched]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitAttempted(true);
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
      //       interval: billingCycle === 'annual' ? 'year' : 'month'
      //       amount: basePrice * 100 (in cents) -- already 12x for annual
      //       customerCoveringFee: coverFee
      //       paymentMethodId: <from Stripe>
      //  5. Then call the Supabase RPC below with the resulting Stripe customer id
      //
      // For now we just fire the existing Supabase RPC.
      //
      // NOTE: billingCycle is not sent below -- process_checkout has no
      // parameter for it today, so annual vs. monthly is not yet persisted
      // server-side (this whole flow is pre-Stripe scaffolding anyway; no
      // real subscription is created either way yet). The RPC needs a new
      // p_billing_cycle parameter, and the Subscriptions table needs to
      // record it, before this is more than a frontend preview.
      // ============================================================

      // 0. Create the member's account first (Supabase Auth handles the
      //    password — hashed server-side, never stored in our tables).
      //    Signed-in members skip this and check out under their account.
      if (!user) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: checkoutForm.email,
          password: accountPassword,
          options: {
            data: { full_name: checkoutForm.fullName },
            // Where the confirmation link lands after the user confirms.
            // Must be listed in Supabase Auth → URL Configuration → Redirect URLs.
            emailRedirectTo: `${window.location.origin}/welcome`,
          },
        });

        if (signUpError) {
          if (/already registered/i.test(signUpError.message || '')) {
            throw new Error("An account already exists for this email. Please sign in first, then complete your checkout.");
          }
          throw new Error(signUpError.message || "Could not create your account. Please try again.");
        }

        // When email confirmation is required, Supabase returns an obfuscated
        // user with no identities for emails that already have an account.
        if (signUpData?.user && Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
          throw new Error("An account already exists for this email. Please sign in first, then complete your checkout.");
        }
        // If a session was returned, the RPC below runs authenticated and the
        // subscription links to the account immediately. If email confirmation
        // is required (no session yet), the subscription links automatically
        // the moment the member confirms their email.
      }

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

      // Optimistic UI Update with Community Race Condition Fix. The
      // community's running "monthly" total reflects the recurring monthly
      // amount regardless of billing cycle, so this uses monthlyPrice, not
      // the (possibly annual, lump-sum) basePrice charged today.
      const tierPrice = monthlyPrice;
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
              <div className={`w-2 h-2 rounded-full shrink-0 ${TIER_ACCENT[selectedTier].dot}`}></div>
              <div className="min-w-0">
                <p className={`text-[0.5625rem] font-black uppercase tracking-widest leading-none mb-1 ${TIER_ACCENT[selectedTier].text}`}>{selectedTier} Circle</p>
                <p className="text-sm font-bold truncate">${totalCharged.toFixed(2)}<span className="font-medium text-indigo-300">{billingCycle === 'annual' ? '/yr' : '/mo'}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300 shrink-0">
              <span className="text-[0.625rem] font-bold uppercase tracking-widest">{summaryExpanded ? 'Hide' : 'Details'}</span>
              {summaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>
          {summaryExpanded && (
            <div id="mobile-summary-detail" className="px-4 pb-5 pt-2 border-t border-indigo-900 animate-in slide-in-from-top-2 duration-200">
              <CheckoutSummary
                selectedTier={selectedTier}
                billingCycle={billingCycle}
                basePrice={basePrice}
                tierData={appData.tierData}
                feeBeingCovered={feeBeingCovered}
                processingFee={processingFee}
                totalCharged={totalCharged}
              />
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-20 flex-grow w-full">
        <div className="max-w-5xl mx-auto">
          {signupSuccess && !causesStepDone ? (
            /* Its own screen, shown before the final confirmation. */
            <CausesStep
              causeSlugs={causeSlugs}
              onChangeCauseSlugs={setCauseSlugs}
              savingCauses={savingCauses}
              causesError={causesError}
              onSave={handleSaveCauses}
              onSkip={() => setCausesStepDone(true)}
            />
          ) : signupSuccess ? (
            <ConfirmationStep
              selectedCommunity={selectedCommunity}
              causesSaved={causesSaved}
              causeSlugs={causeSlugs}
              isSignedIn={!!user}
            />
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
                      <label id="community-label" className="block text-[0.625rem] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 md:mb-3">Select Community</label>
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

                  <form onSubmit={handleCheckoutSubmit} onBlur={handleFieldBlur} className="space-y-6">
                      
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
                            <label htmlFor="fullName" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                            <input id="fullName" name="name" autoComplete="name" type="text" value={checkoutForm.fullName} onChange={handleNameChange} className={fieldClass(!!validationErrors.fullName)} placeholder="John Doe" />
                            {validationErrors.fullName && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.fullName}</p>}
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email</label>
                            <input id="email" name="email" autoComplete="email" type="email" value={checkoutForm.email} onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})} className={fieldClass(!!validationErrors.email)} placeholder="john@example.com" />
                            {validationErrors.email && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.email}</p>}
                          </div>

                          {/* DISPLAY NAME SECTION */}
                          <div className="md:col-span-2">
                            <div className="flex justify-between items-end mb-2">
                              <label htmlFor="displayName" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500">Display Name</label>
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={checkoutForm.isAnonymous} onChange={handleAnonymousChange} className="accent-indigo-900 w-3.5 h-3.5 cursor-pointer rounded-sm" />
                                <span className="text-[0.625rem] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors select-none">Make Anonymous</span>
                              </label>
                            </div>
                            <input 
                              id="displayName" 
                              type="text" 
                              value={checkoutForm.displayName} 
                              disabled={checkoutForm.isAnonymous}
                              onChange={handleDisplayNameChange}
                              className={fieldClass(!!validationErrors.displayName, checkoutForm.isAnonymous ? 'bg-slate-100 text-slate-400 italic' : 'text-slate-900')}
                              placeholder="How you'll appear to others" 
                            />
                            {validationErrors.displayName ? (
                              <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.displayName}</p>
                            ) : (
                              <p className="text-[0.5625rem] text-slate-400 mt-1.5 font-medium">This is how your name will appear on the public community roster.</p>
                            )}
                          </div>
                        </div>

                        {/* ACCOUNT CREDENTIALS — password is handled by Supabase Auth,
                            never stored in application tables. Hidden when signed in. */}
                        {user ? (
                          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                            <CheckCircle size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                            <p className="text-xs md:text-[0.8125rem] text-indigo-900 font-medium leading-relaxed">
                              You're signed in as <span className="font-bold">{user.email}</span>. This membership will be added to your account.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="md:col-span-2 -mb-1">
                              <p className="text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-400">Create Your Account</p>
                              <p className="text-[0.5625rem] text-slate-400 mt-1 font-medium">Manage your membership, receipts, and payment details anytime.</p>
                            </div>
                            <div>
                              <label htmlFor="accountPassword" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Password</label>
                              <div className="relative">
                                <input id="accountPassword" type={showAccountPassword ? 'text' : 'password'} autoComplete="new-password" value={accountPassword} onChange={e => setAccountPassword(e.target.value)} className={fieldClass(!!validationErrors.accountPassword, 'pr-10')} placeholder="At least 8 characters" />
                                <button type="button" onClick={() => setShowAccountPassword(v => !v)} tabIndex={-1} aria-label={showAccountPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                  {showAccountPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                              {validationErrors.accountPassword && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.accountPassword}</p>}
                            </div>
                            <div>
                              <label htmlFor="accountPasswordConfirm" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Confirm Password</label>
                              <div className="relative">
                                <input id="accountPasswordConfirm" type={showAccountPasswordConfirm ? 'text' : 'password'} autoComplete="new-password" value={accountPasswordConfirm} onChange={e => setAccountPasswordConfirm(e.target.value)} className={fieldClass(!!validationErrors.accountPasswordConfirm, 'pr-10')} placeholder="Re-enter your password" />
                                <button type="button" onClick={() => setShowAccountPasswordConfirm(v => !v)} tabIndex={-1} aria-label={showAccountPasswordConfirm ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                  {showAccountPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                              {validationErrors.accountPasswordConfirm && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.accountPasswordConfirm}</p>}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label htmlFor="phone" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Phone</label>
                            <input id="phone" name="phone" autoComplete="tel" type="tel" value={checkoutForm.phone} onChange={handlePhoneChange} className={fieldClass(!!validationErrors.phone)} placeholder="555-123-4567" />
                            {validationErrors.phone && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.phone}</p>}
                          </div>
                          <div>
                            <label htmlFor="address" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Address</label>
                            <input id="address" name="street-address" autoComplete="street-address" type="text" value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className={fieldClass(!!validationErrors.address)} placeholder="123 Main St" />
                            {validationErrors.address && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.address}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-6 gap-4">
                          <div className="col-span-6 md:col-span-3">
                            <label htmlFor="city" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">City</label>
                            <input id="city" name="address-level2" autoComplete="address-level2" type="text" value={checkoutForm.city} onChange={e => setCheckoutForm({...checkoutForm, city: e.target.value})} className={fieldClass(!!validationErrors.city)} placeholder="New York" />
                            {validationErrors.city && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.city}</p>}
                          </div>
                          <div className="col-span-3 md:col-span-1">
                            <label htmlFor="state" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">State</label>
                            <div className="relative">
                              <select id="state" name="address-level1" value={checkoutForm.state} onChange={e => setCheckoutForm({...checkoutForm, state: e.target.value})} className={fieldClass(!!validationErrors.state, 'appearance-none cursor-pointer')}>
                                <option value="" disabled>--</option>
                                {US_STATES.map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                            {validationErrors.state && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.state}</p>}
                          </div>
                          <div className="col-span-3 md:col-span-2">
                            <label htmlFor="zip" className="block text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Zip Code</label>
                            <input id="zip" name="postal-code" autoComplete="postal-code" type="text" value={checkoutForm.zipCode} onChange={e => setCheckoutForm({...checkoutForm, zipCode: e.target.value.replace(/[^\d-]/g, '')})} maxLength="10" className={fieldClass(!!validationErrors.zipCode)} placeholder="10001" />
                            {validationErrors.zipCode && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.zipCode}</p>}
                          </div>
                        </div>
                      </section>

                      {/* ============ SECTION 2: PAYMENT METHOD (NEW) ============ */}
                      <section className="space-y-4 pt-2">
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-indigo-950 mb-2 border-b border-slate-200 pb-4 flex items-center gap-2">
                          <Lock size={18} className="text-slate-400"/> Payment Method
                        </h3>

                        {/* Billing cycle — affects every amount below (express
                            checkout, cover-fee, total), so it comes first. */}
                        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-50">
                          <span className="text-sm font-bold text-slate-900">Billing Cycle</span>
                          <div className="inline-flex bg-white border border-slate-200 rounded-full p-0.5 shrink-0" role="radiogroup" aria-label="Billing cycle">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={billingCycle === 'monthly'}
                              onClick={() => setBillingCycle('monthly')}
                              className={`px-3.5 py-2 rounded-full text-[0.6875rem] font-black uppercase tracking-wide transition-all ${billingCycle === 'monthly' ? 'bg-indigo-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              Monthly
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={billingCycle === 'annual'}
                              onClick={() => setBillingCycle('annual')}
                              className={`px-3.5 py-2 rounded-full text-[0.6875rem] font-black uppercase tracking-wide transition-all ${billingCycle === 'annual' ? 'bg-indigo-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              Annual
                            </button>
                          </div>
                        </div>

                        {/* Express checkout — Apple Pay / Google Pay placeholder.
                            Stripe's PaymentElement auto-renders these when supported. */}
                        <div>
                          <p className="text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 text-center">Express Checkout</p>
                          <div id="stripe-express-checkout-element" className="min-h-[2.75rem] bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium px-4 text-center">
                            Apple Pay / Google Pay buttons render here automatically
                          </div>
                          <div className="flex items-center gap-3 mt-4">
                            <div className="flex-grow h-px bg-slate-200"></div>
                            <span className="text-[0.625rem] font-bold uppercase tracking-widest text-slate-400">or pay another way</span>
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
                                Cover the processing fee
                              </p>
                              <p className="text-slate-600 font-medium mt-0.5 text-[0.8125rem] leading-relaxed">
                                So your full <span className="font-bold text-slate-900">${basePrice.toFixed(2)}</span> reaches the giving pool. None absorbed by card processing costs.
                              </p>
                            </div>
                          </label>
                        ) : (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                            <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-bold text-emerald-900">No processing fee</p>
                              <p className="text-emerald-800/80 font-medium mt-0.5 text-[0.8125rem] leading-relaxed">
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
                            <p className="text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Billing Address</p>
                            <div>
                              <input id="billingLine1" type="text" value={billingAddress.line1} onChange={e => setBillingAddress({...billingAddress, line1: e.target.value})} autoComplete="billing street-address" className={fieldClass(!!validationErrors.billingLine1)} placeholder="Street address" />
                              {validationErrors.billingLine1 && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.billingLine1}</p>}
                            </div>
                            <input type="text" value={billingAddress.line2} onChange={e => setBillingAddress({...billingAddress, line2: e.target.value})} autoComplete="billing address-line2" className={fieldClass(false)} placeholder="Apt, suite, etc. (optional)" />
                            <div className="grid grid-cols-6 gap-3">
                              <div className="col-span-6 md:col-span-3">
                                <input id="billingCity" type="text" value={billingAddress.city} onChange={e => setBillingAddress({...billingAddress, city: e.target.value})} autoComplete="billing address-level2" className={fieldClass(!!validationErrors.billingCity)} placeholder="City" />
                                {validationErrors.billingCity && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.billingCity}</p>}
                              </div>
                              <div className="col-span-3 md:col-span-1">
                                <div className="relative">
                                  <select id="billingState" value={billingAddress.state} onChange={e => setBillingAddress({...billingAddress, state: e.target.value})} className={fieldClass(!!validationErrors.billingState, 'appearance-none cursor-pointer')}>
                                    <option value="" disabled>--</option>
                                    {US_STATES.map(state => (<option key={state} value={state}>{state}</option>))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                                {validationErrors.billingState && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.billingState}</p>}
                              </div>
                              <div className="col-span-3 md:col-span-2">
                                <input id="billingZip" type="text" value={billingAddress.zipCode} onChange={e => setBillingAddress({...billingAddress, zipCode: e.target.value.replace(/[^\d-]/g, '')})} maxLength="10" autoComplete="billing postal-code" className={fieldClass(!!validationErrors.billingZip)} placeholder="ZIP" />
                                {validationErrors.billingZip && <p className="text-red-500 text-[0.625rem] mt-1 font-bold">{validationErrors.billingZip}</p>}
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
                          <p className="text-[0.625rem] md:text-xs text-slate-500 font-medium leading-relaxed select-none">
                            I agree to the <Link to="/rules" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Official Rules</Link>, <Link to="/terms" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Terms of Service</Link>, and <Link to="/privacy" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Privacy Policy</Link>, and authorize this recurring {billingCycle === 'annual' ? 'annual' : 'monthly'} contribution.
                          </p>
                        </label>

                        {/* Validation summary — surfaces every error next to the Pay
                            button so nothing is missed when scrolled to the bottom.
                            Only appears after a submit attempt; updates live as fields
                            are corrected. */}
                        {submitAttempted && Object.keys(validationErrors).length > 0 && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in" role="alert">
                                <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                                <div>
                                    <p className="mb-1">Please fix the following before continuing:</p>
                                    <ul className="list-disc list-inside font-medium space-y-0.5">
                                        {[...new Set(Object.values(validationErrors))].map((msg, i) => <li key={i}>{msg}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-all uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 disabled:opacity-70 disabled:cursor-not-allowed active:bg-black">
                          {isLoading ? <span className="animate-pulse italic">Processing Securely...</span> : <><Lock size={16} /> Pay ${totalCharged.toFixed(2)} / {billingCycle === 'annual' ? 'Year' : 'Month'}</>}
                        </button>

                        {/* Auto-renewal disclosure — plain text adjacent to the payment
                            authorization, per auto-renewal laws (e.g. CA ARL). */}
                        <p className="text-[0.625rem] md:text-xs text-slate-500 font-medium leading-relaxed text-center mt-4">
                          Your contribution renews every {billingCycle === 'annual' ? 'year' : 'month'} until you cancel your subscription.
                        </p>

                        <div className="flex items-center justify-center gap-4 text-[0.625rem] font-bold uppercase tracking-widest text-slate-400 mt-4">
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
                    <CheckoutSummary
                      selectedTier={selectedTier}
                      billingCycle={billingCycle}
                      basePrice={basePrice}
                      tierData={appData.tierData}
                      feeBeingCovered={feeBeingCovered}
                      processingFee={processingFee}
                      totalCharged={totalCharged}
                    />
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
    <p className={`text-[0.5625rem] font-bold uppercase tracking-wider mt-0.5 ${active ? 'text-indigo-700' : 'text-slate-400'}`}>{sublabel}</p>
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
      <p className="text-[0.625rem] font-bold uppercase tracking-widest text-slate-500 mb-3">{config.title}</p>
      <div id={`stripe-payment-element-${method}`} className="space-y-2">
        {config.fields.map((field, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-400 font-medium">
            {field}
          </div>
        ))}
      </div>
      <p className="text-[0.625rem] text-slate-500 font-medium mt-3 flex items-start gap-1.5 leading-relaxed">
        <Info size={11} className="shrink-0 mt-0.5" />
        <span>{config.hint}</span>
      </p>
    </div>
  );
};

export default CheckoutPage;