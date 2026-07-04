"use client";

import { Card, Typography, Alert, Result, Button } from "antd";
import { useTranslations } from "next-intl";
import { requiredVerificationType } from "@rentlegal/core";
import { Link } from "@/i18n/navigation";
import { useUser } from "@/components/shell/user-context";
import { VerificationForm } from "@/components/verification/verification-form";

const VerificationPage = () => {
  const t = useTranslations("verification");
  const user = useUser();
  const type = requiredVerificationType(user.accountType);

  if (user.verificationStatus === "pending") {
    return (
      <Result
        status="info"
        title={t("submittedTitle")}
        subTitle={t("submittedDesc")}
        extra={
          <Link href="/profile">
            <Button type="primary">{t("toProfile")}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div>
        <Typography.Title level={4} className="!mb-1">
          {type === "organization" ? t("typeOrg") : t("typeSelf")}
        </Typography.Title>
        <Typography.Text type="secondary">{t("typeHint")}</Typography.Text>
      </div>

      {user.verificationStatus === "rejected" && (
        <Alert type="warning" showIcon message={t("title")} />
      )}

      <Card styles={{ body: { padding: 24 } }}>
        <VerificationForm />
      </Card>
    </div>
  );
};

export default VerificationPage;
