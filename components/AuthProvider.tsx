"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUsersStore } from "@/store/useUsersStore";

export default function AuthProvider() {

  const setUser = useUsersStore((s) => s.setUser);

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsub();

  }, [setUser]);

  return null;
}