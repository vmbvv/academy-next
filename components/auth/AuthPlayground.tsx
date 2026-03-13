"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function AuthPlayground() {
  // Global component state
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [user, setUser] = useState(null);

  // Form states
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // --- Handlers ---

  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setStatusMessage("Registering...");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
        credentials: "include", // Explicit cookie behavior
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage(
          `Success: ${data.message || "Registered successfully. Please log in."}`,
        );
      } else {
        setStatusMessage(`Error: ${data.error || "Registration failed"}`);
      }
    } catch {
      setStatusMessage("Error: Network issue during registration");
    }
  };

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setStatusMessage("Logging in...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage("Login successful! Fetching session...");
        // Immediately fetch the user profile upon successful login
        await handleCheckSession();
      } else {
        setStatusMessage(`Error: ${data.error || "Login failed"}`);
      }
    } catch {
      setStatusMessage("Error: Network issue during login");
    }
  };

  const handleCheckSession = async () => {
    setStatusMessage("Checking session...");

    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user || data);
        setStatusMessage("Session retrieved successfully.");
      } else {
        setUser(null);
        setStatusMessage("Error: Unauthorized. No active session.");
      }
    } catch {
      setUser(null);
      setStatusMessage("Error: Failed to fetch session.");
    }
  };

  const handleClearOutput = () => {
    setStatusMessage("");
    setUser(null);
  };

  // --- Render ---

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Auth Playground</h1>
        <p className="text-gray-500">Test your backend auth endpoints</p>
      </div>

      {/* --- REGISTER SECTION --- */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Register</h2>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="reg-name">Name</Label>
            <Input
              id="reg-name"
              value={registerForm.name}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, email: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              value={registerForm.password}
              onChange={(e) =>
                setRegisterForm({ ...registerForm, password: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" className="w-fit">
            Register
          </Button>
        </form>
      </Card>

      {/* --- LOGIN SECTION --- */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" className="w-fit">
            Login
          </Button>
        </form>
      </Card>

      <Separator />

      {/* --- CURRENT SESSION SECTION --- */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current Session & Output</h2>
        <div className="flex gap-4 mb-4">
          <Button onClick={handleCheckSession} variant="secondary">
            Check Session
          </Button>
          <Button onClick={handleClearOutput} variant="outline">
            Clear Output
          </Button>
        </div>

        <div className="bg-gray-100 p-4 rounded-md min-h-25">
          <p className="font-semibold mb-2">
            Status:{" "}
            <span className="font-normal text-blue-600">
              {statusMessage || "Waiting for action..."}
            </span>
          </p>

          {user && (
            <div className="mt-4">
              <p className="font-semibold mb-1">User Data:</p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
