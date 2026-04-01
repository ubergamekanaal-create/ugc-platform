"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { option } from "framer-motion/client";
import { redirect } from "next/dist/server/api-utils";

export function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email,{
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        toast.error("Too many requests. Please wait");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Reset link sent to your email");

      // optional redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <input
        type="email"
        required
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl bg-slate-200 px-4 py-4 text-slate-800 outline-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 font-medium text-white transition hover:opacity-90 disabled:opacity-70"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}