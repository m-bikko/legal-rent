"use client";

import { Card, Typography, App } from "antd";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { apiPost, apiUpload } from "@/lib/api-client";
import type { PropertyRow } from "@/lib/types";
import { PropertyForm, type PropertyFormValues } from "@/components/property/property-form";

const NewPropertyPage = () => {
  const t = useTranslations("myProperties");
  const router = useRouter();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const create = async (values: PropertyFormValues, photos: File[]) => {
    const { item } = await apiPost<{ item: PropertyRow }>("/api/properties", values);
    if (photos.length > 0) {
      const form = new FormData();
      for (const file of photos) form.append("photos", file);
      await apiUpload(`/api/properties/${item.id}/photos`, form);
    }
    await qc.invalidateQueries({ queryKey: ["my-properties"] });
    message.success(t("created"));
    router.replace(`/my-properties/${item.id}`);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <Typography.Title level={4} className="!mb-0">
        {t("addTitle")}
      </Typography.Title>
      <Card styles={{ body: { padding: 24 } }}>
        <PropertyForm submitLabel={t("add")} onSubmit={create} />
      </Card>
    </div>
  );
};

export default NewPropertyPage;
