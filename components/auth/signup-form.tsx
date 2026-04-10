"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { SignupRoleTabs } from "./signup-role-tabs";

const OTP_LENGTH = 6;
const BRAND_SETUP_TOTAL_SUBSTEPS = 3;
const DEFAULT_BRAND_HEADLINE = "Brand partnerships lead";
const inputClassName =
  "h-11 w-full rounded-xl border border-gray-300 bg-[#fbf8fe] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-600 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-base";

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

function UploadCloudIcon() {
  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-upload w-6 h-6 text-gray-400 mx-auto" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
      <p className="text-xs">Logo</p>
    </>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.75 9a2.25 2.25 0 1 1 3.9 1.5c-.7.73-1.65 1.2-1.65 2.25" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function SparklesWandIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" color="currentColor" className="w-8 h-8 text-purple-600"><path d="M14 12.6483L16.3708 10.2775C16.6636 9.98469 16.81 9.83827 16.8883 9.68032C17.0372 9.3798 17.0372 9.02696 16.8883 8.72644C16.81 8.56849 16.6636 8.42207 16.3708 8.12923C16.0779 7.83638 15.9315 7.68996 15.7736 7.61169C15.473 7.46277 15.1202 7.46277 14.8197 7.61169C14.6617 7.68996 14.5153 7.83638 14.2225 8.12923L11.8517 10.5M14 12.6483L5.77754 20.8708C5.4847 21.1636 5.33827 21.31 5.18032 21.3883C4.8798 21.5372 4.52696 21.5372 4.22644 21.3883C4.06849 21.31 3.92207 21.1636 3.62923 20.8708C3.33639 20.5779 3.18996 20.4315 3.11169 20.2736C2.96277 19.973 2.96277 19.6202 3.11169 19.3197C3.18996 19.1617 3.33639 19.0153 3.62923 18.7225L11.8517 10.5M14 12.6483L11.8517 10.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M19.5 2.5L19.3895 2.79873C19.2445 3.19044 19.172 3.38629 19.0292 3.52917C18.8863 3.67204 18.6904 3.74452 18.2987 3.88946L18 4L18.2987 4.11054C18.6904 4.25548 18.8863 4.32796 19.0292 4.47083C19.172 4.61371 19.2445 4.80956 19.3895 5.20127L19.5 5.5L19.6105 5.20127C19.7555 4.80956 19.828 4.61371 19.9708 4.47083C20.1137 4.32796 20.3096 4.25548 20.7013 4.11054L21 4L20.7013 3.88946C20.3096 3.74452 20.1137 3.67204 19.9708 3.52917C19.828 3.38629 19.7555 3.19044 19.6105 2.79873L19.5 2.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"></path><path d="M19.5 12.5L19.3895 12.7987C19.2445 13.1904 19.172 13.3863 19.0292 13.5292C18.8863 13.672 18.6904 13.7445 18.2987 13.8895L18 14L18.2987 14.1105C18.6904 14.2555 18.8863 14.328 19.0292 14.4708C19.172 14.6137 19.2445 14.8096 19.3895 15.2013L19.5 15.5L19.6105 15.2013C19.7555 14.8096 19.828 14.6137 19.9708 14.4708C20.1137 14.328 20.3096 14.2555 20.7013 14.1105L21 14L20.7013 13.8895C20.3096 13.7445 20.1137 13.672 19.9708 13.5292C19.828 13.3863 19.7555 13.1904 19.6105 12.7987L19.5 12.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"></path><path d="M10.5 2.5L10.3895 2.79873C10.2445 3.19044 10.172 3.38629 10.0292 3.52917C9.88629 3.67204 9.69044 3.74452 9.29873 3.88946L9 4L9.29873 4.11054C9.69044 4.25548 9.88629 4.32796 10.0292 4.47083C10.172 4.61371 10.2445 4.80956 10.3895 5.20127L10.5 5.5L10.6105 5.20127C10.7555 4.80956 10.828 4.61371 10.9708 4.47083C11.1137 4.32796 11.3096 4.25548 11.7013 4.11054L12 4L11.7013 3.88946C11.3096 3.74452 11.1137 3.67204 10.9708 3.52917C10.828 3.38629 10.7555 3.19044 10.6105 2.79873L10.5 2.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"></path></svg>
  );
}

