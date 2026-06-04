import { CodexClient } from "@/clients/codex";
import {
  AppServerInitResultSchema,
  UsageLimitsResponseSchema,
} from "@/schemas/codex-usage";
import { buildCodexClientInfo } from "@/factories/codex-client-info.factory";
import { UsageWindowRepository } from "@/repositories/usage-window.repository";
import {
  WEEKLY_WINDOW_MINUTES,
  type UsageWindow,
  type UsageWindowGroup,
} from "@/types/codex-usage";

export class CodexUsageService {
  private readonly usageWindowRepository = new UsageWindowRepository();

  async isResetTimeChanged(): Promise<boolean> {
    const previousUsageWindow = await this.getPreviousUsageWindow();
    const currentUsageWindow = await this.getCurrentUsageWindow();
    await this.usageWindowRepository.save(currentUsageWindow);
    if (previousUsageWindow === null) {
      return false;
    }

    return previousUsageWindow.resetsAt !== currentUsageWindow.resetsAt;
  }

  async getPreviousUsageWindow(): Promise<UsageWindow | null> {
    return this.usageWindowRepository.get();
  }

  async getCurrentUsageWindow(): Promise<UsageWindow> {
    await using client = new CodexClient();
    await client.send(
      "initialize",
      { clientInfo: await buildCodexClientInfo() },
      AppServerInitResultSchema
    );

    const response = await client.send(
      "account/rateLimits/read",
      null,
      UsageLimitsResponseSchema,
    );

    const rateLimitGroup: UsageWindowGroup =
      response.rateLimitsByLimitId?.codex ??
      response.rateLimitsByLimitId?.default ??
      response.rateLimits;

    const windows: UsageWindow[] = [rateLimitGroup.primary, rateLimitGroup.secondary].filter(
      (window): window is UsageWindow => window !== null,
    );

    const window: UsageWindow | null =
      windows.find((window) => window.windowDurationMins === WEEKLY_WINDOW_MINUTES) ??
      windows.reduce<UsageWindow | null>((bestWindow, window) => {
        if (bestWindow === null) {
          return window;
        }

        const bestWindowDuration = bestWindow.windowDurationMins ?? -1;
        const windowDuration = window.windowDurationMins ?? -1;
        return windowDuration > bestWindowDuration ? window : bestWindow;
      }, null);

    if (window === null) {
      throw new Error("Codex App Server returned no rate limit windows");
    }

    if (window.resetsAt === null) {
      throw new Error("Codex App Server did not return a reset timestamp");
    }

    return window;
  }
}
