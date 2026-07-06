---
title: Admin Panel
type: entity
tags: [admin, moderation, dashboard]
created: 2026-07-06
updated: 2026-07-06
sources: [apps/web/src/app/api/admin, apps/web/src/app/[locale]/(app)/admin]
---

# Admin Panel

Роль `admin` в `users.role` (миграция 0003). Регистрация админом через API невозможна (core `UserRole` не включает admin) — учётка создаётся seed-скриптом/вручную в БД. Вход обычный: телефон + OTP.

## Доступ

- Вкладка «Админ» в навигации (только для role=admin), страница `/admin`.
- API `requireAdmin` (server/api.ts): 403 всем, кроме админа.

## Дашборд (`GET /api/admin/stats`)

Пользователи (всего/по ролям/по типу учётки/верифицировано), объекты (по статусам/городам/типам), договоры по статусам, платежи (оплачено из всего, просрочено = не оплачено и `due_at < now`, суммы получено/ожидается), заявки по статусам. Агрегация в JS по узким выборкам — на MVP-объёмах достаточно; при росте перевести на SQL-агрегаты.

## Модерация верификаций

- `GET /api/admin/verifications` — заявки (pending первыми), приватные документы отдаются как signed URL (1 час).
- `POST /api/admin/verifications/{id}` `{action: approve|reject}` — обновляет заявку **и** `users.verification_status`. Только для pending-заявок.

## Демо-данные

`db/seed.mjs` (идемпотентен) — аккаунты в `docs/demo-accounts.md`: админ, 2 арендодателя, 4 арендатора, 2 pending-кандидата, 5 свободных + 4 арендованных квартиры с графиками.

## См. также

- [[verification]] — что именно модерируется
- [[architecture]]
