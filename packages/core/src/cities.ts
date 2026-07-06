/** Идентификаторы городов; отображаемые названия — в словарях i18n (ключи cities.<id>). */
export const CITY_IDS = [
  "almaty",
  "astana",
  "shymkent",
  "karaganda",
  "aktobe",
  "taraz",
  "pavlodar",
  "oskemen",
  "semey",
  "atyrau",
  "kostanay",
  "kyzylorda",
  "oral",
  "petropavl",
  "aktau",
  "temirtau",
  "turkistan",
  "kokshetau",
  "taldykorgan",
  "ekibastuz",
] as const;

export type CityId = (typeof CITY_IDS)[number];
