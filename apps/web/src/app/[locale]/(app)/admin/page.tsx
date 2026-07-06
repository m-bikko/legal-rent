"use client";

import { Button, Card, Descriptions, Result, Skeleton, Statistic, Tag, Typography, App } from "antd";
import { FileCheck, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { formatKzPhone } from "@rentlegal/core";
import { apiGet, apiPost } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import type { AppUser } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useUser } from "@/components/shell/user-context";

type Stats = {
  users: {
    total: number;
    byRole: Record<string, number>;
    byAccountType: Record<string, number>;
    verified: number;
    pendingVerification: number;
  };
  properties: {
    total: number;
    byStatus: Record<string, number>;
    byCity: Record<string, number>;
    byType: Record<string, number>;
  };
  agreements: { byStatus: Record<string, number> };
  payments: {
    installments: number;
    paid: number;
    overdue: number;
    paidSum: number;
    expectedSum: number;
  };
  verifications: { byStatus: Record<string, number> };
};

type VerificationItem = {
  id: string;
  type: "self_employed" | "organization";
  status: "pending" | "approved" | "rejected";
  data: Record<string, string>;
  docUrls: string[];
  createdAt: string;
  user: AppUser;
};

const useStats = () =>
  useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet<Stats>("/api/admin/stats") });

const useVerifications = () =>
  useQuery({
    queryKey: ["admin-verifications"],
    queryFn: () =>
      apiGet<{ items: VerificationItem[] }>("/api/admin/verifications").then((d) => d.items),
  });

