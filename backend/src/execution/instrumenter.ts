import estraverse from "estraverse";
import escodegen from "escodegen";
import { ParsedProgram } from "./parser";

interface InstrumentationResult {
  instrumentedCode: string;
}

const getNodeLine = (node: any): number => node?.loc?.start?.line ?? -1;

const isBlockContainer = (node: any): boolean =>
  node && ["Program", "BlockStatement", "SwitchCase"].includes(node.type);

const createIdentifier = (name: string) => ({
  type: "Identifier",
  name,
});

const createLiteral = (value: string | number | boolean | null) => ({
  type: "Literal",
  value,
});

const createTrackExpression = (line: number, variableNames: string[]) => ({
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    callee: createIdentifier("__vizTrack"),
    arguments: [createLiteral(line), createVariablesObject(variableNames)],
  },
});

const createLoopTrackExpression = (line: number, variableNames: string[]) => ({
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    callee: createIdentifier("__vizLoop"),
    arguments: [createLiteral(line), createVariablesObject(variableNames)],
  },
});

const createEnterExpression = (line: number, functionName: string) => ({
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    callee: createIdentifier("__vizEnter"),
    arguments: [createLiteral(functionName), createLiteral(line)],
  },
});

const createExitExpression = (line: number, functionName: string) => ({
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    callee: createIdentifier("__vizExit"),
    arguments: [createLiteral(functionName), createLiteral(line)],
  },
});

const createSafeVariableRead = (name: string) => ({
  type: "CallExpression",
  callee: {
    type: "FunctionExpression",
    id: null,
    params: [],
    body: {
      type: "BlockStatement",
      body: [
        {
          type: "TryStatement",
          block: {
            type: "BlockStatement",
            body: [
              {
                type: "ReturnStatement",
                argument: createIdentifier(name),
              },
            ],
          },
          handler: {
            type: "CatchClause",
            param: { type: "Identifier", name: "__vizErr" },
            body: {
              type: "BlockStatement",
              body: [
                {
                  type: "ReturnStatement",
                  argument: createIdentifier("undefined"),
                },
              ],
            },
          },
          finalizer: null,
        },
      ],
    },
    generator: false,
    async: false,
  },
  arguments: [],
});

const createVariablesObject = (variableNames: string[]) => ({
  type: "ObjectExpression",
  properties: variableNames.map((name) => ({
    type: "Property",
    key: createIdentifier(name),
    computed: false,
    kind: "init",
    method: false,
    shorthand: false,
    value: createSafeVariableRead(name),
  })),
});

const toBlockStatement = (node: any) => {
  if (!node) {
    return {
      type: "BlockStatement",
      body: [],
    };
  }

  if (node.type === "BlockStatement") {
    return node;
  }

  return {
    type: "BlockStatement",
    body: [node],
  };
};

const trackableStatementTypes = new Set<string>([
  "VariableDeclaration",
  "ExpressionStatement",
  "IfStatement",
  "ForStatement",
  "WhileStatement",
  "DoWhileStatement",
  "ForInStatement",
  "ForOfStatement",
  "ReturnStatement",
  "SwitchStatement",
  "TryStatement",
  "ThrowStatement",
]);

const collectDeclaredIdentifiers = (ast: any): string[] => {
  const names = new Set<string>();

  estraverse.traverse(ast, {
    enter(node: any) {
      if (
        node.type === "VariableDeclarator" &&
        node.id?.type === "Identifier"
      ) {
        names.add(node.id.name);
      }

      if (node.type === "FunctionDeclaration" && node.id?.name) {
        names.add(node.id.name);
      }

      if (
        (node.type === "FunctionDeclaration" ||
          node.type === "FunctionExpression" ||
          node.type === "ArrowFunctionExpression") &&
        Array.isArray(node.params)
      ) {
        for (const param of node.params) {
          if (param.type === "Identifier") {
            names.add(param.name);
          }
        }
      }

      if (node.type === "ClassDeclaration" && node.id?.name) {
        names.add(node.id.name);
      }
    },
  });

  return [...names];
};

