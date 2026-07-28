// src/pages/ReferralLandingPage.jsx
// Handles amplifygive.com/{slug}.
//
// Resolves the slug against the affiliates table, records the click, stores
// the attribution, then drops the visitor on the normal landing page. An
// unknown slug renders the ordinary 404 instead, so this route sitting on the
// site's top-level namespace doesn't turn every typo into a redirect.
//
// Static routes out-rank this dynamic one in React Router, so /account,
// /circles and friends are never shadowed. Slugs that would collide are also
// blocked in the database by the reserved_slugs table.
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { captureReferral } from '../lib/referral';
import NotFoundPage from './NotFoundPage';

const ReferralLandingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState('resolving'); // 'resolving' | 'notfound'

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      try {
        const { data, error } = await supabase.rpc('record_referral_click', {
          p_slug: slug,
          p_user_agent: navigator.userAgent,
          p_referrer: document.referrer || null,
        });

        if (cancelled) return;

        if (error || !data?.found) {
          setState('notfound');
          return;
        }

        // Store the canonical slug the server resolved, not the raw URL text.
        captureReferral(data.slug);
        navigate('/', { replace: true });
      } catch {
        if (!cancelled) setState('notfound');
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [slug, navigate]);

  if (state === 'notfound') return <NotFoundPage />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading...</p>
    </div>
  );
};

export default ReferralLandingPage;
