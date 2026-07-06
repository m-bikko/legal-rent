"use client";

import { Select } from "antd";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { locales, type Locale } from "@rentlegal/i18n";
import { usePathname, useRouter } from "@/i18n/navigation";

const labels: Record<Locale, string> = { ru: "Русский", kk: "Қазақша", en: "English" };

export const LangSwitcher = ({ size = "middle" }: { size?: "small" | "middle" | "large" }) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const change = (next: Locale) => {
    // @ts-expect-error — params совместимы с динамическими сегментами текущего роута
    router.replace({ pathname, params }, { locale: next });
  };

  return (
    <Select
      size={size}
      value={locale as Locale}
      onChange={change}
      options={locales.map((l) => ({ value: l, label: labels[l] }))}
      popupMatchSelectWidth={false}
    />
  );
};
