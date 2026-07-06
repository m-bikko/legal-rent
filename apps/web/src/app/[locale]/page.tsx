import { redirect } from "@/i18n/navigation";
import { readSession } from "@/server/session";

type Props = { params: Promise<{ locale: string }> };

const RootPage = async ({ params }: Props) => {
  const { locale } = await params;
  const session = await readSession();
  redirect({ href: session ? "/listings" : "/auth", locale });
};

export default RootPage;
