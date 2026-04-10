"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CreatorSignupFlow } from "@/components/auth/creator-signup-flow";

export default function OnboardingPage() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("creator_profiles")
                .select("onboarding_completed_at, bio")
                .eq("user_id", user?.id)
                .single();

            if (profile?.onboarding_completed_at) {
                router.push("/dashboard");
                return;
            }

            setLoading(false);
        }

        checkUser();
    }, []);

    // if (loading) return <div>Loading...</div>;

    return (
        <div className="relative bg-[#fff3ef] h-screen overflow-y-scroll pt-8 pb-4 px-4 sm:px-0">
            <CreatorSignupFlow initialStep={3} />
        </div>
    );
}