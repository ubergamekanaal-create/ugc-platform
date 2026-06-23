import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { storefrontDomain } = await request.json();

    const admin = createAdminClient();
    if (!admin) {
        return NextResponse.json(
            { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
            { status: 503 },
        );
    }
    const { data: existing } = await admin
        .from("brand_store_connections")
        .select("id")
        .eq("brand_id", user.id)
        .eq("provider", "headless_shopify")
        .maybeSingle();
    let result;
    let error;

    if (existing) {
        ({ data: result, error } = await admin
            .from("brand_store_connections")
            .update({
                storefront_domain: storefrontDomain,
            })
            .eq("id", existing.id)
            .select());
    } else {
        ({ data: result, error } = await admin
            .from("brand_store_connections")
            .insert({
                brand_id: user.id,
                provider: "headless_shopify",
                storefront_domain: storefrontDomain,
                store_url: null,
                store_domain: null,
                status: "connected",
            })
            .select());
    }
    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    return NextResponse.json({
        success: true,
        connection: result,
    });
}