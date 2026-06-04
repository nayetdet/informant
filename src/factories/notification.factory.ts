import dedent from "dedent";
import { env } from "@/lib/env";
import { type UsageWindow } from "@/types/codex-usage";

export function buildNotificationMessage(usageWindow: UsageWindow): string {
  const expiresAt =
    usageWindow.resetsAt === null
      ? "Desconhecido"
      : new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "medium",
          ...(env.TZ === undefined ? {} : { timeZone: env.TZ }),
        }).format(new Date(usageWindow.resetsAt * 1000));

  return dedent`
    🤖 Informant — Consumo do Codex

    A cota do Codex foi resetada. Aqui estão os valores atuais:

    📊 Uso: ${usageWindow.usedPercent}%
    ⏳ Expira em: ${expiresAt}
  `;
}
