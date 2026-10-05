import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import type { User } from "../types";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ ok: boolean; error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check existing session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          createdAt: session.user.created_at,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
          createdAt: session.user.created_at,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          fullName: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
          createdAt: data.user.created_at,
        });
      }

      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      return { ok: false, error: msg };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: fullName ? { full_name: fullName.trim() } : undefined,
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser({
          id: data.user!.id,
          email: data.user!.email || "",
          fullName: fullName || data.user!.email?.split("@")[0],
          createdAt: data.user!.created_at,
        });
        return { ok: true };
      }

      return {
        ok: true,
        message: "Account created! You can now sign in.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign up";
      return { ok: false, error: msg };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, message: "Password reset link sent to your email." };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending reset email";
      return { ok: false, error: msg };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token: session?.access_token || null,
        loading,
        signIn,
        signUp,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
