import axios from 'axios';
import ts from 'typescript';

export const JUDGE0_API_URL = (
  process.env.JUDGE0_API_URL || 'http://34.131.167.198:2358'
).replace(/\/+$/g, '');

export const LANGUAGE_MAPPING: Record<string, number> = {
  javascript: 63,
  js: 63,
  typescript: 74,
  ts: 74,
  python: 71,
  python3: 71,
  java: 62,
  c: 50,
  'c++': 54,
  cpp: 54,
};

export const stripTypeScript = (source: string): string => {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2019,
      removeComments: false,
    },
    reportDiagnostics: false,
  });
  return result.outputText;
};

export const getPrimaryFunctionName = (source: string): string | null => {
  const match = source.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
  return match?.[1] || null;
};

const buildJavaScriptHarness = (functionName: string, stdin: string): string => {
  const escapedInput = JSON.stringify(stdin);
  const escapedFn = JSON.stringify(functionName);

  return `

const __algoInput = ${escapedInput};
const __algoFnName = ${escapedFn};

const __algoNormalized = __algoInput
  .replace(/([A-Za-z_$][\\w$]*\\s*=\\s*)/g, "")
  .trim();

const __algoArgs =
  __algoNormalized.length > 0
    ? eval("[" + __algoNormalized + "]")
    : [];

const __algoFn = eval(__algoFnName);
const __algoResult = __algoFn(...__algoArgs);

if (typeof __algoResult === "string") {
  console.log(__algoResult);
} else {
  console.log(JSON.stringify(__algoResult));
}
`;
};

export interface JudgeExecutionResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  statusId: number;
  statusDescription: string;
  success: boolean;
}

const decodeBase64Field = (value: string | null | undefined): string => {
  if (!value) return '';
  try {
    return Buffer.from(value, 'base64').toString('utf8');
  } catch {
    return value;
  }
};

export const executeJavaScript = async (
  sourceCode: string,
  stdin: string,
): Promise<JudgeExecutionResult> => {
  const preparedSource = stripTypeScript(sourceCode);

  const fnName = getPrimaryFunctionName(preparedSource);
  const hasDirectOutput = /console\.log|process\.stdout\.write/.test(preparedSource);
  const shouldInjectHarness = Boolean(stdin?.trim()) && Boolean(fnName) && !hasDirectOutput;

  let finalCode = preparedSource;
  if (shouldInjectHarness && fnName) {
    finalCode += buildJavaScriptHarness(fnName, stdin);
  }

  const encodedSourceCode = Buffer.from(finalCode, 'utf8').toString('base64');

  const response = await axios.post(
    `${JUDGE0_API_URL}/submissions/?base64_encoded=true&wait=true`,
    {
      source_code: encodedSourceCode,
      language_id: LANGUAGE_MAPPING.javascript,
      stdin: shouldInjectHarness && fnName ? '' : stdin || '',
    },
    { timeout: 25000 },
  );

  const data = response.data;

  if (!data.status) {
    throw new Error(`Judge0 returned an unexpected response: ${JSON.stringify(data)}`);
  }

  const success = data.status.id === 3;

  return {
    stdout: success ? decodeBase64Field(data.stdout) : '',
    stderr: success
      ? ''
      : decodeBase64Field(data.stderr) ||
        decodeBase64Field(data.compile_output) ||
        decodeBase64Field(data.message) ||
        data.status.description,
    compileOutput: decodeBase64Field(data.compile_output),
    statusId: data.status.id,
    statusDescription: data.status.description,
    success,
  };
};