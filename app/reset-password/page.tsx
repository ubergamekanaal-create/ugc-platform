"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FadeIn, PageTransition } from "@/components/shared/motion";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleUpdate = async () => {
    if (loading) return;

    if (!password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");

      // redirect after success
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.12),_transparent_34%),radial-gradient(circle_at_85%_75%,_rgba(99,102,241,0.08),_transparent_22%),linear-gradient(180deg,_#ffffff,_#f8f8fc)]" />
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-8">
        {/* Header */}
        <div className="mx-auto flex w-full max-w-6xl justify-between">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-[0.2em] text-slate-900"
          >
            CIRCL
          </Link>
          <Link
            href="/login"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            Back to login
          </Link>
        </div>

        <PageTransition className="flex flex-1 items-center justify-center">
          <FadeIn className="w-full max-w-[39rem] text-center">
            <div className="mx-auto inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-slate-500 shadow backdrop-blur">
              Reset password
            </div>

            <h1 className="mt-8 font-display text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              Set New Password
            </h1>

            <p className="mt-4 text-xl text-slate-500">
              Enter your new password below
            </p>

            <div className="mt-12 space-y-6 text-left">
              <input
                type="password"
                placeholder="New password"
                className="w-full rounded-xl bg-slate-200 px-4 py-4 text-slate-800 outline-none"
                onChange={(e) => setPassword(e.target.value)}
              />

              <input
                type="password"
                placeholder="Confirm password"
                className="w-full rounded-xl bg-slate-200 px-4 py-4 text-slate-800 outline-none"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                onClick={handleUpdate}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 font-medium text-white transition hover:opacity-90 disabled:opacity-70"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </FadeIn>
        </PageTransition>
      </div>
    </div>
  );
}