import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { ChevronRight, ShieldCheck, Lock, CreditCard, Landmark, FileText } from 'lucide-react';

const AboutPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <PageLayout title="About Amplify" intro="How we're building the future of collective giving.">
      
      {/* The Mission */}
      <section className="py-16 md:py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Consistent, collective giving changes things that individual giving can't.</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black text-xl mb-6">1</div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">The Problem</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Most people who care about Tzedakah give sporadically, responding to emergency appeals and WhatsApp links. We all want to give more consistently, but life gets in the way.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xl mb-6">2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">The Solution</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Amplify turns individual generosity into collective power by pooling monthly giving into a single massive grant. We make giving consistently rewarding with real prizes and real odds.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-black text-xl mb-6">3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">The Result</h3>
              <p className="text-slate-600 font-medium leading-relaxed">People stick with it. The charities receive transformational, overhead-free grants. The donors get a chance to win big. The community wins together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Trust (Dark Section Moved Up) */}
      <section className="py-16 md:py-24 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Trust & Transparency.</h2>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">Enterprise-grade infrastructure ensures your data, payments, and impact are fully secure and legally compliant.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <ShieldCheck size={28} className="text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Legal Structure</h3>
              <p className="text-slate-400 font-medium leading-relaxed text-sm">Amplify operates as Amplify LLC. Sweepstakes are conducted in strict compliance with US federal and state regulations governing prize promotions.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <Lock size={28} className="text-amber-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Prize Security</h3>
              <p className="text-slate-400 font-medium leading-relaxed text-sm">Prize pools are held in a dedicated account and administered accordingly. Winners are verified independently before any prize is disbursed.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <CreditCard size={28} className="text-indigo-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Payment Processing</h3>
              <p className="text-slate-400 font-medium leading-relaxed text-sm">All contributions are processed securely via Stripe. Your payment information is never stored on Amplify's servers.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl lg:col-span-2">
              <Landmark size={28} className="text-blue-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Charitable Disbursement</h3>
              <p className="text-slate-400 font-medium leading-relaxed text-sm">Contributions are received and held by Givinga, a registered 501(c)(3) donor-advised fund. Grants are issued from Givinga directly to our vetted charity partner each month.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex flex-col justify-center items-center text-center">
              <FileText size={28} className="text-slate-300 mb-4" />
              <p className="text-slate-300 font-bold mb-4">All drawings strictly documented.</p>
              <Link to="/rules" className="inline-flex items-center gap-2 text-white font-bold hover:text-slate-300 transition-colors text-sm underline underline-offset-4">
                See official rules
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rabbinic Panel (Moved Down so it borders the footer nicely) */}
      <section id="rabbinic-panel" className="py-16 md:py-24 px-4 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.3em] mb-4">Rabbinic Endorsement</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">Our Rabbinic Panel</h2>
            <p className="text-lg text-slate-600 font-medium">Amplify's model, including its approach to Ma'aser, prize allocation, and charitable disbursement, has been formally reviewed and endorsed by the following Rabbinic authorities.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10 mb-16">
            {[1, 2, 3].map((item, index) => (
              <div key={index} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-28 h-28 bg-slate-200 rounded-full mb-6 shrink-0 shadow-inner"></div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Rabbi Name</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 pb-6 border-b border-slate-200 w-full">Title / Community</p>
                <div className="prose text-slate-600 font-medium italic text-sm leading-relaxed">
                  <p>"Excerpt from their Haskama goes here. A paragraph detailing their review of the model, sweepstakes mechanics, and validity of using Ma'aser funds for this platform."</p>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center bg-indigo-50 rounded-2xl p-8 border border-indigo-100">
            <p className="text-indigo-900 font-medium">We take the halachic integrity of your giving seriously. If you have specific questions about how your Amplify membership interacts with your Ma'aser obligations, we encourage you to speak with your own posek.</p>
          </div>
        </div>
      </section>

    </PageLayout>
  );
};

export default AboutPage;