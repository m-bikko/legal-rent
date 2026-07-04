import { ApiError, handle, ok, requireUser } from "@/server/api";
import { mapProperty, supabaseAdmin } from "@/server/db";

const MAX_PHOTOS = 10;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new ApiError("not_found", 404);
  if (row.owner_id !== user.id) throw new ApiError("forbidden", 403);

  const form = await req.formData().catch(() => null);
  if (!form) throw new ApiError("validation_error");
  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0) throw new ApiError("validation_error");

  const existing: string[] = row.photos ?? [];
  if (existing.length + files.length > MAX_PHOTOS) throw new ApiError("validation_error");

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type) || file.size > MAX_SIZE) throw new ApiError("validation_error");
    const ext = file.type.split("/")[1];
    const path = `${id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("property-photos")
      .upload(path, file, { contentType: file.type });
    if (error) throw new ApiError("upload_failed", 500);
    const { data: pub } = supabaseAdmin.storage.from("property-photos").getPublicUrl(path);
    urls.push(pub.publicUrl);
  }

  const { data: updated, error } = await supabaseAdmin
    .from("properties")
    .update({ photos: [...existing, ...urls] })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !updated) throw new ApiError("unknown", 500);

  return ok({ item: mapProperty(updated) });
});
