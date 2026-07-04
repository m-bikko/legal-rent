"use client";

import { useState } from "react";
import { Empty, Skeleton, Typography } from "antd";
import { useTranslations } from "next-intl";
import { useListings } from "@/lib/queries";
import { FilterBar, type ListingFilters } from "@/components/listings/filter-bar";
import { ListingCard } from "@/components/listings/listing-card";

const ListingsPage = () => {
  const t = useTranslations("listings");
  const [filters, setFilters] = useState<ListingFilters>({});
  const { data: items, isLoading } = useListings(filters);

  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={4} className="!mb-0 md:!text-2xl">
        {t("title")}
      </Typography.Title>

      <FilterBar value={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <Skeleton.Image active className="!h-52 !w-full" />
              <div className="p-4">
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </div>
            </div>
          ))}
        </div>
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
            <ListingCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingsPage;
