import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type Ctx = { user: User | null; loading: boolean; logout: () => Promise<void>; error: string | null; };
const AuthCtx = createContext<Ctx>({ user: null, loading: true, logout: async () => {}, error: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!auth) {
        setError("Firebase authentication not initialized. Please check your configuration.");
        setLoading(false);
        return;
      }

      const unsub = onAuthStateChanged(auth, 
        (u) => { 
          setUser(u); 
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Auth state change error:", err);
          setError(`Authentication error: ${err.message}`);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error("Auth initialization error:", err);
      setError(`Failed to initialize authentication: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      if (!auth) {
        throw new Error("Firebase auth not available");
      }
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
      setError(`Logout failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <AuthCtx.Provider value={{ user, loading, logout, error }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
