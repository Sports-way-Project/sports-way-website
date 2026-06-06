import { useEffect, useState } from "react";
import { getCurrentUser, setCurrentUser as persistCurrentUser } from "../lib/storefront";

export function useAccount() {
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());

  useEffect(() => {
    const refresh = () => setCurrentUserState(getCurrentUser());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const setCurrentUser = (user, remember = true) => {
    persistCurrentUser(user, remember);
    setCurrentUserState(user);
  };

  return {
    currentUser,
    setCurrentUser,
  };
}
