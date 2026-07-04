"use client";

import { useState } from "react";
import { Button, Card, Popconfirm, Tag, Typography, App } from "antd";
import { FileSignature, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { formatKzPhone } from "@rentlegal/core";
import { apiPost } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import type { AppUser, AgreementRow } from "@/lib/types";
import { useUser } from "@/components/shell/user-context";
import { PhoneInput } from "@/components/phone-input";

type Agreement = AgreementRow & { tenant: AppUser | null };

type Props = { propertyId: string; propertyStatus: string; agreement: Agreement | null };

/** Секция «Аренда» на странице объекта владельца. */
export const AgreementSection = ({ propertyId, propertyStatus, agreement }: Props) => {
  const t = useTranslations("agreement");
  const user = useUser();
  const qc = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const [tenantPhone, setTenantPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["owned-property", propertyId] }),
      qc.invalidateQueries({ queryKey: ["my-properties"] }),
      qc.invalidateQueries({ queryKey: ["my-agreements"] }),
    ]);
  };

  const run = async (fn: () => Promise<unknown>, successMsg?: string) => {
    setLoading(true);
    try {
      await fn();
      await invalidate();
      if (successMsg) message.success(successMsg);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const attach = () =>
    run(
      () => apiPost("/api/agreements", { propertyId, tenantPhone }),
      t("attachedNotice"),
    );

  const sign = () =>
    run(() => apiPost(`/api/agreements/${agreement!.id}/sign`), t("signedNotice"));

  const end = () =>
    run(() => apiPost(`/api/agreements/${agreement!.id}/end`), t("endedNotice"));

  const signatureRow = (label: string, signedAt: string | null) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {signedAt ? (
        <Tag color="success">{t("signed")}</Tag>
      ) : (
        <Tag>{t("waiting")}</Tag>
      )}
    </div>
  );

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <FileSignature size={18} />
          {t("sectionTitle")}
        </span>
      }
      styles={{ body: { padding: 20 } }}
    >
      {!agreement && propertyStatus === "free" && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1 text-sm text-gray-600">{t("tenantPhone")}</div>
            <PhoneInput value={tenantPhone} onChange={setTenantPhone} size="middle" />
            <div className="mt-1 text-xs text-gray-400">{t("tenantPhoneHint")}</div>
          </div>
          <Button type="primary" loading={loading} onClick={() => void attach()}>
            {t("attach")}
          </Button>
        </div>
      )}

      {agreement && (
        <div className="flex flex-col gap-3">
          {agreement.tenant && (
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500">
                <UserRound size={20} />
              </div>
              <div>
                <Typography.Text strong className="block">
                  {agreement.tenant.accountType === "organization"
                    ? agreement.tenant.orgName
                    : agreement.tenant.fullName}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-sm">
                  {formatKzPhone(agreement.tenant.phone)}
                </Typography.Text>
              </div>
            </div>
          )}

          {agreement.status === "draft" && (
            <>
              {signatureRow(t("landlord"), agreement.landlordSignedAt)}
              {signatureRow(t("tenant"), agreement.tenantSignedAt)}
              <div className="mt-1 flex gap-2">
                {user.id === agreement.landlordId && !agreement.landlordSignedAt && (
                  <Button type="primary" block loading={loading} onClick={() => void sign()}>
                    {t("sign")}
                  </Button>
                )}
                <Popconfirm title={t("endRental")} onConfirm={() => void end()}>
                  <Button danger block loading={loading}>
                    {t("endRental")}
                  </Button>
                </Popconfirm>
              </div>
            </>
          )}

          {agreement.status === "active" && (
            <>
              <Tag color="blue" className="w-fit">
                {t("activeTitle")}
              </Tag>
              <Popconfirm title={t("endRental")} onConfirm={() => void end()}>
                <Button danger loading={loading}>
                  {t("endRental")}
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      )}
    </Card>
  );
};
