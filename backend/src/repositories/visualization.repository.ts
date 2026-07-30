import prisma from "../utils/prisma";

export const createVisualizationHistory = async (params: {
  userId: string;
  code: string;
  input: string;
  output: unknown;
}): Promise<void> => {
  await prisma.visualization.create({
    data: {
      userId: params.userId,
      code: params.code,
      input: params.input,
      output: JSON.stringify(params.output),
    },
  });
};
