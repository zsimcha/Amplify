import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import OddsVisualizer from '../components/OddsVisualizer';

const CircleCard = ({ tier, tierData, onJoin }) => {
  const headerColor = tier === 'silver' ? 'text-slate-500' : tier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]';
  const dotColor = tier === 'silver' ? 'bg-slate-400' : tier === 'gold' ? 'bg-[#eab308]' : 'bg-[#818cf8]';
  const data = tierData[tier];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-soft p-8 flex flex-col animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
          <span className={`font-black uppercase tracking-widest text-xs lg:whitespace-nowrap ${headerColor}`}>{tier} Circle</span>
        </div>
        <span className="font-black text-slate-900 text-base whitespace-nowrap">
          ${data.price.toLocaleString()}<span className="text-xs font-semibold text-slate-400">/mo</span>
        </span>
      </div>

      <div className="flex justify-between items-center gap-3 mb-5 pb-4 border-b border-slate-200">
        <span className="font-bold text-slate-400 uppercase text-xs tracking-widest lg:whitespace-nowrap">Grand Prize</span>
        <span className="font-black text-slate-900 text-2xl whitespace-nowrap">{data.prize}</span>
      </div>

      <div className="space-y-3.5 flex-grow">
        {data.otherPrizes.map((p, i) => {
          let qty = '1 winner';
          let amount = p;
          const lowerP = p.toLowerCase();
          if (lowerP.includes('x')) {
            const count = parseInt(lowerP.split('x')[0].trim());
            qty = count === 1 ? '1 winner' : `${count} winners`;
            amount = p.substring(lowerP.indexOf('x') + 1).trim();
          }
          return (
            <div key={i} className="flex justify-between items-center text-base">
              <span className="text-slate-500 font-bold">{qty}</span>
              <span className="font-black text-slate-700">{amount}</span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onJoin(tier)}
        className="w-full mt-6 py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all bg-slate-900 text-white hover:bg-indigo-900"
      >
        Join Now • ${data.price.toLocaleString()}/mo
      </button>
    </div>
  );
};

const CirclesPage = ({ appData }) => {
  const navigate = useNavigate();

  return (
    <PageLayout title="Pick Your Circle" intro="See your odds. Pick your circle.">
      <section className="py-16 md:py-24 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 max-w-5xl mx-auto">
            <OddsVisualizer tierData={appData.tierData} />
          </div>

          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-10">
            Pool in <span className="text-slate-300 mx-1">→</span> Pick your cause <span className="text-slate-300 mx-1">→</span> Drawing
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {['silver', 'gold', 'diamond'].map((tier) => (
              <CircleCard
                key={tier}
                tier={tier}
                tierData={appData.tierData}
                onJoin={(t) => navigate('/checkout', { state: { tier: t, from: '/circles' } })}
              />
            ))}
          </div>

          <p className="mt-10 text-slate-500 text-[0.6875rem] md:text-xs font-medium leading-relaxed text-center max-w-2xl mx-auto px-4">
            Actual odds of winning depend on total eligible entries. No purchase necessary. See <Link to="/rules" className="underline hover:text-slate-700 transition-colors">official rules</Link>.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default CirclesPage;
