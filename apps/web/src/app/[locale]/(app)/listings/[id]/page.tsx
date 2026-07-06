"use client";

import { use } from "react";
import { Skeleton, Tag, Typography, Result } from "antd";
import { Phone, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatKzPhone } from "@rentlegal/core";
import { useListing } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { LikeButton } from "@/components/listings/like-button";
import { PhotoCarousel } from "@/components/listings/photo-carousel";
import { TwoGisPreview } from "@/components/listings/two-gis-preview";

// Кастомная зелёная кнопка WhatsApp — фирменный цвет мессенджера
const waGreen = "#25D366";

type Props = { params: Promise<{ id: string }> };

const ListingDetailsPage = ({ params }: Props) => {
  const { id } = use(params);
  const t = useTranslations("property");
  const tCommon = useTranslations("common");
  const tCities = useTranslations("cities");
  const { data: p, isLoading, isError } = useListing(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton.Image active className="!h-64 !w-full !rounded-2xl" />
        <Skeleton active className="mt-4" paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (isError || !p) return <Result status="404" title={tCommon("loading")} />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl">
        <PhotoCarousel
          photos={p.photos}
          alt={p.address}
          heightClass="h-72"
          arrows
          autoplay
          preview
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography.Title level={3} className="!mb-1">
            {formatPrice(p.price)}
            <span className="text-base font-normal text-gray-500">
              /{t(`rentPeriod.${p.rentPeriod}` as "rentPeriod.month")}
            </span>
          </Typography.Title>
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{t(`types.${p.type}` as "types.apartment")}</Tag>
            <Typography.Text type="secondary">
              {tCities.has(p.city) ? tCities(p.city) : p.city}
            </Typography.Text>
          </div>
        </div>
        <LikeButton
          propertyId={p.id}
          isLiked={Boolean(p.isLiked)}
          className="shrink-0 border border-gray-200 !bg-white"
        />
      </div>

      <div>
        <Typography.Text type="secondary" className="text-sm">
          {t("address")}
        </Typography.Text>
        <Typography.Paragraph className="!mb-0">{p.address}</Typography.Paragraph>
      </div>

      {p.gisUrl && <TwoGisPreview gisUrl={p.gisUrl} address={p.address} />}

      {p.description && (
        <div>
          <Typography.Text type="secondary" className="text-sm">
            {t("description")}
          </Typography.Text>
          <Typography.Paragraph className="!mb-0 whitespace-pre-line">
            {p.description}
          </Typography.Paragraph>
        </div>
      )}

      {/* Контакты: список под описанием, разделён на звонки и WhatsApp */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <Typography.Text strong className="mb-3 block">
          {t("contacts")}
        </Typography.Text>

        {p.contactPhones.length > 0 && (
          <div className="mb-3">
            <Typography.Text type="secondary" className="mb-2 block text-sm">
              {t("callPhones")}
            </Typography.Text>
            <div className="flex flex-col gap-2">
              {p.contactPhones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-[#0F6B4E]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F6B4E]/10 text-[#0F6B4E]">
                    <Phone size={18} />
                  </span>
                  <span className="font-medium">{formatKzPhone(phone)}</span>
                  <span className="ml-auto text-sm text-[#0F6B4E]">{tCommon("call")}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {p.whatsappPhones.length > 0 && (
          <div>
            <Typography.Text type="secondary" className="mb-2 block text-sm">
              {t("whatsappPhones")}
            </Typography.Text>
            <div className="flex flex-col gap-2">
              {p.whatsappPhones.map((phone) => (
                <a
                  key={phone}
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-[#25D366]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: waGreen }}
                  >
                    <MessageCircle size={18} />
                  </span>
                  <span className="font-medium">{formatKzPhone(phone)}</span>
                  <span className="ml-auto text-sm" style={{ color: waGreen }}>
                    {tCommon("whatsapp")}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDetailsPage;
