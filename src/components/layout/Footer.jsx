import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 md:pt-20 pb-8 px-4 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Top: Multi-column structure */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-y-12 gap-x-6 md:gap-x-10 mb-14 md:mb-16">
          
          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-4">
            <div className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-white mb-4">Amplify</div>
            <p className="text-xs md:text-sm leading-relaxed text-slate-400 max-w-[16.25rem] font-medium">
              Pool your monthly Tzedakah. Power transformational grants. Win up to $100,000 every month.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div className="md:col-span-3">
            <h3 className="text-[0.625rem] md:text-xs font-black uppercase tracking-[0.2em] text-white mb-5">Explore</h3>
            <ul className="space-y-3 text-xs md:text-sm font-medium">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/circles" className="hover:text-white transition-colors">Circles</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/grant" className="hover:text-white transition-colors">Partners</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="md:col-span-2">
            <h3 className="text-[0.625rem] md:text-xs font-black uppercase tracking-[0.2em] text-white mb-5">Legal</h3>
            <ul className="space-y-3 text-xs md:text-sm font-medium">
              <li><Link to="/rules" className="hover:text-white transition-colors">Official Rules</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 4: Get in Touch */}
          <div className="md:col-span-3">
            <h3 className="text-[0.625rem] md:text-xs font-black uppercase tracking-[0.2em] text-white mb-5">Get in Touch</h3>
            <ul className="space-y-3 text-xs md:text-sm font-medium">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><a href="mailto:support@amplifygive.com" className="hover:text-white transition-colors break-all">support@amplifygive.com</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom: Divider + Copyright */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <p className="text-[0.6875rem] text-slate-500 leading-relaxed max-w-3xl">
            Amplify is a sweepstakes-based giving platform. A portion of each circle's pool funds prize drawings. Charitable contributions are administered through (Nonprofit), a registered 501(c)(3) DAF, and granted to our partner organizations. No purchase necessary to enter or win. See <Link to="/rules" className="text-slate-300 hover:text-white underline">official rules</Link> for full details.
          </p>
          <p className="text-[0.6875rem] text-slate-500 shrink-0 font-medium">
            © {new Date().getFullYear()} Amplify LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;