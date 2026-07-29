import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { LogoIcon } from './SecondaryNavbar';
import { useAuth } from '../../context/AuthContext';

const MainNavbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > 20;
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active link styling for desktop nav.
  // Current page gets the "hover destination" color persistently,
  // so the user always sees which page they're on.
  const desktopNavClass = ({ isActive }) => {
    const base = 'transition-colors uppercase tracking-[0.2em]';
    if (isActive) {
      return `${base} ${isScrolled ? 'text-indigo-900' : 'text-white'}`;
    }
    return `${base} ${isScrolled ? 'hover:text-indigo-900' : 'hover:text-white'}`;
  };

  // Active link styling for the mobile menu — active page reads indigo
  // so it stands out from the slate stack.
  const mobileNavClass = ({ isActive }) =>
    `text-left border-b border-slate-50 pb-3 transition-colors ${
      isActive ? 'text-indigo-700' : ''
    }`;

  return (
    <>
      <nav className={`fixed w-full z-40 top-0 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm py-0' : 'bg-transparent py-2'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" onClick={(e) => { if (location.pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left" aria-label="Go to Home">
            <div className={`p-1.5 rounded-lg transition-all duration-300 ${isScrolled ? 'bg-indigo-950 text-white' : 'bg-white/15 backdrop-blur-sm text-white'}`}>
              <LogoIcon />
            </div>
            <span className={`text-xl md:text-2xl font-black tracking-tighter uppercase transition-colors ${isScrolled ? 'text-indigo-950' : 'text-white'}`}>
              Amplify
            </span>
          </Link>
          
          <div className={`hidden md:flex items-center gap-7 lg:gap-8 text-[0.6875rem] font-bold uppercase tracking-widest text-left transition-colors ${isScrolled ? 'text-slate-500' : 'text-indigo-200'}`}>
            <NavLink to="/how-it-works" className={desktopNavClass}>How it works</NavLink>
            <NavLink to="/about" className={desktopNavClass}>About</NavLink>
	    <NavLink to="/grant" className={desktopNavClass}>Causes</NavLink>
            <NavLink to="/circles" className={desktopNavClass}>Circles</NavLink>
            <NavLink to="/faq" className={desktopNavClass}>FAQ</NavLink>
          </div>
          
          <button className={`md:hidden p-2 transition-colors ${isScrolled ? 'text-indigo-900' : 'text-white'}`} onClick={() => setIsMenuOpen(true)} aria-label="Open Menu">
            <Menu size={24} />
          </button>
          
          <div className="hidden md:flex items-center gap-4">
            <Link to="/circles" className="flex items-center justify-center bg-amber-400 text-slate-900 px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-amber-300 transition-all uppercase tracking-widest shadow-lg shadow-amber-400/20">
              Join the Circle
            </Link>
            <NavLink
              to={user ? '/account' : '/login'}
              aria-label={user ? 'My Account' : 'Sign In'}
              title={user ? 'My Account' : 'Sign In'}
              className={`flex items-center justify-center h-10 transition-colors ${isScrolled ? 'text-slate-400 hover:text-indigo-900' : 'text-indigo-200/80 hover:text-white'}`}
            >
              <User size={24} strokeWidth={2.25} />
            </NavLink>
          </div>
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
                <NavLink to="/how-it-works" onClick={() => setIsMenuOpen(false)} className={mobileNavClass}>How it works</NavLink>
                <NavLink to="/about" onClick={() => setIsMenuOpen(false)} className={mobileNavClass}>About</NavLink>
                <NavLink to="/grant" onClick={() => setIsMenuOpen(false)} className={mobileNavClass}>Causes</NavLink>
                <NavLink to="/circles" onClick={() => setIsMenuOpen(false)} className={mobileNavClass}>Circles</NavLink>
                <NavLink to="/faq" onClick={() => setIsMenuOpen(false)} className={mobileNavClass}>FAQ</NavLink>
                <NavLink to={user ? '/account' : '/login'} onClick={() => setIsMenuOpen(false)} className={mobileNavClass}>
                  <span className="flex items-center gap-2"><User size={16} /> {user ? 'My Account' : 'Sign In'}</span>
                </NavLink>
            </div>
            <div className="p-6 border-t border-slate-50 shrink-0 text-left">
                <Link to="/circles" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center w-full py-5 bg-amber-400 text-slate-900 rounded-lg font-bold uppercase tracking-widest text-sm shadow-xl shadow-amber-400/20">
                  Join the Circle
                </Link>
            </div>
        </div>
      )}
    </>
  );
};

export default MainNavbar;