"use client";

import { Tag } from "antd";
import { useTranslations } from "next-intl";

const colors: Record<string, string> = {
  free: "success",
  rented: "blue",
  archived: "default",
};

export const StatusBadge = ({ status }: { status: string }) => {
  const t = useTranslations("property");
  return (
    <Tag color={colors[status] ?? "default"} className="!mr-0">
      {t(`status.${status}` as "status.free")}
    </Tag>
  );
};
