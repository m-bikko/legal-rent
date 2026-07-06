/**
 * Точка отправки OTP. На MVP — dev-заглушка: код логируется и возвращается
 * в API-ответе (devCode). Для продакшена заменить на TelegramOtpSender
 * (Telegram Gateway API) — остальной код не меняется.
 */
export interface OtpSender {
  send(phone: string, code: string): Promise<void>;
  /** true → API отдаёт devCode клиенту для отображения в dev-панели. */
  readonly exposesCode: boolean;
}

class DevOtpSender implements OtpSender {
  readonly exposesCode = true;

  async send(phone: string, code: string): Promise<void> {
    console.info(`[OTP] ${phone} -> ${code}`);
  }
}

export const otpSender: OtpSender = new DevOtpSender();
