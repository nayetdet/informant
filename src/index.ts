import { CodexUsageService } from "@/services/codex-usage.service";

async function main(): Promise<void> {
  try {
    const codexUsageService = new CodexUsageService();
    const window = await codexUsageService.getCurrentUsageWindow();
    await codexUsageService.saveCurrentUsageWindow(window);
    console.log(window);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  void main();
}
