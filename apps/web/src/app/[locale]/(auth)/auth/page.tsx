"use client";

import { useState } from "react";
import { Button, Card, Typography } from "antd";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@rentlegal/core";
import { useRouter } from "@/i18n/navigation";
import { apiPost } from "@/lib/api-client";
import { RoleChoice } from "@/components/auth/role-choice";
import { RegisterForm, type RegisterDraft } from "@/components/auth/register-form";
import { LoginForm } from "@/components/auth/login-form";
import { OtpStep } from "@/components/auth/otp-step";

type Step =
  | { name: "choice" }
  | { name: "login" }
  | { name: "register"; role: UserRole }
  | { name: "otp"; flow: "login"; phone: string; devCode?: string }
  | { name: "otp"; flow: "register"; draft: RegisterDraft; devCode?: string };

const AuthPage = () => {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>({ name: "choice" });

  const finish = async () => {
    await qc.invalidateQueries({ queryKey: ["me"] });
    router.replace("/listings");
  };

  const confirmOtp = async (code: string) => {
    if (step.name !== "otp") return;
    if (step.flow === "register") {
      await apiPost("/api/auth/register", { ...step.draft, code });
    } else {
      await apiPost("/api/auth/verify-otp", { phone: step.phone, code });
    }
    await finish();
  };

  const back = () => {
    if (step.name === "otp" && step.flow === "register") {
      setStep({ name: "register", role: step.draft.role });
    } else if (step.name === "otp") {
      setStep({ name: "login" });
    } else {
      setStep({ name: "choice" });
    }
  };

  const titles: Record<string, string> = {
    choice: t("welcomeTitle"),
    login: t("loginTitle"),
    register: t("registerTitle"),
    otp: "",
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f6f7f6] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F6B4E] text-white">
            <ShieldCheck size={28} />
          </div>
          <Typography.Title level={3} className="!mb-0">
            RentLegal KZ
          </Typography.Title>
        </div>

        <Card styles={{ body: { padding: 24 } }}>
          {step.name !== "choice" && (
            <Button
              type="text"
              size="small"
              className="!mb-4 !px-1"
              icon={<ArrowLeft size={16} />}
              onClick={back}
            >
              {tCommon("back")}
            </Button>
          )}

          {titles[step.name] && (
            <Typography.Title level={4} className="!mb-5">
              {titles[step.name]}
            </Typography.Title>
          )}

          {step.name === "choice" && (
            <>
              <Typography.Paragraph type="secondary" className="!mb-4">
                {t("welcomeSubtitle")}
              </Typography.Paragraph>
              <RoleChoice onSelect={(role) => setStep({ name: "register", role })} />
              <div className="mt-5 text-center">
                <Typography.Text type="secondary">{t("haveAccount")} </Typography.Text>
                <Button type="link" className="!px-1" onClick={() => setStep({ name: "login" })}>
                  {t("login")}
                </Button>
              </div>
            </>
          )}

          {step.name === "register" && (
            <RegisterForm
              role={step.role}
              onCodeSent={(draft, devCode) =>
                setStep({ name: "otp", flow: "register", draft, devCode })
              }
            />
          )}

          {step.name === "login" && (
            <>
              <LoginForm
                onCodeSent={(phone, devCode) =>
                  setStep({ name: "otp", flow: "login", phone, devCode })
                }
              />
              <div className="mt-5 text-center">
                <Typography.Text type="secondary">{t("noAccount")} </Typography.Text>
                <Button type="link" className="!px-1" onClick={() => setStep({ name: "choice" })}>
                  {t("register")}
                </Button>
              </div>
            </>
          )}

          {step.name === "otp" && (
            <OtpStep
              phone={step.flow === "register" ? step.draft.phone : step.phone}
              flow={step.flow}
              devCode={step.devCode}
              onConfirm={confirmOtp}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
