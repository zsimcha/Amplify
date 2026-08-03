import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import CharitySelector from '../../components/CharitySelector';

// Post-checkout "pick your causes" step (up to 4 orgs). Its own screen,
// shown between the payment form and the final confirmation screen.
const CausesStep = ({ causeSlugs, onChangeCauseSlugs, savingCauses, causesError, onSave, onSkip }) => (
  <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-xl p-8 md:p-16 animate-in fade-in slide-in-from-bottom-2 duration-500 border border-slate-100">
    <div className="text-center mb-8 md:mb-10">
      <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-3">Last step</p>
      <h4 className="text-3xl md:text-5xl font-black text-indigo-950 mb-4 italic uppercase tracking-tighter">Pick your causes.</h4>
      <p className="text-slate-500 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed">
        Choose up to 4 Chessed organizations for your giving to support. You can change them anytime.
      </p>
    </div>

    <CharitySelector value={causeSlugs} onChange={onChangeCauseSlugs} max={4} />

    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 max-w-2xl mx-auto">
      <Info size={15} className="text-slate-400 shrink-0 mt-0.5" />
      <p className="text-xs md:text-[0.8125rem] text-slate-600 font-medium leading-relaxed">
        If you don't pick any causes, your donation is split evenly among all of our partner organizations.
      </p>
    </div>

    {causesError && (
      <div className="mt-4 max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
        <AlertCircle size={14} className="mt-0.5 shrink-0" /> <p>{causesError}</p>
      </div>
    )}

    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        onClick={onSave}
        disabled={savingCauses || causeSlugs.length === 0}
        className="w-full sm:w-auto px-12 py-4 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest text-xs md:text-sm hover:bg-black transition-all shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {savingCauses ? 'Saving...' : 'Continue'}
      </button>
      <button
        onClick={onSkip}
        disabled={savingCauses}
        className="text-[0.625rem] md:text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
      >
        Skip, split among all
      </button>
    </div>
  </div>
);

export default CausesStep;
