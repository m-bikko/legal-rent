/**
 * Нормализует пользовательский ввод в E.164 (+77XXXXXXXXX).
 * Принимает форматы: 87071234567, +7 707..., 7071234567, 77071234567.
 * Мобильные номера Казахстана начинаются с +7 7XX. Возвращает null, если номер не КЗ-мобильный.
 */
export const normalizeKzPhone = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, "");
  let ten: string;
  if (digits.length === 11 && (digits.startsWith("8") || digits.startsWith("7"))) {
    ten = digits.slice(1);
  } else if (digits.length === 10) {
    ten = digits;
  } else {
    return null;
  }
  return /^7\d{9}$/.test(ten) ? `+7${ten}` : null;
};

/** Форматирует E.164 в отображаемый вид: +7 707 123 45 67. */
export const formatKzPhone = (e164: string): string =>
  e164.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, "+7 $1 $2 $3 $4");
