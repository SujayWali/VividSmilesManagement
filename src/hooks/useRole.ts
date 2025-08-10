import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "./useAuth";
import type { Role } from "@/types/models";

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => {
    if (!user) { setRole(null); return; }
    const dref = doc(db, "users", user.uid);
    const unsub = onSnapshot(dref, (snap) => setRole((snap.data() as any)?.role ?? null));
    return () => unsub();
  }, [user]);
  return role;
}
