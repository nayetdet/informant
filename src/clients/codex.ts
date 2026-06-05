import type { ZodType } from "zod";
import { CodexAppServerClient } from "@/clients/codex-app-server";
import { CodexAuthClient } from "@/clients/codex-auth";

export class CodexClient {
  private readonly appServerClient: CodexAppServerClient;

  private constructor(appServerClient: CodexAppServerClient) {
    this.appServerClient = appServerClient;
  }

  static async create(): Promise<CodexClient> {
    await CodexAuthClient.ensureAuthenticatedSession();
    return new CodexClient(new CodexAppServerClient());
  }

  async send<T>(
    method: string,
    params: unknown,
    resultSchema: ZodType<T>,
  ): Promise<T> {
    return this.appServerClient.send(method, params, resultSchema);
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.appServerClient[Symbol.asyncDispose]();
  }
}
