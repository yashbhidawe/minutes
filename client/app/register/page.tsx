"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 items-center justify-center p-16">
        <div className="max-w-md">
          <h1 className="text-4xl font-light text-stone-100 tracking-tight leading-tight">
            Start capturing
            <br />
            <span className="font-semibold">every word.</span>
          </h1>
          <p className="mt-6 text-stone-400 text-lg leading-relaxed">
            Create an account to start recording and summarizing
            your meetings with AI.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-12">
            <Link href="/" className="text-sm tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors">
              Minute AI
            </Link>
          </div>

          <h2 className="text-2xl font-light tracking-tight mb-8">
            Create account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-0 py-2 bg-transparent border-0 border-b border-stone-200 text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-0 py-2 bg-transparent border-0 border-b border-stone-200 text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900 transition-colors text-sm"
                placeholder="Min 8 characters"
              />
              <p className="mt-2 text-xs text-stone-300">
                Must include uppercase, lowercase, number, and special character
              </p>
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-stone-900 text-white text-sm tracking-wide hover:bg-stone-800 disabled:opacity-50 transition-colors mt-8"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-sm text-stone-400">
            Already have an account?{" "}
            <Link href="/login" className="text-stone-900 underline underline-offset-4 hover:text-stone-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
