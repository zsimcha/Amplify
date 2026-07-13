// src/context/AuthContext.jsx
// Session state for the whole app, backed by Supabase Auth.
// Passwords never touch application code or tables — Supabase Auth
// (GoTrue) handles hashing, sessions, and email verification.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({ session: null, user: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
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
