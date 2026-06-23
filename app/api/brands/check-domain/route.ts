import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns/promises";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CLOUDFLARE_ZONE_ID =
    process.env.CLOUDFLARE_ZONE_ID!;

const CLOUDFLARE_API_TOKEN =
    process.env.CLOUDFLARE_API_TOKEN!;

export async function POST(req: NextRequest) {
    try {
        const { brandId } = await req.json();

        if (!brandId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Brand id is required",
                },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const admin = createAdminClient();
        if (!admin) {
            return NextResponse.json(
                { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
                { status: 503 },
            );
        }
        const { data: brand, error } = await supabase
            .from("brands")
            .select(
                "id,user_id, custom_domain, custom_domain_id, domain_verified"
            )
            .eq("id", brandId)
            .single();

        if (error || !brand) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Brand not found",
                },
                { status: 404 }
            );
        }
        const userId = brand.user_id;
        if (!brand.custom_domain_id) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Custom domain has not been configured yet",
                },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${brand.custom_domain_id}`,
            {
                headers: {
                    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            return NextResponse.json(
                {
                    success: false,
                    cloudflare: data,
                },
                { status: 400 }
            );
        }

        const sslStatus =
            data?.result?.ssl?.status;

        const verified =
            sslStatus === "active";
        let dnsErrorType: string | null = null;
        let verificationMessage: string | null = null;

        const expectedTarget =
            "proxy.meetcircl.com";

        try {
            const records = await dns.resolveCname(
                brand.custom_domain
            );

            const actualTarget = records?.[0];

            if (
                actualTarget &&
                actualTarget.toLowerCase() !==
                expectedTarget.toLowerCase()
            ) {
                dnsErrorType = "INVALID_TARGET";

                verificationMessage =
                    `CNAME points to ${actualTarget}, expected ${expectedTarget}`;
            }
        } catch {
            dnsErrorType = "NOT_FOUND";

            verificationMessage =
                "Domain not found or no CNAME record configured";
        }
        // const verificationErrors =
        //     data?.result?.ownership_verification_errors ??
        //     [];

        // const verificationMessage =
        //     verificationErrors?.[0]?.message ?? null;

        // let dnsErrorType: string | null = null;

        // if (verificationMessage) {
        //     if (
        //         verificationMessage
        //             .toLowerCase()
        //             .includes("expected")
        //     ) {
        //         dnsErrorType = "INVALID_TARGET";
        //     } else if (
        //         verificationMessage
        //             .toLowerCase()
        //             .includes("not found")
        //     ) {
        //         dnsErrorType = "NOT_FOUND";
        //     }
        // }
        // if (verified) {
        //     await supabase
        //         .from("brands")
        //         .update({
        //             domain_verified: true,
        //             domain_verified_at:
        //                 new Date().toISOString(),
        //         })
        //         .eq("id", brandId);
        // }

        if (verified && !brand.domain_verified) {
            await supabase
                .from("brands")
                .update({
                    domain_verified: true,
                    domain_verified_at:
                        new Date().toISOString(),
                })
                .eq("id", brandId);

            // Get pixel settings
            const { data: analytics } = await supabase
                .from("brand_store_analytics_settings")
                .select(
                    "public_tracking_token, web_pixel_id"
                )
                .eq("brand_id", userId)
                .single();

            // Get Shopify connection
            const { data: connections } = await supabase
                .from("brand_store_connections")
                .select(
                    "id,store_domain, access_token,provider"
                )
                .eq("brand_id", userId)
                // .eq("provider", "shopify")
                // .single();
                .in("provider", [
                    "shopify",
                    "headless_shopify",
                ])
            // .maybeSingle();
            const shopifyConnection =
                connections?.find(
                    (item) => item.provider === "shopify"
                );
            const trackingToken =
                analytics?.public_tracking_token;

            const webPixelId =
                analytics?.web_pixel_id;
            if (
                shopifyConnection &&
                trackingToken &&
                webPixelId &&
                shopifyConnection.store_domain &&
                shopifyConnection.access_token
            ) {
                const mutation = `
            mutation webPixelUpdate(
                $id: ID!,
                $webPixel: WebPixelInput!
            ) {
                webPixelUpdate(
                    id: $id,
                    webPixel: $webPixel
                ) {
                    webPixel {
                        id
                        settings
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

                const variables = {
                    id: webPixelId,
                    webPixel: {
                        settings: JSON.stringify({
                            trackingToken,
                            accountID: trackingToken,
                            customDomain:
                                brand.custom_domain,
                        }),
                    },
                };

                const shopifyResponse =
                    await fetch(
                        `https://${shopifyConnection.store_domain}/admin/api/2025-10/graphql.json`,
                        {
                            method: "POST",
                            headers: {
                                "X-Shopify-Access-Token":
                                    shopifyConnection.access_token,
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                query: mutation,
                                variables,
                            }),
                        }
                    );

                const shopifyData =
                    await shopifyResponse.json();

                if (
                    shopifyData?.data
                        ?.webPixelUpdate
                        ?.userErrors?.length
                ) {
                    console.error(
                        "WEB PIXEL UPDATE ERROR:",
                        shopifyData.data
                            .webPixelUpdate.userErrors
                    );
                } else {
                    console.log(
                        "WEB PIXEL UPDATED:",
                        shopifyData.data
                            .webPixelUpdate.webPixel
                    );
                }
            }
            if (!brand.custom_domain) {
                throw new Error(
                    "Custom domain is missing."
                );
            }
            if (!connections?.length) {
                throw new Error("No Shopify connections found.");
            }
            const webhookUri =
                `https://${brand.custom_domain}/api/integrations/store/webhooks/shopify?connectionId=${connections[0].id}`;
            const connectionIds =
                connections?.map(
                    (connection) => connection.id
                ) ?? [];

            for (const connection of connections ?? []) {
                try {
                    const { data: webhooks, error: webhooksError } =
                        await admin
                            .from("shopify_webhook_subscriptions")
                            .select("*")
                            .eq("connection_id", connection.id);
                    if (webhooksError) {
                        console.error(
                            "[WEBHOOK_FETCH_ERROR]",
                            webhooksError.message
                        );
                        continue;
                    }

                    if (!webhooks?.length) {
                        continue;
                    }

                    for (const webhook of webhooks) {
                        try {
                            const mutation = `
                                    mutation webhookSubscriptionUpdate(
                                        $id: ID!,
                                        $webhookSubscription: WebhookSubscriptionInput!
                                    ) {
                                        webhookSubscriptionUpdate(
                                        id: $id,
                                        webhookSubscription: $webhookSubscription
                                        ) {
                                        webhookSubscription {
                                            id
                                            topic
                                            uri
                                        }
                                        userErrors {
                                            field
                                            message
                                        }
                                        }
                                    }
                                `;

                            const response = await fetch(
                                `https://${connection.store_domain}/admin/api/2026-01/graphql.json`,
                                {
                                    method: "POST",
                                    headers: {
                                        "X-Shopify-Access-Token":
                                            connection.access_token,
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        query: mutation,
                                        variables: {
                                            id: webhook.shopify_webhook_id,
                                            webhookSubscription: {
                                                uri: webhookUri,
                                            },
                                        },
                                    }),
                                }
                            );

                            const result = await response.json();
                            if (result?.errors?.length) {
                                console.error(
                                    "[WEBHOOK_GRAPHQL_ERROR]",
                                    result.errors
                                );
                                continue;
                            }

                            const userErrors =
                                result?.data?.webhookSubscriptionUpdate?.userErrors ?? [];

                            if (userErrors.length) {
                                console.error(
                                    "[WEBHOOK_UPDATE_ERROR]",
                                    webhook.shopify_webhook_id,
                                    userErrors
                                );
                                continue;
                            }

                            const { error: updateWebhookError } =
                                await admin
                                    .from("shopify_webhook_subscriptions")
                                    .update({
                                        uri: webhookUri,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq("id", webhook.id);

                            if (updateWebhookError) {
                                console.error(
                                    "[WEBHOOK_DB_UPDATE_ERROR]",
                                    updateWebhookError.message
                                );
                            }
                        } catch (error) {
                            console.error(
                                "[WEBHOOK_UPDATE_EXCEPTION]",
                                webhook.shopify_webhook_id,
                                error
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        "[WEBHOOK_CONNECTION_ERROR]",
                        connection.id,
                        error
                    );
                }
            }
        }
        if (!verified) {
            return NextResponse.json({
                success: true,
                verified: false,
                sslStatus,
                dnsErrorType,
                verificationMessage,
                statusMessage:
                    dnsErrorType
                        ? null
                        : "DNS propagation is still in progress",
            });
        }
        // return NextResponse.json({
        //     success: true,
        //     verified,
        //     sslStatus,
        // });
        return NextResponse.json({
            success: true,
            verified,
            sslStatus,
            dnsErrorType,
            verificationMessage,
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