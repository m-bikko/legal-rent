---
title: Архитектура Web MVP
type: concept
tags: [architecture, monorepo, nextjs]
created: 2026-07-04
updated: 2026-07-04
sources: [docs/superpowers/specs/2026-07-04-web-mvp-design.md]
---

# Архитектура

Монорепо (pnpm workspaces + Turborepo), спроектировано с прицелом на будущее мобильное приложение (React Native/Expo переиспользует `packages/*`).

```
apps/web              # Next.js 15 App Router + antd v5 + Tailwind + React Query
packages/core         # доменные типы (zod), телефоны KZ, OTP, статусы, верификация
packages/i18n         # словари ru/kk/en (next-intl)
db/                   # SQL-миграции + apply.mjs (pg, POSTGRES_URL_NON_POOLING)
```

## Ключевой принцип: данные только через сервер

Браузер никогда не обращается к Supabase напрямую. Все чтения/мутации идут через Next.js Route Handlers (`apps/web/src/app/api/**`), где используется service-role ключ ([[database]]). Сессия — httpOnly JWT cookie (jose, секрет `SUPABASE_JWT_SECRET`), см. [[auth-flow]].

Единый контракт API: `{ ok: true, data } | { ok: false, error: { code } }`; коды ошибок переводятся на клиенте через словари i18n (`errors.<code>`).

## Слои apps/web

- `src/server/` — db-клиент и мапперы snake_case→camelCase, session, api-хелперы (`handle`/`requireUser`/`parseBody`), `OtpSender`
- `src/app/api/` — route handlers
- `src/app/[locale]/(auth|app)/` — страницы; `(app)`-layout проверяет сессию и отдаёт `UserProvider`
- `src/components/` — UI: shell (TabBar mobile / TopNav desktop), listings, property, agreement, verification
- `src/lib/` — api-client, React Query hooks, форматтеры

## Особенности

- `@rentlegal/core/otp` — отдельный entrypoint (использует node:crypto, нельзя тянуть в клиентский бандл через barrel).
- next-intl: локаль в URL (`/kk/...`), `localePrefix: as-needed` (ru без префикса).
- UI mobile-first: нижний TabBar (<md), верхняя навигация (≥md).

## См. также

- [[property]], [[rental-agreement]], [[verification]]
- [[mvp-scope-decisions]] — почему именно так
