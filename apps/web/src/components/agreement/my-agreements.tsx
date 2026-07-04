"use client";

import { Button, Card, Tag, Typography, App } from "antd";
import { FileSignature } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import { useMyAgreements } from "@/lib/queries";
import { useUser } from "@/components/shell/user-context";
import { formatPrice } from "@/lib/format";

/** Список моих договоров (draft/active) в профиле — с подписью со своей стороны. */
export const MyAgreements = () => {
  const t = useTranslations("agreement");
  const tProfile = useTranslations("profile");
  const user = useUser();
  const qc = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const { data: items } = useMyAgreements();

  if (!items || items.length === 0) return null;

  const sign = async (id: string) => {
    try {
      await apiPost(`/api/agreements/${id}/sign`);
      await qc.invalidateQueries({ queryKey: ["my-agreements"] });
      message.success(t("signedNotice"));
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <FileSignature size={18} />
          {tProfile("myAgreements")}
        </span>
      }
      styles={{ body: { padding: 16 } }}
    >
      <div className="flex flex-col gap-3">
        {items.map((a) => {
          const mySignedAt = user.id === a.landlordId ? a.landlordSignedAt : a.tenantSignedAt;
          const needsMySignature = a.status === "draft" && !mySignedAt;
          return (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <Typography.Text strong className="block truncate">
                  {a.property.address}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-sm">
                  {formatPrice(a.property.price)} ·{" "}
                  {user.id === a.landlordId ? t("landlord") : t("tenant")}
                </Typography.Text>
              </div>
              {needsMySignature ? (
                <Button type="primary" size="small" onClick={() => void sign(a.id)}>
                  {t("sign")}
                </Button>
              ) : a.status === "draft" ? (
                <Tag>{t("waiting")}</Tag>
              ) : (
                <Tag color="blue">{t("signed")}</Tag>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
