import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { logger } from "@/lib/logger";

export class CodexAuthClient {
  private static readonly RETRY_DELAY_MS = 60_000;

  static async ensureAuthenticatedSession(): Promise<void> {
    if ((await this.runCodexCommand(["login", "status"], "pipe")) === 0) {
      return;
    }

    while (true) {
      const loginExitCode = await this.runCodexCommand(["login", "--device-auth"], "inherit");
      if (loginExitCode === 0 && (await this.runCodexCommand(["login", "status"], "pipe")) === 0) {
        return;
      }

      logger.warn(
        { loginExitCode },
        `Codex login did not complete successfully. Retrying in ${this.RETRY_DELAY_MS / 1000} seconds.`,
      );

      await delay(this.RETRY_DELAY_MS);
    }
  }

  private static async runCodexCommand(
    args: string[],
    stdio: "inherit" | "pipe",
  ): Promise<number> {
    return await new Promise<number>((resolve, reject): void => {
      const child = spawn("codex", args, {
        stdio: stdio === "inherit" ? "inherit" : ["ignore", "ignore", "ignore"],
      });

      child.on("error", (error: Error): void => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });

      child.on("exit", (code: number | null, signal: NodeJS.Signals | null): void => {
        if (signal !== null) {
          reject(new Error(`Codex command exited with signal ${signal}`));
          return;
        }

        resolve(code ?? 1);
      });
    });
  }
}
