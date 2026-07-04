import { ApiError, handle, ok, requireUser } from "@/server/api";
import { mapProperty, supabaseAdmin } from "@/server/db";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new ApiError("not_found", 404);

  const { data: fav } = await supabaseAdmin
    .from("favorites")
    .select("property_id")
    .eq("user_id", user.id)
    .eq("property_id", id)
    .maybeSingle();

  return ok({ item: { ...mapProperty(row), isLiked: Boolean(fav) } });
});
