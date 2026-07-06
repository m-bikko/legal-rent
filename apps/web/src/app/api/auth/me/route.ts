import { handle, ok, requireUser } from "@/server/api";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok({ user });
});
