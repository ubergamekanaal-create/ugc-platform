// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function POST(req: Request) {
//   const supabase = await createClient();

//   //  Get logged-in user
//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (!user || userError) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     const formData = await req.formData();

//     const full_name = (formData.get("full_name") as string)?.trim();
//     const brand_description = (formData.get("brand_description") as string)?.trim();
//     const website_url = (formData.get("website_url") as string)?.trim();
//     const store_currency = (formData.get("store_currency") as string)?.trim();

//     const file = formData.get("logo") as File | null;

//     let avatar_url: string | null = null;

//     //  Basic validation
//     if (!full_name) {
//       return NextResponse.json(
//         { error: "Brand name is required" },
//         { status: 400 }
//       );
//     }
//     if (file) {
//       const allowedTypes = ["image/jpeg", "image/png"];

//       if (!allowedTypes.includes(file.type)) {
//         return NextResponse.json(
//           { error: "Only JPEG and PNG allowed" },
//           { status: 400 }
//         );
//       }
//     }
    
//     if (file && file.size > 0) {
//       const fileExt = file.name.split(".").pop();

//       //  folder based path (recommended)
//       const filePath = `${user.id}/${Date.now()}.${fileExt}`;

//       const { error: uploadError } = await supabase.storage
//         .from("profile_photo")
//         .upload(filePath, file, {
//           cacheControl: "3600",
//           upsert: true,
//         });

//       if (uploadError) {
//         console.error("UPLOAD ERROR:", uploadError);
//         return NextResponse.json(
//           { error: uploadError.message },
//           { status: 500 }
//         );
//       }

//       //  GET PUBLIC URL
//       const { data: publicData } = supabase.storage
//         .from("profile_photo")
//         .getPublicUrl(filePath);

//       avatar_url = publicData.publicUrl;

//       //  UPDATE USERS TABLE
//       const { error: userUpdateError } = await supabase
//         .from("users")
//         .update({ avatar_url })
//         .eq("id", user.id);

//       if (userUpdateError) {
//         console.error("USER UPDATE ERROR:", userUpdateError);
//       }
//     }

//     // =========================
//     //  UPSERT BRAND DATA
//     // =========================
//     const { data, error } = await supabase
//       .from("brands")
//       .upsert(
//         {
//           user_id: user.id,
//           email: user.email,
//           full_name,
//           brand_description,
//           website_url,
//           store_currency,
//         },
//         { onConflict: "user_id" }
//       )
//       .select()
//       .single();

//     if (error) {
//       console.error("DB ERROR:", error);
//       return NextResponse.json(
//         { error: "Failed to update brand profile" },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Profile updated successfully",
//       data,
//       avatar_url,
//     });
//   } catch (err) {
//     console.error("SERVER ERROR:", err);
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let full_name: string | null = null;
    let brand_description: string | null = null;
    let website_url: string | null = null;
    let store_currency: string | null = null;
    let file: File | null = null;

    let creator_enabled: boolean | null = null;
    let creator_visible_metrics: string[] | null = null;

    let avatar_url: string | null = null;

    const contentType = req.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const body = await req.json();

      creator_visible_metrics = body.creator_visible_metrics || [];
      creator_enabled = (creator_visible_metrics?.length || 0) > 0;
    }

    else {
      const formData = await req.formData();

      full_name = (formData.get("full_name") as string)?.trim();
      brand_description = (formData.get("brand_description") as string)?.trim();
      website_url = (formData.get("website_url") as string)?.trim();
      store_currency = (formData.get("store_currency") as string)?.trim();

      file = formData.get("logo") as File | null;

      // Validation
      if (!full_name) {
        return NextResponse.json(
          { error: "Brand name is required" },
          { status: 400 }
        );
      }

      if (file) {
        const allowedTypes = ["image/jpeg", "image/png"];

        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: "Only JPEG and PNG allowed" },
            { status: 400 }
          );
        }
      }

      // Upload
      if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("profile_photo")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          return NextResponse.json(
            { error: uploadError.message },
            { status: 500 }
          );
        }

        const { data: publicData } = supabase.storage
          .from("profile_photo")
          .getPublicUrl(filePath);

        avatar_url = publicData.publicUrl;

        await supabase
          .from("users")
          .update({ avatar_url })
          .eq("id", user.id);
      }
    }

    const updatePayload: any = {
      user_id: user.id,
      email: user.email,
    };

    // Existing fields (only if present)
    if (full_name !== null) updatePayload.full_name = full_name;
    if (brand_description !== null) updatePayload.brand_description = brand_description;
    if (website_url !== null) updatePayload.website_url = website_url;
    if (store_currency !== null) updatePayload.store_currency = store_currency;

    if (creator_visible_metrics !== null) {
      updatePayload.creator_visible_metrics = creator_visible_metrics;
      updatePayload.creator_enabled = creator_enabled;
    }

    // =========================
    // UPSERT
    // =========================
    const { data, error } = await supabase
      .from("brands")
      .upsert(updatePayload, { onConflict: "user_id" })
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