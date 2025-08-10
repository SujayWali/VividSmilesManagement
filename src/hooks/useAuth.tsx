import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type Ctx = { user: User | null; loading: boolean; logout: () => Promise<void>; };
const AuthCtx = createContext<Ctx>({ user: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);
  return <AuthCtx.Provider value={{ user, loading, logout: () => signOut(auth) }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
