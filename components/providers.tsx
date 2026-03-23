"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import { AuthProvider } from "@/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
