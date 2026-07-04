"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Input, Typography, App } from "antd";
import { useTranslations } from "next-intl";
import { formatKzPhone } from "@rentlegal/core";
import { apiPost } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";

const RESEND_SECONDS = 60;

type Props = {
  phone: string; // E.164
  flow: "login" | "register";
  devCode?: string;
  onConfirm: (code: string) => Promise<void>;
};

export const OtpStep = ({ phone, flow, devCode: initialDevCode, onConfirm }: Props) => {
  const t = useTranslations("auth");
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();

  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(initialDevCode);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const submit = async (value: string) => {
    if (value.length !== 6 || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(value);
    } catch (err) {
      message.error(errorMessage(err));
      setCode("");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    try {
      const data = await apiPost<{ devCode?: string }>("/api/auth/request-otp", { phone, flow });
      setDevCode(data.devCode);
      setSecondsLeft(RESEND_SECONDS);
      setCode("");
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Typography.Title level={4} className="!mb-1">
          {t("otpTitle")}
        </Typography.Title>
        <Typography.Text type="secondary">
          {t("otpSentTo", { phone: formatKzPhone(phone) })}
        </Typography.Text>
      </div>

      {devCode && (
        <Alert
          type="info"
          showIcon
          message={t("devCodeTitle")}
          description={
            <div className="flex items-center justify-between gap-3">
              <span>{t("devCodeText", { code: devCode })}</span>
              <Button size="small" onClick={() => void submit(devCode)}>
                {t("devCodeInsert")}
              </Button>
            </div>
          }
        />
      )}

      <div className="flex justify-center">
        <Input.OTP
          length={6}
          size="large"
          value={code}
          onChange={(value) => {
            setCode(value);
            void submit(value);
          }}
        />
      </div>

      <Button
        type="primary"
        size="large"
        block
        loading={submitting}
        disabled={code.length !== 6}
        onClick={() => void submit(code)}
      >
        {t("confirm")}
      </Button>

      <Button type="link" disabled={secondsLeft > 0} onClick={() => void resend()}>
        {secondsLeft > 0 ? t("resendIn", { seconds: secondsLeft }) : t("resend")}
      </Button>
    </div>
  );
};
