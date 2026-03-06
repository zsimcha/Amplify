import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const LogoIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-12 md:h-12" fill="none" aria-label="Amplify Logo">
    <rect x="28" y="55" width="8" height="15" rx="2" fill="white" />
    <rect x="40" y="40" width="8" height="30" rx="2" fill="white" />
    <rect x="52" y="25" width="8" height="45" rx="2" fill="#fbbf24" />
    <rect x="64" y="40" width="8" height="30" rx="2" fill="white" />
    <path d="M25 75H75" stroke="white" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const SecondaryNavbar = () => (
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="bg-indigo-900 text-white p-1 md:p-1.5 rounded-lg md:rounded-xl"><LogoIcon /></div>
        <span className="text-xl md:text-2xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
      </Link>
      <Link to="/" className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-1 hover:text-indigo-900">
        <ArrowLeft size={16} /><span className="hidden sm:inline">Back to</span><span>Home</span>
      </Link>
    </div>
  </nav>
);

export default SecondaryNavbar;