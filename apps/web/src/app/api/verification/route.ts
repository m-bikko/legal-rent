import {
  OrganizationVerificationData,
  SelfEmployedVerificationData,
  requiredVerificationType,
} from "@rentlegal/core";
import { ApiError, handle, ok, requireUser } from "@/server/api";
import { supabaseAdmin } from "@/server/db";

const MAX_DOC_SIZE = 10 * 1024 * 1024;

/**
 * Подача заявки на верификацию (multipart).
 * Для tenant это одновременно «стать арендодателем»: role → landlord,
 * account_type individual → self_employed.
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.verificationStatus === "pending") throw new ApiError("verification_pending", 409);
  if (user.verificationStatus === "approved") throw new ApiError("forbidden", 403);

  const form = await req.formData().catch(() => null);
  if (!form) throw new ApiError("validation_error");

  const type = requiredVerificationType(user.accountType);
  const rawData = form.get("data");
  if (typeof rawData !== "string") throw new ApiError("validation_error");
  const json: unknown = JSON.parse(rawData);

  const schema = type === "organization" ? OrganizationVerificationData : SelfEmployedVerificationData;
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ApiError("validation_error");

  const docPaths: string[] = [];
  if (type === "organization") {
    const file = form.get("noticeFile");
    if (!(file instanceof File) || file.size === 0) throw new ApiError("validation_error");
    if (file.size > MAX_DOC_SIZE) throw new ApiError("validation_error");
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("verification-docs")
      .upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (error) throw new ApiError("upload_failed", 500);
    docPaths.push(path);
  }

  const { error: insertError } = await supabaseAdmin.from("verification_requests").insert({
    user_id: user.id,
    type,
    data: parsed.data,
    doc_paths: docPaths,
  });
  if (insertError) throw new ApiError("unknown", 500);

  const userPatch: Record<string, string> = { verification_status: "pending" };
  if (user.role === "tenant") {
    userPatch.role = "landlord";
    if (user.accountType === "individual") userPatch.account_type = "self_employed";
  }
  await supabaseAdmin.from("users").update(userPatch).eq("id", user.id);

  return ok({ status: "pending" });
});