const AdminPage = () => {
  const t = useTranslations("admin");
  const tVer = useTranslations("verification");
  const tProp = useTranslations("property");
  const tCities = useTranslations("cities");
  const user = useUser();
  const qc = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const { data: stats } = useStats();
  const { data: verifications } = useVerifications();

  if (user.role !== "admin") return <Result status="403" title={t("forbidden")} />;

  const decide = async (id: string, action: "approve" | "reject") => {
    try {
      await apiPost(`/api/admin/verifications/${id}`, { action });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-verifications"] }),
        qc.invalidateQueries({ queryKey: ["admin-stats"] }),
      ]);
      message.success(t(action === "approve" ? "approved" : "rejected"));
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  const breakdown = (record: Record<string, number>, translate: (key: string) => string) =>
    Object.entries(record)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => (
        <div key={key} className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{translate(key)}</span>
          <span className="font-medium">{count}</span>
        </div>
      ));

  const dataLabels: Record<string, string> = {
    iin: tVer("iin"),
    fullName: tVer("fullName"),
    idNumber: tVer("idNumber"),
    idExpiry: tVer("idExpiry"),
    address: tVer("address"),
    iinBin: tVer("iinBin"),
    orgName: tVer("orgName"),
    legalAddress: tVer("legalAddress"),
  };

  const statusTag = {
    pending: <Tag color="processing">{t("statusPending")}</Tag>,
    approved: <Tag color="success">{t("statusApproved")}</Tag>,
    rejected: <Tag color="error">{t("statusRejected")}</Tag>,
  };

  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={4} className="!mb-0 md:!text-2xl">
        {t("title")}
      </Typography.Title>

      {!stats ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          {/* Ключевые метрики */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card styles={{ body: { padding: 16 } }}>
              <Statistic title={t("usersTotal")} value={stats.users.total} />
              <div className="mt-1 text-xs text-gray-500">
                {t("tenants")}: {stats.users.byRole.tenant ?? 0} · {t("landlords")}:{" "}
                {stats.users.byRole.landlord ?? 0}
              </div>
            </Card>
            <Card styles={{ body: { padding: 16 } }}>
              <Statistic title={t("propertiesTotal")} value={stats.properties.total} />
              <div className="mt-1 text-xs text-gray-500">
                {tProp("status.free")}: {stats.properties.byStatus.free ?? 0} ·{" "}
                {tProp("status.rented")}: {stats.properties.byStatus.rented ?? 0} ·{" "}
                {tProp("status.archived")}: {stats.properties.byStatus.archived ?? 0}
              </div>
            </Card>
            <Card styles={{ body: { padding: 16 } }}>
              <Statistic
                title={t("activeAgreements")}
                value={stats.agreements.byStatus.active ?? 0}
              />
              <div className="mt-1 text-xs text-gray-500">
                {t("draftAgreements")}: {stats.agreements.byStatus.draft ?? 0}
              </div>
            </Card>
            <Card styles={{ body: { padding: 16 } }}>
              <Statistic
                title={t("pendingRequests")}
                value={stats.verifications.byStatus.pending ?? 0}
                valueStyle={
                  (stats.verifications.byStatus.pending ?? 0) > 0 ? { color: "#d46b08" } : undefined
                }
              />
              <div className="mt-1 text-xs text-gray-500">
                {t("verifiedUsers")}: {stats.users.verified}
              </div>
            </Card>
          </div>

          {/* Платежи */}
          <Card title={t("payments")} styles={{ body: { padding: 16 } }}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Statistic title={t("paidInstallments")} value={`${stats.payments.paid} / ${stats.payments.installments}`} />
              <Statistic
                title={t("overdueInstallments")}
                value={stats.payments.overdue}
                valueStyle={stats.payments.overdue > 0 ? { color: "#cf1322" } : undefined}
              />
              <Statistic title={t("paidSum")} value={formatPrice(stats.payments.paidSum)} />
              <Statistic title={t("expectedSum")} value={formatPrice(stats.payments.expectedSum)} />
            </div>
          </Card>

          {/* Разбивки */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card title={t("byCity")} styles={{ body: { padding: 16 } }}>
              <div className="flex flex-col gap-1">
                {breakdown(stats.properties.byCity, (c) => (tCities.has(c) ? tCities(c) : c))}
              </div>
            </Card>
            <Card title={t("byType")} styles={{ body: { padding: 16 } }}>
              <div className="flex flex-col gap-1">
                {breakdown(stats.properties.byType, (v) =>
                  tProp(`types.${v}` as "types.apartment"),
                )}
              </div>
            </Card>
            <Card title={t("byAccountType")} styles={{ body: { padding: 16 } }}>
              <div className="flex flex-col gap-1">
                {breakdown(stats.users.byAccountType, (v) => t(`accountTypes.${v}` as "accountTypes.individual"))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Модерация верификаций */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <FileCheck size={18} />
            {t("verificationsTitle")}
          </span>
        }
        styles={{ body: { padding: 16 } }}
      >
        {!verifications ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : verifications.length === 0 ? (
          <Typography.Text type="secondary">{t("verificationsEmpty")}</Typography.Text>
        ) : (
          <div className="flex flex-col gap-3">
            {verifications.map((v) => (
              <div key={v.id} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Typography.Text strong>
                      {v.user.accountType === "organization" ? v.user.orgName : v.user.fullName}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="ml-2 text-sm">
                      {formatKzPhone(v.user.phone)}
                    </Typography.Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag>{v.type === "organization" ? tVer("typeOrg") : tVer("typeSelf")}</Tag>
                    {statusTag[v.status]}
                  </div>
                </div>

                <Descriptions
                  size="small"
                  column={1}
                  items={Object.entries(v.data).map(([key, value]) => ({
                    key,
                    label: dataLabels[key] ?? key,
                    children: value,
                  }))}
                />

                {v.docUrls.map((docUrl, i) => (
                  <a
                    key={docUrl}
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex w-fit items-center gap-1 text-sm text-[#0F6B4E]"
                  >
                    <Paperclip size={14} />
                    {t("document")} {i + 1}
                  </a>
                ))}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">
                    {dayjs(v.createdAt).format("DD.MM.YYYY HH:mm")}
                  </span>
                  {v.status === "pending" && (
                    <div className="flex gap-2">
                      <Button danger size="small" onClick={() => void decide(v.id, "reject")}>
                        {t("reject")}
                      </Button>
                      <Button type="primary" size="small" onClick={() => void decide(v.id, "approve")}>
                        {t("approve")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminPage;
