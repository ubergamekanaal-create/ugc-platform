"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/shared/brand-mark";
type InviteData = {
    id: string;
    email: string;
    role?: string;
};

const primaryButtonClassName =
    "inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(7,107,210,0.18)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_48px_rgba(7,107,210,0.22)]";

const secondaryButtonClassName =
    "inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";

const infoPanelClassName =
    "rounded-[24px] border p-5";

const inviteGradientButtonClassName =
    "inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white transition hover:translate-y-[-1px]";

const authInputClassName =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-black outline-none transition focus:border-blue-300 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]";

function CheckCircleIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-6 w-6"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
    );
}

function AlertCircleIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-6 w-6"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
        </svg>
    );
}

function SparklesIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-6 w-6"
        >
            <path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
            <path d="M19 3v4" />
            <path d="M21 5h-4" />
            <path d="M4 17v2" />
            <path d="M5 18H3" />
        </svg>
    );
}

function SpinnerIcon() {
    return (
        <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400" />
            <div className="relative rounded-full bg-white p-2.5 text-blue-600">
                <SparklesIcon />
            </div>
        </div>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {label}
            </p>
            <p className="mt-1 break-all text-sm font-medium text-slate-800">
                {value}
            </p>
        </div>
    );
}

function InviteMonogram() {
    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-xl font-bold text-white">
            C
        </div>
    );
}

