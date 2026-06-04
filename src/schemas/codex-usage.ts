import { z } from "zod";

export const UsageWindowSchema = z.object({
  usedPercent: z.number().int(),
  resetsAt: z.number().int().nullable(),
  windowDurationMins: z.number().int().nullable(),
});

export const UsageWindowGroupSchema = z.object({
  primary: UsageWindowSchema.nullable(),
  secondary: UsageWindowSchema.nullable(),
});

export const UsageLimitsResponseSchema = z.object({
  rateLimits: UsageWindowGroupSchema,
  rateLimitsByLimitId: z
    .record(z.string(), UsageWindowGroupSchema)
    .nullable()
    .optional(),
});

export const AppServerInitResultSchema = z.object({
  codexHome: z.string(),
  platformFamily: z.string(),
  platformOs: z.string(),
  userAgent: z.string(),
});
