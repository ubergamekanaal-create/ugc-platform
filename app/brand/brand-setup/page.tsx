"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignupForm } from "@/components/auth/signup-form";
import { GlobalInviteModal } from "@/components/creators/global-invite-modal";


export default function BrandSetupPage() {
    const supabase = createClient();

    const router = useRouter();

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        async function checkUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const {
                data: brand,
                error,
            } = await supabase
                .from("brands")
                .select(
                    "onboarding_completed_at"
                )
                .eq("user_id", user.id)
                .maybeSingle();

            if (
                brand?.onboarding_completed_at
            ) {

                router.replace("/dashboard");

                return;
            }

            setLoading(false);
        }

        checkUser();
    }, [router, supabase]);

    if (loading) {
        return null;
    }

    return (
        <div className="relative bg-[#ffffff] min-h-screen overflow-y-auto pt-8 pb-4 px-4 sm:px-0">
            <GlobalInviteModal />
            <SignupForm
                initialStep={4}
            />
        </div>
    );
}