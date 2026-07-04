---
title: Verification (верификация арендодателя)
type: entity
tags: [verification, kyc]
created: 2026-07-04
updated: 2026-07-04
sources: [packages/core/src/verification.ts, apps/web/src/app/api/verification/route.ts]
---

# Verification

Публикация объектов доступна только верифицированным арендодателям. Статусы: `none → pending → approved | rejected` (rejected — повторная подача).

## Типы (определяются по account_type, `requiredVerificationType`)

- **Самозанятый** (individual/self_employed): ИИН, ФИО (prefill), номер и срок удостоверения, адрес проживания
- **ИП/ТОО** (organization): файл уведомления о начале деятельности (приватный bucket `verification-docs`), ИИН/БИН (prefill), название (prefill), юр. адрес

## «Стать арендодателем»

Арендатор подаёт ту же форму из профиля; при сабмите его role → landlord (individual → self_employed), статус pending. Вкладка «Мои объекты» появляется сразу, публикация — после approve.

## Модерация на MVP

Ручная, админ-панели нет: `update users set verification_status='approved' where phone='...'` (+ статус в verification_requests). Автоматизация — следующие релизы.

## См. также

- [[tax-logic]] — почему у арендодателя-физлица обязателен статус
- [[property]] — гейт на публикацию
