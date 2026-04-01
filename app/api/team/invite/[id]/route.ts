import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("team_invitations")
    .delete()
    .eq("id", params.id)
    .eq("brand_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete invite" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}