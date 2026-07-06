"use client";

import { Input } from "antd";
import type { ChangeEvent } from "react";

/**
 * Ввод казахстанского мобильного номера с маской +7 7XX XXX XX XX.
 * value — отображаемая строка; нормализация в E.164 — через normalizeKzPhone при сабмите.
 */
type Props = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: "middle" | "large";
  id?: string;
};

const formatDisplay = (raw: string): string => {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits && !digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, 11);
  if (!digits) return "";

  const rest = digits.slice(1);
  let out = "+7";
  if (rest.length > 0) out += ` ${rest.slice(0, 3)}`;
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`;
  if (rest.length > 6) out += ` ${rest.slice(6, 8)}`;
  if (rest.length > 8) out += ` ${rest.slice(8, 10)}`;
  return out;
};

export const PhoneInput = ({ value, onChange, placeholder, size = "large", id }: Props) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(formatDisplay(e.target.value));
  };

  return (
    <Input
      id={id}
      inputMode="tel"
      autoComplete="tel"
      size={size}
      value={value}
      onChange={handleChange}
      placeholder={placeholder ?? "+7 7__ ___ __ __"}
      maxLength={16}
    />
  );
};
