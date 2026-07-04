"use client";

import "@ant-design/v5-patch-for-react-19";
import { useState, type ReactNode } from "react";
import { ConfigProvider, App as AntApp } from "antd";
import ruRU from "antd/locale/ru_RU";
import kkKZ from "antd/locale/kk_KZ";
import enUS from "antd/locale/en_US";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Locale } from "@rentlegal/i18n";
import { themeConfig } from "@/theme";

const antdLocales = { ru: ruRU, kk: kkKZ, en: enUS } as const;

type Props = { children: ReactNode; locale: Locale };

export const Providers = ({ children, locale }: Props) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeConfig} locale={antdLocales[locale]}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
};
