import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filePath } = await req.json();

  // delete from storage
  const { error: storageError } = await supabase.storage
    .from("profile_photo")
    .remove([filePath]);

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  // remove from users table
  await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}