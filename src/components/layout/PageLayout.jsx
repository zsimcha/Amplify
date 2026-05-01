import React from 'react';
import MainNavbar from './MainNavbar';
import Footer from './Footer';

const PageLayout = ({ children, title, intro }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 flex flex-col">
      <MainNavbar />
      <main className="flex-grow">
        {/* Universal Dark Hero Header for Inner Pages */}
        <header className="bg-indigo-950 pt-32 md:pt-40 pb-16 md:pb-24 px-4 text-center">
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
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