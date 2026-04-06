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
const inputClassName =
  "h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 shadow-[0_8px_24px_rgba(15,23,42,0.04)] focus:border-[#076BD2] focus:shadow-[0_0_0_4px_rgba(7,107,210,0.12)]";

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
  const otpValue = otpDigits.join("");

  function resetFeedback() {
    setError(null);
    setSuccess(null);
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
        throw (
          userError ?? new Error("Unable to load the verified brand account.")
        );
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

      const { error: teamMemberError } = await supabase
        .from("team_members")
        .upsert(
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
        throw (
          userError ??
          new Error("Your session expired. Verify again to continue.")
        );
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

      const { error: teamMemberError } = await supabase
        .from("team_members")
        .upsert(
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

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
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
    <section className="rounded-[1.75rem] border border-black/5 bg-white/76 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Brand signup
        </span>
        <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Step {step} of {BRAND_SIGNUP_TOTAL_STEPS}
        </span>
      </div>

      <div className="relative mt-8">
        <div className="absolute left-[calc(16.666%-0.75rem)] right-[calc(16.666%-0.75rem)] top-[2.85rem] h-px bg-slate-200" />
        <div
          className="absolute left-[calc(16.666%-0.75rem)] top-[2.85rem] h-px bg-[linear-gradient(90deg,_rgba(7,107,210,0.78),_rgba(59,130,246,0.52))] transition-all duration-300"
          style={{
            width:
              step === 1
                ? "0%"
                : step === 2
                  ? "calc(33.333% + 0.75rem)"
                  : "calc(66.666% + 1.5rem)",
          }}
        />

        <div className="grid grid-cols-3 gap-3">
        {BRAND_SIGNUP_STEPS.map((item, index) => {
          const StepIcon = item.icon;
          const isActive = item.id === step;
          const isComplete = item.id < step;

          return (
            <div key={item.id} className="relative text-center">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.18em]",
                  isActive || isComplete ? "text-slate-700" : "text-slate-400",
                )}
              >
                {item.label}
              </p>

              <div className="relative mt-3 flex justify-center">
                <span
                  className={cn(
                    "relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                    isActive
                      ? "border-[#076BD2] bg-[#076BD2] text-white shadow-[0_12px_25px_rgba(7,107,210,0.22)]"
                      : isComplete
                        ? "border-[#076BD2]/25 bg-[#e8f1ff] text-[#076BD2]"
                        : "border-slate-200 bg-white text-slate-400",
                  )}
                >
                  <StepIcon className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {step === 1 ? (
          <div className="space-y-3">
            <input
              type="text"
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              placeholder="Brand name"
              className={inputClassName}
            />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              className={inputClassName}
            />
            <input
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className={inputClassName}
            />
            <input
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              className={inputClassName}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <p className="text-center text-sm leading-7 text-slate-500">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-slate-900">
                {email.trim().toLowerCase()}
              </span>
              .
            </p>

            <div className="flex justify-center gap-3">
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
                  className="h-14 w-12 rounded-2xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-900 outline-none transition shadow-[0_8px_24px_rgba(15,23,42,0.04)] focus:border-[#076BD2] focus:shadow-[0_0_0_4px_rgba(7,107,210,0.12)] sm:w-14"
                />
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void handleResendOtp()}
                disabled={isWorking}
                className="text-sm font-medium text-[#076BD2] transition hover:text-[#0558ad] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? "Sending..." : "Resend code"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <input
              type="url"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="Website link"
              className={inputClassName}
            />
            <p className="text-center text-sm leading-7 text-slate-500">
              This link will be saved to your brand profile before you enter the
              dashboard.
            </p>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePrimaryAction}
        disabled={isWorking}
        className="mt-6 h-14 w-full rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-base font-semibold text-white shadow-[0_18px_35px_rgba(15,23,42,0.16)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isWorking
          ? step === 3
            ? "Finishing..."
            : "Please wait..."
          : step === 1
            ? "Create account"
            : step === 2
              ? "Verify code"
              : "Open dashboard"}
      </button>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1 || isWorking || isOtpVerified}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
      </div>

      <div className="mt-6 border-t border-black/6 pt-6 text-center text-sm text-slate-500">
        <p>
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className="text-[#076BD2] transition hover:text-[#0558ad]"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-[#076BD2] transition hover:text-[#0558ad]"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-4">
          Already have an account?{" "}
          <Link
            href="/login?role=brand"
            className="font-medium text-[#076BD2] transition hover:text-[#0558ad]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
