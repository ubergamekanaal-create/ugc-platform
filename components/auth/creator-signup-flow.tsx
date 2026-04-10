"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SignupRoleTabs } from "./signup-role-tabs";
import { BrandMark } from "../shared/brand-mark";

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

function StepBackIcon({ className }: StepIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left w-5 h-5 text-gray-700" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
  );
}

function StepHelpIcon({ className }: StepIconProps) {
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
      <circle cx="12" cy="12" r="8" />
      <path d="M9.8 9.3a2.7 2.7 0 1 1 4.3 2.2c-.8.6-1.3 1-1.3 2" />
      <path d="M12 16.8h.01" />
    </svg>
  );
}

function StepCameraIcon({ className }: StepIconProps) {
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
      <path d="M4.5 8.5h3l1.4-2h6.2l1.4 2h3A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V10a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function StepHandleIcon({ className }: StepIconProps) {
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
      <path d="M8.8 12a3.2 3.2 0 1 0 6.4 0V9.8a4.8 4.8 0 1 0-9.6 0V12a6.4 6.4 0 1 0 12.8 0" />
    </svg>
  );
}

function StepChevronDownIcon({ className }: StepIconProps) {
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
      <path d="m7 10 5 5 5-5" />
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

const CREATOR_GENDER_OPTIONS = [
  { value: "male", label: "Male", emoji: "👨🏻" },
  { value: "female", label: "Female", emoji: "👩🏻" },
] as const;

const CREATOR_COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
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
const CURRENT_YEAR = new Date().getFullYear();
const MAX_YEAR = CURRENT_YEAR - 18;
const MIN_YEAR = CURRENT_YEAR - 120;

const BIRTH_YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, index) => String(MAX_YEAR - index)
);
const inputClassName =
  "h-11 w-full rounded-xl border border-gray-300 bg-[#fbf8fe] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-600 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-base";

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

