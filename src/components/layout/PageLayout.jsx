import React from 'react';
import MainNavbar from './MainNavbar';
import Footer from './Footer';
import CornerConstellation from '../CornerConstellation';

const PageLayout = ({ children, title, intro }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 flex flex-col">
      <MainNavbar />
      <main className="flex-grow">
        {/* Universal Dark Hero Header for Inner Pages */}
        <header className="bg-indigo-950 text-white pt-32 md:pt-40 pb-16 md:pb-24 px-4 text-center relative overflow-hidden">
          {/* Primary constellation, top-right */}
          <CornerConstellation
            corner="top-right"
            width={420}
            height={320}
            density={20}
            maxR={2.8}
            className="absolute -top-12 -right-12 w-[420px] md:w-[560px] h-[320px] md:h-[420px] pointer-events-none"
          />
          {/* Subtle secondary, bottom-left, for asymmetry */}
          <CornerConstellation
            corner="bottom-left"
            width={240}
            height={180}
            density={28}
            maxR={2}
            seed={7}
            className="absolute -bottom-8 -left-8 w-[240px] h-[180px] pointer-events-none opacity-40"
          />

          <div className="max-w-4xl mx-auto relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase mb-6">{title}</h1>
            {intro && <p className="text-indigo-200 text-lg md:text-xl font-medium leading-relaxed">{intro}</p>}
          </div>
        </header>
        
        {/* Page Content */}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;