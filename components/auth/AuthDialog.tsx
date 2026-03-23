"use client";

import { useState, type FormEvent } from "react";

import { useAuth } from "@/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Mode = "login" | "signup";

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { login, loginWithProvider, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!open) {
    return null;
  }

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setNotice("");
  };

  const handleClose = () => {
    resetForm();
    setMode("login");
    onOpenChange(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setPending(true);

    try {
      if (mode === "login") {
        await login(email, password);
        handleClose();
        return;
      }

      await register(name, email, password);
      setPassword("");
      setMode("login");
      setNotice("Account created. Log in with your new credentials.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setError("");
    setNotice("");
    setPending(true);

    try {
      await loginWithProvider(provider);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed.",
      );
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {mode === "login" ? "Login" : "Create account"}
            </h2>
          </div>

          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "outline"}
            onClick={() => {
              setMode("login");
              setError("");
              setNotice("");
            }}
          >
            Login
          </Button>
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "outline"}
            onClick={() => {
              setMode("signup");
              setError("");
              setNotice("");
            }}
          >
            Sign up
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSocialLogin("google")}
            disabled={pending}
          >
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSocialLogin("github")}
            disabled={pending}
          >
            Continue with GitHub
          </Button>
        </div>

        <div className="mt-6 h-px bg-slate-800" />

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="auth-name">Name</Label>
              <Input
                id="auth-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          {notice ? <p className="text-sm text-emerald-400">{notice}</p> : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create account"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
