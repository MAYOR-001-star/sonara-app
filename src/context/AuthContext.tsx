import React, { createContext, useContext, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "../services/supabase";
import type { User } from "../types";
import type { Session } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

function extractAuthParams(url: string) {
  const [baseAndQuery, hash] = url.split("#");
  const [, query] = baseAndQuery.split("?");
  const searchParams = new URLSearchParams(query || "");
  const hashParams = new URLSearchParams(hash || "");

  return {
    code: searchParams.get("code") || hashParams.get("code"),
    accessToken: searchParams.get("access_token") || hashParams.get("access_token"),
    refreshToken: searchParams.get("refresh_token") || hashParams.get("refresh_token"),
    errorDescription: searchParams.get("error_description") || hashParams.get("error_description"),
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ ok: boolean; error?: string; message?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
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

    // 3. Listen for OAuth deep link callbacks
    const linkSubscription = Linking.addEventListener("url", ({ url }) => {
      if (
        url &&
        (url.includes("code=") ||
          url.includes("access_token=") ||
          url.includes("error_description="))
      ) {
        handleAuthUrl(url);
      }
    });

    Linking.getInitialURL().then((url) => {
      if (
        url &&
        (url.includes("code=") ||
          url.includes("access_token=") ||
          url.includes("error_description="))
      ) {
        handleAuthUrl(url);
      }
    });

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const href = window.location.href;
      if (
        href &&
        (href.includes("code=") ||
          href.includes("access_token=") ||
          href.includes("error_description="))
      ) {
        handleAuthUrl(href);
      }
    }

    return () => {
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  const handleAuthUrl = async (
    url: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { code, accessToken, refreshToken, errorDescription } =
        extractAuthParams(url);

      if (errorDescription) {
        return {
          ok: false,
          error: decodeURIComponent(errorDescription.replace(/\+/g, " ")),
        };
      }

      if (code) {
        const { data: sessionData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          return { ok: false, error: exchangeError.message };
        }

        if (sessionData.session) {
          setSession(sessionData.session);
          setUser({
            id: sessionData.session.user.id,
            email: sessionData.session.user.email || "",
            fullName:
              sessionData.session.user.user_metadata?.full_name ||
              sessionData.session.user.email?.split("@")[0],
            createdAt: sessionData.session.user.created_at,
          });
        }
        return { ok: true };
      }

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (sessionError) {
          return { ok: false, error: sessionError.message };
        }

        if (sessionData.session) {
          setSession(sessionData.session);
          setUser({
            id: sessionData.session.user.id,
            email: sessionData.session.user.email || "",
            fullName:
              sessionData.session.user.user_metadata?.full_name ||
              sessionData.session.user.email?.split("@")[0],
            createdAt: sessionData.session.user.created_at,
          });
        }
        return { ok: true };
      }

      return { ok: true };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error processing auth callback";
      return { ok: false, error: msg };
    }
  };

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
          emailRedirectTo: "sonora://",
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

      // Try immediate sign-in in case auto-confirmation is enabled
      const loginAttempt = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginAttempt.data?.session) {
        setSession(loginAttempt.data.session);
        setUser({
          id: loginAttempt.data.user.id,
          email: loginAttempt.data.user.email || "",
          fullName: fullName || loginAttempt.data.user.email?.split("@")[0],
          createdAt: loginAttempt.data.user.created_at,
        });
        return { ok: true };
      }

      return {
        ok: true,
        message: "Account created! You can now sign in with your email and password.",
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign up";
      return { ok: false, error: msg };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "sonora://",
      });
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, message: "Password reset link sent to your email." };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending reset email";
      return { ok: false, error: msg };
    }
  };

  const signInWithGoogle = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (Platform.OS === "web") {
        const redirectUrl =
          typeof window !== "undefined" ? window.location.origin : "http://localhost:8081";

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      }

      const redirectUrl = makeRedirectUri({
        scheme: "sonora",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (!data?.url) {
        return { ok: false, error: "Authentication URL could not be generated." };
      }

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (res.type === "success" && res.url) {
        return await handleAuthUrl(res.url);
      }

      // If user signed in and tab closed or was dismissed, check active Supabase session
      const { data: checkSession } = await supabase.auth.getSession();
      if (checkSession?.session) {
        setSession(checkSession.session);
        setUser({
          id: checkSession.session.user.id,
          email: checkSession.session.user.email || "",
          fullName:
            checkSession.session.user.user_metadata?.full_name ||
            checkSession.session.user.email?.split("@")[0],
          createdAt: checkSession.session.user.created_at,
        });
        return { ok: true };
      }

      if (res.type === "cancel" || res.type === "dismiss") {
        return { ok: false, error: "Sign in was cancelled." };
      }

      return { ok: false, error: "Google sign-in did not complete." };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to sign in with Google";
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
        signInWithGoogle,
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
