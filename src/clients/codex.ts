import { spawn, type ChildProcess } from "node:child_process";
import { createInterface, type Interface } from "node:readline";
import type { ZodType } from "zod";
import type {
  CodexExitState,
  CodexJsonRpcError,
  CodexJsonRpcRequest,
  CodexJsonRpcResponse,
  CodexPendingRequest,
} from "@/types/codex-client";

export class CodexClient {
  private readonly process: ChildProcess;
  private readonly stdin: NonNullable<ChildProcess["stdin"]>;
  private readonly stdout: Interface;
  private readonly pendingRequests = new Map<number, CodexPendingRequest>();
  private readonly exit: CodexExitState;
  private nextId = 1;
  private closed = false;

  constructor() {
    let resolveExit: CodexExitState["resolve"] = (): void => undefined;
    const exitPromise: Promise<void> = new Promise<void>(
      (promiseResolve: (value: void | PromiseLike<void>) => void): void => {
        resolveExit = (): void => {
          promiseResolve();
        };
      },
    );

    this.exit = {
      promise: exitPromise,
      resolve: (): void => {
        resolveExit();
      },
    };

    this.process = spawn("codex", ["app-server", "--stdio"], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    if (this.process.stdout === null) {
      throw new Error("Codex App Server did not expose stdout");
    }

    if (this.process.stdin === null) {
      throw new Error("Codex App Server did not expose stdin");
    }

    this.stdin = this.process.stdin;
    this.stdout = createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity,
    });

    this.stdout.on("line", (line: string): void => {
      this.handleLine(line);
    });

    this.process.on("exit", (code: number | null, signal: NodeJS.Signals | null): void => {
      this.failAllPending(
        signal != null
          ? new Error(`Codex App Server exited with signal ${signal}`)
          : new Error(`Codex App Server exited with code ${code ?? "unknown"}`),
      );
      this.exit.resolve();
    });

    this.process.on("error", (error: Error): void => {
      this.failAllPending(error instanceof Error ? error : new Error(String(error)));
      this.exit.resolve();
    });
  }

  async send<T>(
    method: string,
    params: unknown,
    resultSchema: ZodType<T>,
  ): Promise<T> {
    const response: unknown = await this.request(method, params);
    return resultSchema.parse(response);
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.close();
    await this.exit.promise;
  }

  private request(method: string, params: unknown): Promise<unknown> {
    this.assertOpen();
    const id: number = this.nextId++;
    const request: CodexJsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise<unknown>((resolve, reject) => {
      const pendingRequest: CodexPendingRequest = { resolve, reject };
      this.pendingRequests.set(id, pendingRequest);

      try {
        this.stdin.write(`${JSON.stringify(request)}\n`);
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private handleLine(line: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      this.failAllPending(new Error("Codex App Server returned an invalid message"));
      return;
    }

    if (typeof parsed !== "object" || parsed === null) {
      this.failAllPending(new Error("Codex App Server returned an invalid message"));
      return;
    }

    const response: CodexJsonRpcResponse = parsed as CodexJsonRpcResponse;
    if (response.id === undefined) {
      return;
    }

    const pendingRequest: CodexPendingRequest | undefined = this.pendingRequests.get(response.id);
    if (!pendingRequest) {
      return;
    }

    this.pendingRequests.delete(response.id);

    const error: CodexJsonRpcError | undefined = response.error;
    if (error !== undefined) {
      pendingRequest.reject(new Error(error.message));
      return;
    }

    const result: unknown = response.result;
    pendingRequest.resolve(result);
  }

  private failAllPending(error: Error): void {
    this.closed = true;
    this.stdout.close();
    for (const pendingRequest of this.pendingRequests.values()) {
      pendingRequest.reject(error);
    }

    this.pendingRequests.clear();
    if (!this.process.killed && this.process.exitCode === null && this.process.signalCode === null) {
      this.process.kill();
    }
  }

  private close(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.stdout.close();

    if (!this.process.killed) {
      this.process.kill();
    }
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new Error("Codex App Server is not running");
    }
  }
}
