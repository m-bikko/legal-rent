# RentLegal KZ — платформа легальной аренды недвижимости

Web MVP: объявления, лайки, верификация арендодателей, публикация объектов, договор аренды с двусторонним подписанием. Полное ТЗ — [TZ_platforma_arenda_kz_v1.1.md](TZ_platforma_arenda_kz_v1.1.md), спека MVP — [docs/superpowers/specs/2026-07-04-web-mvp-design.md](docs/superpowers/specs/2026-07-04-web-mvp-design.md).

## Стек

- **Монорепо**: pnpm workspaces + Turborepo
- **apps/web**: Next.js 15 (App Router), ant-design v5, Tailwind v4, React Query, next-intl (ru/kk/en)
- **packages/core**: доменные типы (zod), KZ-телефоны, OTP-логика, правила статусов и верификации
- **packages/i18n**: словари трёх языков (тест на идентичность ключей)
- **БД**: Supabase (Postgres + Storage), доступ только с сервера через service-role, RLS «запретить всё»

## Запуск

```bash
pnpm install
pnpm db:migrate        # применить миграции из db/migrations
pnpm dev               # dev-серверы (web: http://localhost:3000)
pnpm test              # юнит-тесты core + i18n
pnpm build             # production build
```

Переменные окружения — в `.env` в корне (симлинк в `apps/web/.env`): ключи Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`) и Postgres (`POSTGRES_URL_NON_POOLING` — для миграций).

## Как это работает

- **Auth**: телефон +7 7XX → OTP. Сейчас dev-заглушка (код показывается на экране); замена на Telegram Gateway — реализация интерфейса `OtpSender` в `apps/web/src/server/otp-sender.ts`. Сессия — httpOnly JWT cookie.
- **Роли**: арендатор (объявления/сохранённые/профиль) и арендодатель (+ «Мои объекты»). Арендатор становится арендодателем через верификацию в профиле.
- **Верификация**: самозанятый (ИИН, удостоверение, адрес) или ИП/ТОО (файл уведомления, БИН, юр. адрес). На MVP подтверждается вручную: `update users set verification_status='approved' where phone='...'`.
- **Договор**: арендодатель привязывает арендатора по номеру → draft → обе стороны жмут «Подписать» → договор active, объект «В аренде» и скрыт из ленты. «Завершить аренду» возвращает «Свободен».

## База знаний

Архитектура и концепции проекта — в [wiki/index.md](wiki/index.md).
