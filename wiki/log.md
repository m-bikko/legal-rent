# Лог операций wiki

## [2026-07-06] feat | Админ-панель + демо-данные

Создана [[admin-panel]] (роль admin, дашборд, модерация верификаций), обновлён index. Seed: db/seed.mjs, креды — docs/demo-accounts.md.

## [2026-07-05] feat | График платежей договора

Обновлена [[rental-agreement]]: installments, статусы по окну оплаты, права на отметку. Миграция 0002 (payment_installments), core: addPeriod/installmentStatus.

## [2026-07-05] feat | Ограничение самозанятых жилой недвижимостью + UX-правки деталей

Обновлены [[tax-logic]] и [[property]] (риск №1 ТЗ закрыт: core-правило + сервер + форма). UX страницы объекта: контакты списком под описанием (без sticky), лайк в строке цены.

## [2026-07-04] init | Создание базы знаний

Scaffold wiki + страницы: auth-flow, property, rental-agreement, verification, architecture, database, tax-logic, tz-summary, mvp-scope-decisions. Синхронно с первым релизом Web MVP (спека `docs/superpowers/specs/2026-07-04-web-mvp-design.md`).
