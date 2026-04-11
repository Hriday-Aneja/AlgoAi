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

const createVariablesObject = (variableNames: string[]) => ({
  type: "ObjectExpression",
  properties: variableNames.map((name) => ({
    type: "Property",
    key: createIdentifier(name),
    computed: false,
    kind: "init",
    method: false,
    shorthand: false,
    value: {
      type: "ConditionalExpression",
      test: {
        type: "BinaryExpression",
        operator: "!==",
        left: {
          type: "UnaryExpression",
          operator: "typeof",
          prefix: true,
          argument: createIdentifier(name),
        },
        right: createLiteral("undefined"),
      },
      consequent: createIdentifier(name),
      alternate: createIdentifier("undefined"),
    },
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

const injectStatementTracking = (ast: any, variableNames: string[]): void => {
  estraverse.traverse(ast, {
    enter(node: any) {
      if (!isBlockContainer(node) || !Array.isArray(node.body)) {
        return;
      }

      const newBody: any[] = [];

      for (const statement of node.body) {
        if (
          statement?.type &&
          trackableStatementTypes.has(statement.type) &&
          statement.type !== "BlockStatement"
        ) {
          newBody.push(
            createTrackExpression(getNodeLine(statement), variableNames),
          );
        }

        if (
          statement?.type === "ForStatement" ||
          statement?.type === "ForInStatement" ||
          statement?.type === "ForOfStatement" ||
          statement?.type === "WhileStatement" ||
          statement?.type === "DoWhileStatement"
        ) {
          statement.body = toBlockStatement(statement.body);
          statement.body.body.unshift(
            createLoopTrackExpression(getNodeLine(statement), variableNames),
          );
        }

        newBody.push(statement);
      }

      node.body = newBody;
    },
  });
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
