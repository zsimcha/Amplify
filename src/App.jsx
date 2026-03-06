import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';

import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import ContactPage from './pages/ContactPage';

import PrivacyPolicyContent from './components/PrivacyPolicyContent';
import ReferralProgramContent from './components/ReferralProgramContent';
import RulesContent from './components/RulesContent';
import TermsContent from './components/TermsContent';
import SecondaryNavbar from './components/layout/SecondaryNavbar';
import Footer from './components/layout/Footer';

const FEATURED_COMMUNITIES = ["General Circle", "Teaneck", "5 Towns", "Los Angeles", "Miami", "Lakewood", "Jerusalem"];
const EXTENDED_COMMUNITIES = [...FEATURED_COMMUNITIES, "Baltimore", "Silver Spring", "Chicago", "Boston", "Monsey", "Passaic", "Brooklyn", "Queens", "Boca Raton", "Dallas", "Atlanta", "Cleveland", "Detroit", "Philadelphia", "Toronto", "Montreal", "London", "Houston", "Seattle", "Denver"];

const initialTierData = {
  silver: { price: 250, prize: "$25,000", totalOdds: "1 / 100", otherPrizes: ["1 × $1,250", "2 × $750"] },
  gold: { price: 500, prize: "$50,000", totalOdds: "1 / 50", otherPrizes: ["1 × $2,500", "6 × $1,000"] },
  diamond: { price: 1000, prize: "$100,000", totalOdds: "1 / 25", otherPrizes: ["1 × $5,000", "2 × $3,000", "12 × $2,000"] }
};

const initialNames = ["General Circle", ...EXTENDED_COMMUNITIES.filter(c => c !== "General Circle").sort()];
const initialCommunityData = {};
initialNames.forEach(name => { initialCommunityData[name] = { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 }; });

const ContentPage = ({ title, content }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 flex-grow">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 md:mb-12 uppercase tracking-tighter border-b border-slate-200 pb-6">{title}</h1>
        <div className="text-slate-700 font-medium text-sm md:text-base leading-relaxed">{content}</div>
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  const [appData, setAppData] = useState({ tierData: initialTierData, allCommunityNames: initialNames, communities: initialCommunityData });

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase.from('communities').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setAppData(prev => {
            const fetchedData = { ...prev.communities };
            const fetchedNames = new Set(prev.allCommunityNames);
            data.forEach(comm => {
              fetchedNames.add(comm.name);
              fetchedData[comm.name] = { members: comm.members || 0, monthly: comm.monthly || 0, silver: comm.silver || 0, gold: comm.gold || 0, diamond: comm.diamond || 0 };
            });
            return { ...prev, allCommunityNames: ["General Circle", ...Array.from(fetchedNames).filter(c => c !== "General Circle").sort()], communities: { ...prev.communities, ...fetchedData } };
          });
        }
      } catch (err) { console.error("Error fetching communities:", err); }
    };
    fetchCommunities();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage appData={appData} />} />
        <Route path="/checkout" element={<CheckoutPage appData={appData} setAppData={setAppData} />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<ContentPage title="Privacy Policy" content={<PrivacyPolicyContent />} />} />
        <Route path="/rules" element={<ContentPage title="Official Sweepstakes Rules" content={<RulesContent />} />} />
        <Route path="/terms" element={<ContentPage title="Terms of Service" content={<TermsContent />} />} />
        <Route path="/referral" element={<ContentPage title="Referral Program Terms" content={<ReferralProgramContent />} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;