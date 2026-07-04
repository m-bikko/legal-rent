"use client";

import { Empty, Skeleton, Typography } from "antd";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/lib/queries";
import { ListingCard } from "@/components/listings/listing-card";

const SavedPage = () => {
  const t = useTranslations("saved");
  const { data: items, isLoading } = useFavorites();

  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={4} className="!mb-0 md:!text-2xl">
        {t("title")}
      </Typography.Title>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !items || items.length === 0 ? (
        <Empty
          className="mt-16"
          description={
            <div>
              <div>{t("empty")}</div>
              <div className="text-sm text-gray-400">{t("emptyHint")}</div>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ListingCard key={p.id} property={p} showStatus />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPage;
