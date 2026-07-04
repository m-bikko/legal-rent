"use client";

import { Tag, Typography } from "antd";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PropertyRow } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { PhotoCarousel } from "./photo-carousel";
import { LikeButton } from "./like-button";

type Props = { property: PropertyRow; showStatus?: boolean };

export const ListingCard = ({ property, showStatus = false }: Props) => {
  const tProp = useTranslations("property");
  const tCities = useTranslations("cities");

  return (
    <Link
      href={`/listings/${property.id}`}
      className="block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative">
        <PhotoCarousel photos={property.photos} alt={property.address} />
        <LikeButton
          propertyId={property.id}
          isLiked={Boolean(property.isLiked)}
          className="absolute right-3 top-3"
        />
        {showStatus && property.status !== "free" && (
          <Tag
            color={property.status === "rented" ? "blue" : "default"}
            className="!absolute left-3 top-3"
          >
            {tProp(`status.${property.status}` as "status.rented")}
          </Tag>
        )}
      </div>

      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <Typography.Text strong className="text-lg">
            {formatPrice(property.price)}
            <span className="text-sm font-normal text-gray-500">
              /{tProp(`rentPeriod.${property.rentPeriod}` as "rentPeriod.month")}
            </span>
          </Typography.Text>
          <Tag className="!mr-0">{tProp(`types.${property.type}` as "types.apartment")}</Tag>
        </div>
        <Typography.Text className="truncate">{property.address}</Typography.Text>
        <span className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={14} />
          {tCities.has(property.city) ? tCities(property.city) : property.city}
        </span>
      </div>
    </Link>
  );
};