export default function AcceptInvitePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Accepting your invitation...");
    const [error, setError] = useState("");
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState("");
    const [invitedEmail, setInvitedEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(58);

    const [authLoading, setAuthLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authMode, setAuthMode] =
        useState<"new" | "existing">("new");
    const otpInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setError("Invalid invitation link");
            return;
        }

        void acceptInvite();
    }, [token]);

    useEffect(() => {
        if (!otpSent || resendTimer <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setResendTimer((current) => {
                if (current <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [otpSent, resendTimer]);

    useEffect(() => {
        if (!otpSent) {
            return;
        }

        window.setTimeout(() => {
            otpInputRef.current?.focus();
        }, 0);
    }, [otpSent]);
    const acceptInvite = async () => {
        try {
            const inviteRes = await fetch(
                `/api/team/invitation-details?token=${token}`,
            );

            const inviteData = (await inviteRes.json()) as {
                error?: string;
                invite?: InviteData;
            };

            if (!inviteRes.ok || !inviteData.invite) {
                setError(inviteData.error || "Invitation not found");
                return;
            }

            setInvite(inviteData.invite);
            const {
                data: { user },
            } = await supabase.auth.getUser();

            // already logged in
            // if (user) {
            //     router.replace("/dashboard");
            //     return;
            // }
            if (user) {

                const loggedInEmail =
                    user.email?.toLowerCase();

                const invitedEmail =
                    inviteData.invite.email?.toLowerCase();

                // correct account
                if (loggedInEmail === invitedEmail) {
                    router.replace("/dashboard");
                    return;
                }

                // wrong account
                setCurrentUserEmail(user.email || "");
                setInvitedEmail(inviteData.invite.email || "");

                setError("This invitation is not for you");
                return;
            }
            // show auth onboarding
            setError("Unauthorized");

        } catch (acceptInviteError) {
            console.error(acceptInviteError);
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };
    const handleLogout = async () => {
        localStorage.removeItem(
            "last-selected-org-id"
        );
        await fetch("/api/auth/logout", {
            method: "POST",
        });

        window.location.reload();
    };
    const handleExistingUserLogin = async () => {
        try {
            setAuthLoading(true);
            setAuthError("");

            if (!invite?.email) {
                setAuthError("Invitation email missing");
                return;
            }

            if (!password) {
                setAuthError("Password is required");
                return;
            }

            const { error } =
                await supabase.auth.signInWithPassword({
                    email: invite.email,
                    password,
                });

            if (error) {
                setAuthError(error.message);
                return;
            }

            // window.location.reload();
            router.replace("/dashboard");

        } catch (err) {
            console.error(err);
            setAuthError("Unable to sign in");
        } finally {
            setAuthLoading(false);
        }
    };
    const handleSendOtp = async () => {
        try {
            setAuthLoading(true);
            setAuthError("");

            if (!invite?.email) {
                setAuthError("Invitation email missing");
                return;
            }

            if (!fullName.trim()) {
                setAuthError("Full name is required");
                return;
            }

            if (password.length < 6) {
                setAuthError(
                    "Password must be at least 6 characters"
                );
                return;
            }

            if (password !== confirmPassword) {
                setAuthError(
                    "Passwords do not match"
                );
                return;
            }

            const { error } =
                await supabase.auth.signInWithOtp({
                    email: invite.email,
                    options: {
                        shouldCreateUser: true,
                        data: {
                            role: "brand",
                            full_name: fullName,
                            company_name: fullName,
                            headline: "Brand partnerships lead",
                        },
                    },
                });

            if (error) {
                setAuthError(error.message);
                return;
            }

            setOtpSent(true);
            setResendTimer(58);
            setOtp("");

        } catch (err) {
            console.error(err);
            setAuthError("Unable to send verification code");
        } finally {
            setAuthLoading(false);
        }
    };
    const handleResendOtp = async () => {
        if (!invite?.email || resendTimer > 0) {
            return;
        }

        try {
            setResendLoading(true);
            setAuthError("");

            const { error } =
                await supabase.auth.resend({
                    type: "signup",
                    email: invite.email,
                });

            if (error) {
                setAuthError(error.message);
                return;
            }

            setResendTimer(58);
            setOtp("");
            otpInputRef.current?.focus();
        } catch (err) {
            console.error(err);
            setAuthError("Unable to resend the verification code");
        } finally {
            setResendLoading(false);
        }
    };

    const handleBackToSignup = () => {
        setOtpSent(false);
        setOtp("");
        setAuthError("");
        setResendTimer(58);
    };

    const handleVerifyOtp = async () => {
        try {
            setAuthLoading(true);
            setAuthError("");

            if (!invite?.email) {
                setAuthError("Invitation email missing");
                return;
            }

            if (otp.length !== 6) {
                setAuthError(
                    "Enter the 6-digit verification code"
                );
                return;
            }

            let verifyError: Error | null = null;

            for (const type of ["email", "signup"] as const) {

                const result =
                    await supabase.auth.verifyOtp({
                        email: invite.email,
                        token: otp,
                        type,
                    });

                if (!result.error) {
                    verifyError = null;
                    break;
                }

                verifyError = result.error;
            }

            if (verifyError) {
                setAuthError(verifyError.message);
                return;
            }

            const { error: updateError } =
                await supabase.auth.updateUser({
                    password,
                    data: {
                        role: "brand",
                        full_name: fullName,
                        company_name: fullName,
                        headline: "Brand partnerships lead",
                    },
                });

            if (updateError) {
                setAuthError(updateError.message);
                return;
            }
            // window.location.reload();
            router.replace("/brand/brand-setup");
        } catch (err) {
            console.error(err);
            setAuthError("Unable to verify email");
        } finally {
            setAuthLoading(false);
        }
    };
    const isWrongAccount = error === "This invitation is not for you";
    const isUnauthorized =
        error === "Unauthorized";
    // const isSuccess = !loading && !error;
    const isSuccess = false;
    const showStandaloneAuth = !loading && isUnauthorized;
    const showVerificationScreen = showStandaloneAuth && authMode === "new" && otpSent;

    if (showVerificationScreen) {
        return (
            <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.10),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.12),_transparent_28%),linear-gradient(180deg,#fdfbff_0%,#fffefe_44%,#fff8fb_100%)] px-6 py-10 sm:py-14">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-[-8%] top-10 h-56 w-56 rounded-full bg-indigo-200/25 blur-3xl" />
                    <div className="absolute right-[-10%] top-32 h-72 w-72 rounded-full bg-pink-200/25 blur-3xl" />
                    <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-100/20 blur-3xl" />
                </div>

                <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center">
                    <div className="mt-2 text-center">
                        <div className="mx-auto flex w-full max-w-6xl items-start justify-center text-start">
                            <BrandMark href="/" tone="light" />
                        </div>
                    </div>

                    <div className="mt-20 w-full max-w-[448px] text-center">
                        <h1 className="text-[2.7rem] font-black tracking-tight text-slate-950">
                            Email Verification
                        </h1>
                        <p className="mt-3 text-base text-slate-600">
                            Enter the verification code sent to your email
                        </p>

                        <div className="mt-8 relative">
                            <input
                                ref={otpInputRef}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={otp}
                                onChange={(e) =>
                                    setOtp(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                onFocus={(e) => e.target.select()}
                                className="absolute inset-0 opacity-0"
                                aria-label="Email verification code"
                            />

                            <button
                                type="button"
                                onClick={() => otpInputRef.current?.focus()}
                                className="mx-auto flex justify-center gap-2"
                            >
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <span
                                        key={index}
                                        className={`flex h-12 w-12 items-center justify-center rounded-xl border text-lg font-semibold transition sm:h-14 sm:w-14 ${otp[index]
                                            ? "border-blue-300 bg-white text-slate-950"
                                            : "border-slate-200 bg-white/90 text-slate-300"
                                            }`}
                                    >
                                        {otp[index] || ""}
                                    </span>
                                ))}
                            </button>
                        </div>

                        <p className="mt-4 text-sm text-slate-500">
                            Enter the 6-digit code from your email
                        </p>

                        {authError ? (
                            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                {authError}
                            </div>
                        ) : null}

                        <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={authLoading}
                            className={`mt-7 w-full ${inviteGradientButtonClassName}`}
                        >
                            {authLoading
                                ? "Verifying..."
                                : "Verify Account"}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendLoading || resendTimer > 0}
                            className={`mt-6 w-full ${inviteGradientButtonClassName} disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                            {resendLoading
                                ? "Sending..."
                                : resendTimer > 0
                                    ? `Send new code in ${resendTimer}s`
                                    : "Send new code"}
                        </button>

                        <button
                            type="button"
                            onClick={handleBackToSignup}
                            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            Back to signup
                        </button>

                        <p className="mt-7 text-sm text-slate-500">
                            Didn&apos;t receive the code? Check your spam folder or{" "}
                            <Link
                                href="mailto:support@trybe.com"
                                className="font-medium text-blue-600 transition hover:text-blue-600"
                            >
                                contact support
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (showStandaloneAuth) {
        return (
            <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.10),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.12),_transparent_28%),linear-gradient(180deg,#fdfbff_0%,#fffefe_44%,#fff8fb_100%)] px-6 py-10 sm:py-14">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-[-8%] top-10 h-56 w-56 rounded-full bg-indigo-200/25 blur-3xl" />
                    <div className="absolute right-[-10%] top-32 h-72 w-72 rounded-full bg-pink-200/25 blur-3xl" />
                    <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-100/20 blur-3xl" />
                </div>

                <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center">
                    <div className=" text-center">
                        <div className="mx-auto flex w-full max-w-6xl items-start justify-center text-start">
                            <BrandMark href="/" tone="light" />
                        </div>
                    </div>

                    <div className="mt-10 w-full max-w-[448px] rounded-[24px] border border-blue-200 bg-white/70 p-3 backdrop-blur-sm">
                        <div className="flex items-start gap-4">
                            <InviteMonogram />
                            <div className="min-w-0">
                                <p className="text-lg font-semibold text-[#076BD2]">
                                    Team Invitation {invite?.role ? `as ${invite.role}` : ""}
                                </p>
                                <p className="mt-1 text-sm text-[#076BD2]">
                                    This invite is linked to {invite?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 w-full max-w-[448px] rounded-[24px] bg-white/75 p-1 shadow-[0_18px_50px_rgba(15,23,42,0.08)] border border-slate-100 backdrop-blur-sm">
                        <div className="grid grid-cols-2 rounded-[20px]  bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => setAuthMode("new")}
                                className={`flex items-center justify-center rounded-2xl px-4 py-3 text-sm transition ${authMode === "new"
                                    ? "bg-white font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
                                    : "font-medium text-slate-500"
                                    }`}
                            >
                                New User
                            </button>
                            <button
                                type="button"
                                onClick={() => setAuthMode("existing")}
                                className={`flex items-center justify-center rounded-2xl px-4 py-3 text-sm transition ${authMode === "existing"
                                    ? "bg-white font-semibold text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
                                    : "font-medium text-slate-500"
                                    }`}
                            >
                                Existing User
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 w-full max-w-[448px] rounded-[24px] bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] border border-slate-200 backdrop-blur-sm">
                        {authMode === "new" ? (
                            <div className="space-y-4">
                                {!otpSent ? (
                                    <>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Full Name"
                                            className={authInputClassName}
                                        />

                                        <div className="space-y-2">
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                                                {invite?.email}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                This invitation is linked to this email address
                                            </p>
                                        </div>

                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className={authInputClassName}
                                        />

                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm Password"
                                            className={authInputClassName}
                                        />

                                        {authError ? (
                                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                                {authError}
                                            </div>
                                        ) : null}

                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={authLoading}
                                            className={`w-full ${inviteGradientButtonClassName}`}
                                        >
                                            {authLoading
                                                ? "Sending code..."
                                                : "Create Account & Join Team"}
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
                                        {invite?.email}
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        This invitation is linked to this email address
                                    </p>
                                </div>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className={authInputClassName}
                                />

                                <Link
                                    href="/forgot-password"
                                    className="inline-flex text-sm font-medium text-[#076BD2] transition hover:text-[#3B82F6]"
                                >
                                    Forgot your password?
                                </Link>

                                {authError ? (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                        {authError}
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={handleExistingUserLogin}
                                    disabled={authLoading}
                                    className={`w-full ${inviteGradientButtonClassName}`}
                                >
                                    {authLoading
                                        ? "Signing in..."
                                        : "Sign In & Join Team"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f3f7fd_48%,#f8fafc_100%)] px-6 py-12">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[-5%] top-20 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />
                <div className="absolute right-[-8%] top-12 h-56 w-56 rounded-full bg-cyan-100/50 blur-3xl" />
            </div>

            <section className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,251,255,1),rgba(255,255,255,1))] px-6 py-6 sm:px-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Team Invite
                    </div>
                    <div className="mt-4 flex items-start gap-4">
                        <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${loading
                                ? "border-blue-100 bg-blue-50"
                                : isSuccess
                                    ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                                    : "border-rose-100 bg-rose-50 text-rose-500"
                                }`}
                        >
                            {loading ? (
                                <SpinnerIcon />
                            ) : isSuccess ? (
                                <CheckCircleIcon />
                            ) : (
                                <AlertCircleIcon />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">
                                {loading
                                    ? "Joining your team..."
                                    : isSuccess
                                        ? "Welcome to the team"
                                        : "We couldn't accept this invite"}
                            </h1>
                            <p className="max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                                {loading
                                    ? "We're validating the invitation and connecting it to your account."
                                    : isSuccess
                                        ? "Your access is ready. We'll send you into the team workspace in a moment."
                                        : "The invitation needs attention before we can complete the handoff."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                    {invite ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <DetailRow label="Invited Email" value={invite.email} />
                            <DetailRow
                                label="Role"
                                value={invite.role ? invite.role : "Team member"}
                            />
                        </div>
                    ) : null}

                    {loading ? (
                        <div className={`${infoPanelClassName} border-blue-100 bg-blue-50/60`}>
                            <p className="text-sm font-medium text-slate-700">{message}</p>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100">
                                <div className="h-full w-1/2 animate-pulse rounded-full bg-[linear-gradient(90deg,#2563eb,#60a5fa)]" />
                            </div>
                        </div>
                    ) : null}

                    {!loading && error ? (
                        <div className="space-y-4">
                            <div className={`${infoPanelClassName} border-rose-200 bg-rose-50/70`}>
                                <p className="text-sm font-semibold text-rose-600">Invite issue</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    {isUnauthorized
                                        ? "Please sign in with the invited email address to continue."
                                        : error}
                                </p>
                            </div>

                            {isWrongAccount ? (
                                <div className={`${infoPanelClassName} border-slate-200 bg-slate-50/70`}>
                                    <div className="grid gap-3">
                                        <DetailRow
                                            label="Signed In As"
                                            value={currentUserEmail || "Unknown account"}
                                        />
                                        <DetailRow
                                            label="Invite Sent To"
                                            value={invitedEmail || "Unknown recipient"}
                                        />
                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-slate-500">
                                        Switch accounts, then open the same invite link again with the
                                        email that received the invitation.
                                    </p>

                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={handleLogout}
                                            className={primaryButtonClassName}
                                        >
                                            Logout and continue
                                        </button>
                                        <Link
                                            href="/dashboard"
                                            className={secondaryButtonClassName}
                                        >
                                            Back to dashboard
                                        </Link>
                                    </div>
                                </div>
                            ) : null}

                            {!isWrongAccount && !isUnauthorized ? (
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href="/dashboard"
                                        className={primaryButtonClassName}
                                    >
                                        Go to dashboard
                                    </Link>
                                    <Link
                                        href="/"
                                        className={secondaryButtonClassName}
                                    >
                                        Return home
                                    </Link>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </section>
        </main>
    );
}
