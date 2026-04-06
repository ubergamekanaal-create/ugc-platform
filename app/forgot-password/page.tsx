import Link from "next/link";
import { FadeIn, PageTransition } from "@/components/shared/motion";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { BrandMark } from "@/components/shared/brand-mark";

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.12),_transparent_34%),radial-gradient(circle_at_85%_75%,_rgba(99,102,241,0.08),_transparent_22%),linear-gradient(180deg,_#ffffff,_#f8f8fc)]" />
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-8">
        {/* Header */}
        <div className="mx-auto flex w-full max-w-6xl justify-between">
          <BrandMark href="/" tone="light" />
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
              Password recovery
            </div>

            <h1 className="mt-8 font-display text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              Forgot Password?
            </h1>

            <p className="mt-4 text-xl text-slate-500">
              Enter your email and we’ll send you a reset link
            </p>

            <div className="mt-12">
              <ForgotPasswordForm />
            </div>
          </FadeIn>
        </PageTransition>
      </div>
    </div>
  );
}
