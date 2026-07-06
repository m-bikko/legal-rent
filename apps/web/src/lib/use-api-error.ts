"use client";

import { useTranslations } from "next-intl";
import { ApiClientError } from "./api-client";

/** Превращает ошибку API в переводимое сообщение для пользователя. */
export const useApiErrorMessage = () => {
  const t = useTranslations("errors");
  return (err: unknown): string => {
    const code = err instanceof ApiClientError ? err.code : "unknown";
    return t.has(code) ? t(code) : t("unknown");
  };
};
