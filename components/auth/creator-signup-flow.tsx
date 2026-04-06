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

function CalendarStepIcon({ className }: StepIconProps) {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function InterestStepIcon({ className }: StepIconProps) {
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
      <path d="m12 3 2.4 4.8L20 10l-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6L4 10l5.6-2.2Z" />
    </svg>
  );
}

function SocialStepIcon({ className }: StepIconProps) {
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
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.2 10.8 15.8 7.2" />
      <path d="m8.2 13.2 7.6 3.6" />
    </svg>
  );
}

function PortfolioStepIcon({ className }: StepIconProps) {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m10 9 5 3-5 3Z" />
    </svg>
  );
}

const CREATOR_INTEREST_OPTIONS = [
  "Menswear",
  "Skincare",
  "Technology",
  "Health",
  "Lifestyle",
  "Fitness",
  "Foods",
  "Sports",
  "Other",
] as const;

const CREATOR_SIGNUP_STEPS: Array<{
  id: number;
  label: string;
  title: string;
  description: string;
  icon: (props: StepIconProps) => JSX.Element;
}> = [
  {
    id: 1,
    label: "Account",
    title: "Create your creator account",
    description:
      "Enter your name, email, and password before we send your verification code.",
    icon: AccountStepIcon,
  },
  {
    id: 2,
    label: "Verify",
    title: "Verify the 6-digit code",
    description:
      "Enter the code from your email to confirm the account before profile setup continues.",
    icon: VerifyStepIcon,
  },
  {
    id: 3,
    label: "Birth year",
    title: "What is your birth year?",
    description:
      "This helps keep creator eligibility structured from the start.",
    icon: CalendarStepIcon,
  },
  {
    id: 4,
    label: "Interests",
    title: "What are you interested in?",
    description:
      "Pick the categories you naturally create in so brands can match you correctly.",
    icon: InterestStepIcon,
  },
  {
    id: 5,
    label: "Socials",
    title: "Add your socials",
    description:
      "Share the handles brands recognize and how many UGC videos you create each month.",
    icon: SocialStepIcon,
  },
  {
    id: 6,
    label: "Portfolio",
    title: "Add up to 5 of your best links",
    description:
      "Share your strongest links so the profile is useful the moment it goes live.",
    icon: PortfolioStepIcon,
  },
];

const CREATOR_SIGNUP_TOTAL_STEPS = CREATOR_SIGNUP_STEPS.length;
const OTP_LENGTH = 6;
const MAX_FEATURED_LINKS = 5;
const DEFAULT_CREATOR_HEADLINE = "Available for UGC collaborations";
const BIRTH_YEAR_OPTIONS = Array.from({ length: 2018 - 1991 + 1 }, (_, index) =>
  String(1991 + index),
);
const inputClassName =
  "h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 shadow-[0_8px_24px_rgba(15,23,42,0.04)] focus:border-[#076BD2] focus:shadow-[0_0_0_4px_rgba(7,107,210,0.12)]";

function normalizeHandle(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const firstPathSegment = url.pathname
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean)[0];

      return firstPathSegment ? firstPathSegment.replace(/^@+/, "") : "";
    } catch {
      return trimmed.replace(/^@+/, "");
    }
  }

  return trimmed.replace(/^@+/, "");
}

function buildInstagramUrl(handle: string) {
  const normalized = normalizeHandle(handle);
  return normalized ? `https://www.instagram.com/${normalized}/` : null;
}

function buildTiktokUrl(handle: string) {
  const normalized = normalizeHandle(handle);
  return normalized ? `https://www.tiktok.com/@${normalized}` : null;
}

function buildCreatorHeadline(interests: string[]) {
  if (!interests.length) {
    return DEFAULT_CREATOR_HEADLINE;
  }

  return `${interests.slice(0, 2).join(" • ")} creator`;
}

