"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
type Props = {
    open: boolean;
    onClose: () => void;
    onVerified?: () => void;
    storeUrl: string;
    brandId: string;
    customDomain:string,
    domainVerified:boolean | undefined
};

export function CustomDomainSetupModal({
    open,
    onClose,
    onVerified,
    storeUrl,
    brandId,
    customDomain,
    domainVerified
}: Props) {
    const [step, setStep] = useState(1);

    const cleanStoreUrl = useMemo(() => {
        return storeUrl
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/$/, "");
    }, [storeUrl]);

    const suggestedTrackDomain = `track.${cleanStoreUrl}`;
    const suggestedAnalyticsDomain = `analytics.${cleanStoreUrl}`;

    const [domain, setDomain] = useState("");
    const [domainError, setDomainError] =
        useState("");
    const [isCheckingDns, setIsCheckingDns] =
        useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (open) {
            setDomain(suggestedTrackDomain);
        }
    }, [open, suggestedTrackDomain]);

    useEffect(() => {
  if (!open) return;

  if (customDomain && !domainVerified) {
    setDomain(customDomain);
    setStep(2);
  } else {
    setDomain(suggestedTrackDomain);
    setStep(1);
  }
}, [
  open,
  customDomain,
  domainVerified,
  suggestedTrackDomain,
]);

    if (!open) return null;

    const hostPart = domain.split(".")[0] || "track";
    const handleContinue = async () => {

        try {
            const normalizedDomain = domain
                .trim()
                .toLowerCase();

            if (!isValidSubdomain(normalizedDomain)) {
                setDomainError(
                    "Please enter a valid subdomain like track.brand.com"
                );
                toast.error(
                    "Please enter a valid tracking domain (e.g. track.brand.com)"
                );
                return;
            }
            setIsSubmitting(true);

            const response = await fetch(
                "/api/brands/custom-domain",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        brandId,
                        customDomain: domain,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.cloudflare?.errors[0]?.message || "Something went wrong"
                );
            }
            toast.success(
                "Custom domain configured! Now add the CNAME record to your DNS.",
                {
                    position: "top-right",
                    autoClose: 4000,
                }
            );

            setStep(2);
        } catch (error) {
            console.error(error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to setup custom domain",
                {
                    position: "top-right",
                    autoClose: 4000,
                }
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleCheckDns = async () => {
        try {
            setIsCheckingDns(true);

            const response = await fetch(
                "/api/brands/check-domain",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        brandId,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "DNS verification failed"
                );
            }
            if (data.verified) {
                toast.success(
                    "Custom domain verified successfully!",
                    {
                        position: "top-right",
                        autoClose: 4000,
                    }
                );
                onVerified?.();
                onClose();
                return;
            }

            if (data.dnsErrorType === "INVALID_TARGET") {
                toast.error(
                    data.verificationMessage ||
                    "CNAME points to the wrong target.",
                    {
                        position: "top-right",
                        autoClose: 6000,
                    }
                );
                return;
            }

            if (data.dnsErrorType === "NOT_FOUND") {
                toast.error(
                    "Domain not found or no CNAME record configured.",
                    {
                        position: "top-right",
                        autoClose: 6000,
                    }
                );
                return;
            }

            if (data.sslStatus === "pending_validation") {
                toast.info(
                    "DNS configured successfully. Waiting for SSL validation to complete. Please check again in a few minutes.",
                    {
                        position: "top-right",
                        autoClose: 6000,
                    }
                );
                return;
            }

            toast.info(
                "DNS verification is still in progress.",
                {
                    position: "top-right",
                    autoClose: 6000,
                }
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Verification failed",
                {
                    position: "top-right",
                    autoClose: 4000,
                }
            );
        } finally {
            setIsCheckingDns(false);
        }
    };
    const isValidSubdomain = (value: string) => {
        const domain = value.trim().toLowerCase();

        const regex =
            /^(?!:\/\/)([a-z0-9-]+\.)+[a-z]{2,}$/;

        return regex.test(domain);
    };
    return (
        <div className="fixed inset-0 z-50 mt-0 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl md:rounded-3xl bg-white shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col">
                {/* Header */}
                <div className="border-b border-slate-200 p-4 sm:p-6 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                                Set up custom tracking domain
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                Improve attribution accuracy and bypass ad blockers.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-900 p-1 rounded-lg transition-colors text-lg"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <div className="h-2 rounded-full bg-slate-100 w-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: step === 1 ? "50%" : "100%" }}
                            />
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            Step {step} of 2
                        </p>
                    </div>
                </div>

                {/* Modal Content - Scrollable on small viewports */}
                <div className="overflow-y-auto p-4 sm:p-6 flex-1 min-h-0">
                    {step === 1 && (
                        <div className="space-y-5 sm:space-y-6">
                            <div className="rounded-xl sm:rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                                    Ad blockers block tracking from third-party domains causing
                                    30–40% attribution loss. A custom tracking domain improves
                                    tracking accuracy to 95%+.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">
                                    Custom Tracking Domain
                                </label>

                                <input
                                    value={domain}
                                    placeholder={suggestedTrackDomain}
                                    onChange={(e) => {
                                        setDomain(e.target.value);
                                        setDomainError("");
                                    }}
                                    className="h-11 sm:h-12 w-full rounded-xl sm:rounded-2xl border border-slate-200 px-4 text-sm sm:text-base outline-none focus:border-blue-500 transition-colors"
                                />
                                {domainError && (
                                    <p className="mt-2 text-sm text-red-500">
                                        {domainError}
                                    </p>
                                )}
                                <div className="mt-2 text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-y-1.5">
                                    <span>Suggestion: Use a subdomain like</span>
                                    <button
                                        type="button"
                                        onClick={() => setDomain(suggestedTrackDomain)}
                                        className="mx-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] sm:text-xs text-slate-700 hover:bg-slate-200 transition-colors break-all"
                                    >
                                        {suggestedTrackDomain}
                                    </button>
                                    <span>or</span>
                                    <button
                                        type="button"
                                        onClick={() => setDomain(suggestedAnalyticsDomain)}
                                        className="mx-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] sm:text-xs text-slate-700 hover:bg-slate-200 transition-colors break-all"
                                    >
                                        {suggestedAnalyticsDomain}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                                <h4 className="text-sm font-medium text-blue-900">
                                    What happens next?
                                </h4>

                                <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs sm:text-sm text-blue-800">
                                    <li>You&apos;ll receive DNS instructions</li>
                                    <li>Add the CNAME record</li>
                                    <li>Click Check DNS</li>
                                    <li>Once verified, tracking becomes active</li>
                                </ol>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleContinue}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    {isSubmitting
                                        ? "Setting up..."
                                        : "Continue to DNS Setup"}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="rounded-xl sm:rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-xs sm:text-sm text-blue-800">
                                    Add the following DNS record to your DNS provider.
                                </p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <h4 className="text-sm font-medium text-slate-900">
                                        DNS Configuration
                                    </h4>

                                    <button
                                        onClick={() =>
                                            navigator.clipboard.writeText("proxy.meetcircl.com")
                                        }
                                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>

                                <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="border-b sm:border-b-0 pb-2 sm:pb-0 border-slate-100">
                                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Type</p>
                                        <p className="font-mono text-sm sm:text-base font-semibold text-slate-800 mt-0.5">CNAME</p>
                                    </div>

                                    <div className="border-b sm:border-b-0 pb-2 sm:pb-0 border-slate-100">
                                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Name</p>
                                        <p className="font-mono text-sm sm:text-base font-semibold text-slate-800 mt-0.5 break-all">{hostPart}</p>
                                    </div>

                                    <div className="border-b sm:border-b-0 pb-2 sm:pb-0 border-slate-100">
                                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Value</p>
                                        <p className="font-mono text-sm sm:text-base font-semibold text-slate-800 mt-0.5 break-all">proxy.meetcircl.com</p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">TTL</p>
                                        <p className="font-mono text-sm sm:text-base font-semibold text-slate-800 mt-0.5">3600</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <p className="text-xs sm:text-sm font-medium text-amber-800">
                                    Domain not verified yet
                                </p>
                                <p className="mt-1 text-xs sm:text-sm text-amber-700">
                                    DNS propagation can take between 1–60 minutes.
                                </p>
                            </div>
                            <div className="rounded-xl sm:rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                                <h4 className="text-sm font-semibold text-blue-900 mb-4">
                                    Instructions:
                                </h4>

                                <ol className="space-y-3 text-xs sm:text-sm text-blue-800">
                                    <li>
                                        1. Log in to your DNS provider (GoDaddy, Cloudflare, etc.)
                                    </li>

                                    <li>
                                        2. Navigate to DNS Management for your domain
                                    </li>

                                    <li>
                                        3. Click &quot;Add Record&quot; or &quot;Add DNS Record&quot;
                                    </li>

                                    <li>
                                        4. Select <span className="font-semibold">&quot;CNAME&quot;</span> as the
                                        record type
                                    </li>

                                    <li>
                                        5. Enter the Name:
                                        <span className="ml-2 rounded bg-white px-2 py-1 font-mono text-blue-700 border border-blue-100">
                                            {hostPart}
                                        </span>
                                    </li>

                                    <li>
                                        6. Enter the Value:
                                        <span className="ml-2 rounded bg-white px-2 py-1 font-mono text-blue-700 border border-blue-100 break-all inline-block">
                                            proxy.meetcircl.com
                                        </span>
                                    </li>

                                    <li>
                                        7. Set TTL to{" "}
                                        <span className="font-semibold">3600 seconds</span>
                                        {" "} (or leave as default)
                                    </li>

                                    <li>
                                        8. Save the record
                                    </li>

                                    <li>
                                        9. Wait 1–60 minutes for DNS propagation, then click{" "}
                                        <span className="font-semibold">&quot;Check DNS&quot;</span>
                                    </li>
                                </ol>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors order-3 sm:order-1 text-center"
                                >
                                    ← Back
                                </button>

                                <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                                    {/* <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-center">
                                        Skip for now
                                    </button> */}

                                    <button
                                        onClick={handleCheckDns}
                                        disabled={isCheckingDns}
                                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm text-center disabled:opacity-50"
                                    >
                                        {isCheckingDns
                                            ? "Checking..."
                                            : "Check DNS"}
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}