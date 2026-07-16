import { useEffect, useState } from "react";
import {
  ensureProfile,
  ensureSupabaseSession,
  fetchProfileById,
  replaceCart,
  replaceWishlist,
  updateProfile as updateProfileRecord,
} from "../lib/storefrontApi";
import { supabase } from "../lib/supabase";

export function useAccount() {
  const [authReady, setAuthReady] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [currentUser, setCurrentUserState] = useState(null);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    let active = true;

    const syncSession = async (session) => {
      const authUser = session?.user || null;
      if (!active) {
        return;
      }

      setSessionUser(authUser);
      if (!authUser || authUser.is_anonymous) {
        setCurrentUserState(null);
        return;
      }

      const profile = await ensureProfile(authUser);
      if (active) {
        setCurrentUserState(profile);
      }
    };

    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session || await ensureSupabaseSession();
      await syncSession(session);
      if (active) {
        setAuthReady(true);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
      Promise.resolve(syncSession(session)).finally(() => {
        if (active) {
          setAuthReady(true);
        }
      });
    });

    boot();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const promoteGuestState = async (userId, guestCart = [], guestWishlist = []) => {
    if (!userId) {
      return;
    }

    if (guestCart.length) {
      await replaceCart(userId, guestCart);
    }

    if (guestWishlist.length) {
      await replaceWishlist(userId, guestWishlist);
    }
  };

  const signIn = async ({ email, password, guestCart = [], guestWishlist = [] }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    const profile = await ensureProfile(data.user);
    await promoteGuestState(data.user.id, guestCart, guestWishlist);

    setSessionUser(data.user);
    setCurrentUserState(profile);
    return profile;
  };

  const signUp = async ({
    email,
    password,
    name,
    phone,
    terms_accepted = false,
    marketing_opt_in = false,
    billing_address = "",
    shipping_address = "",
    guestCart = [],
    guestWishlist = [],
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, terms_accepted, marketing_opt_in },
      },
    });

    if (error) {
      throw error;
    }

    if (!data.session) {
      // Email confirmation is enabled in Supabase — return a friendly signal
      // so the UI can show "check your inbox" instead of a crash.
      return { needsConfirmation: true };
    }

    const profile = await ensureProfile(data.user, {
      name,
      phone,
      terms_accepted,
      marketing_opt_in,
      billing_address,
      shipping_address,
    });
    await promoteGuestState(data.user.id, guestCart, guestWishlist);
    setSessionUser(data.user);
    setCurrentUserState(profile);
    return profile;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    const guestSession = await ensureSupabaseSession();
    setSessionUser(guestSession?.user || null);
    setCurrentUserState(null);
  };

  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/my-account`,
    });
    if (error) {
      throw error;
    }
  };

  const saveProfile = async ({ profilePatch, authPatch = null }) => {
    if (!currentUser?.id) {
      return null;
    }

    const nextProfile = await updateProfileRecord(currentUser.id, profilePatch, authPatch);
    setCurrentUserState(nextProfile);
    return nextProfile;
  };

  const clearRecovery = () => setIsRecovery(false);

  return {
    authReady,
    currentUser,
    saveProfile,
    sessionUser,
    signIn,
    signOut,
    signUp,
    requestPasswordReset,
    isRecovery,
    clearRecovery,
  };
}
