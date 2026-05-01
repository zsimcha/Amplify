import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { HelpCircle } from 'lucide-react';

const CirclesPage = ({ appData }) => {
  const navigate = useNavigate();
  const [activeTooltip, setActiveTooltip] = useState(null);

  const handleJoinClick = (tier, e) => {
    if (e) e.stopPropagation();
    navigate('/checkout', { state: { tier } }); 
  };

  const handleCardClick = (tier, e) => {
    if (window.innerWidth >= 768) {
      handleJoinClick(tier, e);
    }
  };

  return (
    <PageLayout 
      title="Pick Your Circle" 
      intro="Each circle funds one massive grant. You have real odds of winning big."
    >
      <section className="py-16 md:py-24 bg-white px-4" onClick={() => setActiveTooltip(null)}>
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto pb-8">
            {['silver', 'gold', 'diamond'].map((tier) => {
              const totalPool = (appData.tierData[tier].price * 400).toLocaleString();
              const headerColor = tier === 'silver' ? 'text-slate-500' : tier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]';
              const dotColor = tier === 'silver' ? 'bg-slate-400' : tier === 'gold' ? 'bg-[#eab308]' : 'bg-[#818cf8]';

              return (
                <div key={tier} onClick={(e) => handleCardClick(tier, e)} className="bg-white border border-slate-200 rounded-2xl flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 md:cursor-pointer group/card animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                      <span className={`text-xs font-black uppercase tracking-widest ${headerColor}`}>{tier} Circle</span>
                    </div>
                    <span className="text-base font-black text-slate-900">
                      ${appData.tierData[tier].price.toLocaleString()}
                      <span className="text-xs font-semibold text-slate-400">/mo</span>
                    </span>
                  </div>

                  <div className="px-6 pt-8 pb-6 text-center flex flex-col items-center justify-center bg-white">
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Monthly Grand Prize</p>
                    <p className={`text-5xl md:text-6xl font-black tracking-tighter leading-none ${headerColor}`}>{appData.tierData[tier].prize}</p>
                  </div>

                  <div className="mx-6 py-4 border-t border-b border-slate-200 flex flex-col gap-4 relative z-20">
                    <div className="flex justify-between items-center relative">
                      <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">Grand Prize Odds</span>
                      <span className="text-sm md:text-base font-black text-slate-700 flex items-center gap-1.5">
                        <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Up to</span> 1 / 400
                      </span>
                    </div>
                    <div className="flex justify-between items-center relative">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Winning Odds</span>
                        <div className="relative inline-flex items-center" onMouseEnter={() => setActiveTooltip(`${tier}-tot`)} onMouseLeave={() => setActiveTooltip(null)} onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === `${tier}-tot` ? null : `${tier}-tot`); }}>
                          <HelpCircle size={14} className="text-slate-400 cursor-pointer" />
                          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 max-w-[80vw] bg-slate-900 text-white p-3 rounded-xl shadow-xl text-[10px] leading-relaxed font-medium normal-case transition-all duration-200 z-[100] text-center pointer-events-none ${activeTooltip === `${tier}-tot` ? 'opacity-100 visible' : 'opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible'}`}>
                              The estimated probability of winning any prize when the circle fills.
                              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-slate-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm md:text-base font-black text-slate-700 flex items-center gap-1.5">
                        <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Up to</span> {appData.tierData[tier].totalOdds}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-3 border-t border-slate-200">
                      <span className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Combined Tzedakah Pool</span>
                      <span className="text-base md:text-lg font-black text-slate-700">${totalPool}</span>
                    </div>
                  </div>

                  <div className="px-6 py-5 flex-grow bg-white">
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Other Monthly Prizes</p>
                    <div className="space-y-0 relative z-10">
                      {appData.tierData[tier].otherPrizes.map((p, i) => {
                        let qty = '1 winner';
                        let amount = p;
                        const lowerP = p.toLowerCase();
                        if (lowerP.includes('x')) {
                          const parts = lowerP.split('x');
                          const count = parseInt(parts[0].trim());
                          qty = count === 1 ? '1 winner' : `${count} winners`;
                          amount = p.substring(lowerP.indexOf('x') + 1).trim();
                        }
                        
                        return (
                          <div key={i} className="flex justify-between items-center text-sm py-2.5 border-b border-slate-50 last:border-0">
                            <span className="text-slate-500 font-bold text-sm md:text-base">{qty}</span>
                            <span className="font-black text-slate-800 tabular-nums text-base md:text-lg">{amount}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-5 pt-3 bg-white rounded-b-2xl relative z-10 overflow-hidden mt-auto">
                    <button onClick={(e) => handleJoinClick(tier, e)} className="w-full py-3.5 rounded-lg font-bold text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-wider lg:tracking-widest transition-all whitespace-nowrap bg-slate-900 text-white hover:bg-indigo-900 shadow-lg group-hover/card:bg-indigo-900">
                      Join Now • ${appData.tierData[tier].price.toLocaleString()}/mo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-10 text-center px-4">
            <p className="text-slate-500 text-[11px] md:text-xs font-medium leading-relaxed text-center max-w-2xl mx-auto">
              Actual odds of winning depend on total eligible entries. No purchase necessary. See <Link to="/rules" className="underline hover:text-slate-700 transition-colors">official rules</Link>.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default CirclesPage;