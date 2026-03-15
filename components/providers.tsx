"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
