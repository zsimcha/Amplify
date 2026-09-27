// src/pages/EmailConfirmedPage.jsx
// Landing page for the signup confirmation link. Supabase's /auth/v1/verify
// endpoint validates the token and redirects here; supabase-js then picks the
// session out of the URL, so by the time this renders the member is usually
// already signed in. We show a clear confirmation either way — unless the
// link itself failed (expired, already used, or pre-opened by a mail
// scanner), in which case saying "confirmed" would send the member to a
// sign-in that then tells them to confirm their email.
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import { authRedirectError } from '../lib/supabase';

const EmailConfirmedPage = () => {
  const { user, loading } = useAuth();
  const linkFailed = !!authRedirectError && !user;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl p-8 md:p-12 text-center border border-slate-100 animate-in zoom-in-95 duration-500">
            {loading ? (
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400 animate-pulse py-8">Confirming...</p>
            ) : linkFailed ? (
              <>
                <div className="bg-amber-100 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                  <AlertCircle size={44} className="text-amber-600 md:w-14 md:h-14" />
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold text-indigo-950 mb-4 tracking-tight">
                  This link didn't work.
                </h1>
                <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed mb-8 md:mb-10">
                  Confirmation links expire and can only be used once. If you've already confirmed, just sign in. If not, sign in with your email and password and we'll offer to send a fresh link.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl text-xs md:text-sm"
                >
                  Sign In <ChevronRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <div className="bg-green-100 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle size={44} className="text-green-600 md:w-14 md:h-14" />
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold text-indigo-950 mb-4 tracking-tight">
                  Email confirmed.
                </h1>
                <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed mb-8 md:mb-10">
                  {user
                    ? "Your account is active and you're signed in. You can manage your membership anytime from My Account."
                    : "Your email is confirmed and your account is active. Sign in to manage your membership anytime."}
                </p>
                <Link
                  to={user ? '/account' : '/login'}
                  className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl text-xs md:text-sm"
                >
                  {user ? 'Go to My Account' : 'Sign In'} <ChevronRight size={16} />
                </Link>
                <p className="mt-6">
                  <Link to="/" className="text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                    Return home
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmailConfirmedPage;
