// src/context/AuthContext.jsx
// Session state for the whole app, backed by Supabase Auth.
// Passwords never touch application code or tables — Supabase Auth
// (GoTrue) handles hashing, sessions, and email verification.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { applyPendingCauses } from '../lib/charities';

const AuthContext = createContext({ session: null, user: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A new member's post-checkout cause selection is stashed in localStorage
    // until a session exists (see lib/charities.js). Flush it here, app-wide,
    // the moment any session appears — not just when the member happens to
    // visit My Account — so it isn't silently stranded on one device.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
      if (data.session) applyPendingCauses(data.session.user?.email).catch(() => {});
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      if (newSession) applyPendingCauses(newSession.user?.email).catch(() => {});
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- provider + hook is the idiomatic context pairing; only affects HMR granularity
export const useAuth = () => useContext(AuthContext);
