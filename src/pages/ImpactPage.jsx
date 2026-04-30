import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Building, Heart, Check, Search, Target, Zap, Shield } from 'lucide-react';

const ImpactPage = () => {
  return (
    <PageLayout title="Our Impact" intro="We don't spread the money thin. We identify one organization at a time. We vet them for impact, financial transparency, and readiness to deploy funding. Then we issue the full grant directly to them.">
      
      <section className="py-12 px-4 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xl text-slate-600 font-medium italic">
            "The best grant we can give isn't just money. It's the right amount, to the right organization, at the right moment."
          </p>
        </div>
      </section>

      {/* This Month's Partner */}
      <section className="py-16 md:py-24 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
            
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">This Month's Partner</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Chai Lifeline</h2>
              <div className="prose prose-lg text-slate-600 font-medium mb-8">
                <p>Chai Lifeline is there for families the moment a child is diagnosed with cancer or a life-threatening illness. Transportation, counseling, summer camp, crisis support — whatever a family needs, Chai Lifeline provides it.</p>
                <p className="font-bold text-slate-900">Our collective grant goes directly to making sure no child or family faces this alone.</p>
                <h3 className="text-xl font-bold text-slate-900 mt-8 mb-3">Why we chose them:</h3>
                <p>Chai Lifeline has an established track record of financial transparency, measurable impact, and programmatic excellence. A grant at this scale funds [specific program detail] and allows them to serve [X] additional families this year.</p>
              </div>

              <div className="space-y-4 mb-10 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                  <Heart size={24} className="text-amber-500 fill-current" />
                  <p className="font-bold text-slate-900 text-lg">Grant Target: <span className="text-slate-600 font-medium">$400,000</span></p>
                </div>
                <div className="flex items-center gap-4">
                  <Building size={24} className="text-indigo-600" />
                  <p className="font-bold text-slate-900 text-lg">Status: <span className="text-slate-600 font-medium">Verified 501(c)(3)</span></p>
                </div>
                <div className="flex items-center gap-4">
                  <Check size={24} className="text-emerald-500" />
                  <p className="font-bold text-slate-900 text-lg">Charity Navigator Rating: <span className="text-slate-600 font-medium">[Add rating]</span></p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl relative bg-slate-900">
                <img src="/impact-photo.jpg" alt="Impact" className="absolute inset-0 w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.style.display='none'; }} />
              </div>
              <div className="bg-indigo-950 text-white p-8 md:p-10 rounded-3xl shadow-xl relative">
                <svg className="absolute top-8 left-8 text-indigo-800 w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 32 32"><path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.896 3.456-8.352 9.12-8.352 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" /></svg>
                <p className="relative z-10 text-lg md:text-xl font-medium italic leading-relaxed pt-10 mb-6 text-indigo-100">"[Quote from Chai Lifeline leadership — pursue this actively. A single quote from their director is worth more than a page of your own copy.]"</p>
                <p className="relative z-10 font-bold text-white">— Director Name, Chai Lifeline</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Vetting Process */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">Vetting</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Our vetting process.</h2>
            <p className="text-lg text-slate-600 font-medium mt-4">Every Amplify charity partner goes through the same review before being featured:</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
            <div className="bg-white p-10 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
              <Search size={32} className="text-indigo-600 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-wide">Financials</h3>
              <p className="text-slate-600 font-medium leading-relaxed">We review audited financials, 990 filings, and overhead ratios. We only partner with organizations that can account for every single dollar.</p>
            </div>
            
            <div className="bg-white p-10 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
              <Target size={32} className="text-amber-500 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-wide">Clear Impact</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Not "it helps our general fund." We look for organizations that can tell us exactly what program this grant funds, and how many families it will reach.</p>
            </div>
            
            <div className="bg-white p-10 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
              <Zap size={32} className="text-blue-500 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-wide">Ready to Scale</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Some nonprofits aren't structured to deploy a huge lump-sum gift effectively. We look for partners where this grant acts as a true catalyst.</p>
            </div>
            
            <div className="bg-white p-10 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
              <Shield size={32} className="text-emerald-500 mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-wide">Proven Trust</h3>
              <p className="text-slate-600 font-medium leading-relaxed">We prioritize organizations with an established track record in the communities we serve. Trust is earned, and we rely on partners who have already earned it.</p>
            </div>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default ImpactPage;