"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useUser } from "./user-context";
import { navItemsFor } from "./nav-items";

/** Нижний таб-бар (мобильные). На десктопе скрыт — там TopNav. */
export const TabBar = () => {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const user = useUser();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Main"
    >
      <div className="flex h-16 items-stretch">
        {navItemsFor(user).map(({ href, labelKey, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                active ? "text-[#0F6B4E]" : "text-gray-500"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              <span className={active ? "font-medium" : ""}>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
