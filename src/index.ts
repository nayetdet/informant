import { buildNotificationMessage } from "@/factories/notification.factory";
import { logger } from "@/lib/logger";
import { CodexUsageService } from "@/services/codex-usage.service";
import { NotificationService } from "@/services/notification.service";

async function main(): Promise<void> {
  try {
    const codexUsageService = new CodexUsageService();
    if (await codexUsageService.isResetTimeChanged()) {
      const window = await codexUsageService.getCurrentUsageWindow();
      await new NotificationService().notify(buildNotificationMessage(window));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ err: error }, message);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  void main();
}
