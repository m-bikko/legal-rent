"use client";

import { useState } from "react";
import { Button, Progress, Tag, Typography, App } from "antd";
import dayjs from "dayjs";
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  installmentStatus,
  type InstallmentStatus,
  type RentPeriod,
} from "@rentlegal/core";
import { apiPost } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import type { InstallmentRow } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const statusMeta: Record<InstallmentStatus, { color: string; key: string }> = {
  paid: { color: "success", key: "paid" },
  upcoming: { color: "default", key: "upcoming" },
  warning25: { color: "orange", key: "warning25" },
  critical10: { color: "volcano", key: "critical10" },
  overdue: { color: "red", key: "overdue" },
};

// Формат дат зависит от единицы аренды: часам важно время, месяцам — только дата
const fmtDue = (iso: string, unit: RentPeriod) =>
  dayjs(iso).format(unit === "hour" ? "DD.MM.YYYY HH:mm" : "DD.MM.YYYY");

const fmtPeriod = (startIso: string, endIso: string, unit: RentPeriod) => {
  const s = dayjs(startIso);
  const e = dayjs(endIso);
  if (unit === "hour") {
    return s.isSame(e, "day")
      ? `${s.format("DD.MM")} ${s.format("HH:mm")}–${e.format("HH:mm")}`
      : `${s.format("DD.MM HH:mm")} – ${e.format("DD.MM HH:mm")}`;
  }
  return `${s.format("DD.MM.YYYY")} – ${e.format("DD.MM.YYYY")}`;
};

type Props = {
  agreementId: string;
  installments: InstallmentRow[];
  unit: RentPeriod;
  /** Момент создания графика — от него считается окно первого платежа. */
  scheduleCreatedAt: string;
  /** true — арендодатель: может ставить/снимать отметку «оплачено». */
  canMarkPaid: boolean;
};

export const PaymentSchedule = ({
  agreementId,
  installments,
  unit,
  scheduleCreatedAt,
  canMarkPaid,
}: Props) => {
  const t = useTranslations("schedule");
  const qc = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const [busySeq, setBusySeq] = useState<number | null>(null);

  if (installments.length === 0) return null;

  const now = new Date();
  const createdAt = new Date(scheduleCreatedAt);
  const paidCount = installments.filter((i) => i.paidAt).length;
  const total = installments.reduce((sum, i) => sum + i.amount, 0);

  const togglePaid = async (inst: InstallmentRow) => {
    setBusySeq(inst.seq);
    try {
      await apiPost(`/api/agreements/${agreementId}/installments/${inst.seq}`, {
        paid: !inst.paidAt,
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["owned-property"] }),
        qc.invalidateQueries({ queryKey: ["my-agreements"] }),
      ]);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusySeq(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-medium">
          <CalendarClock size={17} />
          {t("title")}
        </span>
        <Typography.Text type="secondary" className="text-sm">
          {t("paidOf", { paid: paidCount, total: installments.length })} ·{" "}
          {formatPrice(total)}
        </Typography.Text>
      </div>

      <Progress
        percent={Math.round((paidCount / installments.length) * 100)}
        size="small"
        strokeColor="#0F6B4E"
      />

      <div className="flex flex-col gap-2">
        {installments.map((inst) => {
          const status = installmentStatus(
            { dueAt: new Date(inst.dueAt), paidAt: inst.paidAt ? new Date(inst.paidAt) : null },
            unit,
            createdAt,
            now,
          );
          const meta = statusMeta[status];
          return (
            <div
              key={inst.seq}
              className={`flex flex-col gap-1 rounded-xl border p-3 ${
                status === "paid"
                  ? "border-emerald-200 bg-emerald-50/50"
                  : status === "overdue"
                    ? "border-red-200 bg-red-50/40"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {t("installment", { n: inst.seq })} · {formatPrice(inst.amount)}
                </span>
                <Tag color={meta.color} className="!mr-0">
                  {t(`status.${meta.key}` as "status.paid")}
                </Tag>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-gray-500">
                <span>{fmtPeriod(inst.periodStart, inst.periodEnd, unit)}</span>
                <span>
                  {t("dueBy")} {fmtDue(inst.dueAt, unit)}
                </span>
              </div>
              {inst.paidAt && (
                <div className="text-xs text-gray-400">
                  {t("paidAt")} {fmtDue(inst.paidAt, "hour")}
                </div>
              )}
              {canMarkPaid && (
                <Button
                  size="small"
                  type={inst.paidAt ? "default" : "primary"}
                  className="mt-1 self-start"
                  loading={busySeq === inst.seq}
                  onClick={() => void togglePaid(inst)}
                >
                  {inst.paidAt ? t("markUnpaid") : t("markPaid")}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
