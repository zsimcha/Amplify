// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';
import RulesContent from './components/RulesContent';
import TermsContent from './components/TermsContent';
import PrivacyPolicyContent from './components/PrivacyPolicyContent';
import ReferralProgramContent from './components/ReferralProgramContent';
import ContactPage from './pages/ContactPage';
import { supabase } from './lib/supabase';

import SecondaryNavbar from './components/layout/SecondaryNavbar';
import Footer from './components/layout/Footer';

const LegalPageLayout = ({ title, children }) => {
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }, []);
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-24 flex-grow w-full">
        <h1 className="text-3xl md:text-5xl font-black text-indigo-950 mb-8 md:mb-12 uppercase italic tracking-tighter border-b border-slate-200 pb-6">{title}</h1>
        <div className="bg-white p-6 md:p-12 rounded-3xl md:rounded-[3rem] shadow-sm border border-slate-100 text-slate-600 text-sm md:text-base leading-relaxed">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  const [appData, setAppData] = useState({
    tierData: {
      silver: { price: 250, prize: "$25,000", otherPrizes: ["$1,250", "$750", "$750"], totalOdds: "1 / 100" },
      gold: { price: 500, prize: "$50,000", otherPrizes: ["$2,500", "$1,000 (x6)"], totalOdds: "1 / 50" },
      diamond: { price: 1000, prize: "$100,000", otherPrizes: ["$5,000", "$3,000 (x2)", "$2,000 (x12)"], totalOdds: "1 / 25" }
    },
    communities: {
      "General Circle": { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 }
    },
    allCommunityNames: ["General Circle"]
  });

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const { data, error } = await supabase.from('communities').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          const newCommunities = {};
          data.forEach(c => {
            newCommunities[c.name] = {
              members: c.members || 0,
              monthly: c.monthly || 0,
              silver: c.silver || 0,
              gold: c.gold || 0,
              diamond: c.diamond || 0
            };
          });
          const allNames = Object.keys(newCommunities);
          const others = allNames.filter(name => name !== "General Circle");
          const sortedNames = ["General Circle", ...others.sort((a, b) => a.localeCompare(b))];
          
          if (!newCommunities["General Circle"]) {
             newCommunities["General Circle"] = { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 };
          }
          setAppData(prev => ({ ...prev, communities: newCommunities, allCommunityNames: sortedNames }));
        }
      } catch (err) {
        console.error("Error fetching communities:", err);
      }
    };
    fetchCommunities();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Removed isLoading prop */}
        <Route path="/" element={<HomePage appData={appData} />} />
        <Route path="/checkout" element={<CheckoutPage appData={appData} setAppData={setAppData} />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/rules" element={<LegalPageLayout title="Official Sweepstakes Rules"><RulesContent /></LegalPageLayout>} />
        <Route path="/terms" element={<LegalPageLayout title="Terms of Service"><TermsContent /></LegalPageLayout>} />
        <Route path="/privacy" element={<LegalPageLayout title="Privacy Policy"><PrivacyPolicyContent /></LegalPageLayout>} />
        <Route path="/referral" element={<LegalPageLayout title="Referral Program"><ReferralProgramContent /></LegalPageLayout>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;