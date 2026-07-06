import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Locale } from "@rentlegal/i18n";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import "../globals.css";

export const metadata: Metadata = {
  title: "RentLegal KZ",
  description: "Аренда недвижимости в Казахстане — легально и просто",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const generateStaticParams = () =>
  routing.locales.map((locale) => ({ locale }));

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const LocaleLayout = async ({ children, params }: Props) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <AntdRegistry>
          <NextIntlClientProvider>
            <Providers locale={locale as Locale}>{children}</Providers>
          </NextIntlClientProvider>
        </AntdRegistry>
      </body>
    </html>
  );
};

export default LocaleLayout;
