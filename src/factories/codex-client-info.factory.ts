import type { CodexClientInfo } from "@/types/codex-client";

export async function buildCodexClientInfo(): Promise<CodexClientInfo> {
  const packageJson: CodexClientInfo = (await Bun.file(
    new URL("../../package.json", import.meta.url),
  ).json()) as CodexClientInfo;

  return {
    name: packageJson.name,
    version: packageJson.version,
  };
}
