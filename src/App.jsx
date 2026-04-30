import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import ImpactPage from './pages/ImpactPage';
import FaqPage from './pages/FaqPage';
import CheckoutPage from './pages/CheckoutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import RulesContent from './components/RulesContent';
import PrivacyPolicyContent from './components/PrivacyPolicyContent';
import TermsContent from './components/TermsContent';
import ReferralProgramContent from './components/ReferralProgramContent';
import SecondaryNavbar from './components/layout/SecondaryNavbar';
import Footer from './components/layout/Footer';

const LegalPageLayout = ({ children }) => (
  <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 flex flex-col">
    <SecondaryNavbar />
    <main className="flex-grow pt-24 pb-20">
      {children}
    </main>
    <Footer />
  </div>
);

// Note: The "x " spacing is strictly required to prevent the CheckoutPage parser from crashing
const appData = {
  tierData: {
    silver: { price: 250, prize: "$25,000", totalOdds: "1 / 100", otherPrizes: ["1x $1,250", "2x $750"] },
    gold: { price: 500, prize: "$50,000", totalOdds: "1 / 50", otherPrizes: ["1x $2,500", "6x $1,000"] },
    diamond: { price: 1000, prize: "$100,000", totalOdds: "1 / 25", otherPrizes: ["1x $5,000", "2x $3,000", "12x $2,000"] }
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage appData={appData} />} />
        
        <Route path="/how-it-works" element={<HowItWorksPage appData={appData} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/impact" element={<ImpactPage />} />
        <Route path="/faq" element={<FaqPage appData={appData} />} />

        <Route path="/checkout" element={<CheckoutPage appData={appData} />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/rules" element={<LegalPageLayout><RulesContent /></LegalPageLayout>} />
        <Route path="/privacy" element={<LegalPageLayout><PrivacyPolicyContent /></LegalPageLayout>} />
        <Route path="/terms" element={<LegalPageLayout><TermsContent /></LegalPageLayout>} />
        <Route path="/referral" element={<LegalPageLayout><ReferralProgramContent /></LegalPageLayout>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;