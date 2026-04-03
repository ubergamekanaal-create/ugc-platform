"use client";

import Link from "next/link";
import {
  type ClipboardEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type StepIconProps = {
  className?: string;
};

function AccountStepIcon({ className }: StepIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function VerifyStepIcon({ className }: StepIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m12 3 7 3v5c0 4.7-3.1 8.3-7 10-3.9-1.7-7-5.3-7-10V6l7-3Z" />
      <path d="m9.5 12 1.8 1.8 3.7-3.8" />
    </svg>
  );
}

function WebsiteStepIcon({ className }: StepIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9Z" />
    </svg>
  );
}

const BRAND_SIGNUP_STEPS: Array<{
  id: number;
  label: string;
  title: string;
  description: string;
  icon: (props: StepIconProps) => JSX.Element;
}> = [
  {
    id: 1,
    label: "Account",
    title: "Create your brand account",
    description:
      "Enter your brand name, email, and password to start the signup flow.",
    icon: AccountStepIcon,
  },
  {
    id: 2,
    label: "Verify",
    title: "Verify the 6-digit code",
    description:
      "Enter the code from your email to confirm the account before setup continues.",
    icon: VerifyStepIcon,
  },
  {
    id: 3,
    label: "Website",
    title: "Add your website link",
    description:
      "Use your main store or brand website. You can update other brand details later.",
    icon: WebsiteStepIcon,
  },
];

const BRAND_SIGNUP_TOTAL_STEPS = BRAND_SIGNUP_STEPS.length;
const OTP_LENGTH = 6;
const DEFAULT_BRAND_HEADLINE = "Brand partnerships lead";

function createEmptyOtp() {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    try {
      const url = new URL(`https://${trimmed}`);
      return url.protocol === "http:" || url.protocol === "https:"
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  }
}

