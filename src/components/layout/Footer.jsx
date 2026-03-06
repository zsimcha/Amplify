import React from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon } from './SecondaryNavbar';

const Footer = () => (
  <footer className="bg-slate-950 text-slate-500 py-12 md:py-16 px-4 border-t border-slate-900">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12 mb-8 md:mb-12">
        <div className="flex items-center gap-2"><LogoIcon /><span className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">Amplify</span></div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
          <Link to="/rules" className="hover:text-white transition-colors">Official Rules</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link to="/referral" className="hover:text-white transition-colors">Referral Program</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
    </div>
    <p className="text-[9px] md:text-[10px] leading-relaxed max-w-4xl opacity-40 uppercase tracking-widest font-bold mx-auto text-center">DISCLOSURE: Amplify sweepstakes are subject to official rules. Actual odds of winning depend on the total number of eligible entries received. No purchase necessary to enter or win. Void where prohibited.</p>
  </footer>
);

export default Footer;