"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  getSession,
  signIn,
  signOut,
  useSession,
} from "next-auth/react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type SocialProvider = "google" | "github";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: SocialProvider) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getErrorMessage(response: Response) {
  try {
    const data: unknown = await response.json();

    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  } catch {
    return "Request failed";
  }

  return "Request failed";
}

function mapSessionUser(
  user:
    | {
        id?: string;
        name?: string | null;
        email?: string | null;
        role?: "USER" | "ADMIN";
      }
    | null
    | undefined,
) {
  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    name: user.name ?? user.email ?? "User",
    email: user.email ?? "",
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  } satisfies AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const user = mapSessionUser(session?.user);

  const refreshUser = async () => {
    const nextSession = await getSession();

    if (!nextSession) {
      await update();
      return null;
    }

    await update();
    return mapSessionUser(nextSession.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
  };

  const login = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.code === "rate_limited") {
        throw new Error(
          "Too many login attempts. Please wait a few minutes and try again.",
        );
      }

      throw new Error("Invalid email or password");
    }

    await update();
  };

  const loginWithProvider = async (provider: SocialProvider) => {
    await signIn(provider, { redirectTo: "/" });
  };

  const logout = async () => {
    await signOut({ redirect: false });
    await update();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading: status === "loading",
        refreshUser,
        register,
        login,
        loginWithProvider,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
