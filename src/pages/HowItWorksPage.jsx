import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

const HowItWorksPage = ({ appData }) => {
  return (
    <PageLayout 
      title="How It Works" 
      intro="Consistent, collective giving creates impact that individual giving simply can't."
    >
      
      {/* The Circle Model */}
      <section className="py-12 md:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Every donor is part of a circle.</h2>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">Each circle is capped at exactly 400 members. That's the specific number required to create a massive charity grant while maintaining high prize odds.</p>
        </div>

        <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="py-5 px-6 font-black uppercase tracking-widest text-xs text-slate-400">Circle</th>
                  <th className="py-5 px-6 font-black uppercase tracking-widest text-xs text-slate-400">Monthly Gift</th>
                  <th className="py-5 px-6 font-black uppercase tracking-widest text-xs text-slate-400">Full Circle Pool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50">
                  <td className="py-5 px-6 font-bold text-slate-900">Silver</td>
                  <td className="py-5 px-6 font-medium text-slate-600">$250/mo</td>
                  <td className="py-5 px-6 font-black text-slate-900">$100,000/month</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-5 px-6 font-bold text-slate-900">Gold</td>
                  <td className="py-5 px-6 font-medium text-slate-600">$500/mo</td>
                  <td className="py-5 px-6 font-black text-slate-900">$200,000/month</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-5 px-6 font-bold text-slate-900">Diamond</td>
                  <td className="py-5 px-6 font-medium text-slate-600">$1,000/mo</td>
                  <td className="py-5 px-6 font-black text-slate-900">$400,000/month</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The Grant */}
      <section className="py-16 md:py-24 px-4 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">One massive check. Every month.</h2>
            <p className="text-lg text-slate-300 font-medium max-w-2xl mx-auto">The pooled funds are issued as a single grant to one vetted nonprofit partner. Not split across dozens of organizations. Not dripped out over time.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] hover:border-blue-400/30 group">
              <h3 className="text-5xl md:text-6xl font-black text-amber-400 tracking-tighter mb-4 group-hover:scale-105 transition-transform origin-left">$400k</h3>
              <h4 className="text-xl font-bold mb-3 text-white">Scale matters</h4>
              <p className="text-slate-300 leading-relaxed font-medium">Transformational gifts—the kind that let an organization expand, launch a new program, or hit a critical milestone—need scale. $250 doesn't do that. $400,000 does.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] hover:border-blue-400/30 group">
              <h3 className="text-5xl md:text-6xl font-black text-emerald-400 tracking-tighter mb-4 group-hover:scale-105 transition-transform origin-left">0%</h3>
              <h4 className="text-xl font-bold mb-3 text-white">Zero acquisition cost</h4>
              <p className="text-slate-300 leading-relaxed font-medium">Our charity partners receive this grant with zero fundraising cost on their end. No gala. No matching campaign. No WhatsApp appeal. Just the grant.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Prize Model */}
      <section className="py-16 md:py-24 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">Why Prizes?</h2>
          <p className="text-xl text-slate-600 font-medium leading-relaxed mb-10 max-w-3xl mx-auto">
            Consistent giving at scale is hard to sustain without a reason to show up every month. A giving circle without prizes might raise $40,000 in a good month. With them, it raises $400,000 delivered to a charity that spent nothing to acquire it. A smaller percentage of a much larger pool does more good than 100% of a small one.
          </p>
          <div className="bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl inline-block">
            <p className="text-2xl md:text-3xl font-black text-slate-900 italic">"That's not a compromise. That's how we optimize."</p>
          </div>
        </div>
      </section>

      {/* The Drawings */}
      <section className="py-16 md:py-24 px-4 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">When a circle fills, the drawing goes live.</h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">Every member gets one entry per month, every month they remain active. With all prizes combined, members in a full circle have winning odds up to 1 in 25.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
            {['silver', 'gold', 'diamond'].map(tier => {
              const headerColor = tier === 'silver' ? 'text-slate-500' : tier === 'gold' ? 'text-[#eab308]' : 'text-[#818cf8]';
              return (
                <div key={tier} className="bg-slate-50 border border-slate-100 rounded-3xl p-8 shadow-sm">
                  <h3 className={`font-black uppercase tracking-widest text-sm mb-6 pb-4 border-b border-slate-200 ${headerColor}`}>{tier} Circle Prizes</h3>
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Grand Prize</span>
                    <span className="font-black text-slate-900 text-3xl">{appData.tierData[tier].prize}</span>
                  </div>
                  <div className="space-y-4">
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
                        <div key={i} className="flex justify-between items-center text-base">
                          <span className="text-slate-500 font-bold">{qty}</span>
                          <span className="font-black text-slate-700">{amount}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Strictly Compliant</h3>
              <p className="text-slate-600 font-medium">All drawings are conducted in strict compliance with US sweepstakes regulations. Winners are notified directly. <Link to="/rules" className="text-indigo-600 hover:underline">See official rules.</Link></p>
            </div>
          </div>
        </div>
      </section>

      {/* Your Membership */}
      <section className="py-16 md:py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Simple, flexible, automatic.</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 mb-3">Joining</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Choose your circle, enter your payment details, and your first contribution processes immediately. You're in.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 mb-3">Recurring Giving</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Once your circle reaches 400 members, your contribution is charged on the same date each month, automatically. No reminders, no guilt.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 mb-3">Canceling</h3>
              <p className="text-slate-600 font-medium leading-relaxed">You can pause or cancel any time before your next billing date. No penalty, no runaround.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 mb-3">Tax & Ma'aser</h3>
              <p className="text-slate-600 font-medium leading-relaxed">The charitable portion is tax-deductible to the extent permitted by law. Our Rabbinic Panel has also approved using Ma'aser funds. <Link to="/about#rabbinic-panel" className="text-indigo-600 hover:underline">See their guidance.</Link></p>
            </div>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default HowItWorksPage;