function ExtractBrnad() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-sparkles w-4 h-4 mr-2" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
  )
}
function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left w-4 h-4 mr-2" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-right w-4 h-4 ml-2" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M16 21a4 4 0 0 0-8 0" />
      <circle cx="12" cy="11" r="3" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

function BrandTileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 8h.01" />
      <path d="M12 8h4" />
      <path d="M8 12h.01" />
      <path d="M12 12h4" />
      <path d="M8 16h.01" />
      <path d="M12 16h4" />
    </svg>
  );
}

function CreatorTileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <path d="M4 7h16v10H4z" />
      <path d="m10 10 4 2-4 2Z" />
      <path d="M7 4h2" />
      <path d="M15 4h2" />
    </svg>
  );
}

export function SignupForm() {
  const supabase = useMemo(() => createClient(), []);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [storeCurrency, setStoreCurrency] = useState("USD");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtp);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [hasPasswordApplied, setHasPasswordApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [disableVerify, setDisableVerify] = useState(false);
  const otpValue = otpDigits.join("");

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isResendDisabled && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }

    if (resendTimer === 0) {
      setIsResendDisabled(false);
      if (step === 2 && isOtpSent) {
        setDisableVerify(true);
      }
    }

    return () => clearInterval(interval);
  }, [isOtpSent, isResendDisabled, resendTimer, step]);

  useEffect(() => {
    if (step !== 3) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStep(4);
      setSubStep(1);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [step]);

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
      setResendTimer(60);
      setIsResendDisabled(true);
      setDisableVerify(false);
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
          setDisableVerify(false);
          await sendOtp();
        } else {
          setOtpDigits(createEmptyOtp());
          setDisableVerify(true);
        }
      }

      setSuccess("New verification code sent! Please check your inbox.");
      setResendTimer(60);
      setIsResendDisabled(true);
    } catch (submitError) {
      setDisableVerify(false);
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

      const formData = new FormData();
      formData.append("full_name", brandName.trim());
      formData.append("brand_description", brandDescription.trim());
      formData.append("website_url", normalizedWebsite);
      formData.append("store_currency", storeCurrency);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const profileResponse = await fetch("/api/update-brand-profile", {
        method: "POST",
        body: formData,
      });

      const profileResult = (await profileResponse.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!profileResponse.ok) {
        throw new Error(
          profileResult?.error ?? "Unable to save your brand profile.",
        );
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

  function handleStepThreeContinue() {
    resetFeedback();

    if (subStep === 1) {
      const normalizedWebsite = normalizeWebsiteUrl(websiteUrl);

      if (!normalizedWebsite) {
        setError("Enter a valid website link to continue.");
        return;
      }

      setSubStep(2);
      return;
    }

    if (subStep === 2) {
      if (!logoFile) {
        setError("Brand logo is required.");
        return;
      }
      if (!brandName.trim()) {
        setError("Brand name is required.");
        return;
      }

      setSubStep(3);
    }
  }

  function handleLogoSelection(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      setLogoFile(null);
      return;
    }

    setLogoFile(nextFile);
  }

  function renderStepThreeCard() {
    return (
      <div className="space-y-7">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Set Up Your Brand
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Complete these steps to get your brand ready
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-[#f8f8fb] px-4 py-2 text-xs font-medium text-slate-500 shadow-sm"
            >
              <HelpIcon />
              Need help?
            </button>
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-900">{subStep}/3</span>
              <span>
                {subStep === 1
                  ? "Website"
                  : subStep === 2
                    ? "Brand Details"
                    : "Team"}
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-purple-700 to-purple-500 transition-all duration-300"
                style={{
                  width: `${(subStep / BRAND_SETUP_TOTAL_SUBSTEPS) * 100}%`,
                }}
              >
                <span className="absolute right-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-white bg-purple-600" />
              </div>
            </div>
          </div>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
          {subStep === 1 ? (
            <div className="space-y-6 px-1 py-3">
              <div className="space-y-2 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6e9ff] text-[#a020f0]">
                  <SparklesWandIcon />
                </div>
                <h3 className="pt-1 text-[1.7rem] font-semibold tracking-tight text-slate-950">
                  Enter Your Website
                </h3>
                <p className="text-sm leading-6 text-slate-500">
                  We&apos;ll use AI to extract your brand information
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://yourbrand.com"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 shadow-[0_8px_24px_rgba(15,23,42,0.04)] focus:border-[#7c1fff] focus:shadow-[0_0_0_4px_rgba(124,31,255,0.12)]"
                />
              </div>

              <button
                type="button"
                onClick={handleStepThreeContinue}
                className="flex h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,_#c084fc,_#d946ef)] text-sm font-semibold text-white transition hover:brightness-105"
              >
                <ExtractBrnad />
                Extract Brand Info
              </button>

              <p className="pt-1 text-center text-sm text-slate-400">Skip</p>
            </div>
          ) : null}

          {subStep === 2 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-[1.7rem] font-semibold tracking-tight text-slate-950">
                  Brand Details
                </h3>
                <p className="text-sm leading-5 text-slate-500">
                  Enter your brand information
                </p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoSelection}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-[#fbfbfd] text-slate-400 transition hover:border-slate-400 hover:text-slate-500"
                >
                  <UploadCloudIcon />
                </button>
                {/* <span className="mt-2 text-xs text-slate-400">Logo</span> */}
                <span className="mt-2 text-xs text-slate-400">
                  {logoFile ? logoFile.name : "Required *"}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  placeholder="Your Brand Name"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7c1fff] focus:shadow-[0_0_0_4px_rgba(124,31,255,0.12)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">
                  Description (Optional)
                </label>
                <textarea
                  value={brandDescription}
                  onChange={(event) => setBrandDescription(event.target.value)}
                  maxLength={200}
                  placeholder="Brief description of your brand..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7c1fff] focus:shadow-[0_0_0_4px_rgba(124,31,255,0.12)]"
                />
                <p className="text-xs text-slate-400">
                  {brandDescription.length}/200
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">
                  Store Currency
                </label>
                <select
                  value={storeCurrency}
                  onChange={(event) => setStoreCurrency(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#f8f8fb] px-4 text-sm text-slate-900 outline-none transition focus:border-[#7c1fff] focus:shadow-[0_0_0_4px_rgba(124,31,255,0.12)]"
                >
                  <option value="USD">US USD</option>
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
                <p className="text-xs text-slate-400">
                  The currency your store operates in. Defaults to USD.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setSubStep(1);
                  }}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-[#f8f8fb] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                >
                  <ArrowLeftIcon />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleStepThreeContinue}
                  className="inline-flex items-center rounded-full bg-[linear-gradient(90deg,_#7c1fff,_#c026ff)] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  Next
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          ) : null}

          {subStep === 3 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-[1.7rem] font-semibold tracking-tight text-slate-950">
                  Invite Team Members
                </h3>
                <p className="text-sm leading-5 text-slate-500">
                  Optional: Add team members to help manage your brand
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-base font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#e35d5b]">
                      <MailIcon />
                    </span>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="roefiek@hotmail.com"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7c1fff] focus:shadow-[0_0_0_4px_rgba(124,31,255,0.12)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-base font-semibold text-slate-700">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-[#f8f8fb] px-4 text-sm text-slate-900 outline-none transition focus:border-[#7c1fff] focus:shadow-[0_0_0_4px_rgba(124,31,255,0.12)]"
                  >
                    <option value="Member">Select role</option>
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-[#f8f8fb] text-sm font-medium text-slate-400 transition hover:text-slate-600"
              >
                <UserPlusIcon />
                Add Team Member
              </button>

              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setSubStep(2);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8f8fb] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                >
                  <ArrowLeftIcon />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => void handleCompleteSignup()}
                  disabled={isWorking}
                  className="rounded-full bg-[linear-gradient(90deg,_#7c1fff,_#c026ff)] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isWorking ? "Finishing..." : "Complete Setup"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderWelcomeBridge() {
    return (
      <div className=" px-5 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto flex max-w-[40rem] flex-col items-center text-center">
          {/* <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[#5b3df5] shadow-[0_10px_30px_rgba(91,61,245,0.14)]">
            <UploadCloudIcon />
          </div> */}

          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Welcome to CIRCL!
          </h2>

          <div className="mt-6 grid w-full gap-6 sm:grid-cols-2">
            <div className="flex gap-2 rounded-2xl border border-white/80 bg-white px-4 py-4 text-left shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
              <div className="mb-3 flex h-11 w-11 text-4xl items-center justify-center rounded-xl text-slate-800">
                <BrandTileIcon />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-950">
                  I&apos;m a Brand
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  I want to add my brand to CIRCL to supercharge our creator
                  program
                </p>
              </div>

            </div>

            <div className="flex gap-2 rounded-2xl border border-white/80 bg-white px-4 py-4 text-left shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-slate-800">
                <CreatorTileIcon />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-950">
                  I&apos;m a Creator
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  I want to discover brands to work with and make money with my
                  content
                </p>
              </div>

            </div>
          </div>

          <button
            type="button"
            className="mt-7 rounded-xl bg-[linear-gradient(90deg,_#c084fc,_#f472b6)] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(244,114,182,0.2)]"
          >
            Get Started
          </button>

          <div className="mt-5 flex items-center gap-5 text-xs">
            <button type="button" className="text-[#8b5cf6] underline">
              Chat with us
            </button>
            <button type="button" className="text-slate-500 underline">
              Return home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={`rounded-[1.5rem] py-1 ${(step === 1 || step === 2) ? "max-w-[29rem]" : "max-w-[50rem]"}   mx-auto`}>
      {step === 1 ? (
        <div className="space-y-4 ">
          <div className="space-y-2 text-center">
            <h1 className="font-display text-[1.8rem] font-semibold tracking-tight text-slate-950 sm:text-[2.1rem] capitalize">
              Create your brand account
            </h1>
            <p className="mx-auto max-w-[26rem] text-xs leading-5 text-slate-500 sm:text-sm">
              Launch your workspace and start posting campaigns faster.
            </p>
          </div>

          <div className="flex justify-center">
            <SignupRoleTabs activeRole="brand" className="max-w-[28.90rem]" />
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
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
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                Email Verification
              </h2>
              <p className="text-sm text-slate-500">
                Enter the verification code sent to your email
              </p>
            </div>
            <div className="space-y-2 mb-2">
              <div className="flex justify-center gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpInputRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleOtpDigitChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    className="h-12 w-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-[#076BD2] focus:shadow-[0_0_0_4px_rgba(7,107,210,0.12)]"
                  />
                ))}
              </div>

              <p className="text-xs text-slate-400">
                Enter the 6-digit code from your email
              </p>
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
              onClick={() => void handleVerifyOtpAndContinue()}
              disabled={isWorking || disableVerify}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
            >
              {isWorking ? "Verifying..." : "Verify Account"}
            </button>

            <button
              type="button"
              onClick={() => void handleResendOtp()}
              disabled={isResendDisabled || isWorking}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
            >
              {isResendDisabled
                ? `Send new code in ${resendTimer}s`
                : isWorking
                  ? "Sending..."
                  : "Send new code"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-10 w-full rounded-xl border border-slate-300 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Back to signup
            </button>

            <p className="text-xs text-slate-500">
              Didn&apos;t receive the code? Check your spam folder or <span className="text-purple-600 hover:text-purple-500 font-medium">contact support</span>
            </p>
          </div>
        ) : null}

        {step === 3 ? renderWelcomeBridge() : null}

        {step === 4 ? renderStepThreeCard() : null}
      </div>

      {step === 1 && error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {step === 1 && success ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-4 flex items-center gap-x-2">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(event) => setIsChecked(event.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#076BD2] focus:ring-[#076BD2]"
          />
          <p className="my-2">
            I agree to the{" "}
            <Link
              href="/terms"
              className="text-purple-600 hover:text-purple-500 underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-purple-600 hover:text-purple-500 underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      ) : null}

      {step === 1 ? (
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={isWorking || !isChecked}
          className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(15,23,42,0.16)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
        >
          {isWorking ? "Please wait..." : "Create account"}
        </button>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 text-center text-[11px] leading-5 text-purple-600 font-medium sm:text-base">
          <p className="mt-2">
            Already have an account?{" "}
            <Link
              href="/login?role=brand"
              className="font-medium text-purple-600 transition hover:text-purple-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      ) : null}
    </section>
  );
}
