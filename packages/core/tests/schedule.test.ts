import { addPeriod, installmentStatus } from "../src/schedule";

const d = (iso: string) => new Date(iso);

describe("addPeriod", () => {
  it("adds hours by exact milliseconds", () => {
    expect(addPeriod(d("2026-07-05T14:00:00Z"), "hour", 3).toISOString()).toBe(
      "2026-07-05T17:00:00.000Z",
    );
  });

  it("adds days by exact milliseconds", () => {
    expect(addPeriod(d("2026-07-05T00:00:00Z"), "day", 10).toISOString()).toBe(
      "2026-07-15T00:00:00.000Z",
    );
  });

  it("adds calendar months keeping day of month", () => {
    expect(addPeriod(d("2026-07-05T00:00:00Z"), "month", 2).toISOString()).toBe(
      "2026-09-05T00:00:00.000Z",
    );
  });

  it("clamps day for shorter target month (Jan 31 + 1mo = Feb 28)", () => {
    expect(addPeriod(d("2026-01-31T00:00:00Z"), "month", 1).toISOString()).toBe(
      "2026-02-28T00:00:00.000Z",
    );
  });

  it("handles year rollover and negative months", () => {
    expect(addPeriod(d("2026-12-15T00:00:00Z"), "month", 2).toISOString()).toBe(
      "2027-02-15T00:00:00.000Z",
    );
    expect(addPeriod(d("2026-03-31T00:00:00Z"), "month", -1).toISOString()).toBe(
      "2026-02-28T00:00:00.000Z",
    );
  });
});

describe("installmentStatus", () => {
  const dueAt = d("2026-08-01T00:00:00Z");
  const createdAt = d("2026-06-20T00:00:00Z"); // окно месячного платежа: 01.07–01.08

  const at = (now: string) =>
    installmentStatus({ dueAt, paidAt: null }, "month", createdAt, d(now));

  it("paid wins over everything", () => {
    expect(
      installmentStatus({ dueAt, paidAt: d("2026-09-09T00:00:00Z") }, "month", createdAt, d("2026-09-10T00:00:00Z")),
    ).toBe("paid");
  });

  it("overdue after the deadline", () => {
    expect(at("2026-08-01T00:00:01Z")).toBe("overdue");
  });

  it("upcoming when >=25% of the window remains", () => {
    expect(at("2026-07-02T00:00:00Z")).toBe("upcoming");
  });

  it("warning25 when <25% of the window remains (месяц: ~7.5 дней)", () => {
    // окно 01.07–01.08 (31 день); 25% = 7.75 дня; 26.07 → осталось 6 дней
    expect(at("2026-07-26T00:00:00Z")).toBe("warning25");
  });

  it("critical10 when <10% of the window remains (месяц: ~3 дня)", () => {
    // 10% от 31 дня = 3.1 дня; 29.07 12:00 → осталось 2.5 дня
    expect(at("2026-07-29T12:00:00Z")).toBe("critical10");
  });

  it("clamps window start by schedule creation for the first installment", () => {
    // график создан за 2 часа до дедлайна: окно = 2 часа, осталось 29 мин (24.2%) → warning25
    const created = d("2026-07-31T22:00:00Z");
    expect(
      installmentStatus({ dueAt, paidAt: null }, "month", created, d("2026-07-31T23:31:00Z")),
    ).toBe("warning25");
  });

  it("hour unit: 15 min = warning25 threshold, 6 min = critical10", () => {
    const due = d("2026-07-05T15:00:00Z");
    const created = d("2026-07-01T00:00:00Z");
    const status = (now: string) =>
      installmentStatus({ dueAt: due, paidAt: null }, "hour", created, d(now));
    expect(status("2026-07-05T14:30:00Z")).toBe("upcoming"); // 30 мин из часа
    expect(status("2026-07-05T14:50:00Z")).toBe("warning25"); // 10 мин
    expect(status("2026-07-05T14:57:00Z")).toBe("critical10"); // 3 мин
  });
});
