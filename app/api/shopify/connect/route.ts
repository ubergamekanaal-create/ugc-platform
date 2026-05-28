import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getBaseUrl(req: Request) {
  return (process.env.FRONTEND_URL || new URL(req.url).origin).replace(/\/+$/, "");
}
export async function POST(req: Request) {
  try {
    const { storeUrl } = await req.json();

    if (!storeUrl) {
      return NextResponse.json(
        { error: "Store URL required" },
        { status: 400 }
      );
    }

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

    let shop = storeUrl
      .replace("https://", "")
      .replace("http://", "")
      .trim();

    // ❗ Handle admin.shopify.com case
    if (shop.includes("admin.shopify.com")) {
      const parts = shop.split("/store/");
      if (parts[1]) {
        shop = parts[1];
      }
    }

    // remove extra paths
    shop = shop.split("/")[0];

    // ensure .myshopify.com
    // if (!shop.endsWith(".myshopify.com")) {
    //   shop = shop + ".myshopify.com";
    // }
    // if (!shop.endsWith(".myshopify.com")) {
    //   return NextResponse.json(
    //     { error: "Invalid Shopify store domain" },
    //     { status: 400 }
    //   );
    // }
    const state = JSON.stringify({
      brandId: user.id,
      nonce: crypto.randomUUID(),
    });

    const scopes = process.env.SHOPIFY_SCOPES;

    if (!scopes) {
      throw new Error("SHOPIFY_SCOPES is not defined in env");
    }

    const baseUrl = getBaseUrl(req);

    const redirectUri = `${baseUrl}/api/shopify/callback`;

    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY
      }&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=${encodeURIComponent(state)}`;

    return NextResponse.json({ url: installUrl });

  } catch (error) {
    console.error("Connect API Error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}