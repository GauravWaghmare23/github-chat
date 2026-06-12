import { prisma } from "../../../../lib/prisma";

export async function DELETE(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } =
    await context.params;

  await prisma.repository.delete({
    where: {
      id,
    },
  });

  return Response.json({
    success: true,
  });
}