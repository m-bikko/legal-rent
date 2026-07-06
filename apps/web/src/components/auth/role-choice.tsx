"use client";

import { Card, Typography } from "antd";
import { Search, KeyRound, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserRole } from "@rentlegal/core";

type Props = { onSelect: (role: UserRole) => void };

const options = [
  { role: "tenant" as const, icon: Search, title: "roleTenant", hint: "roleTenantHint" },
  { role: "landlord" as const, icon: KeyRound, title: "roleLandlord", hint: "roleLandlordHint" },
];

export const RoleChoice = ({ onSelect }: Props) => {
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col gap-3">
      {options.map(({ role, icon: Icon, title, hint }) => (
        <Card
          key={role}
          hoverable
          onClick={() => onSelect(role)}
          styles={{ body: { padding: 20 } }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F6B4E]/10 text-[#0F6B4E]">
              <Icon size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <Typography.Text strong className="block text-base">
                {t(title)}
              </Typography.Text>
              <Typography.Text type="secondary" className="text-sm">
                {t(hint)}
              </Typography.Text>
            </div>
            <ChevronRight size={20} className="shrink-0 text-gray-400" />
          </div>
        </Card>
      ))}
    </div>
  );
};
