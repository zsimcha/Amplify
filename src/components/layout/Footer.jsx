import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 pt-16 pb-8 px-4 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <span className="text-2xl font-black tracking-tighter uppercase text-white">Amplify</span>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/impact" className="hover:text-white transition-colors">Our Impact</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link to="/rules" className="hover:text-white transition-colors">Official Rules</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
        
        {/* Adjusted Layout: Info on Left, Disclaimer on Right */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="text-slate-400 text-[11px] md:text-xs text-center md:text-left shrink-0 w-full md:w-auto">
            <p className="font-bold text-white mb-1">Amplify LLC</p>
            <p>info@amplifygive.com</p>
          </div>
          <p className="text-slate-500 text-[10px] leading-relaxed max-w-3xl text-center md:text-right w-full">
            Amplify is a sweepstakes-based giving platform. A portion of each circle's pool funds prize drawings. Charitable contributions benefit our 501(c)(3) partner organizations. Prize winnings subject to applicable tax regulations. No purchase necessary to enter or win. See official rules for full details.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;