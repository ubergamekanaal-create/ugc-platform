"use client";

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

function NameStepIcon({ className }: StepIconProps) {
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

function EmailStepIcon({ className }: StepIconProps) {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PasswordStepIcon({ className }: StepIconProps) {
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
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
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

function VolumeStepIcon({ className }: StepIconProps) {
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
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="m10 9 5 3-5 3Z" />
    </svg>
  );
}

function BestWorkStepIcon({ className }: StepIconProps) {
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
      <path d="M10 13a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1l-1.4 1.4" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2.1 2.1a5 5 0 1 0 7.1 7.1l1.4-1.4" />
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
    label: "Name",
    title: "What should brands call you?",
    description:
      "Use the full name you want attached to your creator profile and submissions.",
    icon: NameStepIcon,
  },
  {
    id: 2,
    label: "Email",
    title: "Where should we send your code?",
    description:
      "We’ll send a 6-digit verification code to confirm the email before profile setup continues.",
    icon: EmailStepIcon,
  },
  {
    id: 3,
    label: "Password",
    title: "Set your password",
    description:
      "Create the password you’ll use after your email is verified. You can resend the email code from here.",
    icon: PasswordStepIcon,
  },
  {
    id: 4,
    label: "OTP",
    title: "Verify the 6-digit code",
    description:
      "Enter the email code to confirm ownership of the inbox and activate the account.",
    icon: VerifyStepIcon,
  },
  {
    id: 5,
    label: "Birth year",
    title: "What is your birth year?",
    description:
      "This helps keep creator eligibility structured from the start.",
    icon: CalendarStepIcon,
  },
  {
    id: 6,
    label: "Interests",
    title: "What are you interested in?",
    description:
      "Pick the categories you naturally create in so brands can match you correctly.",
    icon: InterestStepIcon,
  },
  {
    id: 7,
    label: "Socials",
    title: "What are your socials?",
    description:
      "Add the Instagram and TikTok usernames brands will recognize immediately.",
    icon: SocialStepIcon,
  },
  {
    id: 8,
    label: "Volume",
    title: "How many UGC videos do you create per month?",
    description:
      "Give brands a realistic sense of your delivery rhythm and production capacity.",
    icon: VolumeStepIcon,
  },
  {
    id: 9,
    label: "Best work",
    title: "Add up to 5 of your best videos or links",
    description:
      "Share your strongest links so the profile is useful the moment it goes live.",
    icon: BestWorkStepIcon,
  },
];

const CREATOR_SIGNUP_TOTAL_STEPS = CREATOR_SIGNUP_STEPS.length;
const OTP_LENGTH = 6;
const MAX_FEATURED_LINKS = 5;
const DEFAULT_CREATOR_HEADLINE = "Available for UGC collaborations";
const BIRTH_YEAR_OPTIONS = Array.from({ length: 2018 - 1991 + 1 }, (_, index) =>
  String(1991 + index),
);

type CreatorSignupFlowProps = {
  onSwitchToBrand?: () => void;
};

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

export function CreatorSignupFlow({
  onSwitchToBrand,
}: CreatorSignupFlowProps) {
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
  const progress = (step / CREATOR_SIGNUP_TOTAL_STEPS) * 100;
  const otpValue = otpDigits.join("");

  function resetFeedback() {
    setError(null);
    setSuccess(null);
  }

  function handleBack() {
    resetFeedback();
    setStep((current) => {
      if (isOtpVerified) {
        return Math.max(5, current - 1);
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
      const nextLinks = current.filter((_, currentIndex) => currentIndex !== index);
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
    setIsWorking(true);

    try {
      await sendOtp();
      setSuccess(`We sent a 6-digit code to ${email.trim().toLowerCase()}.`);
      setStep(3);
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

    if (password.length < 6) {
      throw new Error("Use a password with at least 6 characters.");
    }

    if (password !== confirmPassword) {
      throw new Error("Password and confirm password must match.");
    }

    if (!isOtpVerified) {
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
    }

    if (!hasPasswordApplied) {
      const creatorHeadline = buildCreatorHeadline(interests);
      const { error: updateUserError } = await supabase.auth.updateUser({
        password,
        data: {
          role: "creator",
          full_name: fullName.trim(),
          headline: creatorHeadline,
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
        throw userError ?? new Error("Unable to load the verified creator account.");
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

      setHasPasswordApplied(true);
    }
  }

  async function handleVerifyOtpAndContinue() {
    resetFeedback();
    setIsWorking(true);

    try {
      await verifyOtpAndApplyPassword();
      setSuccess("Email verified. Your creator account is ready for profile setup.");
      setStep(5);
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
        throw new Error("Verify your email and password setup before finishing signup.");
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
        throw new Error("Add at least one of your best videos or portfolio links.");
      }

      const normalizedLinks = cleanedLinks.map((link) => normalizeLink(link));

      if (normalizedLinks.some((link) => !link)) {
        throw new Error("Use valid http or https links for your featured videos.");
      }

      const uniqueLinks = [...new Set(normalizedLinks.filter((link): link is string => Boolean(link)))];
      const creatorHeadline = buildCreatorHeadline(interests);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("Your creator session has expired. Verify again to continue.");
      }

      const { error: profileError } = await supabase.from("creator_profiles").upsert({
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

  function handleStepAdvance() {
    resetFeedback();

    if (step === 1) {
      if (!fullName.trim()) {
        setError("Full name is required to continue.");
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      void handleSendOtpAndContinue();
      return;
    }

    if (step === 3) {
      if (password.length < 6) {
        setError("Use a password with at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Password and confirm password must match.");
        return;
      }

      setStep(4);
      return;
    }

    if (step === 4) {
      void handleVerifyOtpAndContinue();
      return;
    }

    if (step === 5) {
      if (!birthYear) {
        setError("Choose your birth year to continue.");
        return;
      }

      setStep(6);
      return;
    }

    if (step === 6) {
      if (!interests.length) {
        setError("Choose at least one interest to continue.");
        return;
      }

      setStep(7);
      return;
    }

    if (step === 7) {
      if (!normalizeHandle(instagramUsername) && !normalizeHandle(tiktokUsername)) {
        setError("Add at least one social username to continue.");
        return;
      }

      setStep(8);
      return;
    }

    if (step === 8) {
      const monthlyVideoCount = Number.parseInt(monthlyVideos, 10);

      if (!Number.isFinite(monthlyVideoCount) || monthlyVideoCount <= 0) {
        setError("Enter how many UGC videos you create per month.");
        return;
      }

      setStep(9);
      return;
    }

    if (step === 9) {
      void handleCompleteSignup();
    }
  }

  function handleOtpDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtpDigits((current) =>
      current.map((currentDigit, currentIndex) =>
        currentIndex === index ? digit : currentDigit,
      ),
    );

    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
      otpInputRefs.current[index + 1]?.select();
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
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

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Creator onboarding
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-950">
              Step {step} of {CREATOR_SIGNUP_TOTAL_STEPS}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Guided creator setup with email verification, profile structure, and
              initial portfolio links.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
            {onSwitchToBrand ? (
              <button
                type="button"
                onClick={onSwitchToBrand}
                className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              >
                Switch to brand
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 h-2 rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-9">
          {CREATOR_SIGNUP_STEPS.map((item) => {
            const isActive = item.id === step;
            const isComplete = item.id < step;
            const StepIcon = item.icon;

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-center transition",
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
                      "inline-flex h-9 w-9 items-center justify-center rounded-full",
                      isActive
                        ? "bg-[rgba(7,107,210,0.1)]"
                        : isComplete
                          ? "bg-white/80"
                          : "bg-white/60",
                    )}
                  >
                    <StepIcon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {currentStep.label}
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {currentStep.title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          {currentStep.description}
        </p>

        <div className="mt-6 space-y-5">
          {step === 1 ? (
            <div>
              <label
                htmlFor="creator-full-name"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Full name
              </label>
              <input
                id="creator-full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Riley Cole"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="creator-email"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Email address
                </label>
                <input
                  id="creator-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="creator@example.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-500">
                We&apos;ll send a 6-digit verification code to this inbox so you can
                continue the creator setup.
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Code destination:{" "}
                <span className="font-semibold text-slate-900">
                  {email.trim().toLowerCase()}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="creator-password"
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Password
                  </label>
                  <input
                    id="creator-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="creator-confirm-password"
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Confirm password
                  </label>
                  <input
                    id="creator-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter password"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleResendOtp()}
                disabled={isWorking}
                className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? "Sending..." : "Resend code"}
              </button>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Enter the code sent to{" "}
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

          {step === 5 ? (
            <div>
              <label
                htmlFor="creator-birth-year"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Birth year
              </label>
              <select
                id="creator-birth-year"
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              >
                <option value="">Select birth year</option>
                {BIRTH_YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Select all categories that fit your creator profile.
              </p>
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
                          ? "border-accent/20 bg-[rgba(7,107,210,0.09)] text-accent shadow-[0_10px_24px_rgba(7,107,210,0.08)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 7 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="creator-instagram"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Instagram username
                </label>
                <input
                  id="creator-instagram"
                  type="text"
                  value={instagramUsername}
                  onChange={(event) => setInstagramUsername(event.target.value)}
                  placeholder="@creatorname"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label
                  htmlFor="creator-tiktok"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  TikTok username
                </label>
                <input
                  id="creator-tiktok"
                  type="text"
                  value={tiktokUsername}
                  onChange={(event) => setTiktokUsername(event.target.value)}
                  placeholder="@creatorname"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>
          ) : null}

          {step === 8 ? (
            <div>
              <label
                htmlFor="creator-monthly-videos"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                UGC videos per month
              </label>
              <input
                id="creator-monthly-videos"
                type="number"
                min="1"
                step="1"
                value={monthlyVideos}
                onChange={(event) => setMonthlyVideos(event.target.value)}
                placeholder="12"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          ) : null}

          {step === 9 ? (
            <div className="space-y-4">
              {featuredLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="url"
                    value={link}
                    onChange={(event) =>
                      handleFeaturedLinkChange(index, event.target.value)
                    }
                    placeholder={`Best video or portfolio link ${index + 1}`}
                    className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                  {featuredLinks.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeaturedLink(index)}
                      className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAddFeaturedLink}
                  disabled={featuredLinks.length >= MAX_FEATURED_LINKS}
                  className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add another link
                </button>
                <span className="inline-flex rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Up to {MAX_FEATURED_LINKS} links
                </span>
              </div>
            </div>
          ) : null}
        </div>
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
          disabled={step === 1 || isWorking || (isOtpVerified && step === 5)}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleStepAdvance}
          disabled={isWorking}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white shadow-[0_24px_60px_rgba(7,107,210,0.2)] transition hover:translate-y-[-1px] hover:shadow-[0_28px_70px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isWorking
            ? step === 9
              ? "Creating profile..."
              : step === 4
                ? "Verifying..."
                : "Working..."
            : step === 2
              ? "Send OTP and continue"
              : step === 4
                ? "Verify email and continue"
                : step === 9
                  ? "Create creator account"
                  : "Continue"}
        </button>
      </div>
    </div>
  );
}
