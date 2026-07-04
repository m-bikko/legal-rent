"use client";

import { use } from "react";
import { Button, Carousel, Image, Skeleton, Tag, Typography, Result } from "antd";
import { Phone, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatKzPhone } from "@rentlegal/core";
import { useListing } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { LikeButton } from "@/components/listings/like-button";
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
    <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-24 md:pb-0">
      <div className="relative overflow-hidden rounded-2xl">
        {p.photos.length > 0 ? (
          <Image.PreviewGroup>
            <Carousel dots swipeToSlide draggable>
              {p.photos.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt={p.address}
                  width="100%"
                  className="!h-72 w-full object-cover"
                  rootClassName="!block"
                />
              ))}
            </Carousel>
          </Image.PreviewGroup>
        ) : (
          <div className="flex h-72 w-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-400">
            <ImageOff size={36} />
            <span className="text-sm">{t("noPhotos")}</span>
          </div>
        )}
        <LikeButton
          propertyId={p.id}
          isLiked={Boolean(p.isLiked)}
          className="absolute right-3 top-3 z-10"
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

      {/* Контакты: sticky-панель на мобильных, обычный блок на десктопе */}
      <div className="fixed inset-x-0 bottom-16 z-10 border-t border-gray-200 bg-white/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur md:static md:rounded-2xl md:border md:bg-white md:p-4">
        <Typography.Text type="secondary" className="mb-2 hidden text-sm md:block">
          {t("contacts")}
        </Typography.Text>
        <div className="flex flex-col gap-2 sm:flex-row">
          {p.contactPhones[0] && (
            <Button
              type="primary"
              size="large"
              block
              icon={<Phone size={18} />}
              href={`tel:${p.contactPhones[0]}`}
            >
              {tCommon("call")} {formatKzPhone(p.contactPhones[0])}
            </Button>
          )}
          {p.whatsappPhones[0] && (
            <Button
              size="large"
              block
              href={`https://wa.me/${p.whatsappPhones[0].replace(/\D/g, "")}`}
              target="_blank"
              style={{ background: waGreen, borderColor: waGreen, color: "#fff" }}
            >
              {tCommon("whatsapp")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsPage;
