"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!username.trim()) {
      setError(
        "Please enter username."
      );
      return;
    }

    if (!password.trim()) {
      setError(
        "Please enter password."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "https://event-seat-booking-pkru.onrender.com/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              username:
                username.trim(),

              password:
                password,
            }),
          }
        );

      const data =
        await response.json();

     

      if (!response.ok) {
        setError(
          data.detail ||
            "Invalid username or password."
        );

        return;
      }

      // =====================================================
      // CHECK JWT TOKEN
      // =====================================================

      if (!data.access_token) {
        setError(
          "Login succeeded but no authentication token was received."
        );

        console.error(
          "No access_token received:",
          data
        );

        return;
      }

      // =====================================================
      // SAVE ADMIN LOGIN
      // =====================================================

      localStorage.setItem(
        "adminLoggedIn",
        "true"
      );

      localStorage.setItem(
        "adminToken",
        data.access_token
      );

      localStorage.setItem(
        "adminUsername",
        data.username ||
          username.trim()
      );

      

      // =====================================================
      // GO TO ADMIN DASHBOARD
      // =====================================================

      router.replace(
        "/admin"
      );

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Unable to connect to the server. Make sure FastAPI is running."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        {/* HEADER */}

        <div className="text-center mb-8">

          <div className="text-5xl mb-3">
            🔐
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Admin Login
          </h1>

          <p className="text-gray-500 mt-2">
            Sign in to manage events and bookings
          </p>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* USERNAME */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              placeholder="Enter username"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* PASSWORD */}

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* ERROR */}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400"
          >
            {loading
              ? "Signing in..."
              : "LOGIN"}
          </button>

        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Admin access only
        </p>

      </div>

    </main>
  );
}