const wrapConditions = (ast: any): void => {
  estraverse.replace(ast, {
    enter(node: any) {
      const hasTest =
        node.type === "IfStatement" ||
        node.type === "WhileStatement" ||
        node.type === "DoWhileStatement" ||
        node.type === "ForStatement";

      if (hasTest && node.test) {
        node.test = {
          type: "CallExpression",
          callee: createIdentifier("__vizCondition"),
          arguments: [createLiteral(getNodeLine(node)), node.test],
        };
      }

      return node;
    },
  });
};

const wrapFunctionBodies = (ast: any): void => {
  estraverse.traverse(ast, {
    enter(node: any) {
      if (
        node.type !== "FunctionDeclaration" &&
        node.type !== "FunctionExpression" &&
        node.type !== "ArrowFunctionExpression"
      ) {
        return;
      }

      if (
        node.type === "ArrowFunctionExpression" &&
        node.body.type !== "BlockStatement"
      ) {
        node.body = {
          type: "BlockStatement",
          body: [{ type: "ReturnStatement", argument: node.body }],
        };
      }

      const bodyBlock = toBlockStatement(node.body);
      node.body = bodyBlock;

      const functionName = node.id?.name ?? "anonymous";
      const line = getNodeLine(node);

      estraverse.replace(bodyBlock, {
        enter(innerNode: any) {
          if (innerNode.type === "ReturnStatement") {
            return {
              type: "BlockStatement",
              body: [
                createExitExpression(getNodeLine(innerNode), functionName),
                innerNode,
              ],
            };
          }

          return innerNode;
        },
      });

      bodyBlock.body.unshift(createEnterExpression(line, functionName));
      bodyBlock.body.push(createExitExpression(line, functionName));
    },
  });
};

const isVizTrackingCall = (statement: any): boolean =>
  statement?.type === "ExpressionStatement" &&
  statement.expression?.type === "CallExpression" &&
  typeof statement.expression.callee?.name === "string" &&
  statement.expression.callee.name.startsWith("__viz");


const injectStatementTracking = (
  ast: any,
  variableNames: string[],
): void => {
  const blockContainers: any[] = [];

  // First collect containers safely
  estraverse.traverse(ast, {
    enter(node: any) {
      if (isBlockContainer(node) && Array.isArray(node.body)) {
        blockContainers.push(node);
      }
    },
  });

  // Then modify their statements
  for (const node of blockContainers) {
    const newBody: any[] = [];

    for (const statement of node.body) {
      const isTrackable =
        statement?.type &&
        trackableStatementTypes.has(statement.type) &&
        statement.type !== "BlockStatement" &&
        !isVizTrackingCall(statement);

      const isLoop =
        statement?.type === "ForStatement" ||
        statement?.type === "ForInStatement" ||
        statement?.type === "ForOfStatement" ||
        statement?.type === "WhileStatement" ||
        statement?.type === "DoWhileStatement";

      // For loops, capture state at the beginning of each iteration
      if (isLoop) {
        statement.body = toBlockStatement(statement.body);

        statement.body.body.unshift(
          createLoopTrackExpression(
            getNodeLine(statement),
            variableNames,
          ),
        );
      }

      // Execute original statement
      newBody.push(statement);

      // Capture resulting state AFTER execution
      if (
        isTrackable &&
        statement.type !== "ReturnStatement" &&
        !isLoop
      ) {
        newBody.push(
          createTrackExpression(
            getNodeLine(statement),
            variableNames,
          ),
        );
      }
    }

    node.body = newBody;
  }
};

export const instrumentJavaScriptCode = (
  ast: ParsedProgram,
): InstrumentationResult => {
  const mutableAst: any = ast;
  const variableNames = collectDeclaredIdentifiers(mutableAst);

  wrapConditions(mutableAst);
  wrapFunctionBodies(mutableAst);
  injectStatementTracking(mutableAst, variableNames);

  const instrumentedCode = escodegen.generate(mutableAst, {
    format: {
      indent: {
        style: "  ",
      },
    },
  });

  return { instrumentedCode };
};