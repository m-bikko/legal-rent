import { ToggleFavoriteBody } from "@rentlegal/core";
import { ApiError, handle, ok, parseBody, requireUser } from "@/server/api";
import { mapProperty, supabaseAdmin } from "@/server/db";

export const GET = handle(async () => {
  const user = await requireUser();
  const { data: rows, error } = await supabaseAdmin
    .from("favorites")
    .select("created_at, properties(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError("unknown", 500);

  const items = (rows ?? [])
    .map((r) => r.properties as unknown as Record<string, unknown> | null)
    .filter((p): p is Record<string, unknown> => Boolean(p))
    .map((p) => ({ ...mapProperty(p), isLiked: true }));
  return ok({ items });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const { propertyId } = await parseBody(ToggleFavoriteBody, req);

  const { data: existing } = await supabaseAdmin
    .from("favorites")
    .select("property_id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", propertyId);
    return ok({ liked: false });
  }

  const { error } = await supabaseAdmin
    .from("favorites")
    .insert({ user_id: user.id, property_id: propertyId });
  if (error) throw new ApiError("not_found", 404);
  return ok({ liked: true });
});
