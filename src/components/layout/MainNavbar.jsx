import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LogoIcon } from './SecondaryNavbar';

const MainNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleJoinClick = () => {
    setIsMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('tiers');
      if (el) {
        const offset = 70;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById('tiers');
        if (el) {
          const offset = 70;
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <>
      <nav className={`fixed w-full z-40 top-0 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm py-0' : 'bg-transparent py-2'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Smooth scroll to top added here */}
          <Link to="/" onClick={(e) => { if (location.pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left" aria-label="Go to Home">
            <div className={`p-1.5 rounded-lg transition-all duration-300 ${isScrolled ? 'bg-indigo-950 text-white' : 'bg-white/15 backdrop-blur-sm text-white'}`}>
              <LogoIcon />
            </div>
            <span className={`text-xl md:text-2xl font-black tracking-tighter uppercase transition-colors ${isScrolled ? 'text-indigo-950' : 'text-white'}`}>
              Amplify
            </span>
          </Link>
          
          <div className={`hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-left transition-colors ${isScrolled ? 'text-slate-500' : 'text-indigo-200'}`}>
            <Link to="/how-it-works" className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>How it works</Link>
            <Link to="/about" className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>About</Link>
            <Link to="/impact" className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>Our Impact</Link>
            <Link to="/faq" className={`transition-colors uppercase tracking-[0.2em] ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`}>FAQ</Link>
          </div>
          
          <button className={`md:hidden p-2 transition-colors ${isScrolled ? 'text-indigo-900' : 'text-white'}`} onClick={() => setIsMenuOpen(true)} aria-label="Open Menu">
            <Menu size={24} />
          </button>
          
          <button onClick={handleJoinClick} className="hidden md:block bg-amber-400 text-slate-900 px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-amber-300 transition-all uppercase tracking-widest shadow-lg shadow-amber-400/20">
            Join the Circle
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white animate-in slide-in-from-right duration-300 flex flex-col" role="dialog">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 shrink-0 text-left">
                <span className="text-xl font-black tracking-tighter text-indigo-950 uppercase">Amplify</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-indigo-950 p-2"><X size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-base font-bold text-slate-900 uppercase tracking-widest text-left">
                <Link to="/how-it-works" onClick={() => setIsMenuOpen(false)} className="text-left border-b border-slate-50 pb-3">How it works</Link>
                <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-left border-b border-slate-50 pb-3">About</Link>
                <Link to="/impact" onClick={() => setIsMenuOpen(false)} className="text-left border-b border-slate-50 pb-3">Our Impact</Link>
                <Link to="/faq" onClick={() => setIsMenuOpen(false)} className="text-left border-b border-slate-50 pb-3">FAQ</Link>
            </div>
            <div className="p-6 border-t border-slate-50 shrink-0 text-left">
                <button onClick={handleJoinClick} className="w-full py-5 bg-amber-400 text-slate-900 rounded-lg font-bold uppercase tracking-widest text-sm shadow-xl shadow-amber-400/20">Join the Circle</button>
            </div>
        </div>
      )}
    </>
  );
};

export default MainNavbar;