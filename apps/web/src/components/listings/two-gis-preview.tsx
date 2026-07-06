"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = { gisUrl: string; address: string };

/**
 * Превью точки 2ГИС: карточка-ссылка (открывает 2ГИС в новой вкладке).
 * Полноценный embed-виджет требует ключа — задача после MVP.
 */
export const TwoGisPreview = ({ gisUrl, address }: Props) => {
  const t = useTranslations("property");

  return (
    <a
      href={gisUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-[#0F6B4E]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#0F6B4E]">
        <MapPin size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{t("mapPoint")}</div>
        <div className="truncate text-sm text-gray-500">{address}</div>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-sm text-[#0F6B4E]">
        {t("openIn2gis")}
        <ExternalLink size={14} />
      </span>
    </a>
  );
};
