import { prisma } from "../../../../lib/prisma";

export async function POST(
  req: Request
) {
  const {
    repositoryId,
  } = await req.json();

  const chat =
    await prisma.chat.create({
      data: {
        repositoryId,
        title: "New Chat",
      },
    });

  return Response.json(chat);
}