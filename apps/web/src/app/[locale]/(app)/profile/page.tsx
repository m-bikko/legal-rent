"use client";

import { Alert, Button, Card, Descriptions, Tag, Typography, App } from "antd";
import { BadgeCheck, ChevronRight, KeyRound, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { formatKzPhone } from "@rentlegal/core";
import { Link, useRouter } from "@/i18n/navigation";
import { apiPost } from "@/lib/api-client";
import { useUser } from "@/components/shell/user-context";
import { LangSwitcher } from "@/components/shell/lang-switcher";
import { MyAgreements } from "@/components/agreement/my-agreements";

const ProfilePage = () => {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tCities = useTranslations("cities");
  const user = useUser();
  const router = useRouter();
  const qc = useQueryClient();
  const { modal } = App.useApp();

  const displayName =
    user.accountType === "organization" ? user.orgName : user.fullName;

  const verificationTag = {
    none: <Tag>{t("notVerified")}</Tag>,
    pending: <Tag color="processing">{t("pendingVerification")}</Tag>,
    approved: (
      <Tag color="success" className="!flex !items-center gap-1">
        <BadgeCheck size={14} />
        {t("verified")}
      </Tag>
    ),
    rejected: <Tag color="error">{t("rejectedVerification")}</Tag>,
  }[user.verificationStatus];

  const accountTypeLabel = {
    individual: tAuth("accountTypeIndividual"),
    self_employed: tAuth("accountTypeSelf"),
    organization: tAuth("accountTypeOrg"),
  }[user.accountType];

  const logout = () => {
    modal.confirm({
      title: tCommon("logout"),
      okText: tCommon("logout"),
      cancelText: tCommon("cancel"),
      onOk: async () => {
        await apiPost("/api/auth/logout");
        qc.clear();
        router.replace("/auth");
        router.refresh();
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <Typography.Title level={4} className="!mb-0 md:!text-2xl">
        {t("title")}
      </Typography.Title>

      <Card styles={{ body: { padding: 20 } }}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Typography.Title level={5} className="!mb-0">
            {displayName}
          </Typography.Title>
          {verificationTag}
        </div>
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: "phone", label: t("phone"), children: formatKzPhone(user.phone) },
            {
              key: "city",
              label: t("city"),
              children: tCities.has(user.city) ? tCities(user.city) : user.city,
            },
            { key: "type", label: t("accountType"), children: accountTypeLabel },
          ]}
        />
      </Card>

      {user.role === "tenant" && (
        <Link href="/profile/verification" className="block">
          <Card hoverable styles={{ body: { padding: 20 } }}>
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F6B4E]/10 text-[#0F6B4E]">
                <KeyRound size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <Typography.Text strong className="block">
                  {t("becomeLandlord")}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-sm">
                  {t("becomeLandlordHint")}
                </Typography.Text>
              </div>
              <ChevronRight size={20} className="shrink-0 text-gray-400" />
            </div>
          </Card>
        </Link>
      )}

      {user.role === "landlord" &&
        (user.verificationStatus === "none" || user.verificationStatus === "rejected") && (
          <Alert
            type="warning"
            showIcon
            message={t("verificationRequired")}
            action={
              <Link href="/profile/verification">
                <Button size="small" type="primary">
                  {t("verificationCta")}
                </Button>
              </Link>
            }
          />
        )}

      {user.role === "landlord" && user.verificationStatus === "pending" && (
        <Alert type="info" showIcon message={t("verificationPendingInfo")} />
      )}

      <MyAgreements />

      <Card styles={{ body: { padding: 20 } }}>
        <div className="flex items-center justify-between gap-3">
          <Typography.Text>{t("language")}</Typography.Text>
          <LangSwitcher />
        </div>
      </Card>

      <Button danger icon={<LogOut size={16} />} size="large" onClick={logout}>
        {tCommon("logout")}
      </Button>
    </div>
  );
};

export default ProfilePage;
