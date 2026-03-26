import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to sign in." },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile?.role) {
    await supabase.auth.signOut();

    return NextResponse.json(
      {
        error:
          "Your profile is not ready yet. Apply the Supabase schema or finish signup first.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ redirectTo: "/dashboard" });
}
