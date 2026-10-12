
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/auth";
import * as svc from "../services/authService";

export const AuthContext = createContext(null);

// useAuth এখন এই ফাইল থেকেই export হবে
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await svc.fetchMe();
      setProfile(data);
    } catch (error) {
      console.error("Profile loading failed:", error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setLoading(true);

      try {
        if (user) {
          await loadProfile();
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      user: firebaseUser,
      profile,
      loading,
      role: profile?.role || "user",
      isStaff:
        profile?.role === "editor" ||
        profile?.role === "administrator",
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
