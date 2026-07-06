---
title: Property (объект недвижимости)
type: entity
tags: [property, listings, statuses]
created: 2026-07-04
updated: 2026-07-05
sources: [packages/core/src/property.ts, apps/web/src/app/api/properties]
---

# Property

Центральная сущность маркетплейса.

## Атрибуты

Тип (квартира/дом/дача/офис/коммерческое/здание/площадь), адрес, город (из фиксированного списка `CITY_IDS`, подписи в i18n), ссылка 2ГИС, цена, срок аренды (час/день/мес), описание, фото (до 10, Supabase Storage), номера для связи и WhatsApp (до 3 каждых).

## Статусы

`free` → `archived` → `free` — ручные переходы владельца.
`rented` — **только** через договор ([[rental-agreement]]): обе подписи → rented; завершение → free. Ручная установка запрещена (`canTransitionStatus` в core + серверная проверка, код ошибки `status_via_agreement_only`).

В публичной ленте показываются только `free`. В «Сохранённых» лайкнутые объекты видны с бейджем любого статуса.

## Публикация

Создавать объекты может только landlord с `verification_status = approved` ([[verification]]), иначе `verification_required`.

Самозанятым доступны только жилые типы (apartment/house/dacha) — `allowedPropertyTypesFor` в core, серверная проверка (`self_employed_residential_only`) и фильтр в форме. Обоснование — [[tax-logic]].

## См. также

- [[architecture]], [[database]]
