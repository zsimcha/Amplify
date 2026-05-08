import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import ImpactPage from './pages/ImpactPage';
import FaqPage from './pages/FaqPage';
import CirclesPage from './pages/CirclesPage';
import CheckoutPage from './pages/CheckoutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import RulesContent from './components/RulesContent';
import PrivacyPolicyContent from './components/PrivacyPolicyContent';
import TermsContent from './components/TermsContent';
import ReferralProgramContent from './components/ReferralProgramContent';
import SecondaryNavbar from './components/layout/SecondaryNavbar';
import Footer from './components/layout/Footer';

const LegalPageLayout = ({ title, children }) => (
  <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-indigo-100 flex flex-col">
    <SecondaryNavbar />
    <main className="flex-grow py-8 md:py-16 px-4 md:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 px-6 py-10 md:px-14 md:py-16">
        {title && (
          <header className="mb-10 md:mb-14 pb-8 border-b border-slate-200">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 mb-3">Legal</p>
            <h1 className="text-3xl md:text-5xl font-black uppercase italic text-indigo-950 tracking-tighter leading-[1.05]">{title}</h1>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mt-4">Last updated: January 2026</p>
          </header>
        )}
        <div className="text-slate-700 font-medium leading-relaxed text-sm md:text-base">
          {children}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

// SCROLL FIX: Only scrolls to top on route change, ignores initial load (refreshing)
// Also skips when navigating to a hash so anchor scrolling works.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (hash) return; // Let the destination page handle hash navigation
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

const appData = {
  tierData: {
    silver: { price: 250, prize: "$25,000", totalOdds: "1 / 100", otherPrizes: ["1x $1,250", "2x $750"] },
    gold: { price: 500, prize: "$50,000", totalOdds: "1 / 50", otherPrizes: ["1x $2,500", "6x $1,000"] },
    diamond: { price: 1000, prize: "$100,000", totalOdds: "1 / 25", otherPrizes: ["1x $5,000", "2x $3,000", "12x $2,000"] }
  },
  allCommunityNames: ["General Circle"],
  communities: { "General Circle": { members: 0, monthly: 0, silver: 0, gold: 0, diamond: 0 } }
};

function App() {
  const [appState, setAppData] = useState(appData);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage appData={appState} />} />
        
        <Route path="/how-it-works" element={<HowItWorksPage appData={appState} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/impact" element={<ImpactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/circles" element={<CirclesPage appData={appState} />} />

        <Route path="/checkout" element={<CheckoutPage appData={appState} setAppData={setAppData} />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/rules" element={<LegalPageLayout title="Official Sweepstakes Rules"><RulesContent /></LegalPageLayout>} />
        <Route path="/privacy" element={<LegalPageLayout title="Privacy Policy"><PrivacyPolicyContent /></LegalPageLayout>} />
        <Route path="/terms" element={<LegalPageLayout title="Terms of Service"><TermsContent /></LegalPageLayout>} />
        <Route path="/referral" element={<LegalPageLayout title="Referral Program Terms"><ReferralProgramContent /></LegalPageLayout>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;