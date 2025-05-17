import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Manual validations
    if (!email) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      window.location.href = "/";
    } catch (err) {
      console.error("Sign in error:", err);

      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No user found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center  px-4">
      <div className="max-w-md w-full bg-[#222222] text-[#F7CE46] p-8 rounded-2xl shadow-2xl border border-gray-700">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-sm mt-1 text-[#F7CE46] opacity-80">
            Sign in to your account
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-600/20 border border-red-400 text-red-300 text-sm rounded-md px-4 py-2">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-4 py-2 bg-[#333333] text-[#F7CE46] border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F7CE46] focus:outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-4 py-2 bg-[#333333] text-[#F7CE46] border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-[#F7CE46] focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full cursor-pointer flex justify-center items-center px-4 py-2 text-sm font-medium text-[#222222] rounded-lg shadow-md transition-all duration-200 ${
                loading
                  ? "bg-[#F7CE46]/50 cursor-not-allowed"
                  : "bg-[#F7CE46] hover:bg-yellow-400"
              } focus:outline-none focus:ring-2 focus:ring-[#F7CE46]`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
