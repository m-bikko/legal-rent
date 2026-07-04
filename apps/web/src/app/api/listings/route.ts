import { ListingsQuery } from "@rentlegal/core";
import { ApiError, handle, ok, requireUser } from "@/server/api";
import { mapProperty, supabaseAdmin } from "@/server/db";

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const parsed = ListingsQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) throw new ApiError("validation_error");
  const q = parsed.data;

  let query = supabaseAdmin
    .from("properties")
    .select("*")
    .eq("status", "free")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q.city) query = query.eq("city", q.city);
  if (q.type) query = query.eq("type", q.type);
  if (q.rentPeriod) query = query.eq("rent_period", q.rentPeriod);
  if (q.priceMin !== undefined) query = query.gte("price", q.priceMin);
  if (q.priceMax !== undefined) query = query.lte("price", q.priceMax);

  const { data: rows, error } = await query;
  if (error) throw new ApiError("unknown", 500);

  const ids = (rows ?? []).map((r) => r.id);
  const liked = new Set<string>();
  if (ids.length > 0) {
    const { data: favs } = await supabaseAdmin
      .from("favorites")
      .select("property_id")
      .eq("user_id", user.id)
      .in("property_id", ids);
    for (const f of favs ?? []) liked.add(f.property_id);
  }

  const items = (rows ?? []).map((r) => ({ ...mapProperty(r), isLiked: liked.has(r.id) }));
  return ok({ items });
});
