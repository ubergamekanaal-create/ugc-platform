import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchShopifyCatalog } from "@/lib/integrations/shopify";

function getBaseUrl(req: Request) {
    return process.env.FRONTEND_URL || new URL(req.url).origin;
}
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const code = searchParams.get("code");
        const shop = searchParams.get("shop");
        const stateParam = searchParams.get("state");

        if (!code || !shop || !stateParam) {
            return NextResponse.json({ error: "Missing params" }, { status: 400 });
        }

        let brandId: string;

        try {
            const state = JSON.parse(decodeURIComponent(stateParam));
            brandId = state.brandId;
        } catch {
            const baseUrl = getBaseUrl(req);
            return NextResponse.redirect(
                `${baseUrl}/dashboard/integrations?error=invalid_state`
            );
        }

        const tokenRes = await fetch(
            `https://${shop}/admin/oauth/access_token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: process.env.SHOPIFY_API_KEY,
                    client_secret: process.env.SHOPIFY_API_SECRET,
                    code,
                }),
            }
        );

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return NextResponse.json({ error: "Token failed" }, { status: 400 });
        }

        const admin = createAdminClient();
        if (!admin) {
            throw new Error("Admin client not initialized");
        }
        const { data: connection, error: ConnectionError } = await admin
            .from("brand_store_connections")
            .upsert(
                {
                    brand_id: brandId,
                    provider: "shopify",
                    store_url: shop,
                    store_domain: shop,
                    access_token: accessToken,
                    status: "connected",
                    last_synced_at: null,
                },
                { onConflict: "brand_id" }
            )
            .select()
            .single();
        if (ConnectionError) {
            throw new Error(ConnectionError.message);
        }
        // if (connection?.id) {
        //     syncProductsInBackground({
        //         shop,
        //         accessToken,
        //         brandId,
        //         connectionId: connection.id,
        //     });
        // }
        const { data: analytics, error: analyticsError } = await admin
            .from("brand_store_analytics_settings")
            .select("public_tracking_token")
            .eq("brand_id", brandId)
            .single();

        if (analyticsError) {
            throw new Error(analyticsError.message);
        }

        const trackingToken = analytics?.public_tracking_token;
        if (trackingToken) {
            if (trackingToken) {
                try {
                    const query = `
                        mutation webPixelCreate($webPixel: WebPixelInput!) {
                            webPixelCreate(webPixel: $webPixel) {
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
                        webPixel: {
                            settings: JSON.stringify({
                                trackingToken: trackingToken,
                                accountID: trackingToken,
                            }),
                        },
                    };

                    const res = await fetch(
                        `https://${shop}/admin/api/2025-10/graphql.json`,
                        {
                            method: "POST",
                            headers: {
                                "X-Shopify-Access-Token": accessToken,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                query,
                                variables,
                            }),
                        }
                    );

                    const data = await res.json();

                    if (data?.data?.webPixelCreate?.userErrors?.length) {
                        console.error("PIXEL USER ERRORS:", data.data.webPixelCreate.userErrors);
                    } else {
                        console.log("PIXEL CREATED:", data.data.webPixelCreate.webPixel);
                    }

                } catch (err) {
                    console.error("PIXEL ERROR:", err);
                }
            }
        }

        const baseUrl = getBaseUrl(req);
        return NextResponse.redirect(
            `${baseUrl}/dashboard/integrations?connected=true&autoSync=true`
        );

    } catch (error) {
        console.error("Callback error:", error);

        const baseUrl = getBaseUrl(req);
        return NextResponse.redirect(
            `${baseUrl}/dashboard/integrations?error=connection_failed`
        );
    }
}

async function syncProductsInBackground({
    shop,
    accessToken,
    brandId,
    connectionId,
}: any) {
    try {

        const admin = createAdminClient();
        if (!admin) {
            throw new Error("Admin client not initialized");
        }
        const catalog = await fetchShopifyCatalog({
            provider: "shopify",
            storeUrl: shop,
            accessToken,
        });

        if (catalog?.products?.length) {
            await admin
                .from("brand_store_products")
                .delete()
                .eq("brand_id", brandId);

            await admin.from("brand_store_products").insert(
                catalog.products.map((p: any) => ({
                    connection_id: connectionId,
                    brand_id: brandId,
                    external_product_id: p.external_product_id,
                    title: p.title,
                    handle: p.handle,
                    price: p.price,
                    currency: p.currency,
                    synced_at: p.synced_at,
                }))
            );
        }
    } catch (err) {
        console.error("SYNC ERROR:", err);
    }
}