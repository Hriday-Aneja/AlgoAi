import axios from 'axios';

const JUDGE0_API_URL = (
  process.env.JUDGE0_API_URL || 'http://34.131.167.198:2358'
).replace(/\/+$/g, '');

const LANGUAGE_MAPPING: Record<string, number> = {
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

const getPrimaryFunctionName = (source: string): string | null => {
  const match = source.match(/function\s+([A-Za-z_$][\\w$]*)\s*\(/);
  return match?.[1] || null;
};

const buildHarness = (functionName: string, stdin: string): string => {
  const escapedInput = JSON.stringify(stdin);
  const escapedFn = JSON.stringify(functionName);

  return `\n;(() => {\n  try {\n    const __algoInput = ${escapedInput};\n    const __algoFnName = ${escapedFn};\n    let __algoFn;\n    try { __algoFn = eval(__algoFnName); } catch (e) { __algoFn = globalThis[__algoFnName]; }\n    if (typeof __algoFn !== 'function') { throw new Error('Could not locate function ' + __algoFnName); }\n    const __algoNormalized = String(__algoInput).replace(/([A-Za-z_$][\\w$]*\\s*=\\s*)/g, '').trim();\n    const __algoArgs = __algoNormalized.length > 0 ? eval('[' + __algoNormalized + ']') : [];\n    const __algoResult = __algoFn(...__algoArgs);\n    if (typeof __algoResult === 'string') {\n      console.log(__algoResult);\n    } else {\n      console.log(JSON.stringify(__algoResult));\n    }\n  } catch (e) {\n    console.error('@@HARNESS_ERROR@@', e && (e.stack || e.message));\n    throw e;\n  }\n})();\n`;
};

interface Judge0Result {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: { id: number; description: string };
  time: string | null;
  memory: string | null;
}

export const executeJudge0 = async (
  sourceCode: string,
  language: string,
  stdin: string = '',
): Promise<Judge0Result> => {
  const normalizedLanguage = language.trim().toLowerCase();
  const languageId = LANGUAGE_MAPPING[normalizedLanguage] || 93;
  let finalSource = sourceCode;

  const primaryFunction = getPrimaryFunctionName(sourceCode);
  const shouldInjectHarness =
    Boolean(stdin?.trim()) &&
    Boolean(primaryFunction) &&
    !/console\.log|process\.stdout\.write/.test(sourceCode);

  if (shouldInjectHarness && primaryFunction && ['javascript', 'js', 'typescript', 'ts'].includes(normalizedLanguage)) {
    finalSource += '\n' + buildHarness(primaryFunction, stdin);
  }

  const response = await axios.post(
    `${JUDGE0_API_URL}/submissions/?base64_encoded=false&wait=true`,
    {
      source_code: finalSource,
      language_id: languageId,
      stdin: stdin || '',
    },
    { timeout: 30000 },
  );

  const data = response.data;

  return {
    stdout: data.stdout ?? '',
    stderr: data.stderr ?? '',
    compileOutput: data.compile_output ?? '',
    status: data.status ?? { id: -1, description: 'Unknown' },
    time: data.time ?? null,
    memory: data.memory ?? null,
  };
};