function normalizeLink(value: string) {
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

function createEmptyOtp() {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

export function CreatorSignupFlow() {
  const supabase = useMemo(() => createClient(), []);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [instagramUsername, setInstagramUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [monthlyVideos, setMonthlyVideos] = useState("");
  const [featuredLinks, setFeaturedLinks] = useState([""]);
  const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtp);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [hasPasswordApplied, setHasPasswordApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const currentStep = CREATOR_SIGNUP_STEPS.find((item) => item.id === step)!;
  const otpValue = otpDigits.join("");

  function resetFeedback() {
    setError(null);
    setSuccess(null);
  }

  function handleBack() {
    resetFeedback();
    setStep((current) => {
      if (isOtpVerified) {
        return Math.max(3, current - 1);
      }

      return Math.max(1, current - 1);
    });
  }

  function handleInterestToggle(value: string) {
    setInterests((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function handleFeaturedLinkChange(index: number, value: string) {
    setFeaturedLinks((current) =>
      current.map((link, currentIndex) =>
        currentIndex === index ? value : link,
      ),
    );
  }

  function handleAddFeaturedLink() {
    setFeaturedLinks((current) =>
      current.length >= MAX_FEATURED_LINKS ? current : [...current, ""],
    );
  }

  function handleRemoveFeaturedLink(index: number) {
    setFeaturedLinks((current) => {
      const nextLinks = current.filter(
        (_, currentIndex) => currentIndex !== index,
      );
      return nextLinks.length ? nextLinks : [""];
    });
  }

  async function sendOtp() {
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFullName) {
      throw new Error("Full name is required before sending the email code.");
    }

    if (!normalizedEmail) {
      throw new Error("Email is required before sending the email code.");
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        data: {
          role: "creator",
          full_name: normalizedFullName,
          headline: DEFAULT_CREATOR_HEADLINE,
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

    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFullName || !normalizedEmail) {
      setError("Full name and email are required.");
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

  async function verifyOtpAndApplyPassword() {
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
          role: "creator",
          full_name: fullName.trim(),
          headline: buildCreatorHeadline(interests),
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
          userError ?? new Error("Unable to load the verified creator account.")
        );
      }

      const { error: userRowError } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          headline: buildCreatorHeadline(interests),
        })
        .eq("id", user.id);

      if (userRowError) {
        throw userRowError;
      }

      setHasPasswordApplied(true);
    }
  }

  async function handleVerifyOtpAndContinue() {
    resetFeedback();
    setIsWorking(true);

    try {
      await verifyOtpAndApplyPassword();
      setSuccess("Email verified. Continue with your creator profile.");
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
        throw new Error(
          "Verify your email and password setup before finishing signup.",
        );
      }

      const normalizedInstagram = normalizeHandle(instagramUsername);
      const normalizedTiktok = normalizeHandle(tiktokUsername);

      if (!normalizedInstagram && !normalizedTiktok) {
        throw new Error("Add at least one social username before continuing.");
      }

      const monthlyVideoCount = Number.parseInt(monthlyVideos, 10);

      if (!Number.isFinite(monthlyVideoCount) || monthlyVideoCount <= 0) {
        throw new Error("Enter how many UGC videos you create per month.");
      }

      const cleanedLinks = featuredLinks
        .map((link) => link.trim())
        .filter(Boolean);

      if (!cleanedLinks.length) {
        throw new Error(
          "Add at least one of your best videos or portfolio links.",
        );
      }

      const normalizedLinks = cleanedLinks.map((link) => normalizeLink(link));

      if (normalizedLinks.some((link) => !link)) {
        throw new Error(
          "Use valid http or https links for your featured videos.",
        );
      }

      const uniqueLinks = [
        ...new Set(
          normalizedLinks.filter((link): link is string => Boolean(link)),
        ),
      ];
      const creatorHeadline = buildCreatorHeadline(interests);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw (
          userError ??
          new Error(
            "Your creator session has expired. Verify again to continue.",
          )
        );
      }

      const { error: profileError } = await supabase
        .from("creator_profiles")
        .upsert({
          user_id: user.id,
          birth_year: Number.parseInt(birthYear, 10),
          niches: interests,
          platform_specialties: [
            normalizedInstagram ? "Instagram Reels" : null,
            normalizedTiktok ? "TikTok" : null,
          ].filter((value): value is string => Boolean(value)),
          portfolio_url: uniqueLinks[0] ?? null,
          instagram_url: buildInstagramUrl(normalizedInstagram),
          instagram_handle: normalizedInstagram || null,
          tiktok_url: buildTiktokUrl(normalizedTiktok),
          tiktok_handle: normalizedTiktok || null,
          monthly_ugc_videos: monthlyVideoCount,
          featured_content_links: uniqueLinks,
          onboarding_completed_at: new Date().toISOString(),
        });

      if (profileError) {
        throw profileError;
      }

      const { error: userRowError } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          headline: creatorHeadline,
        })
        .eq("id", user.id);

      if (userRowError) {
        throw userRowError;
      }

      const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
          role: "creator",
          full_name: fullName.trim(),
          headline: creatorHeadline,
        },
      });

      if (updateUserError) {
        throw updateUserError;
      }

      setSuccess("Creator account ready. Opening your workspace...");
      window.location.assign("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to complete creator signup.",
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
    resetFeedback();

    if (step === 1) {
      void handleSendOtpAndContinue();
      return;
    }

    if (step === 2) {
      void handleVerifyOtpAndContinue();
      return;
    }

    if (step === 3) {
      if (!birthYear) {
        setError("Choose your birth year to continue.");
        return;
      }

      setStep(4);
      return;
    }

    if (step === 4) {
      if (!interests.length) {
        setError("Select at least one interest to continue.");
        return;
      }

      setStep(5);
      return;
    }

    if (step === 5) {
      const normalizedInstagram = normalizeHandle(instagramUsername);
      const normalizedTiktok = normalizeHandle(tiktokUsername);
      const monthlyVideoCount = Number.parseInt(monthlyVideos, 10);

      if (!normalizedInstagram && !normalizedTiktok) {
        setError("Add at least one social username to continue.");
        return;
      }

      if (!Number.isFinite(monthlyVideoCount) || monthlyVideoCount <= 0) {
        setError("Enter how many UGC videos you create per month.");
        return;
      }

      setStep(6);
      return;
    }

    void handleCompleteSignup();
  }

  return (
    <section className="rounded-[1.75rem] border border-black/5 bg-white/76 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Creator signup
        </span>
        <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Step {step} of {CREATOR_SIGNUP_TOTAL_STEPS}
        </span>
      </div>

      <div className="relative mt-8">
        <div className="absolute left-[calc(8.333%-0.6rem)] right-[calc(8.333%-0.6rem)] top-[2.75rem] h-px bg-slate-200" />
        <div
          className="absolute left-[calc(8.333%-0.6rem)] top-[2.75rem] h-px bg-[linear-gradient(90deg,_rgba(7,107,210,0.78),_rgba(59,130,246,0.52))] transition-all duration-300"
          style={{
            width:
              step === 1
                ? "0%"
                : `calc(${((step - 1) / (CREATOR_SIGNUP_TOTAL_STEPS - 1)) * 100}% + ${((step - 1) / (CREATOR_SIGNUP_TOTAL_STEPS - 1)) * 1.2}rem)`,
          }}
        />

        <div className="grid grid-cols-6 gap-2">
          {CREATOR_SIGNUP_STEPS.map((item, index) => {
            const StepIcon = item.icon;
            const isActive = item.id === step;
            const isComplete = item.id < step;

            return (
              <div key={item.id} className="relative text-center">
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.16em]",
                    isActive || isComplete
                      ? "text-slate-700"
                      : "text-slate-400",
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

      <div className="mt-8 rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.82))] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {currentStep.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {currentStep.description}
            </p>
          </div>
          <span className="hidden rounded-full border border-[rgba(7,107,210,0.14)] bg-[rgba(7,107,210,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#076BD2] sm:inline-flex">
            {currentStep.label}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {step === 1 ? (
          <div className="space-y-3">
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className={inputClassName}
            />
            <input
              type="password"
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
          <select
            value={birthYear}
            onChange={(event) => setBirthYear(event.target.value)}
            className={cn(inputClassName, "appearance-none")}
          >
            <option value="" className="text-slate-500">
              Select birth year
            </option>
            {BIRTH_YEAR_OPTIONS.map((year) => (
              <option key={year} value={year} className="text-slate-900">
                {year}
              </option>
            ))}
          </select>
        ) : null}

        {step === 4 ? (
          <div className="flex flex-wrap gap-3">
            {CREATOR_INTEREST_OPTIONS.map((option) => {
              const isSelected = interests.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleInterestToggle(option)}
                  className={cn(
                    "rounded-full border px-4 py-3 text-sm font-semibold transition",
                    isSelected
                      ? "border-[#076BD2] bg-[#076BD2] text-white shadow-[0_12px_24px_rgba(7,107,210,0.18)]"
                      : "border-slate-200 bg-white text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-3">
            <input
              type="text"
              value={instagramUsername}
              onChange={(event) => setInstagramUsername(event.target.value)}
              placeholder="Instagram username"
              className={inputClassName}
            />
            <input
              type="text"
              value={tiktokUsername}
              onChange={(event) => setTiktokUsername(event.target.value)}
              placeholder="TikTok username"
              className={inputClassName}
            />
            <input
              type="number"
              min="1"
              step="1"
              value={monthlyVideos}
              onChange={(event) => setMonthlyVideos(event.target.value)}
              placeholder="UGC videos per month"
              className={inputClassName}
            />
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-3">
            {featuredLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="url"
                  value={link}
                  onChange={(event) =>
                    handleFeaturedLinkChange(index, event.target.value)
                  }
                  placeholder={`Best video or portfolio link ${index + 1}`}
                  className={cn(inputClassName, "flex-1")}
                />
                {featuredLinks.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveFeaturedLink(index)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAddFeaturedLink}
                disabled={featuredLinks.length >= MAX_FEATURED_LINKS}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add another link
              </button>
              <span className="text-sm text-slate-500">
                Up to {MAX_FEATURED_LINKS} links
              </span>
            </div>
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
          ? step === 6
            ? "Finishing..."
            : "Please wait..."
          : step === 1
            ? "Create account"
            : step === 2
              ? "Verify code"
              : step === 6
                ? "Open dashboard"
                : "Continue"}
      </button>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1 || isWorking || (isOtpVerified && step === 3)}
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
            href="/login?role=creator"
            className="font-medium text-[#076BD2] transition hover:text-[#0558ad]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
