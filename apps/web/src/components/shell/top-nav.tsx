"use client";

import { Typography } from "antd";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useUser } from "./user-context";
import { navItemsFor } from "./nav-items";
import { LangSwitcher } from "./lang-switcher";

/** Верхняя навигация (десктоп ≥ md). */
export const TopNav = () => {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const user = useUser();

  return (
    <header className="sticky top-0 z-20 hidden border-b border-gray-200 bg-white md:block">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-8 px-6">
        <Link href="/listings" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F6B4E] text-white">
            <ShieldCheck size={20} />
          </span>
          <Typography.Text strong className="text-base">
            RentLegal KZ
          </Typography.Text>
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {navItemsFor(user).map(({ href, labelKey, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-[#0F6B4E]/10 font-medium text-[#0F6B4E]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <LangSwitcher />
      </div>
    </header>
  );
};
