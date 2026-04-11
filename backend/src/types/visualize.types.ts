export interface ExecutionStep {
  step: number;
  line: number;
  variables: Record<string, unknown>;
  output?: string;
  stack?: string[];
  changedVariables?: string[];
}

export interface VisualizeResponse {
  success: boolean;
  execution: ExecutionStep[];
}
