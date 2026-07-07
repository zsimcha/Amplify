import React, { useState, useEffect } from 'react';
import SecondaryNavbar from '../components/layout/SecondaryNavbar';
import Footer from '../components/layout/Footer';
import { Mail, MessageSquare, Send, AlertCircle, Loader2 } from 'lucide-react';

// SECURITY FIX: Pulls securely from environment variables. No fallback exposed to the public.
const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT;

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a complete email address (e.g., name@domain.com)');
      return;
    }

    // Safety check in case the environment variable isn't set up yet
    if (!FORMSPREE_ENDPOINT) {
      setEmailError('Contact form is temporarily unavailable. Please email us directly.');
      return;
    }

    // Clear any previous errors and start loading
    setEmailError('');
    setIsSubmitting(true);

    try {
      // Send the data to Formspree
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        console.error("Formspree submission failed");
        setEmailError('Something went wrong. Please email us directly.');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setEmailError('Failed to connect. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SecondaryNavbar />

      <div className="flex-grow max-w-3xl mx-auto px-4 py-16 md:py-24 w-full">
        {/* Friendly Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-indigo-950 uppercase italic tracking-tighter mb-4">
            Let's Chat
          </h1>
          <p className="text-lg text-slate-600 font-medium px-4">
            Have a question about how the circles work, need a hand with your membership, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
          
          {/* Direct Email Callout */}
          <div className="flex flex-col items-center justify-center mb-10 pb-10 border-b border-slate-100 text-center">
            <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600 mb-4">
              <Mail size={32} />
            </div>
            <h2 className="text-xl font-black uppercase text-indigo-950 tracking-tight mb-2">Email Us Directly</h2>
            <a 
              href="mailto:support@amplifygive.com" 
              className="text-lg md:text-xl font-bold text-indigo-600 hover:text-indigo-900 transition-colors"
            >
              support@amplifygive.com
            </a>
            <p className="text-sm text-slate-500 mt-2 font-medium">We usually reply within 24 hours.</p>
          </div>

          {/* Contact Form */}
          {submitted ? (
            <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Message Sent!</h3>
              <p className="text-slate-600 font-medium">Thanks for reaching out. We've received your note and will get back to you soon.</p>
              <button 
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', message: '' }); // Reset form
                }}
                className="mt-8 text-sm font-bold text-indigo-600 hover:text-indigo-900 transition-colors uppercase tracking-widest"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Your Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    required 
                    value={formData.name}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-slate-50 transition-all font-medium" 
                    placeholder="David Cohen" 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
                  {/* FIX: Changed type="text" to type="email" */}
                  <input 
                    type="email" 
                    id="email" 
                    required 
                    value={formData.email}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:border-transparent transition-all font-medium bg-slate-50 ${emailError ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-600'}`} 
                    placeholder="david@example.com" 
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (emailError) setEmailError('');
                    }} 
                  />
                  {emailError && (
                    <p className="text-red-500 text-[0.625rem] mt-1.5 font-bold flex items-center gap-1">
                      <AlertCircle size={12} /> {emailError}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">How can we help?</label>
                <textarea 
                  id="message" 
                  rows="5" 
                  required 
                  value={formData.message}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-slate-50 transition-all font-medium resize-none" 
                  placeholder="Write your message here..." 
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span>Sending...</span>
                    <Loader2 size={16} className="animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;