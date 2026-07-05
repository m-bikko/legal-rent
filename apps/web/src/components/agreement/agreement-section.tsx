"use client";

import { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  InputNumber,
  Popconfirm,
  Tag,
  Typography,
  App,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { FileSignature, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { MAX_UNITS, formatKzPhone, type RentPeriod } from "@rentlegal/core";
import { apiPost } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import type { AppUser, AgreementRow, InstallmentRow } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useUser } from "@/components/shell/user-context";
import { PhoneInput } from "@/components/phone-input";
import { PaymentSchedule } from "./payment-schedule";

type Agreement = AgreementRow & { tenant: AppUser | null; installments: InstallmentRow[] };

type Props = {
  propertyId: string;
  propertyStatus: string;
  rentPeriod: RentPeriod;
  price: number;
  agreement: Agreement | null;
};

/** Секция «Аренда» на странице объекта владельца. */
export const AgreementSection = ({
  propertyId,
  propertyStatus,
  rentPeriod,
  price,
  agreement,
}: Props) => {
  const t = useTranslations("agreement");
  const tSchedule = useTranslations("schedule");
  const tProp = useTranslations("property");
  const user = useUser();
  const qc = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();

  const [tenantPhone, setTenantPhone] = useState("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [unitsCount, setUnitsCount] = useState<number>(1);
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

  const attach = () => {
    if (!startDate) {
      message.error(tSchedule("startDateRequired"));
      return;
    }
    return run(
      () =>
        apiPost("/api/agreements", {
          propertyId,
          tenantPhone,
          startDate: startDate.toISOString(),
          unitsCount,
        }),
      t("attachedNotice"),
    );
  };

  const sign = () =>
    run(() => apiPost(`/api/agreements/${agreement!.id}/sign`), t("signedNotice"));

  const end = () =>
    run(() => apiPost(`/api/agreements/${agreement!.id}/end`), t("endedNotice"));

  const signatureRow = (label: string, signedAt: string | null) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {signedAt ? <Tag color="success">{t("signed")}</Tag> : <Tag>{t("waiting")}</Tag>}
    </div>
  );

  // Для часовой аренды важно точное время начала; для дней/месяцев — только дата
  const isHourly = rentPeriod === "hour";

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-sm text-gray-600">{tSchedule("startDate")}</div>
              <DatePicker
                className="w-full"
                value={startDate}
                onChange={setStartDate}
                format={isHourly ? "DD.MM.YYYY HH:mm" : "DD.MM.YYYY"}
                showTime={isHourly ? { format: "HH:mm", minuteStep: 15 } : false}
                disabledDate={(d) => d.isBefore(dayjs().subtract(1, "month"), "day")}
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-gray-600">
                {tSchedule(`unitsLabel.${rentPeriod}` as "unitsLabel.month")}
              </div>
              <InputNumber
                className="!w-full"
                min={1}
                max={MAX_UNITS[rentPeriod]}
                value={unitsCount}
                onChange={(v) => setUnitsCount(v ?? 1)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-500">{tSchedule("total")}</span>
            <span className="font-medium">
              {formatPrice(price * unitsCount)}
              <span className="font-normal text-gray-500">
                {" "}
                ({unitsCount} × {formatPrice(price)}/
                {tProp(`rentPeriod.${rentPeriod}` as "rentPeriod.month")})
              </span>
            </span>
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

          {agreement.installments.length > 0 && (
            <>
              <Divider className="!my-1" />
              <PaymentSchedule
                agreementId={agreement.id}
                installments={agreement.installments}
                unit={rentPeriod}
                scheduleCreatedAt={agreement.createdAt}
                canMarkPaid={user.id === agreement.landlordId}
              />
            </>
          )}
        </div>
      )}
    </Card>
  );
};
