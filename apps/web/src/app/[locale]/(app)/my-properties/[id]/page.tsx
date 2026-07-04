"use client";

import { use, useState } from "react";
import { Button, Card, Result, Skeleton, Typography, App } from "antd";
import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { apiPatch, apiUpload } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/use-api-error";
import { useOwnedProperty } from "@/lib/queries";
import type { PropertyRow } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/property/status-badge";
import { PropertyForm, type PropertyFormValues } from "@/components/property/property-form";
import { PhotoCarousel } from "@/components/listings/photo-carousel";
import { AgreementSection } from "@/components/agreement/agreement-section";

type Props = { params: Promise<{ id: string }> };

const OwnedPropertyPage = ({ params }: Props) => {
  const { id } = use(params);
  const t = useTranslations("myProperties");
  const tProp = useTranslations("property");
  const tCommon = useTranslations("common");
  const qc = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const { message } = App.useApp();
  const { data, isLoading, isError } = useOwnedProperty(id);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (isError || !data) return <Result status="404" title={tCommon("loading")} />;

  const { item: p, agreement } = data;

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["owned-property", id] }),
      qc.invalidateQueries({ queryKey: ["my-properties"] }),
    ]);
  };

  const save = async (values: PropertyFormValues, photos: File[]) => {
    await apiPatch(`/api/properties/${id}`, values);
    if (photos.length > 0) {
      const form = new FormData();
      for (const file of photos) form.append("photos", file);
      await apiUpload(`/api/properties/${id}/photos`, form);
    }
    await invalidate();
    message.success(t("saved"));
    setEditing(false);
  };

  const setStatus = async (status: "free" | "archived") => {
    try {
      await apiPatch(`/api/properties/${id}`, { status });
      await invalidate();
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Typography.Title level={4} className="!mb-0 truncate">
          {editing ? t("editTitle") : p.address}
        </Typography.Title>
        <StatusBadge status={p.status} />
      </div>

      {editing ? (
        <Card styles={{ body: { padding: 24 } }}>
          <PropertyForm initial={p} submitLabel={tCommon("save")} onSubmit={save} />
          <Button block className="mt-3" onClick={() => setEditing(false)}>
            {tCommon("cancel")}
          </Button>
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl">
            <PhotoCarousel
              photos={p.photos}
              alt={p.address}
              heightClass="h-56"
              arrows
              autoplay
              preview
            />
          </div>

          <Card styles={{ body: { padding: 20 } }}>
            <div className="flex flex-col gap-2">
              <Typography.Text strong className="text-lg">
                {formatPrice(p.price)}
                <span className="text-sm font-normal text-gray-500">
                  /{tProp(`rentPeriod.${p.rentPeriod}` as "rentPeriod.month")}
                </span>
              </Typography.Text>
              <Typography.Text type="secondary">
                {tProp(`types.${p.type}` as "types.apartment")} · {p.address}
              </Typography.Text>
              {p.description && (
                <Typography.Paragraph className="!mb-0 whitespace-pre-line text-sm">
                  {p.description}
                </Typography.Paragraph>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button icon={<Pencil size={15} />} onClick={() => setEditing(true)}>
                {tCommon("edit")}
              </Button>
              {p.status === "free" && (
                <Button icon={<Archive size={15} />} onClick={() => void setStatus("archived")}>
                  {t("archive")}
                </Button>
              )}
              {p.status === "archived" && (
                <Button
                  icon={<ArchiveRestore size={15} />}
                  onClick={() => void setStatus("free")}
                >
                  {t("unarchive")}
                </Button>
              )}
            </div>
          </Card>

          {p.status !== "archived" && (
            <AgreementSection
              propertyId={p.id}
              propertyStatus={p.status}
              agreement={agreement}
            />
          )}
        </>
      )}
    </div>
  );
};

export default OwnedPropertyPage;
