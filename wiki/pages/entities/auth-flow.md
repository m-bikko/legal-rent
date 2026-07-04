---
title: Auth Flow
type: entity
tags: [auth, otp, session]
created: 2026-07-04
updated: 2026-07-04
sources: [apps/web/src/server/otp-service.ts, apps/web/src/server/session.ts]
---

# Auth Flow

Вход и регистрация только по казахстанскому мобильному номеру (+7 7XX) с OTP-кодом.

## Регистрация

Выбор роли («Хочу арендовать» / «Я арендодатель») → switch типа аккаунта:
- арендодатель: Самозанятый | ИП/ТОО (физлицо-арендодатель без статуса запрещено — см. [[tax-logic]])
- арендатор: Физлицо | ИП/ТОО

Поля: ФИО (или ИИН/БИН + название организации), город, телефон → OTP → аккаунт + сессия.

## OTP

- 6 цифр, TTL 5 минут, максимум 5 попыток, кулдаун повторной отправки 60 сек
- В БД хранится только hash `sha256(code:phone:secret)`
- Чистая логика проверки — `packages/core/src/otp.ts` (отдельный entrypoint `@rentlegal/core/otp`)
- **Dev-заглушка**: интерфейс `OtpSender` (apps/web/src/server/otp-sender.ts); текущая реализация возвращает `devCode` в API-ответ и показывает его в UI. Продакшен-замена — Telegram Gateway, меняется только этот модуль.

## Сессия

httpOnly JWT cookie `lr_session` (HS256, секрет `SUPABASE_JWT_SECRET`, 30 дней). `(app)`-layout на сервере читает сессию и редиректит на `/auth` без неё.

## Коды ошибок

`invalid_phone`, `user_not_found`, `user_exists`, `otp_cooldown`, `otp_invalid`, `otp_expired`, `otp_too_many_attempts`, `otp_consumed` — все переводятся в UI через i18n.

## См. также

- [[architecture]], [[verification]]
