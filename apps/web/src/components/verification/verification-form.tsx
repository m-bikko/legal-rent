"use client";

import { useState } from "react";
import { Button, DatePicker, Form, Input, Upload, App } from "antd";
import type { UploadFile } from "antd";
import { FileUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { requiredVerificationType } from "@rentlegal/core";
import { apiUpload } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import { useUser } from "@/components/shell/user-context";

type SelfEmployedValues = {
  iin: string;
  fullName: string;
  idNumber: string;
  idExpiry: { format: (f: string) => string };
  address: string;
};

type OrgValues = {
  iinBin: string;
  orgName: string;
  legalAddress: string;
  noticeFile: { fileList: UploadFile[] };
};

export const VerificationForm = () => {
  const t = useTranslations("verification");
  const user = useUser();
  const router = useRouter();
  const qc = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const type = requiredVerificationType(user.accountType);
  const isOrg = type === "organization";

  const submit = async (values: SelfEmployedValues | OrgValues) => {
    setLoading(true);
    try {
      const form = new FormData();
      if (isOrg) {
        const v = values as OrgValues;
        const file = v.noticeFile.fileList[0]?.originFileObj;
        if (file) form.append("noticeFile", file);
        form.append(
          "data",
          JSON.stringify({ iinBin: v.iinBin, orgName: v.orgName, legalAddress: v.legalAddress }),
        );
      } else {
        const v = values as SelfEmployedValues;
        form.append(
          "data",
          JSON.stringify({
            iin: v.iin,
            fullName: v.fullName,
            idNumber: v.idNumber,
            idExpiry: v.idExpiry.format("YYYY-MM-DD"),
            address: v.address,
          }),
        );
      }
      await apiUpload("/api/verification", form);
      await qc.invalidateQueries({ queryKey: ["me"] });
      message.success(t("submittedTitle"));
      router.replace("/profile");
      router.refresh();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      layout="vertical"
      requiredMark={false}
      onFinish={(v) => void submit(v as SelfEmployedValues | OrgValues)}
      initialValues={
        isOrg
          ? { iinBin: user.iinBin ?? "", orgName: user.orgName ?? "" }
          : { fullName: user.fullName ?? "" }
      }
    >
      {isOrg ? (
        <>
          <Form.Item
            name="noticeFile"
            label={t("noticeFile")}
            extra={t("noticeFileHint")}
            rules={[{ required: true, message: t("noticeFile") }]}
          >
            <Upload.Dragger
              maxCount={1}
              beforeUpload={() => false}
              accept=".pdf,.jpg,.jpeg,.png"
            >
              <div className="flex flex-col items-center gap-2 py-2 text-gray-500">
                <FileUp size={28} />
                <span>{t("noticeFileHint")}</span>
              </div>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item
            name="iinBin"
            label={t("iinBin")}
            rules={[{ required: true, pattern: /^\d{12}$/, message: t("iinBin") }]}
          >
            <Input size="large" inputMode="numeric" maxLength={12} />
          </Form.Item>
          <Form.Item name="orgName" label={t("orgName")} rules={[{ required: true, min: 2 }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="legalAddress" label={t("legalAddress")} rules={[{ required: true, min: 3 }]}>
            <Input size="large" />
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item
            name="iin"
            label={t("iin")}
            rules={[{ required: true, pattern: /^\d{12}$/, message: t("iin") }]}
          >
            <Input size="large" inputMode="numeric" maxLength={12} />
          </Form.Item>
          <Form.Item name="fullName" label={t("fullName")} rules={[{ required: true, min: 2 }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="idNumber" label={t("idNumber")} rules={[{ required: true, min: 5 }]}>
            <Input size="large" inputMode="numeric" maxLength={20} />
          </Form.Item>
          <Form.Item name="idExpiry" label={t("idExpiry")} rules={[{ required: true }]}>
            <DatePicker size="large" className="w-full" format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="address" label={t("address")} rules={[{ required: true, min: 3 }]}>
            <Input size="large" />
          </Form.Item>
        </>
      )}

      <Button type="primary" size="large" htmlType="submit" block loading={loading}>
        {t("submit")}
      </Button>
    </Form>
  );
};
