import { resolve } from "node:path";
import { JSONFilePreset } from "lowdb/node";
import type { Low } from "lowdb";
import type { UsageWindow } from "@/types/codex-usage";

export type UsageWindowData = {
  usageWindow: UsageWindow | null;
};

const DATABASE_PATH = resolve(process.cwd(), "data", ".usage-window.json");

export class UsageWindowRepository {
  private readonly databasePromise: Promise<Low<UsageWindowData>>;

  constructor() {
    this.databasePromise = JSONFilePreset<UsageWindowData>(DATABASE_PATH, {
      usageWindow: null,
    });
  }

  async get(): Promise<UsageWindow | null> {
    const db: Low<UsageWindowData> = await this.getDatabase();
    return db.data.usageWindow;
  }

  async save(usageWindow: UsageWindow): Promise<void> {
    const db: Low<UsageWindowData> = await this.getDatabase();
    db.data.usageWindow = usageWindow;
    await db.write();
  }

  private async getDatabase(): Promise<Low<UsageWindowData>> {
    return this.databasePromise;
  }
}
