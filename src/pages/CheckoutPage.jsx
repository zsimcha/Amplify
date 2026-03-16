import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, CheckCircle, ChevronDown, Search, Plus, AlertCircle, Check } from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';

const INTEGRATION_CONFIG = { stripeCheckoutUrl: "#" };

const CheckoutPage = ({ appData, setAppData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTier = location.state?.tier || 'silver';

  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [selectedCommunity, setSelectedCommunity] = useState("General Circle");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const [checkoutForm, setCheckoutForm] = useState({ fullName: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false); 
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); 
    
    const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toTitleCase = (str) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    let phoneNumber = value.replace(/[^\d]/g, '');
    if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) phoneNumber = phoneNumber.substring(1);
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const filteredCommunities = appData.allCommunityNames.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  const exactMatch = appData.allCommunityNames.some(c => c.toLowerCase() === searchQuery.trim().toLowerCase());

  const handleCreateCommunity = () => {
     const rawName = searchQuery.trim();
     if (!rawName) return;
     const newName = toTitleCase(rawName);

     if (!appData.allCommunityNames.includes(newName)) {
         setAppData(prev => {
             const others = prev.allCommunityNames.filter(c => c !== "General Circle");
             const sortedNames = [...others, newName].sort((a, b) => a.localeCompare(b));
             return { ...prev, allCommunityNames: ["General Circle", ...sortedNames], communities: { ...prev.communities, [newName]: { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 } } };
         });
     }
     setSelectedCommunity(newName);
     setDropdownOpen(false); setSearchQuery(''); setFocusedIndex(-1);
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

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    
    if (!checkoutForm.fullName.trim()) errors.fullName = "Full name is required.";
    if (!emailRegex.test(checkoutForm.email)) errors.email = "Enter a valid email (e.g. name@domain.com).";
    if (checkoutForm.phone.length < 14) errors.phone = "Enter a complete 10-digit phone number.";
    if (!checkoutForm.address.trim()) errors.address = "Address is required.";
    if (!checkoutForm.city.trim()) errors.city = "City is required.";
    if (checkoutForm.state.length !== 2) errors.state = "Use a 2-letter state code.";
    if (checkoutForm.zipCode.length < 5) errors.zipCode = "Enter a valid zip code.";
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
      const tierPrice = appData.tierData[selectedTier].price;

      // Secure Backend Call: Handles community creation, subscription insertion, and updating totals
      const { data, error } = await supabase.rpc('process_checkout', {
        p_full_name: checkoutForm.fullName,
        p_email: checkoutForm.email,
        p_phone: checkoutForm.phone,
        p_address: checkoutForm.address,
        p_city: checkoutForm.city,
        p_state: checkoutForm.state,
        p_zip_code: checkoutForm.zipCode,
        p_tier: selectedTier,
        p_community_name: selectedCommunity,
        p_tier_price: tierPrice
      });

      if (error) {
        throw new Error(error.message || "Failed to record your subscription. Please try again.");
      }

      // Update local UI state to reflect the new addition immediately
      setAppData(prev => ({
        ...prev,
        communities: {
          ...prev.communities,
          [selectedCommunity]: {
            ...prev.communities[selectedCommunity],
            members: (prev.communities[selectedCommunity]?.members || 0) + 1,
            monthly: (prev.communities[selectedCommunity]?.monthly || 0) + tierPrice,
            [selectedTier]: (prev.communities[selectedCommunity]?.[selectedTier] || 0) + 1
          }
        }
      }));
      
      setSignupSuccess(true);
      if (INTEGRATION_CONFIG.stripeCheckoutUrl !== "#") { window.open(INTEGRATION_CONFIG.stripeCheckoutUrl, '_blank'); }

    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "An unexpected error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-20 flex-grow w-full">
        <div className="max-w-5xl mx-auto">
          {signupSuccess ? (
            <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-xl p-8 md:p-24 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
                <div className="bg-green-100 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-10"><CheckCircle size={48} className="text-green-600 md:w-16 md:h-16" /></div>
                <h4 className="text-3xl md:text-5xl font-black text-indigo-950 mb-4 md:mb-6 italic uppercase tracking-tighter">You're in.</h4>
                <p className="text-slate-500 text-base md:text-xl font-medium max-w-md mx-auto leading-relaxed mb-8 md:mb-12">
                  Welcome to the {selectedCommunity !== 'General Circle' ? selectedCommunity : 'General'} Circle. Your monthly impact starts today.
                </p>
                <Link to="/" className="inline-block px-12 py-4 md:py-5 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Return Home</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
              <div className="order-2 lg:order-1 lg:col-span-7 space-y-6 md:space-y-8">
                <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-slate-100">
                  <h2 className="text-2xl md:text-3xl font-black uppercase italic text-indigo-950 mb-6 md:mb-8 tracking-tight">Secure Your Spot</h2>
                  
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
                              <input type="text" aria-label="Search cities" className="w-full bg-transparent outline-none text-xs md:text-sm font-bold text-slate-700 placeholder-slate-400 py-2" placeholder="Search cities..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setFocusedIndex(-1); }} onKeyDown={handleDropdownKeyDown} autoFocus />
                            </div>
                            <ul role="listbox" className="max-h-56 overflow-y-auto p-1.5 md:p-2 scroll-smooth bg-white">
                              {filteredCommunities.map((name, index) => (
                                  <li key={name} role="option" aria-selected={selectedCommunity === name} onClick={() => { setSelectedCommunity(name); setDropdownOpen(false); setSearchQuery(''); setFocusedIndex(-1); }} className={`cursor-pointer w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-colors ${selectedCommunity === name ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'} ${focusedIndex === index ? 'ring-2 ring-indigo-500 bg-slate-50' : ''}`}>{name}</li>
                              ))}
                              {!exactMatch && searchQuery.trim() !== '' && (
                                  <li role="option" aria-selected="false" onClick={handleCreateCommunity} className={`cursor-pointer w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2 md:gap-3 mt-1 border border-indigo-100 bg-indigo-50/50 ${focusedIndex === filteredCommunities.length ? 'ring-2 ring-indigo-500' : ''}`}><div className="bg-indigo-200 text-indigo-700 rounded-md p-1"><Plus size={14} strokeWidth={3}/></div>Create "{toTitleCase(searchQuery.trim())}"</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="bg-slate-50 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-8 space-y-4">
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-indigo-950 mb-4 border-b border-slate-200 pb-4 flex items-center gap-2"><Shield size={18} className="text-slate-400"/> Your Details</h3>
                      
                      {submitError && (
                          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-2 animate-in fade-in">
                              <AlertCircle size={16} className="mt-0.5 shrink-0"/> <p>{submitError}</p>
                          </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="fullName" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                          <input id="fullName" name="name" autoComplete="name" type="text" value={checkoutForm.fullName} onChange={e => setCheckoutForm({...checkoutForm, fullName: toTitleCase(e.target.value)})} className={`w-full bg-white border ${validationErrors.fullName ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="John Doe" />
                          {validationErrors.fullName && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.fullName}</p>}
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email</label>
                          <input id="email" name="email" autoComplete="email" type="email" value={checkoutForm.email} onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})} className={`w-full bg-white border ${validationErrors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="john@example.com" />
                          {validationErrors.email && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.email}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="phone" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Phone</label>
                          <input id="phone" name="phone" autoComplete="tel" type="tel" maxLength="14" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: formatPhoneNumber(e.target.value)})} className={`w-full bg-white border ${validationErrors.phone ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="(555) 123-4567" />
                          {validationErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.phone}</p>}
                        </div>
                        <div>
                          <label htmlFor="address" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Address</label>
                          <input id="address" name="street-address" autoComplete="street-address" type="text" value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className={`w-full bg-white border ${validationErrors.address ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="123 Main St" />
                          {validationErrors.address && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.address}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-6 md:col-span-3">
                          <label htmlFor="city" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">City</label>
                          <input id="city" name="address-level2" autoComplete="address-level2" type="text" value={checkoutForm.city} onChange={e => setCheckoutForm({...checkoutForm, city: toTitleCase(e.target.value)})} className={`w-full bg-white border ${validationErrors.city ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="New York" />
                          {validationErrors.city && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.city}</p>}
                        </div>
                        <div className="col-span-3 md:col-span-1">
                          <label htmlFor="state" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">State</label>
                          <input id="state" name="address-level1" autoComplete="address-level1" type="text" value={checkoutForm.state} onChange={e => setCheckoutForm({...checkoutForm, state: e.target.value.toUpperCase()})} maxLength="2" className={`w-full bg-white border ${validationErrors.state ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="NY" />
                          {validationErrors.state && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.state}</p>}
                        </div>
                        <div className="col-span-3 md:col-span-2">
                          <label htmlFor="zip" className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Zip Code</label>
                          <input id="zip" name="postal-code" autoComplete="postal-code" type="text" value={checkoutForm.zipCode} onChange={e => setCheckoutForm({...checkoutForm, zipCode: e.target.value.replace(/[^\d]/g, '')})} maxLength="5" className={`w-full bg-white border ${validationErrors.zipCode ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'} rounded-xl p-3 text-sm outline-none transition-all`} placeholder="10001" />
                          {validationErrors.zipCode && <p className="text-red-500 text-[10px] mt-1 font-bold">{validationErrors.zipCode}</p>}
                        </div>
                      </div>
                      
                      <div className="pt-6 mt-6 border-t border-slate-200">
                        <label className="flex items-start gap-3 cursor-pointer group mb-6">
                          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                            <input 
                              type="checkbox" 
                              className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-indigo-900 checked:border-indigo-900 transition-all cursor-pointer"
                              checked={agreedToTerms}
                              onChange={(e) => setAgreedToTerms(e.target.checked)}
                            />
                            <Check size={14} strokeWidth={3} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                          </div>
                          <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed select-none">
                            I agree to the <Link to="/rules" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Official Rules</Link> and <Link to="/terms" className="text-indigo-600 font-bold hover:text-indigo-900 transition-colors">Terms of Service</Link>, and authorize this recurring monthly contribution.
                          </p>
                        </label>

                        {validationErrors.terms && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in">
                                <AlertCircle size={14} className="mt-0.5 shrink-0"/> <p>{validationErrors.terms}</p>
                            </div>
                        )}

                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-900 text-white rounded-xl font-black shadow-lg hover:bg-black transition-all uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 disabled:opacity-70 disabled:cursor-not-allowed active:bg-black">
                          {isLoading ? <span className="animate-pulse italic">Processing Securely...</span> : <><Shield size={16} /> Complete Checkout</>}
                        </button>
                      </div>
                  </form>
                  
                </div>
              </div>

              <div className="order-1 lg:order-2 lg:col-span-5 space-y-4 md:space-y-6">
                <div className="bg-indigo-950 text-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                          <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-indigo-300">Summary</h3>
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
      <Footer />
    </div>
  );
};

export default CheckoutPage;