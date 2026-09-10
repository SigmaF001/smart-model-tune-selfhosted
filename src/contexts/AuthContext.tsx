import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getAuthState,
  initAuth,
  manageAccount,
  register,
  signIn,
  signOut,
  subscribeAuth,
  type AuthProfile,
  type AuthUser,
} from "@/auth/keycloak";

interface AuthContextValue {
  user: AuthUser | null;
  profile: AuthProfile | null;
  loading: boolean;
  authError: string | null;
  signIn: (redirectPath?: string) => Promise<void>;
  register: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  manageAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = getAuthState();
  const [user, setUser] = useState(initial.user);
  const [profile, setProfile] = useState(initial.profile);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const apply = (state: ReturnType<typeof getAuthState>) => {
      setUser(state.user);
      setProfile(state.profile);
    };
    const unsubscribe = subscribeAuth(apply);
    void initAuth()
      .then(() => apply(getAuthState()))
      .catch(() => setAuthError("Authentication service is unavailable."))
      .finally(() => setLoading(false));
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      authError,
      signIn,
      register,
      signOut,
      manageAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
