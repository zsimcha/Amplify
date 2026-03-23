import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto bg-white p-10 md:p-16 rounded-[2.5rem] shadow-xl border border-slate-100">
          <AlertCircle size={64} className="text-indigo-200 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-black text-indigo-950 uppercase italic tracking-tighter mb-4">Page Not Found</h1>
          <p className="text-slate-500 font-medium mb-8">We couldn't find the page you were looking for. It might have been moved or the link might be broken.</p>
          <Link to="/" className="inline-block px-10 py-4 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">
            Return Home
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFoundPage;