import { redirect } from "@/i18n/navigation";
import { readSession } from "@/server/session";
import { supabaseAdmin, mapUser } from "@/server/db";
import { UserProvider } from "@/components/shell/user-context";
import { TabBar } from "@/components/shell/tab-bar";
import { TopNav } from "@/components/shell/top-nav";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const AppLayout = async ({ children, params }: Props) => {
  const { locale } = await params;
  const session = await readSession();
  if (!session) redirect({ href: "/auth", locale });

  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", session!.userId)
    .maybeSingle();
  if (!data) redirect({ href: "/auth", locale });

  return (
    <UserProvider user={mapUser(data!)}>
      <TopNav />
      <main className="pb-tabbar mx-auto min-h-dvh w-full max-w-5xl px-4 pt-4 md:px-6 md:pb-10">
        {children}
      </main>
      <TabBar />
    </UserProvider>
  );
};

export default AppLayout;
