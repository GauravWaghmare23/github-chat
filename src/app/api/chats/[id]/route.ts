import { prisma } from "../../../../lib/prisma";

export async function GET(
    req: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    const { id } =
        await context.params;

    const chat =
        await prisma.chat.findUnique({
            where: {
                id,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
                repository: true,
            },
        });

    return Response.json(chat);
}

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

    await prisma.chat.delete({
        where: {
            id,
        },
    });

    return Response.json({
        success: true,
    });
}