function formatUsdWhole(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CreatorSignupFlow({ initialStep = 1 }) {
  const supabase = useMemo(() => createClient(), []);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [step, setStep] = useState(initialStep);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [instagramUsername, setInstagramUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [monthlyVideos, setMonthlyVideos] = useState("");
  const [monthlyEarnings, setMonthlyEarnings] = useState(1748);
  const [monthlyEarningsGoal, setMonthlyEarningsGoal] = useState(3496);
  const [featuredLinks, setFeaturedLinks] = useState<string[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<(File | null)[]>([]);
  const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtp);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [hasPasswordApplied, setHasPasswordApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const videoInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentStep = CREATOR_SIGNUP_STEPS.find((item) => item.id === step)!;
  const otpValue = otpDigits.join("");
  const router = useRouter()
  const parsedMonthlyVideos = Number.parseInt(monthlyVideos, 10);
  const monthlyVideoSliderValue =
    Number.isFinite(parsedMonthlyVideos) && parsedMonthlyVideos > 0
      ? Math.min(parsedMonthlyVideos, 24)
      : 4;
  const monthlyVideoSliderThumbPosition =
    ((monthlyVideoSliderValue - 1) / 23) * 100;
  const monthlyEarningsSliderValue = Math.min(
    Math.max(monthlyEarnings, 0),
    10000,
  );
  const monthlyEarningsThumbPosition =
    (monthlyEarningsSliderValue / 10000) * 100;
  const monthlyEarningsGoalSliderValue = Math.min(
    Math.max(monthlyEarningsGoal, 0),
    10000,
  );
  const monthlyEarningsGoalThumbPosition =
    (monthlyEarningsGoalSliderValue / 10000) * 100;
  const isProfileIntroStep =
    step === 3 ||
    step === 4 ||
    step === 5 ||
    step === 6 ||
    step === 7 ||
    step === 8 ||
    step === 9 ||
    step === 10 ||
    step === 11 ||
    step === 12;

  function getOnboardingProgressWidth(currentStepNumber: number) {
    if (currentStepNumber === 3) {
      return "32%";
    }

    if (currentStepNumber === 4) {
      return "40%";
    }

    if (currentStepNumber === 5) {
      return "46%";
    }

    if (currentStepNumber === 6) {
      return "55%";
    }

    if (currentStepNumber === 7) {
      return "57%";
    }

    if (currentStepNumber === 8) {
      return "69%";
    }

    if (currentStepNumber === 9) {
      return "71%";
    }

    if (currentStepNumber === 10) {
      return "81%";
    }

    if (currentStepNumber === 11) {
      return "89%";
    }

    if (currentStepNumber === 12) {
      return "95%";
    }
    return "0%";
  }

  function getEarningsMessage(value: number) {
    if (value >= 8000) {
      return "I'm a Rockstar!";
    }

    if (value >= 5000) {
      return "You're doing great!";
    }

    if (value >= 2500) {
      return "You're building momentum!";
    }

    return "Every creator journey starts somewhere.";
  }

  function resetFeedback() {
    setError(null);
    setSuccess(null);
  }

  function handleBack() {
    resetFeedback();
    setStep((current) => {
      if (isOtpVerified && current <= 3) {
        return 3;
      }

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

  // function handleFeaturedLinkChange(index: number, value: string) {
  //   setFeaturedLinks((current) =>
  //     current.map((link, currentIndex) =>
  //       currentIndex === index ? value : link,
  //     ),
  //   );
  // }
  function handleImageClick() {
    if (isUploaded) {
      return;
    }

    fileInputRef.current?.click();
  }
  async function handleImageUpload(file: File | null) {
    if (!file) return;
    if (isUploaded) {
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPG and PNG images are allowed.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setProfileImage(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setIsUploaded(true);

      setUploadedUrl(data.avatar_url);

    } catch (err) {
      console.error(err);
      setError("Image upload failed");
    }
  }

  async function handleRemoveImage() {
    try {
      if (uploadedUrl) {
        const filePath = uploadedUrl.split("/profile_photo/")[1];

        await fetch("/api/delete-avatar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filePath }),
        });
      }

      setProfileImage(null);
      setPreviewUrl(null);
      setIsUploaded(false);
      setUploadedUrl(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      console.error("Delete failed", err);
    }
  }
  function handleFeaturedLinkChange(index: number, value: string) {
    setFeaturedLinks((current) => {
      const updated = [...current];

      // ensure index exist kare
      updated[index] = value;

      return updated;
    });
  }
  function handleVideoBoxClick(index: number) {
    videoInputRefs.current[index]?.click();
  }
  function handleVideoUpload(index: number, file: File | null) {
    if (!file) return;

    setFeaturedVideos((prev) => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });
  }
  function handleRemoveVideo(index: number) {
    setFeaturedVideos((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
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
        emailRedirectTo: `${window.location.origin}/creator/onboarding`,
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
      // setStep(3);
      let sessionReady = false;

      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          sessionReady = true;
          break;
        }

        await new Promise((res) => setTimeout(res, 300));
      }

      if (!sessionReady) {
        throw new Error("Session not ready. Try again.");
      }
      router.push("/creator/onboarding");
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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      // if (!isOtpVerified || !hasPasswordApplied) {
      //   throw new Error(
      //     "Verify your email and password setup before finishing signup.",
      //   );
      // }

      if (userError || !user) {
        throw new Error("Session expired. Please login again.");
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

      const hasVideos = featuredVideos.some((file) => file instanceof File);
      if (!cleanedLinks.length && !hasVideos) {
        throw new Error(
          "Add at least one video or portfolio link.",
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
      let uploadedAssets: any[] = [];

      if (hasVideos) {
        const formData = new FormData();

        featuredVideos.forEach((file) => {
          if (file instanceof File) {
            formData.append("files", file);
          }
        });

        const res = await fetch("/api/creator-profile/assets", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Video upload failed");
        }

        uploadedAssets = data.assets || [];
      }


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
          username: creatorName,
          gender: gender,
          country: country,
          city: city,
          state_region: stateRegion,
          monthly_earnings: monthlyEarnings,
          monthly_earnings_goal: monthlyEarningsGoal,
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
          ...(creatorName && { full_name: creatorName }),
          headline: creatorHeadline,
        })
        .eq("id", user.id);

      if (userRowError) {
        throw userRowError;
      }

      const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
          role: "creator",
          ...(creatorName && { full_name: creatorName }),
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
  async function uploadProfileImage() {
    if (!profileImage) return;

    try {
      const formData = new FormData();
      formData.append("file", profileImage);

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

    } catch (err) {
      console.error(err);
      setError("Image upload failed");
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

  async function handlePrimaryAction() {
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
      if (!creatorName) {
        setError("Choose your name to continue.");
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      if (!gender) {
        setError("Select your gender to continue.");
        return;
      }

      setStep(5);
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
      if (!country.trim()) {
        setError("Select your country to continue.");
        return;
      }

      if (!city.trim()) {
        setError("Enter your city to continue.");
        return;
      }

      if (!stateRegion.trim()) {
        setError("Enter your state or region to continue.");
        return;
      }

      setStep(7);
      return;
    }

    if (step === 7) {
      if (!interests.length) {
        setError("Select at least one interest to continue.");
        return;
      }

      setStep(8);
      return;
    }

    if (step === 8) {
      const normalizedInstagram = normalizeHandle(instagramUsername);
      const normalizedTiktok = normalizeHandle(tiktokUsername);

      if (!normalizedInstagram && !normalizedTiktok) {
        setError("Add at least one social username to continue.");
        return;
      }

      setStep(9);
      return;
    }

    if (step === 9) {
      const monthlyVideoCount = Number.parseInt(monthlyVideos, 10);

      if (!Number.isFinite(monthlyVideoCount) || monthlyVideoCount <= 0) {
        setError("Enter how many UGC videos you create per month.");
        return;
      }

      setStep(10);
      return;
    }

    if (step === 10) {
      setStep(11);
      return;
    }

    if (step === 11) {
      setStep(12);
      return;
    }
    if (step === 12) {
      if (!isWorking) {
        void handleCompleteSignup();
      }
      return;
    }
    // void handleCompleteSignup();
  }
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <section
      className={cn(
        "mx-auto",
        step === 1 || step === 2
          ? "max-w-[30rem]"
          : "max-w-[40rem]",
      )}
    >

      {step == 1 && <div className="space-y-4 ">
        <div className="mx-auto flex  w-full max-w-6xl items-center justify-center">
          <BrandMark href="/" tone="light" />
        </div>
        <div className="space-y-2 text-center pt-7">
          <h1 className="font-display text-[1.6rem] font-semibold tracking-tight text-slate-950 sm:text-[2.1rem] capitalize">
            Create your creator account
          </h1>
          <p className="mx-auto max-w-[26rem] text-xs leading-5 text-slate-500 sm:text-sm">
            Set up your profile quickly and start getting campaign
            invites.
          </p>
        </div>

        <div className="flex justify-center">
          <SignupRoleTabs
            activeRole="creator"
            className="max-w-[28.90rem]"
          />
        </div>
      </div>}

      {/* <div className="flex flex-row justify-between items-center gap-2 sm:gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-xs sm:tracking-[0.22em]">
          Creator signup
        </span>
        <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-2 sm:text-xs sm:tracking-[0.18em]">
          Step {step} of {CREATOR_SIGNUP_TOTAL_STEPS}
        </span>
      </div> */}
      {/* <div className="relative mt-4">

        <div className="absolute left-[calc(8.333%-0.55rem)] right-[calc(8.333%-0.55rem)] top-[2.3rem] h-px bg-slate-200" />

        <div
          className="absolute left-[calc(8.333%-0.55rem)] top-[2.3rem] h-px bg-[linear-gradient(90deg,_rgba(7,107,210,0.82),_rgba(59,130,246,0.58))] transition-all duration-300"
          style={{
            width:
              step === 1
                ? "0%"
                : `calc(${((step - 1) / (CREATOR_SIGNUP_TOTAL_STEPS - 1)) * 100}% + ${((step - 1) / (CREATOR_SIGNUP_TOTAL_STEPS - 1)) * 1.1}rem)`
          }}
        />
        <div className="absolute left-[calc(8.333%-0.55rem)] right-[calc(8.333%-0.55rem)] top-[6.8rem] h-px bg-slate-200 sm:hidden" />

        <div className="grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-6 sm:gap-2">
          {CREATOR_SIGNUP_STEPS.map((item) => {
            const isActive = item.id === step;
            const isComplete = item.id < step;
            const StepIcon = item.icon;

            return (
              <div key={item.id} className="relative text-center">
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.14em]",
                    isActive || isComplete
                      ? "text-slate-700"
                      : "text-slate-400"
                  )}
                >
                  {item.label}
                </p>

                <div className="relative mt-2 flex justify-center">
                  <span
                    className={cn(
                      "relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition sm:h-8 sm:w-8 sm:text-[11px]",
                      isActive
                        ? "border-[#076BD2] bg-[#076BD2] text-white shadow-[0_12px_25px_rgba(7,107,210,0.22)]"
                        : isComplete
                          ? "border-[#076BD2]/25 bg-[#e8f1ff] text-[#076BD2]"
                          : "border-slate-200 bg-white text-slate-400"
                    )}
                  >
                    <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div> */}
      {/* <div className="relative mt-4">
        <div className="absolute left-0 right-0 top-[2.3rem] h-px bg-slate-200" />

        <div
          className="absolute left-0 top-[2.3rem] h-px bg-[linear-gradient(90deg,_rgba(7,107,210,0.82),_rgba(59,130,246,0.58))] transition-all duration-300"
          style={{
            width:
              step === 1
                ? "0%"
                : `${((step - 1) / (CREATOR_SIGNUP_TOTAL_STEPS - 1)) * 100}%`
          }}
        />
        <div className="flex overflow-x-auto gap-4 px-2 pb-2 sm:pb-0 sm:grid sm:grid-cols-6 sm:gap-2 sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {CREATOR_SIGNUP_STEPS.map((item) => {
            const isActive = item.id === step;
            const isComplete = item.id < step;
            const StepIcon = item.icon;

            return (
              <div
                key={item.id}
                className="relative text-center min-w-[70px] flex-shrink-0 sm:min-w-0"
              >
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.14em]",
                    isActive || isComplete
                      ? "text-slate-700"
                      : "text-slate-400"
                  )}
                >
                  {item.label}
                </p>

                <div className="relative mt-2 flex justify-center">
                  <span
                    className={cn(
                      "relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition sm:h-8 sm:w-8 sm:text-[11px]",
                      isActive
                        ? "border-[#076BD2] bg-[#076BD2] text-white shadow-[0_12px_25px_rgba(7,107,210,0.22)]"
                        : isComplete
                          ? "border-[#076BD2]/25 bg-[#e8f1ff] text-[#076BD2]"
                          : "border-slate-200 bg-white text-slate-400"
                    )}
                  >
                    <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div> */}
      {step === 1 && <div className="mt-4 rounded-[1.25rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.82))] p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold leading-5 text-slate-900">
              {currentStep.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
              {currentStep.description}
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full border border-purple-500 bg-[#E6E6FA] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-500 sm:inline-flex">
            {currentStep.label}
          </span>
        </div>
      </div>}
      <div className={`${step === 1 || step === 2 ? "mt-4" : ""} space-y-3`}>
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
            <div className="flex flex-col gap-y-4 items-center ">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-semibold text-slate-900">
                  Email Verification
                </h2>
                <p className="text-sm text-slate-500">
                  Enter the verification code sent to your email
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.82))] p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold leading-5 text-slate-900">
                    {currentStep.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                    {currentStep.description}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full border border-purple-600 bg-[#E6E6FA] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-600 sm:inline-flex">
                  {currentStep.label}
                </span>
              </div>
            </div>
            <p className="text-center text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-slate-900">
                {email.trim().toLowerCase()}
              </span>
              .
            </p>
            <div className="flex justify-center gap-2 sm:gap-3">
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
                  className="h-11 w-10 rounded-2xl border border-slate-200 bg-white text-center text-base font-semibold text-slate-900 outline-none transition shadow-[0_8px_24px_rgba(15,23,42,0.04)] focus:border-[#076BD2] focus:shadow-[0_0_0_4px_rgba(7,107,210,0.12)] sm:h-12 sm:w-11"
                />
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void handleResendOtp()}
                disabled={isWorking}
                className="text-xs font-medium text-purple-600 transition hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {isWorking ? "Sending..." : "Resend code"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mx-auto flex min-h-[30rem] w-full max-w-[40rem] flex-col px-0 pt-1">
            <div className="h-2  max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center mt-7">
              <div className="">
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-8 w-8 items-center justify-center text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled
                >
                  <StepBackIcon className="h-10 w-10" />
                </button>
              </div>
              <div className="pointer-events-none -mt-2 flex justify-center">
                <span className="text-5xl font-black italic leading-none text-[#4b31da]">
                  t
                </span>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-10 w-10" />
              </button>
            </div>



            <div className="mt-3">
              <h2 className="text-[1.05rem] font-medium tracking-tight text-slate-950 sm:text-2xl">
                Complete your profile!
              </h2>
            </div>

            <div className="mt-4 flex justify-center">
              <div className="relative" onClick={handleImageClick}>
                {/* <div className="flex h-[7.8rem] w-[7.8rem] items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_rgba(237,221,255,0.97),_rgba(225,205,255,0.92))]">
                  <div className="flex h-[4.6rem] w-[4.6rem] items-center justify-center rounded-full bg-white/10">
                    <AccountStepIcon className="h-9 w-9 text-[#d8befa]" />
                  </div>
                </div> */}
                <div className="flex h-[7.8rem] w-[7.8rem] items-center justify-center rounded-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(237,221,255,0.97),_rgba(225,205,255,0.92))]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[4.6rem] w-[4.6rem] items-center justify-center rounded-full bg-white/10">
                      <AccountStepIcon className="h-9 w-9 text-[#d8befa]" />
                    </div>
                  )}
                </div>
                {/* <button
                  type="button"
                  aria-label="Upload profile picture"
                  className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,_#c44eff,_#a14cff)] text-white shadow-[0_10px_24px_rgba(161,76,255,0.32)]"
                >
                  <StepCameraIcon className="h-3.5 w-3.5" />
                </button> */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick();
                  }}
                  className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,_#c44eff,_#a14cff)] text-white"
                >
                  <StepCameraIcon className="h-3.5 w-3.5" />
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="absolute top-0 right-0 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="relative">
                {/* <StepHandleIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" /> */}
                {/* <select
                  value={birthYear}
                  onChange={(event) => setBirthYear(event.target.value)}
                  className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white pl-11 pr-14 text-sm text-slate-500 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.05)] transition focus:border-[#b493ff] focus:shadow-[0_0_0_4px_rgba(180,147,255,0.18)]"
                >
                  <option value="" className="text-slate-400">
                    @username
                  </option>
                  {BIRTH_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year} className="text-slate-900">
                      {year}
                    </option>
                  ))}
                </select> */}
                <input
                  type="text"
                  value={creatorName}
                  onChange={(event) => setCreatorName(event.target.value)}
                  placeholder="@username"
                  className="h-[3.2rem] w-full rounded-full border border-slate-200 bg-white px-4 text-[1rem] text-slate-900 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition placeholder:text-slate-400 focus:border-[#b493ff] focus:shadow-[0_0_0_4px_rgba(180,147,255,0.18)]"
                />
                {/* <div className="pointer-events-none absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-[#f05149] text-white shadow-[0_8px_18px_rgba(240,81,73,0.2)]">
                  <CalendarStepIcon className="h-3.5 w-3.5" />
                </div> */}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mx-auto flex min-h-[30rem] w-full max-w-[40rem] flex-col px-0 pt-1">
            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/35 text-slate-500 shadow-[0_4px_10px_rgba(15,23,42,0.04)] transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="pointer-events-none -mt-2 flex justify-center">
                <span className="text-5xl font-black italic leading-none text-[#4b31da]">
                  t
                </span>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>



            <div className="mt-4">
              <h2 className="text-[1.95rem] font-medium tracking-tight text-slate-950">
                Select your gender
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                This helps brands match you with relevant campaigns.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {CREATOR_GENDER_OPTIONS.map((option) => {
                const isSelected = gender === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    className={cn(
                      "flex h-[3.05rem] w-full items-center gap-3 rounded-full border bg-white px-4 text-left text-base font-semibold transition shadow-[0_5px_14px_rgba(15,23,42,0.04)]",
                      isSelected
                        ? "border-[#b493ff] shadow-[0_0_0_3px_rgba(180,147,255,0.14)]"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <span className="text-lg leading-none">{option.emoji}</span>
                    <span className="text-[1.05rem] text-slate-900">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}



        {step === 5 ? (
          <div className="mx-auto flex min-h-[30rem] w-full flex-col px-0 pt-1">
            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none -mt-8 flex justify-center">
              <span className="text-[2.2rem] font-black italic leading-none text-[#4b31da]">
                t
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[1.95rem] font-medium tracking-tight text-slate-950">
                What year were you born?
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                You must be at least 18 years old to use Trybe.
              </p>
            </div>

            <div className="mt-5">
              <div className="relative">
                <select
                  value={birthYear}
                  onChange={(event) => setBirthYear(event.target.value)}
                  className="h-[3.2rem] w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-12 text-[1rem] text-slate-500 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition focus:border-[#b493ff] focus:shadow-[0_0_0_4px_rgba(180,147,255,0.18)]"
                >
                  <option value="" className="text-slate-400">
                    i.e 2006
                  </option>
                  {BIRTH_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year} className="text-slate-900">
                      {year}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <StepChevronDownIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="mx-auto flex min-h-[30rem] max-h-[30rem] w-full flex-col px-0 pt-1">
            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none -mt-8 flex justify-center">
              <span className="text-[2.2rem] font-black italic leading-none text-[#4b31da]">
                t
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[1.95rem] font-medium tracking-tight text-slate-950">
                Where are you located?
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                We&apos;ll use this information to find the best opportunities for you.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="relative">
                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="h-[3.2rem] w-full appearance-none rounded-full border border-slate-200 bg-white px-4 pr-12 text-[1rem] text-slate-500 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition focus:border-[#b493ff] focus:shadow-[0_0_0_4px_rgba(180,147,255,0.18)]"
                >
                  <option value="" className="text-slate-400">
                    Select country
                  </option>
                  {CREATOR_COUNTRY_OPTIONS.map((option) => (
                    <option key={option} value={option} className="text-slate-900">
                      {option}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <StepChevronDownIcon className="h-4 w-4" />
                </div>
              </div>

              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Search for your city"
                className="h-[3.2rem] w-full rounded-full border border-slate-200 bg-white px-4 text-[1rem] text-slate-900 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition placeholder:text-slate-400 focus:border-[#b493ff] focus:shadow-[0_0_0_4px_rgba(180,147,255,0.18)]"
              />

              <input
                type="text"
                value={stateRegion}
                onChange={(event) => setStateRegion(event.target.value)}
                placeholder="State / Region"
                className="h-[3.2rem] w-full rounded-full border border-slate-200 bg-white px-4 text-[1rem] text-slate-900 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition placeholder:text-slate-400 focus:border-[#b493ff] focus:shadow-[0_0_0_4px_rgba(180,147,255,0.18)]"
              />
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="mx-auto flex min-h-[30rem] w-full max-w-[40rem] flex-col px-0 pt-1">
            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none -mt-8 flex justify-center">
              <span className="text-[2.2rem] font-black italic leading-none text-[#4b31da]">
                t
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[1.95rem] font-medium tracking-tight text-slate-950">
                What are you interested in?
              </h2>
            </div>

            <div className="mt-32 flex flex-wrap gap-3">
              {CREATOR_INTEREST_OPTIONS.map((option) => {
                const isSelected = interests.includes(option);
                const emoji =
                  option === "Menswear"
                    ? "👕"
                    : option === "Skincare"
                      ? "🛁"
                      : option === "Technology"
                        ? "💻"
                        : option === "Health"
                          ? "🍓"
                          : option === "Lifestyle"
                            ? "🏠"
                            : option === "Fitness"
                              ? "🏋️"
                              : option === "Foods"
                                ? "🍔"
                                : option === "Sports"
                                  ? "🏀"
                                  : "🎩";

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleInterestToggle(option)}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-full border bg-white px-4 text-[0.95rem] font-medium text-slate-900 shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition",
                      isSelected
                        ? "border-[#b493ff] shadow-[0_0_0_3px_rgba(180,147,255,0.14)]"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <span className="text-lg leading-none">{emoji}</span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 8 ? (
          <div className="mx-auto flex min-h-[30rem] w-full max-w-[40rem] flex-col px-0 pt-1">
            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none -mt-8 flex justify-center">
              <span className="text-[2.2rem] font-black italic leading-none text-[#4b31da]">
                t
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[1.95rem] font-medium tracking-tight text-slate-950">
                What are your socials?
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Linking your socials lets brands explore your experience. Results in 30% more brand invites! Link at least 1.
              </p>
            </div>

            <div className="hidden">
              <div className="text-center">
                <span className="text-[2.3rem] font-semibold tracking-tight text-slate-950">
                  {monthlyVideoSliderValue}
                </span>
                <span className="ml-2 text-[2rem] font-medium tracking-tight text-slate-400">
                  posts
                </span>
              </div>

              <div className="relative mt-14 px-1">
                <div className="pointer-events-none flex items-end justify-between">
                  {Array.from({ length: 24 }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "w-px rounded-full bg-slate-300/90",
                        index < 4 ? "h-2 bg-[#8f63ff]" : "h-7",
                      )}
                    />
                  ))}
                </div>

                <input
                  type="range"
                  min="1"
                  max="24"
                  step="1"
                  value={monthlyVideoSliderValue}
                  onChange={(event) => setMonthlyVideos(event.target.value)}
                  className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#8f63ff] [&::-moz-range-thumb]:shadow-[0_4px_12px_rgba(143,99,255,0.45)] [&::-webkit-slider-runnable-track]:h-8 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-2 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#8f63ff] [&::-webkit-slider-thumb]:shadow-[0_4px_12px_rgba(143,99,255,0.45)]"
                />
              </div>

              <p className="mt-10 text-center text-sm text-slate-500">
                It&apos;s best to be honest here with whatever you are comfortable with
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg leading-none">
                  <svg viewBox="0 0 2500 2500" width={20} height={20} xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><radialGradient id="0" cx="332.14" cy="2511.81" r="3263.54" gradientUnits="userSpaceOnUse"><stop offset=".09" stop-color="#fa8f21"></stop><stop offset=".78" stop-color="#d82d7e"></stop></radialGradient><radialGradient id="1" cx="1516.14" cy="2623.81" r="2572.12" gradientUnits="userSpaceOnUse"><stop offset=".64" stop-color="#8c3aaa" stop-opacity="0"></stop><stop offset="1" stop-color="#8c3aaa"></stop></radialGradient></defs><path d="M833.4,1250c0-230.11,186.49-416.7,416.6-416.7s416.7,186.59,416.7,416.7-186.59,416.7-416.7,416.7S833.4,1480.11,833.4,1250m-225.26,0c0,354.5,287.36,641.86,641.86,641.86S1891.86,1604.5,1891.86,1250,1604.5,608.14,1250,608.14,608.14,895.5,608.14,1250M1767.27,582.69a150,150,0,1,0,150.06-149.94h-0.06a150.07,150.07,0,0,0-150,149.94M745,2267.47c-121.87-5.55-188.11-25.85-232.13-43-58.36-22.72-100-49.78-143.78-93.5s-70.88-85.32-93.5-143.68c-17.16-44-37.46-110.26-43-232.13-6.06-131.76-7.27-171.34-7.27-505.15s1.31-373.28,7.27-505.15c5.55-121.87,26-188,43-232.13,22.72-58.36,49.78-100,93.5-143.78s85.32-70.88,143.78-93.5c44-17.16,110.26-37.46,232.13-43,131.76-6.06,171.34-7.27,505-7.27s373.28,1.31,505.15,7.27c121.87,5.55,188,26,232.13,43,58.36,22.62,100,49.78,143.78,93.5s70.78,85.42,93.5,143.78c17.16,44,37.46,110.26,43,232.13,6.06,131.87,7.27,171.34,7.27,505.15s-1.21,373.28-7.27,505.15c-5.55,121.87-25.95,188.11-43,232.13-22.72,58.36-49.78,100-93.5,143.68s-85.42,70.78-143.78,93.5c-44,17.16-110.26,37.46-232.13,43-131.76,6.06-171.34,7.27-505.15,7.27s-373.28-1.21-505-7.27M734.65,7.57c-133.07,6.06-224,27.16-303.41,58.06C349,97.54,279.38,140.35,209.81,209.81S97.54,349,65.63,431.24c-30.9,79.46-52,170.34-58.06,303.41C1.41,867.93,0,910.54,0,1250s1.41,382.07,7.57,515.35c6.06,133.08,27.16,223.95,58.06,303.41,31.91,82.19,74.62,152,144.18,221.43S349,2402.37,431.24,2434.37c79.56,30.9,170.34,52,303.41,58.06C868,2498.49,910.54,2500,1250,2500s382.07-1.41,515.35-7.57c133.08-6.06,223.95-27.16,303.41-58.06,82.19-32,151.86-74.72,221.43-144.18s112.18-139.24,144.18-221.43c30.9-79.46,52.1-170.34,58.06-303.41,6.06-133.38,7.47-175.89,7.47-515.35s-1.41-382.07-7.47-515.35c-6.06-133.08-27.16-224-58.06-303.41-32-82.19-74.72-151.86-144.18-221.43S2150.95,97.54,2068.86,65.63c-79.56-30.9-170.44-52.1-303.41-58.06C1632.17,1.51,1589.56,0,1250.1,0S868,1.41,734.65,7.57" fill="url(#0)"></path><path d="M833.4,1250c0-230.11,186.49-416.7,416.6-416.7s416.7,186.59,416.7,416.7-186.59,416.7-416.7,416.7S833.4,1480.11,833.4,1250m-225.26,0c0,354.5,287.36,641.86,641.86,641.86S1891.86,1604.5,1891.86,1250,1604.5,608.14,1250,608.14,608.14,895.5,608.14,1250M1767.27,582.69a150,150,0,1,0,150.06-149.94h-0.06a150.07,150.07,0,0,0-150,149.94M745,2267.47c-121.87-5.55-188.11-25.85-232.13-43-58.36-22.72-100-49.78-143.78-93.5s-70.88-85.32-93.5-143.68c-17.16-44-37.46-110.26-43-232.13-6.06-131.76-7.27-171.34-7.27-505.15s1.31-373.28,7.27-505.15c5.55-121.87,26-188,43-232.13,22.72-58.36,49.78-100,93.5-143.78s85.32-70.88,143.78-93.5c44-17.16,110.26-37.46,232.13-43,131.76-6.06,171.34-7.27,505-7.27s373.28,1.31,505.15,7.27c121.87,5.55,188,26,232.13,43,58.36,22.62,100,49.78,143.78,93.5s70.78,85.42,93.5,143.78c17.16,44,37.46,110.26,43,232.13,6.06,131.87,7.27,171.34,7.27,505.15s-1.21,373.28-7.27,505.15c-5.55,121.87-25.95,188.11-43,232.13-22.72,58.36-49.78,100-93.5,143.68s-85.42,70.78-143.78,93.5c-44,17.16-110.26,37.46-232.13,43-131.76,6.06-171.34,7.27-505.15,7.27s-373.28-1.21-505-7.27M734.65,7.57c-133.07,6.06-224,27.16-303.41,58.06C349,97.54,279.38,140.35,209.81,209.81S97.54,349,65.63,431.24c-30.9,79.46-52,170.34-58.06,303.41C1.41,867.93,0,910.54,0,1250s1.41,382.07,7.57,515.35c6.06,133.08,27.16,223.95,58.06,303.41,31.91,82.19,74.62,152,144.18,221.43S349,2402.37,431.24,2434.37c79.56,30.9,170.34,52,303.41,58.06C868,2498.49,910.54,2500,1250,2500s382.07-1.41,515.35-7.57c133.08-6.06,223.95-27.16,303.41-58.06,82.19-32,151.86-74.72,221.43-144.18s112.18-139.24,144.18-221.43c30.9-79.46,52.1-170.34,58.06-303.41,6.06-133.38,7.47-175.89,7.47-515.35s-1.41-382.07-7.47-515.35c-6.06-133.08-27.16-224-58.06-303.41-32-82.19-74.72-151.86-144.18-221.43S2150.95,97.54,2068.86,65.63c-79.56-30.9-170.44-52.1-303.41-58.06C1632.17,1.51,1589.56,0,1250.1,0S868,1.41,734.65,7.57" fill="url(#1)"></path></g></svg>
                </span>
                <input
                  type="text"
                  value={instagramUsername}
                  onChange={(event) => setInstagramUsername(event.target.value)}
                  placeholder="@username"
                  className="h-[3.15rem] w-full rounded-full border border-[#b86cff] bg-white pl-10 pr-12 text-[1rem] text-slate-900 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition placeholder:text-slate-400 focus:border-[#b86cff] focus:shadow-[0_0_0_4px_rgba(184,108,255,0.16)]"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-[#f05149] text-[11px] text-white shadow-[0_8px_18px_rgba(240,81,73,0.2)]">
                  •••
                </div>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg leading-none">
                  <svg viewBox="0 0 32 32" width={20} height={20} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8.45095 19.7926C8.60723 18.4987 9.1379 17.7743 10.1379 17.0317C11.5688 16.0259 13.3561 16.5948 13.3561 16.5948V13.2197C13.7907 13.2085 14.2254 13.2343 14.6551 13.2966V17.6401C14.6551 17.6401 12.8683 17.0712 11.4375 18.0775C10.438 18.8196 9.90623 19.5446 9.7505 20.8385C9.74562 21.5411 9.87747 22.4595 10.4847 23.2536C10.3345 23.1766 10.1815 23.0889 10.0256 22.9905C8.68807 22.0923 8.44444 20.7449 8.45095 19.7926ZM22.0352 6.97898C21.0509 5.90039 20.6786 4.81139 20.5441 4.04639H21.7823C21.7823 4.04639 21.5354 6.05224 23.3347 8.02482L23.3597 8.05134C22.8747 7.7463 22.43 7.38624 22.0352 6.97898ZM28 10.0369V14.293C28 14.293 26.42 14.2312 25.2507 13.9337C23.6179 13.5176 22.5685 12.8795 22.5685 12.8795C22.5685 12.8795 21.8436 12.4245 21.785 12.3928V21.1817C21.785 21.6711 21.651 22.8932 21.2424 23.9125C20.709 25.246 19.8859 26.1212 19.7345 26.3001C19.7345 26.3001 18.7334 27.4832 16.9672 28.28C15.3752 28.9987 13.9774 28.9805 13.5596 28.9987C13.5596 28.9987 11.1434 29.0944 8.96915 27.6814C8.49898 27.3699 8.06011 27.0172 7.6582 26.6277L7.66906 26.6355C9.84383 28.0485 12.2595 27.9528 12.2595 27.9528C12.6779 27.9346 14.0756 27.9528 15.6671 27.2341C17.4317 26.4374 18.4344 25.2543 18.4344 25.2543C18.5842 25.0754 19.4111 24.2001 19.9423 22.8662C20.3498 21.8474 20.4849 20.6247 20.4849 20.1354V11.3475C20.5435 11.3797 21.2679 11.8347 21.2679 11.8347C21.2679 11.8347 22.3179 12.4734 23.9506 12.8889C25.1204 13.1864 26.7 13.2483 26.7 13.2483V9.91314C27.2404 10.0343 27.7011 10.0671 28 10.0369Z" fill="#EE1D52"></path> <path d="M26.7009 9.91314V13.2472C26.7009 13.2472 25.1213 13.1853 23.9515 12.8879C22.3188 12.4718 21.2688 11.8337 21.2688 11.8337C21.2688 11.8337 20.5444 11.3787 20.4858 11.3464V20.1364C20.4858 20.6258 20.3518 21.8484 19.9432 22.8672C19.4098 24.2012 18.5867 25.0764 18.4353 25.2553C18.4353 25.2553 17.4337 26.4384 15.668 27.2352C14.0765 27.9539 12.6788 27.9357 12.2604 27.9539C12.2604 27.9539 9.84473 28.0496 7.66995 26.6366L7.6591 26.6288C7.42949 26.4064 7.21336 26.1717 7.01177 25.9257C6.31777 25.0795 5.89237 24.0789 5.78547 23.7934C5.78529 23.7922 5.78529 23.791 5.78547 23.7898C5.61347 23.2937 5.25209 22.1022 5.30147 20.9482C5.38883 18.9122 6.10507 17.6625 6.29444 17.3494C6.79597 16.4957 7.44828 15.7318 8.22233 15.0919C8.90538 14.5396 9.6796 14.1002 10.5132 13.7917C11.4144 13.4295 12.3794 13.2353 13.3565 13.2197V16.5948C13.3565 16.5948 11.5691 16.028 10.1388 17.0317C9.13879 17.7743 8.60812 18.4987 8.45185 19.7926C8.44534 20.7449 8.68897 22.0923 10.0254 22.991C10.1813 23.0898 10.3343 23.1775 10.4845 23.2541C10.7179 23.5576 11.0021 23.8221 11.3255 24.0368C12.631 24.8632 13.7249 24.9209 15.1238 24.3842C16.0565 24.0254 16.7586 23.2167 17.0842 22.3206C17.2888 21.7611 17.2861 21.1978 17.2861 20.6154V4.04639H20.5417C20.6763 4.81139 21.0485 5.90039 22.0328 6.97898C22.4276 7.38624 22.8724 7.7463 23.3573 8.05134C23.5006 8.19955 24.2331 8.93231 25.1734 9.38216C25.6596 9.61469 26.1722 9.79285 26.7009 9.91314Z" fill="#000000"></path> <path d="M4.48926 22.7568V22.7594L4.57004 22.9784C4.56076 22.9529 4.53074 22.8754 4.48926 22.7568Z" fill="#69C9D0"></path> <path d="M10.5128 13.7916C9.67919 14.1002 8.90498 14.5396 8.22192 15.0918C7.44763 15.7332 6.79548 16.4987 6.29458 17.354C6.10521 17.6661 5.38897 18.9168 5.30161 20.9528C5.25223 22.1068 5.61361 23.2983 5.78561 23.7944C5.78543 23.7956 5.78543 23.7968 5.78561 23.798C5.89413 24.081 6.31791 25.0815 7.01191 25.9303C7.2135 26.1763 7.42963 26.4111 7.65924 26.6334C6.92357 26.1457 6.26746 25.5562 5.71236 24.8839C5.02433 24.0451 4.60001 23.0549 4.48932 22.7626C4.48919 22.7605 4.48919 22.7584 4.48932 22.7564V22.7527C4.31677 22.2571 3.95431 21.0651 4.00477 19.9096C4.09213 17.8736 4.80838 16.6239 4.99775 16.3108C5.4985 15.4553 6.15067 14.6898 6.92509 14.0486C7.608 13.4961 8.38225 13.0567 9.21598 12.7484C9.73602 12.5416 10.2778 12.3891 10.8319 12.2934C11.6669 12.1537 12.5198 12.1415 13.3588 12.2575V13.2196C12.3808 13.2349 11.4148 13.4291 10.5128 13.7916Z" fill="#69C9D0"></path> <path d="M20.5438 4.04635H17.2881V20.6159C17.2881 21.1983 17.2881 21.76 17.0863 22.3211C16.7575 23.2167 16.058 24.0253 15.1258 24.3842C13.7265 24.923 12.6326 24.8632 11.3276 24.0368C11.0036 23.823 10.7187 23.5594 10.4844 23.2567C11.5962 23.8251 12.5913 23.8152 13.8241 23.341C14.7558 22.9821 15.4563 22.1734 15.784 21.2774C15.9891 20.7178 15.9864 20.1546 15.9864 19.5726V3H20.4819C20.4819 3 20.4315 3.41188 20.5438 4.04635ZM26.7002 8.99104V9.9131C26.1725 9.79263 25.6609 9.61447 25.1755 9.38213C24.2352 8.93228 23.5026 8.19952 23.3594 8.0513C23.5256 8.1559 23.6981 8.25106 23.8759 8.33629C25.0192 8.88339 26.1451 9.04669 26.7002 8.99104Z" fill="#69C9D0"></path> </g></svg>
                </span>
                <input
                  type="text"
                  value={tiktokUsername}
                  onChange={(event) => setTiktokUsername(event.target.value)}
                  placeholder="@username"
                  className="h-[3.15rem] w-full rounded-full border border-slate-200 bg-white pl-10 pr-12 text-[1rem] text-slate-900 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition placeholder:text-slate-400 focus:border-[#b493ff] focus:shadow-[0_0_0_4px_rgba(180,147,255,0.18)]"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-[#f05149] text-[11px] text-white shadow-[0_8px_18px_rgba(240,81,73,0.2)]">
                  •••
                </div>
              </div>

              {/* <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[0.8rem] font-semibold text-slate-400">
                  #
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={monthlyVideos}
                  onChange={(event) => setMonthlyVideos(event.target.value)}
                  placeholder="UGC videos per month"
                  className="h-[3.15rem] w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-[1rem] text-slate-900 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition placeholder:text-slate-400 focus:border-[#b493ff] focus:shadow-[0_0_0_4px_rgba(180,147,255,0.18)]"
                />
              </div> */}
            </div>
          </div>
        ) : null}

        {step === 9 ? (
          <div className="mx-auto flex min-h-[30rem] w-full max-w-[40rem] flex-col px-0 pt-1">
            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none -mt-8 flex justify-center">
              <span className="text-[2.2rem] font-black italic leading-none text-[#4b31da]">
                t
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[1.95rem] font-medium tracking-tight text-slate-950">
                How many UGC videos do you create per month?
              </h2>
            </div>

            <div className="mt-20">
              <div className="text-center">
                <span className="text-[2.3rem] font-semibold tracking-tight text-slate-950">
                  {monthlyVideoSliderValue}
                </span>
                <span className="ml-2 text-[2rem] font-medium tracking-tight text-slate-400">
                  posts
                </span>
              </div>

              <div className="relative mt-14 px-1 pb-8">
                <div className="pointer-events-none relative flex items-end justify-between">
                  {Array.from({ length: 24 }, (_, index) => {
                    const height = 3 + index * 1.2;

                    return (
                      <span
                        key={index}
                        className={cn(
                          "w-[2px] rounded-full transition-colors",
                          index < monthlyVideoSliderValue
                            ? "bg-[#8f63ff]"
                            : "bg-slate-300/90",
                        )}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}

                  <span
                    className="absolute top-full h-5 w-5 -translate-x-1/2 rounded-full bg-[#8f63ff] shadow-[0_6px_16px_rgba(143,99,255,0.42)]"
                    style={{
                      left: `${monthlyVideoSliderThumbPosition}%`,
                      marginTop: "8px",
                    }}
                  />
                </div>

                <input
                  type="range"
                  min="1"
                  max="24"
                  step="1"
                  value={monthlyVideoSliderValue}
                  onChange={(event) => setMonthlyVideos(event.target.value)}
                  className="absolute inset-x-0 -top-3 z-20 h-[64px] w-full cursor-pointer appearance-none bg-transparent opacity-0"
                />
              </div>

              <p className="mt-10 text-center text-sm text-slate-500">
                It&apos;s best to be honest here with whatever you are comfortable with
              </p>
            </div>
          </div>
        ) : null}

        {step === 10 ? (
          <div className="mx-auto flex min-h-[30rem] w-full max-w-[40rem] flex-col px-0 pt-1">
            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none -mt-8 flex justify-center">
              <span className="text-[2.2rem] font-black italic leading-none text-[#4b31da]">
                t
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[1.95rem] font-medium leading-[1.32] tracking-tight text-slate-950">
                How much do you earn from UGC on average per month? (across all channels)
              </h2>
            </div>

            <div className="mt-18">
              <div className="text-center">
                <span className="text-[2.3rem] font-semibold tracking-tight text-slate-950">
                  {formatUsdWhole(monthlyEarningsSliderValue)}
                </span>
              </div>

              <div className="relative mt-14 px-1 pb-12">
                <div className="pointer-events-none relative flex items-end justify-between">
                  {Array.from({ length: 24 }, (_, index) => {
                    const height = 3 + index * 1.85;
                    const markerValue = (10000 / 23) * index;

                    return (
                      <span
                        key={index}
                        className={cn(
                          "w-[2px] rounded-full transition-colors",
                          markerValue <= monthlyEarningsSliderValue
                            ? "bg-[#8f63ff]"
                            : "bg-slate-300/90",
                        )}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}

                  <span
                    className="absolute top-full h-6 w-6 -translate-x-1/2 rounded-full bg-[#8f63ff] shadow-[0_8px_20px_rgba(143,99,255,0.42)]"
                    style={{
                      left: `${monthlyEarningsThumbPosition}%`,
                      marginTop: "10px",
                    }}
                  />
                </div>

                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="1"
                  value={monthlyEarningsSliderValue}
                  onChange={(event) =>
                    setMonthlyEarnings(Number.parseInt(event.target.value, 10))
                  }
                  className="absolute inset-x-0 -top-4 z-30 h-[82px] w-full cursor-pointer appearance-none bg-transparent opacity-0"
                />
              </div>

              <p className="mt-8 text-center text-[1.05rem] font-medium text-[#8f31ff]">
                {getEarningsMessage(monthlyEarningsSliderValue)}
              </p>
            </div>
          </div>
        ) : null}

        {step === 11 ? (
          <div className="mx-auto flex min-h-[30rem] w-full max-w-[40rem] flex-col px-0 pt-1">
            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none -mt-8 flex justify-center">
              <span className="text-[2.2rem] font-black italic leading-none text-[#4b31da]">
                t
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[1.95rem] font-medium leading-[1.32] tracking-tight text-slate-950">
                What is your monthly earnings goal in the next year?
              </h2>
            </div>

            <div className="mt-20">
              <div className="text-center">
                <span className="text-[2.3rem] font-semibold tracking-tight text-slate-950">
                  {formatUsdWhole(monthlyEarningsGoalSliderValue)}
                </span>
              </div>

              <div className="relative mt-14 px-1 pb-12">
                <div className="pointer-events-none relative flex items-end justify-between">
                  {Array.from({ length: 24 }, (_, index) => {
                    const height = 3 + index * 1.45;
                    const markerValue = (10000 / 23) * index;

                    return (
                      <span
                        key={index}
                        className={cn(
                          "w-[2px] rounded-full transition-colors",
                          markerValue <= monthlyEarningsGoalSliderValue
                            ? "bg-[#8f63ff]"
                            : "bg-slate-300/90",
                        )}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}

                  <span
                    className="absolute top-full h-6 w-6 -translate-x-1/2 rounded-full bg-[#8f63ff] shadow-[0_8px_20px_rgba(143,99,255,0.42)]"
                    style={{
                      left: `${monthlyEarningsGoalThumbPosition}%`,
                      marginTop: "10px",
                    }}
                  />
                </div>

                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="1"
                  value={monthlyEarningsGoalSliderValue}
                  onChange={(event) =>
                    setMonthlyEarningsGoal(Number.parseInt(event.target.value, 10))
                  }
                  className="absolute inset-x-0 -top-4 z-30 h-[82px] w-full cursor-pointer appearance-none bg-transparent opacity-0"
                />
              </div>
            </div>
          </div>
        ) : null}
        {step === 12 && (
          <div className="mx-auto flex min-h-[24rem] w-full max-w-[40rem] flex-col px-4 pt-2">

            <div className="h-2 max-w-full rounded-full bg-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#f7a48f,_#b196ff)]"
                style={{ width: getOnboardingProgressWidth(step) }}
              />
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="inline-flex h-7 w-7 items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isWorking}
                >
                  <StepBackIcon className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label="Help"
                className="inline-flex h-7 w-7 items-center justify-center justify-self-end rounded-full text-slate-700 transition hover:text-slate-950"
              >
                <StepHelpIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Title */}
            <div className="mt-6">
              <h2 className="text-[1.5rem] font-semibold text-slate-900">
                Add up to 5 of your best videos/links
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Don&apos;t worry brands care more about authenticity than perfection.
              </p>
            </div>

            {/* Upload Boxes */}
            <div className="mt-6 flex flex-wrap sm:grid sm:grid-cols-5 gap-3">
              {/* {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => videoInputRefs.current[i]?.click()}
                  className="flex w-[90px] h-[90px] sm:w-[107px] sm:h-[107px] aspect-square rounded-2xl border-2 border-dashed border-primary/60 items-center justify-center rounded-xl border-2 border-dashed border-[#b196ff]"
                >
                  <span className="text-[#b196ff] text-lg"><svg className="w-9 h-9 text-primary/60" viewBox="0 0 36 36" fill="none"><path d="M19.9375 16.5265C19.7355 17.3622 18.781 17.9527 16.8719 19.1337C15.0263 20.2754 14.1035 20.8462 13.3599 20.6168C13.0525 20.5219 12.7723 20.3418 12.5464 20.0936C12 19.4933 12 18.3289 12 16.0002C12 13.6714 12 12.5071 12.5464 11.9068C12.7723 11.6586 13.0525 11.4784 13.3599 11.3835C14.1035 11.1541 15.0263 11.7249 16.8719 12.8666C18.781 14.0476 19.7355 14.6381 19.9375 15.4738C20.0208 15.8187 20.0208 16.1816 19.9375 16.5265Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path><path d="M3.333 16C3.333 10.029 3.333 7.043 5.188 5.188C7.043 3.333 10.029 3.333 16 3.333C21.971 3.333 24.956 3.333 26.811 5.188C28.666 7.043 28.666 10.029 28.666 16C28.666 21.971 28.666 24.957 26.811 26.812C24.956 28.667 21.971 28.667 16 28.667C10.029 28.667 7.043 28.667 5.188 26.812C3.333 24.957 3.333 21.971 3.333 16Z" stroke="currentColor" stroke-width="1.5"></path><circle cx="27.5" cy="27.5" r="6.667" fill="var(--primary)"></circle><path d="M27.5 24.833V30.167M30.166 27.5H24.833" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
                  <input
                    type="file"
                    accept="video/*"
                    ref={(el) => (videoInputRefs.current[i] = el)}
                    className="hidden"
                    onChange={(e) =>
                      handleVideoUpload(i, e.target.files?.[0] || null)
                    }
                  />
                </div>
                
              ))} */}

              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => handleVideoBoxClick(i)}
                  className="relative flex w-[90px] h-[90px] sm:w-[107px] sm:h-[107px] aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-[#b196ff] cursor-pointer overflow-hidden"
                >
                  {featuredVideos[i] ? (
                    <>
                      <video
                        src={URL.createObjectURL(featuredVideos[i])}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVideo(i);
                        }}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </>

                  ) : (
                    <span className="text-[#b196ff] text-lg">
                      <span className="text-[#b196ff] text-lg"><svg className="w-9 h-9 text-primary/60" viewBox="0 0 36 36" fill="none"><path d="M19.9375 16.5265C19.7355 17.3622 18.781 17.9527 16.8719 19.1337C15.0263 20.2754 14.1035 20.8462 13.3599 20.6168C13.0525 20.5219 12.7723 20.3418 12.5464 20.0936C12 19.4933 12 18.3289 12 16.0002C12 13.6714 12 12.5071 12.5464 11.9068C12.7723 11.6586 13.0525 11.4784 13.3599 11.3835C14.1035 11.1541 15.0263 11.7249 16.8719 12.8666C18.781 14.0476 19.7355 14.6381 19.9375 15.4738C20.0208 15.8187 20.0208 16.1816 19.9375 16.5265Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path><path d="M3.333 16C3.333 10.029 3.333 7.043 5.188 5.188C7.043 3.333 10.029 3.333 16 3.333C21.971 3.333 24.956 3.333 26.811 5.188C28.666 7.043 28.666 10.029 28.666 16C28.666 21.971 28.666 24.957 26.811 26.812C24.956 28.667 21.971 28.667 16 28.667C10.029 28.667 7.043 28.667 5.188 26.812C3.333 24.957 3.333 21.971 3.333 16Z" stroke="currentColor" stroke-width="1.5"></path><circle cx="27.5" cy="27.5" r="6.667" fill="var(--primary)"></circle><path d="M27.5 24.833V30.167M30.166 27.5H24.833" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
                    </span>
                  )}

                  <input
                    type="file"
                    accept="video/*"
                    ref={(el) => {
                      videoInputRefs.current[i] = el;
                    }}
                    className="hidden"
                    onChange={(e) =>
                      handleVideoUpload(i, e.target.files?.[0] || null)
                    }
                  />
                </div>
              ))}
            </div>
            {/* Divider */}
            {/* <div className="mt-6 text-center text-xs text-slate-400">
              Or Link
            </div> */}
            <div className="mt-6 flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"></div><span className="text-sm font-medium text-gray-400">Or Link</span><div className="flex-1 h-px bg-gray-200"></div></div>
            {/* Links Input */}
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="relative" key={index}>
                  <input
                    key={index}
                    type="text"
                    placeholder="Link"
                    className=" relative h-[3rem] px-12 w-full rounded-full border border-slate-200 bg-white text-sm outline-none placeholder:text-slate-400 text-black focus:border-[#b493ff] focus:shadow-[0_0_0_3px_rgba(180,147,255,0.2)]"
                    onChange={(e) =>
                      handleFeaturedLinkChange(index, e.target.value)
                    }
                  />
                  <svg viewBox="0 0 24 24" w-dth="20" height="20" className="absolute top-[30%] left-5" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M10.0464 14C8.54044 12.4882 8.67609 9.90087 10.3494 8.22108L15.197 3.35462C16.8703 1.67483 19.4476 1.53865 20.9536 3.05046C22.4596 4.56228 22.3239 7.14956 20.6506 8.82935L18.2268 11.2626" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> <path d="M13.9536 10C15.4596 11.5118 15.3239 14.0991 13.6506 15.7789L11.2268 18.2121L8.80299 20.6454C7.12969 22.3252 4.55237 22.4613 3.0464 20.9495C1.54043 19.4377 1.67609 16.8504 3.34939 15.1706L5.77323 12.7373" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> </g></svg>

                </div>

              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Button */}
            {/* <button
              type="button"
              onClick={handlePrimaryAction}
              className="mt-6 h-[3.2rem] w-full rounded-full bg-gradient-to-r from-[#7b4dff] to-[#6a5cff] text-white font-semibold shadow-lg"
            >
              Skip &gt;
            </button> */}
          </div>
        )}
        {step === 13 ? (
          <div className="space-y-3">
            {featuredLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
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
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddFeaturedLink}
                disabled={featuredLinks.length >= MAX_FEATURED_LINKS}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:py-3 sm:text-sm"
              >
                Add another link
              </button>
              <span className="text-xs text-slate-500 sm:text-sm">
                Up to {MAX_FEATURED_LINKS} links
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className={` ${step !== 1 && step !== 2 && step !== 12 ? "md:fixed md:bottom-32 md:left-1/2 md:-translate-x-1/2 w-full max-w-[40rem]" : ""} mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700`}>
          {error}
        </div>
      ) : null}

      {success && !isProfileIntroStep ? (
        <div className=" mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className={cn(isProfileIntroStep ? `mx-auto ${step === 12 ? "mt-8" : "mt-[7]"}  w-full` : "")}>
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={isWorking}
          className={cn(
            "mt-4 h-12 w-full px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-base",
            isProfileIntroStep && step !== 12
              ? "md:fixed h-14 md:bottom-10 md:left-1/2 md:-translate-x-1/2 max-w-[40rem] rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              : "rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50",
          )}
        >
          {isWorking
            ? step === 12
              ? "Finishing..."
              : "Please wait..."
            : step === 1
              ? "Create account"
              : step === 2
                ? "Verify code"
                : step === 3
                  ? "Continue >"
                  : step === 9
                    ? `I commit to ${monthlyVideoSliderValue} posts >`
                    : step === 12
                      ? "Open dashboard"
                      : "Continue"}
        </button>
      </div>

      {/* <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1 || isWorking || (isOtpVerified && step === 3)}
          className="text-xs font-medium text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          Back
        </button>
      </div> */}

      {step === 1 && <div className="mt-4 border-t border-slate-400 pt-4 text-center text-[11px] leading-5 text-slate-500 sm:text-xs">
        <p>
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className="text-purple-600 transition hover:text-purple-500 font-medium"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-purple-600 transition hover:text-purple-500 font-medium"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-2">
          Already have an account?{" "}
          <Link
            href="/login?role=creator"
            className="font-medium text-purple-600 transition hover:text-purple-500"
          >
            Sign in
          </Link>
        </p>
      </div>}
    </section>
  );
}
