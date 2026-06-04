import type { z } from "zod";
import {
  UsageWindowGroupSchema,
  UsageWindowSchema,
} from "@/schemas/codex-usage";

export const WEEKLY_WINDOW_MINUTES = 7 * 24 * 60;

export type UsageWindow = z.infer<typeof UsageWindowSchema>;
export type UsageWindowGroup = z.infer<typeof UsageWindowGroupSchema>;
