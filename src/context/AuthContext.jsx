import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/auth";
import * as svc from "../services/authService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // { role, status, name, email } — from the backend, never from the client
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await svc.fetchMe());
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setFirebaseUser(u);
        if (u) await loadProfile();
        else setProfile(null);
        setLoading(false);
      }),
    [loadProfile]
  );

  const value = useMemo(
    () => ({
      user: firebaseUser,
      profile,
      loading,
      role: profile?.role || "user",
      isStaff: profile?.role === "editor" || profile?.role === "administrator",
      isAdministrator: profile?.role === "administrator",
      refreshProfile: loadProfile,
      login: svc.loginWithEmail,
      loginGoogle: svc.loginWithGoogle,
      register: svc.registerWithEmail,
      logout: svc.logout,
      resetPassword: svc.resetPassword,
    }),
    [firebaseUser, profile, loading, loadProfile]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
