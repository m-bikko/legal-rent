import { handle, ok, requireAdmin, ApiError } from "@/server/api";
import { mapUser, supabaseAdmin } from "@/server/db";

/** Заявки на верификацию: pending первыми, затем обработанные (свежие сверху). */
export const GET = handle(async () => {
  await requireAdmin();

  const { data: rows, error } = await supabaseAdmin
    .from("verification_requests")
    .select("*, users(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new ApiError("unknown", 500);

  const items = await Promise.all(
    (rows ?? []).map(async (r) => {
      // приватные документы — через временные signed URL (1 час)
      const docUrls: string[] = [];
      for (const path of (r.doc_paths as string[]) ?? []) {
        const { data } = await supabaseAdmin.storage
          .from("verification-docs")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) docUrls.push(data.signedUrl);
      }
      return {
        id: r.id as string,
        type: r.type as string,
        status: r.status as string,
        data: r.data as Record<string, string>,
        docUrls,
        createdAt: r.created_at as string,
        user: mapUser(r.users as unknown as Record<string, unknown>),
      };
    }),
  );

  items.sort((a, b) => (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1));
  return ok({ items });
});
