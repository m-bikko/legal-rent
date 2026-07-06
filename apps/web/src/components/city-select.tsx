"use client";

import { Select } from "antd";
import { useTranslations } from "next-intl";
import { CITY_IDS } from "@rentlegal/core";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  allowAll?: boolean;
  allLabel?: string;
  size?: "middle" | "large";
  className?: string;
  placeholder?: string;
};

export const CitySelect = ({
  value,
  onChange,
  allowAll = false,
  allLabel,
  size = "large",
  className,
  placeholder,
}: Props) => {
  const t = useTranslations("cities");

  const options = [
    ...(allowAll ? [{ value: "", label: allLabel ?? "" }] : []),
    ...CITY_IDS.map((id) => ({ value: id, label: t(id) })),
  ];

  return (
    <Select
      size={size}
      className={className}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      showSearch
      optionFilterProp="label"
    />
  );
};
