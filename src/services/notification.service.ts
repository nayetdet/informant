import { Api } from "grammy";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export class NotificationService {
  private readonly telegramApi = new Api(env.TELEGRAM_BOT_TOKEN);

  async notify(message: string): Promise<void> {
    try {
      await this.telegramApi.sendMessage(env.TELEGRAM_BOT_CHAT_ID, message);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, `Failed to send Telegram notification: ${message}`);
      return;
    }
  }
}
