export type CodexJsonRpcError = {
  code?: number;
  message: string;
  data?: unknown;
};

export type CodexJsonRpcResponse = {
  id?: number;
  result?: unknown;
  error?: CodexJsonRpcError;
};

export type CodexJsonRpcRequest = {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: unknown;
};

export type CodexPendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

export type CodexExitState = {
  promise: Promise<void>;
  resolve: () => void;
};

export type CodexClientInfo = {
  name: string;
  version: string;
};
