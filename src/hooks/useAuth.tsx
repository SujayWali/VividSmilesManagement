import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type Ctx = { 
  user: User | null; 
  loading: boolean; 
  error: string | null;
  logout: () => Promise<void>; 
};

const AuthCtx = createContext<Ctx>({ 
  user: null, 
  loading: true, 
  error: null,
  logout: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsub = onAuthStateChanged(auth, 
        (u) => { 
          setUser(u); 
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Auth state change error:', err);
          setError('Authentication service unavailable. Please check your connection.');
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error('❌ Auth initialization error:', err);
      setError('Failed to initialize authentication. Please refresh the page.');
      setLoading(false);
    }
  }, []);

  return (
    <AuthCtx.Provider value={{ 
      user, 
      loading, 
      error,
      logout: () => signOut(auth) 
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
