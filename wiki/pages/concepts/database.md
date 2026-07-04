---
title: База данных и Storage
type: concept
tags: [supabase, postgres, rls, storage]
created: 2026-07-04
updated: 2026-07-04
sources: [db/migrations/0001_init.sql]
---

# База данных (Supabase)

Проект Supabase `xmkfklhubdbtsocfwloh` (credentials в `.env`). Внимание: Supabase MCP в окружении разработчика подключён к **другому** проекту — миграции применяются напрямую через `pnpm db:migrate` (pg, `POSTGRES_URL_NON_POOLING`, реестр `_migrations`).

## Таблицы

| Таблица | Суть |
|---|---|
| `users` | phone (unique, E.164), role, account_type, verification_status |
| `otp_codes` | hash кода (sha256 code:phone:secret), expires_at, attempts, consumed |
| `verification_requests` | тип, данные формы (jsonb), файлы, статус |
| `properties` | владелец, тип, город, цена, rent_period, photos[], контакты, status |
| `favorites` | лайки (PK user_id+property_id) |
| `rental_agreements` | подписи сторон, status draft/active/ended; unique-индекс: один draft/active на объект |

## Безопасность

RLS включён на всех таблицах **без политик** — anon/authenticated не имеют доступа ни к чему. Сервер ходит через service-role (bypass RLS). Это осознанный контур MVP: публичное чтение объявлений можно открыть политиками позже. См. [[architecture]].

## Storage

- `property-photos` — public read, пути `{propertyId}/{uuid}.{ext}`
- `verification-docs` — приватный, доступ только через сервер

## См. также

- [[property]] — правила переходов статусов
- [[auth-flow]] — как OTP-строки живут в `otp_codes`
