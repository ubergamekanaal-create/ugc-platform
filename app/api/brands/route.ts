// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function GET() {
//   const supabase = await createClient();

//   // 🔐 get logged-in user
//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (!user || userError) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   // 🔥 fetch brand profile
//   const { data, error } = await supabase
//     .from("brands")
//     .select("*")
//     .eq("user_id", user.id)
//     .maybeSingle();

//   if (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch brand profile" },
//       { status: 500 }
//     );
//   }

//   return NextResponse.json({ data });
// }


import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (brandError) {
    console.error("BRAND ERROR:", brandError);
    return NextResponse.json(
      { error: "Failed to fetch brand profile" },
      { status: 500 }
    );
  }

  const { data: userData, error: userFetchError } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (userFetchError) {
    console.error("USER FETCH ERROR:", userFetchError);
  }

  const response = brand
    ? {
        ...brand,
        avatar_url: userData?.avatar_url || null,
      }
    : null;

  return NextResponse.json({ data: response });
}