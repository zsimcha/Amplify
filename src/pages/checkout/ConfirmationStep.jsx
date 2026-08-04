import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

// Final "You're in" confirmation screen shown once checkout (and, if
// applicable, the causes step) has completed.
const ConfirmationStep = ({ selectedCommunity, causesSaved, causeSlugs, isSignedIn }) => (
  <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-xl p-8 md:p-24 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
    <div className="bg-green-100 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-10"><CheckCircle size={48} className="text-green-600 md:w-16 md:h-16" /></div>
    <h4 className="text-3xl md:text-5xl font-black text-indigo-950 mb-4 md:mb-6 italic uppercase tracking-tighter">You're in.</h4>
    <p className="text-slate-500 text-base md:text-xl font-medium max-w-md mx-auto leading-relaxed mb-6 md:mb-8">
      Welcome to the {selectedCommunity} circle. Your monthly impact starts today.
    </p>

    <div className="max-w-md mx-auto mb-8 md:mb-10 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
      <p className="text-xs md:text-sm text-indigo-900 font-medium leading-relaxed">
        {causesSaved
          ? (isSignedIn
              ? `You're supporting ${causeSlugs.length} ${causeSlugs.length === 1 ? 'organization' : 'organizations'}. Update your causes anytime from My Account.`
              : `We've saved your ${causeSlugs.length} ${causeSlugs.length === 1 ? 'cause' : 'causes'} and will apply them the moment you confirm your email and sign in.`)
          : 'Your donation will be split evenly among all of our partner organizations. You can choose specific causes anytime from My Account.'}
      </p>
    </div>

    {!isSignedIn && (
      <p className="text-slate-400 text-xs md:text-sm font-medium max-w-md mx-auto leading-relaxed mb-8 md:mb-10">
        We've created your account — if a confirmation email lands in your inbox, click it to activate sign-in. You can manage your membership anytime from <span className="font-bold text-slate-500">My Account</span>.
      </p>
    )}
    <Link to="/" className="inline-block px-12 py-4 md:py-5 bg-indigo-900 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Return Home</Link>
  </div>
);

export default ConfirmationStep;
