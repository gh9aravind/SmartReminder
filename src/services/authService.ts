import { supabase } from '../config/supabaseClient';
import type { AuthUser } from '../types';

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Google sign-in via Supabase OAuth. Requires @react-native-google-signin/google-signin
 * to obtain an idToken on-device, which is then exchanged with Supabase.
 * See README.md → "Google Sign-In setup" for the native configuration steps.
 */
export async function signInWithGoogleIdToken(idToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    fullName: data.user.user_metadata?.full_name ?? null,
  };
}

/** Subscribe to sign-in / sign-out / token-refresh events. Returns an unsubscribe fn. */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.user_metadata?.full_name ?? null,
      });
    } else {
      callback(null);
    }
  });
  return () => sub.subscription.unsubscribe();
}
