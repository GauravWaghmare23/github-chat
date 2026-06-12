import { prisma } from "../../../lib/prisma";

export async function GET() {
  const chats =
    await prisma.chat.findMany({
      include: {
        repository: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return Response.json(
    chats
  );
}