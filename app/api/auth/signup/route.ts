import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

function resolveRole(value?: string): Role {
  return value === "brand" ? "brand" : "creator";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = (await request.json().catch(() => null)) as
    | {
      role?: string;
      fullName?: string;
      companyName?: string;
      email?: string;
      password?: string;
    }
    | null;

  const role = resolveRole(body?.role);
  const fullName = body?.fullName?.trim() ?? "";
  const companyName = body?.companyName?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";

  if (!fullName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Name, email, and a 6 character password are required." },
      { status: 400 },
    );
  }

  if (role === "brand" && !companyName) {
    return NextResponse.json(
      { error: "Company name is required for brand accounts." },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role,
        full_name: fullName,
        company_name: role === "brand" ? companyName : "",
        headline:
          role === "brand"
            ? "Brand partnerships lead"
            : "Available for UGC collaborations",
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (data.user && role === "brand") {
    await supabase.from("team_members").upsert(
      {
        brand_id: data.user.id,
        user_id: data.user.id,
        role: "owner",
      },
      { onConflict: "brand_id,user_id" }
    );
  }
  if (data.session) {
    return NextResponse.json({ redirectTo: "/dashboard" });
  }

  return NextResponse.json({
    message: "Account created. Check your email to confirm your address.",
  });
}
