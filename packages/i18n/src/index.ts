import ru from "./ru.json";
import kk from "./kk.json";
import en from "./en.json";

export const locales = ["ru", "kk", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export type Messages = typeof ru;

const messages: Record<Locale, Messages> = { ru, kk, en };

export const getMessages = (locale: Locale): Messages => messages[locale];
