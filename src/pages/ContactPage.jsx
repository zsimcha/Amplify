import React, { useState, useEffect } from 'react';
import { Mail, Phone, Globe, CheckCircle } from 'lucide-react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';

const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT || 'https://formspree.io/f/xwvnzkqp';

const ContactPage = () => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('submitting');
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactForm) });
      if (response.ok) { setContactStatus('success'); setContactForm({ name: '', email: '', message: '' }); } 
      else { setContactStatus('error'); }
    } catch (error) { setContactStatus('error'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 flex-grow w-full">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-black text-indigo-950 mb-4 md:mb-6 uppercase italic tracking-tighter">Get in Touch</h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">Have questions about joining a circle or starting your own? We're here to help.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-slate-100">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-indigo-950 mb-6 md:mb-8">Contact Information</h3>
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-900"><Mail size={20} className="md:w-6 md:h-6" /></div>
                  <div><p className="font-bold text-slate-900 text-base md:text-lg mb-0.5 md:mb-1">Email Us</p><p className="text-sm md:text-base text-slate-500">support@amplify.org</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-900"><Phone size={20} className="md:w-6 md:h-6" /></div>
                  <div><p className="font-bold text-slate-900 text-base md:text-lg mb-0.5 md:mb-1">Call Us</p><p className="text-sm md:text-base text-slate-500">+1 (800) 555-0123</p></div>
                </div>
              </div>
            </div>
            <div className="bg-indigo-900 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl text-white">
               <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-6">Send a Message</h3>
               {contactStatus === 'success' ? (
                 <div className="bg-green-400/20 border border-green-400/50 p-6 rounded-2xl text-center animate-in fade-in zoom-in duration-300">
                    <CheckCircle className="text-green-400 mx-auto mb-3" size={40} />
                    <h4 className="font-black text-lg mb-1">Message Sent!</h4>
                    <p className="text-indigo-200 text-sm mb-6">We'll get back to you shortly.</p>
                    <button onClick={() => setContactStatus('idle')} className="text-xs font-bold uppercase tracking-widest hover:text-[#eab308] transition-colors underline underline-offset-4">Send another message</button>
                 </div>
               ) : (
                 <form className="space-y-4" onSubmit={handleSubmit}>
                   <div><label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Name</label><input type="text" required value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-3 md:p-4 text-sm md:text-base text-white placeholder-indigo-400 focus:ring-2 focus:ring-[#eab308] outline-none" placeholder="Your Name" /></div>
                   <div><label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Email</label><input type="email" required value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-3 md:p-4 text-sm md:text-base text-white placeholder-indigo-400 focus:ring-2 focus:ring-[#eab308] outline-none" placeholder="john@example.com" /></div>
                   <div><label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Message</label><textarea required value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} className="w-full bg-indigo-800/50 border border-indigo-700 rounded-xl p-3 md:p-4 text-sm md:text-base text-white placeholder-indigo-400 h-24 md:h-32 focus:ring-2 focus:ring-[#eab308] outline-none" placeholder="How can we help?"></textarea></div>
                   <button type="submit" disabled={contactStatus === 'submitting'} className="w-full py-3 md:py-4 bg-[#eab308] text-indigo-950 text-sm md:text-base font-black uppercase tracking-widest rounded-xl hover:bg-white transition-colors mt-2 disabled:opacity-70 flex justify-center items-center gap-2">
                     {contactStatus === 'submitting' ? <span className="animate-pulse">Sending...</span> : 'Send Message'}
                   </button>
                   {contactStatus === 'error' && <p className="text-red-400 text-xs text-center font-bold mt-2">Problem sending message. Please try again.</p>}
                 </form>
               )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;