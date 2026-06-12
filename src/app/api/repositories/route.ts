import { prisma } from "../../../lib/prisma";

export async function GET() {
  const repositories =
    await prisma.repository.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

  return Response.json(
    repositories
  );
}