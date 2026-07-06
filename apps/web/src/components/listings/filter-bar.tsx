"use client";

import { useState } from "react";
import { Badge, Button, Drawer, InputNumber, Segmented, Select, Space } from "antd";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { PropertyType, RentPeriod, type ListingsQuery } from "@rentlegal/core";
import { CitySelect } from "@/components/city-select";

export type ListingFilters = Partial<ListingsQuery>;

type Props = { value: ListingFilters; onChange: (next: ListingFilters) => void };

export const FilterBar = ({ value, onChange }: Props) => {
  const t = useTranslations("listings");
  const tProp = useTranslations("property");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ListingFilters>(value);

  const activeCount = [value.type, value.priceMin, value.priceMax, value.rentPeriod].filter(
    (v) => v !== undefined,
  ).length;

  const openDrawer = () => {
    setDraft(value);
    setOpen(true);
  };

  const apply = () => {
    onChange({ ...draft, city: value.city });
    setOpen(false);
  };

  const reset = () => {
    setDraft({ city: value.city });
    onChange({ city: value.city });
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <CitySelect
        allowAll
        allLabel={t("allKz")}
        size="middle"
        className="min-w-0 flex-1 md:max-w-60"
        value={value.city ?? ""}
        onChange={(city) =>
          onChange({ ...value, city: (city || undefined) as ListingFilters["city"] })
        }
      />
      <Badge count={activeCount} size="small" color="#0F6B4E">
        <Button icon={<SlidersHorizontal size={16} />} onClick={openDrawer}>
          {t("filters")}
        </Button>
      </Badge>

      <Drawer
        title={t("filters")}
        placement="bottom"
        height="auto"
        open={open}
        onClose={() => setOpen(false)}
        styles={{ body: { paddingBottom: 24 } }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 text-sm text-gray-500">{t("propertyType")}</div>
            <Select
              allowClear
              className="w-full"
              placeholder={t("anyType")}
              value={draft.type}
              onChange={(type) => setDraft({ ...draft, type })}
              options={PropertyType.options.map((v) => ({
                value: v,
                label: tProp(`types.${v}` as "types.apartment"),
              }))}
            />
          </div>

          <div>
            <div className="mb-1 text-sm text-gray-500">
              {t("priceFrom")} — {t("priceTo")}
            </div>
            <Space.Compact className="w-full">
              <InputNumber
                className="!w-1/2"
                min={0}
                placeholder={t("priceFrom")}
                value={draft.priceMin}
                onChange={(v) => setDraft({ ...draft, priceMin: v ?? undefined })}
              />
              <InputNumber
                className="!w-1/2"
                min={0}
                placeholder={t("priceTo")}
                value={draft.priceMax}
                onChange={(v) => setDraft({ ...draft, priceMax: v ?? undefined })}
              />
            </Space.Compact>
          </div>

          <div>
            <div className="mb-1 text-sm text-gray-500">{t("rentPeriod")}</div>
            <Segmented
              block
              value={draft.rentPeriod ?? ""}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  rentPeriod: (v || undefined) as ListingFilters["rentPeriod"],
                })
              }
              options={[
                { label: t("anyPeriod"), value: "" },
                ...RentPeriod.options.map((v) => ({
                  label: tProp(`rentPeriod.${v}` as "rentPeriod.month"),
                  value: v,
                })),
              ]}
            />
          </div>

          <div className="mt-2 flex gap-2">
            <Button block onClick={reset}>
              {tCommon("reset")}
            </Button>
            <Button block type="primary" onClick={apply}>
              {tCommon("apply")}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
