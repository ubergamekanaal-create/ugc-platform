import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  //  Get logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const full_name = (formData.get("full_name") as string)?.trim();
    const brand_description = (formData.get("brand_description") as string)?.trim();
    const website_url = (formData.get("website_url") as string)?.trim();
    const store_currency = (formData.get("store_currency") as string)?.trim();

    const file = formData.get("logo") as File | null;

    let avatar_url: string | null = null;

    //  Basic validation
    if (!full_name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      );
    }

    // =========================
    //  IMAGE UPLOAD
    // =========================
    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop();

      //  folder based path (recommended)
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile_photo")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 }
        );
      }

      //  GET PUBLIC URL
      const { data: publicData } = supabase.storage
        .from("profile_photo")
        .getPublicUrl(filePath);

      avatar_url = publicData.publicUrl;

      //  UPDATE USERS TABLE
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ avatar_url })
        .eq("id", user.id);

      if (userUpdateError) {
        console.error("USER UPDATE ERROR:", userUpdateError);
      }
    }

    // =========================
    //  UPSERT BRAND DATA
    // =========================
    const { data, error } = await supabase
      .from("brands")
      .upsert(
        {
          user_id: user.id,
          email: user.email,
          full_name,
          brand_description,
          website_url,
          store_currency,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("DB ERROR:", error);
      return NextResponse.json(
        { error: "Failed to update brand profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data,
      avatar_url,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}