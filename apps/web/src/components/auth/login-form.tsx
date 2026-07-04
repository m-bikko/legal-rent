"use client";

import { useState } from "react";
import { Button, Form, App } from "antd";
import { useTranslations } from "next-intl";
import { normalizeKzPhone } from "@rentlegal/core";
import { apiPost } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import { PhoneInput } from "@/components/phone-input";

type Props = {
  onCodeSent: (phone: string, devCode?: string) => void;
};

export const LoginForm = ({ onCodeSent }: Props) => {
  const t = useTranslations("auth");
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ phone: string }>();
  const [loading, setLoading] = useState(false);

  const submit = async ({ phone: raw }: { phone: string }) => {
    const phone = normalizeKzPhone(raw);
    if (!phone) {
      form.setFields([{ name: "phone", errors: [t("phone")] }]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ devCode?: string }>("/api/auth/request-otp", {
        phone,
        flow: "login",
      });
      onCodeSent(phone, data.devCode);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={(v) => void submit(v)} requiredMark={false}>
      <Form.Item name="phone" label={t("phone")} rules={[{ required: true }]}>
        <PhoneInput />
      </Form.Item>
      <Button type="primary" size="large" htmlType="submit" block loading={loading}>
        {t("sendCode")}
      </Button>
    </Form>
  );
};