export function SignupForm() {
  const supabase = useMemo(() => createClient(), []);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [step, setStep] = useState(1);
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtp);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [hasPasswordApplied, setHasPasswordApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const currentStep = BRAND_SIGNUP_STEPS.find((item) => item.id === step)!;
  const progress = (step / BRAND_SIGNUP_TOTAL_STEPS) * 100;
  const otpValue = otpDigits.join("");

  function resetFeedback() {
    setError(null);
    setSuccess(null);
  }

  function handleBack() {
    resetFeedback();
    setStep((current) => Math.max(1, current - 1));
  }

  async function sendOtp() {
    const normalizedBrandName = brandName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedBrandName) {
      throw new Error("Brand name is required before sending the email code.");
    }

    if (!normalizedEmail) {
      throw new Error("Email is required before sending the email code.");
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        data: {
          role: "brand",
          full_name: normalizedBrandName,
          company_name: normalizedBrandName,
          headline: DEFAULT_BRAND_HEADLINE,
        },
      },
    });

    if (otpError) {
      throw otpError;
    }

    setIsOtpSent(true);
    setIsOtpVerified(false);
    setHasPasswordApplied(false);
    setOtpDigits(createEmptyOtp());
  }

  async function handleSendOtpAndContinue() {
    resetFeedback();

    const normalizedBrandName = brandName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedBrandName || !normalizedEmail) {
      setError("Brand name and email are required.");
      return;
    }

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setIsWorking(true);

    try {
      await sendOtp();
      setSuccess(`We sent a 6-digit code to ${normalizedEmail}.`);
      setStep(2);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send the email verification code.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleResendOtp() {
    resetFeedback();
    setIsWorking(true);

    try {
      if (!isOtpSent) {
        await sendOtp();
      } else {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: email.trim().toLowerCase(),
        });

        if (resendError) {
          await sendOtp();
        } else {
          setOtpDigits(createEmptyOtp());
        }
      }

      setSuccess(`A fresh code was sent to ${email.trim().toLowerCase()}.`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to resend the email verification code.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function verifyOtpAndPrepareAccount() {
    const normalizedBrandName = brandName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (otpValue.length !== OTP_LENGTH) {
      throw new Error("Enter the full 6-digit code from your email.");
    }

    let verifyError: Error | null = null;

    for (const verificationType of ["email", "signup"] as const) {
      const result = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otpValue,
        type: verificationType,
      });

      if (!result.error) {
        verifyError = null;
        setIsOtpVerified(true);
        break;
      }

      verifyError = result.error;
    }

    if (verifyError) {
      throw verifyError;
    }

    if (!hasPasswordApplied) {
      const { error: updateUserError } = await supabase.auth.updateUser({
        password,
        data: {
          role: "brand",
          full_name: normalizedBrandName,
          company_name: normalizedBrandName,
          headline: DEFAULT_BRAND_HEADLINE,
        },
      });

      if (updateUserError) {
        throw updateUserError;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("Unable to load the verified brand account.");
      }

      const { error: userRowError } = await supabase
        .from("users")
        .update({
          full_name: normalizedBrandName,
          company_name: normalizedBrandName,
          headline: DEFAULT_BRAND_HEADLINE,
        })
        .eq("id", user.id);

      if (userRowError) {
        throw userRowError;
      }

      const { error: teamMemberError } = await supabase.from("team_members").upsert(
        {
          brand_id: user.id,
          user_id: user.id,
          role: "owner",
        },
        { onConflict: "brand_id,user_id" },
      );

      if (teamMemberError) {
        throw teamMemberError;
      }

      setHasPasswordApplied(true);
    }
  }

  async function handleVerifyOtpAndContinue() {
    resetFeedback();
    setIsWorking(true);

    try {
      await verifyOtpAndPrepareAccount();
      setSuccess("Email verified. Add your website to finish signup.");
      setStep(3);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to verify the email code.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleCompleteSignup() {
    resetFeedback();
    setIsWorking(true);

    try {
      if (!isOtpVerified || !hasPasswordApplied) {
        throw new Error("Verify your email before finishing signup.");
      }

      const normalizedWebsite = normalizeWebsiteUrl(websiteUrl);

      if (!normalizedWebsite) {
        throw new Error("Enter a valid website link to continue.");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("Your session expired. Verify again to continue.");
      }

      const { error: brandError } = await supabase.from("brands").upsert(
        {
          user_id: user.id,
          email: user.email ?? email.trim().toLowerCase(),
          full_name: brandName.trim(),
          website_url: normalizedWebsite,
          store_currency: "USD",
        },
        { onConflict: "user_id" },
      );

      if (brandError) {
        throw brandError;
      }

      const { error: teamMemberError } = await supabase.from("team_members").upsert(
        {
          brand_id: user.id,
          user_id: user.id,
          role: "owner",
        },
        { onConflict: "brand_id,user_id" },
      );

      if (teamMemberError) {
        throw teamMemberError;
      }

      setSuccess("Brand account ready. Opening your workspace...");
      window.location.assign("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to complete brand signup.",
      );
      setIsWorking(false);
    }
  }

  function handleOtpDigitChange(index: number, value: string) {
    const nextValue = value.replace(/\D/g, "").slice(-1);

    setOtpDigits((current) =>
      current.map((digit, currentIndex) =>
        currentIndex === index ? nextValue : digit,
      ),
    );

    if (nextValue && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
      otpInputRefs.current[index + 1]?.select();
    }
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");

    if (!pastedDigits.length) {
      return;
    }

    event.preventDefault();

    setOtpDigits((current) =>
      current.map((digit, index) => pastedDigits[index] ?? digit),
    );

    const lastIndex = Math.min(pastedDigits.length, OTP_LENGTH) - 1;
    otpInputRefs.current[lastIndex]?.focus();
    otpInputRefs.current[lastIndex]?.select();
  }

  function handlePrimaryAction() {
    if (step === 1) {
      void handleSendOtpAndContinue();
      return;
    }

    if (step === 2) {
      void handleVerifyOtpAndContinue();
      return;
    }

    void handleCompleteSignup();
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_32px_90px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="border-b border-slate-200/80 bg-white/90 px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              Brand signup
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Create a brand workspace
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Complete the 3-step setup to verify your email and enter your dashboard.
            </p>
          </div>
          <span className="inline-flex rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500">
            Step {step} of {BRAND_SIGNUP_TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Setup progress
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                {currentStep.title}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                {currentStep.description}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                isOtpVerified
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {isOtpVerified ? "Email verified" : "Email pending"}
            </span>
          </div>

          <div className="mt-5 h-2 rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {BRAND_SIGNUP_STEPS.map((item) => {
              const isActive = item.id === step;
              const isComplete = item.id < step;
              const StepIcon = item.icon;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border px-4 py-4 text-center transition",
                    isActive
                      ? "border-accent/20 bg-white text-accent shadow-[0_10px_24px_rgba(7,107,210,0.08)]"
                      : isComplete
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border-transparent bg-white/70 text-slate-400",
                  )}
                >
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-full",
                        isActive
                          ? "bg-[rgba(7,107,210,0.1)]"
                          : isComplete
                            ? "bg-white/80"
                            : "bg-white/60",
                      )}
                    >
                      <StepIcon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          {step === 1 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="brand-name"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Brand name
                </label>
                <input
                  id="brand-name"
                  type="text"
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  placeholder="Northstar Labs"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="brand-email"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Email address
                </label>
                <input
                  id="brand-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="team@northstar.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>

              <div>
                <label
                  htmlFor="brand-password"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Password
                </label>
                <input
                  id="brand-password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>

              <div>
                <label
                  htmlFor="brand-confirm-password"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Confirm password
                </label>
                <input
                  id="brand-confirm-password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter password"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-500">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-slate-900">
                  {email.trim().toLowerCase()}
                </span>
                .
              </div>

              <div className="flex flex-wrap gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpInputRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleOtpDigitChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    className="h-14 w-12 rounded-2xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-950 outline-none transition focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)] sm:w-14"
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleResendOtp()}
                  disabled={isWorking}
                  className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWorking ? "Sending..." : "Resend code"}
                </button>

                {isOtpVerified ? (
                  <span className="inline-flex rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    Code accepted
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="brand-website-url"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Website link
                </label>
                <input
                  id="brand-website-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://northstar.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-500">
                This link will be saved to your brand profile and you&apos;ll be
                redirected straight to the dashboard after setup completes.
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || isWorking || isOtpVerified}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isWorking}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white shadow-[0_24px_60px_rgba(7,107,210,0.2)] transition hover:translate-y-[-1px] hover:shadow-[0_28px_70px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWorking
              ? step === 3
                ? "Finishing..."
                : "Please wait..."
              : step === 1
                ? "Continue"
                : step === 2
                  ? "Verify code"
                  : "Open dashboard"}
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="text-accent transition hover:text-accent/80"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-accent transition hover:text-accent/80"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            Already have an account?{" "}
            <Link
              href="/login?role=brand"
              className="font-medium text-accent transition hover:text-accent/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
