import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CLOUDFLARE_ZONE_ID =
    process.env.CLOUDFLARE_ZONE_ID!;

const CLOUDFLARE_TOKEN =
    process.env.CLOUDFLARE_API_TOKEN!;

export async function POST(req: NextRequest) {
    if (!CLOUDFLARE_TOKEN || !CLOUDFLARE_ZONE_ID) {
        return NextResponse.json(
            {
                success: false,
                message: "Cloudflare configuration missing",
            },
            { status: 500 }
        );
    }
    try {
        const body = await req.json();

        const {
            brandId,
            customDomain,
        } = body;

        if (!brandId || !customDomain) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing required fields",
                },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Update brand table
        // const { error: brandError } = await supabase
        //     .from("brands")
        //     .update({
        //         custom_domain: customDomain,
        //         domain_verified: false,
        //     })
        //     .eq("id", brandId);

        // if (brandError) {
        //     return NextResponse.json(
        //         {
        //             success: false,
        //             message: brandError.message,
        //         },
        //         { status: 400 }
        //     );
        // }

        // Cloudflare API
        const normalizedDomain = customDomain
            .trim()
            .toLowerCase();
        const { data: existingDomain } = await supabase
            .from("brands")
            .select("id")
            .eq("custom_domain", normalizedDomain)
            .neq("id", brandId)
            .maybeSingle();

        if (existingDomain) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This domain is already in use",
                },
                { status: 400 }
            );
        }
        const cfResponse = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
                },
                body: JSON.stringify({
                    hostname: normalizedDomain,
                    ssl: {
                        method: "http",
                        type: "dv",
                    },
                    settings: {
                        "min_tls_version": "1.0",
                        "http2": "on",
                        "tls_1_3": "on"
                    }
                }),
            }
        );

        const cfData = await cfResponse.json();
        if (!cfResponse.ok || !cfData.success) {
            return NextResponse.json(
                {
                    success: false,
                    cloudflare: cfData,
                },
                { status: 400 }
            );
        }

        const customDomainId = cfData.result.id;

        const { error: brandError } = await supabase
            .from("brands")
            .update({
                custom_domain: customDomain,
                custom_domain_id: customDomainId,
                domain_verified: false,
            })
            .eq("id", brandId);

        if (brandError) {
            return NextResponse.json(
                {
                    success: false,
                    message: brandError.message,
                },
                { status: 400 }
            );
        }
        return NextResponse.json({
            success: true,
            customDomain,
            customDomainId,
            sslStatus: cfData.result.ssl?.status,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}