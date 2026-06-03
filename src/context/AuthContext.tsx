import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'viewer';
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isViewer: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('id, username, role, is_active, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (data) {
      setProfile(data as UserProfile);
      return data;
    }
    return null;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (username: string, password: string): Promise<{ error: string | null }> => {
    try {
      // Fetch user email by username
      const { data: userProfiles, error: profileError } = await supabase
        .from('admin_profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (profileError || !userProfiles) {
        return { error: 'Invalid username or password.' };
      }

      // Get user email from auth.users via admin API
      const { data: authUser } = await supabase.auth.admin.getUserById(userProfiles.id).catch(() => ({ data: null }));

      if (!authUser?.user?.email) {
        return { error: 'Invalid username or password.' };
      }

      // Sign in with email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authUser.user.email,
        password,
      });

      if (signInError) {
        return { error: 'Invalid username or password.' };
      }

      return { error: null };
    } catch {
      return { error: 'Login failed. Please try again.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isAdmin: profile?.role === 'admin',
      isViewer: profile?.role === 'viewer',
      isLoading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
