"use client";

import { useState } from "react";
import { Button, Form, Input, Segmented, App } from "antd";
import { useTranslations } from "next-intl";
import { normalizeKzPhone, type AccountType, type UserRole } from "@rentlegal/core";
import { apiPost } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import { PhoneInput } from "@/components/phone-input";
import { CitySelect } from "@/components/city-select";

export type RegisterDraft = {
  role: UserRole;
  accountType: AccountType;
  fullName?: string;
  orgName?: string;
  iinBin?: string;
  city: string;
  phone: string; // E.164
};

type FormValues = {
  fullName?: string;
  orgName?: string;
  iinBin?: string;
  city: string;
  phone: string;
};

type Props = {
  role: UserRole;
  onCodeSent: (draft: RegisterDraft, devCode?: string) => void;
};

export const RegisterForm = ({ role, onCodeSent }: Props) => {
  const t = useTranslations("auth");
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();

  // Арендодатель: Самозанятый | ИП/ТОО. Арендатор: Физлицо | ИП/ТОО.
  const personalType: AccountType = role === "landlord" ? "self_employed" : "individual";
  const [accountType, setAccountType] = useState<AccountType>(personalType);
  const [loading, setLoading] = useState(false);

  const isOrg = accountType === "organization";

  const submit = async (values: FormValues) => {
    const phone = normalizeKzPhone(values.phone);
    if (!phone) {
      form.setFields([{ name: "phone", errors: [t("phone")] }]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ devCode?: string }>("/api/auth/request-otp", {
        phone,
        flow: "register",
      });
      onCodeSent(
        {
          role,
          accountType,
          fullName: isOrg ? undefined : values.fullName,
          orgName: isOrg ? values.orgName : undefined,
          iinBin: isOrg ? values.iinBin : undefined,
          city: values.city,
          phone,
        },
        data.devCode,
      );
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={(v) => void submit(v)} requiredMark={false}>
      <Form.Item className="!mb-5">
        <Segmented
          block
          size="large"
          value={accountType}
          onChange={(value) => setAccountType(value as AccountType)}
          options={[
            {
              label: role === "landlord" ? t("accountTypeSelf") : t("accountTypeIndividual"),
              value: personalType,
            },
            { label: t("accountTypeOrg"), value: "organization" },
          ]}
        />
      </Form.Item>

      {isOrg ? (
        <>
          <Form.Item
            name="iinBin"
            label={t("iinBin")}
            rules={[{ required: true, pattern: /^\d{12}$/, message: t("iinBin") }]}
          >
            <Input size="large" inputMode="numeric" maxLength={12} placeholder="123456789012" />
          </Form.Item>
          <Form.Item name="orgName" label={t("orgName")} rules={[{ required: true, min: 2 }]}>
            <Input size="large" placeholder='ТОО "Компания"' />
          </Form.Item>
        </>
      ) : (
        <Form.Item name="fullName" label={t("fullName")} rules={[{ required: true, min: 2 }]}>
          <Input size="large" autoComplete="name" />
        </Form.Item>
      )}

      <Form.Item name="city" label={t("city")} rules={[{ required: true }]}>
        <CitySelect />
      </Form.Item>

      <Form.Item name="phone" label={t("phone")} rules={[{ required: true }]}>
        <PhoneInput />
      </Form.Item>

      <Button type="primary" size="large" htmlType="submit" block loading={loading}>
        {t("sendCode")}
      </Button>
    </Form>
  );
};
