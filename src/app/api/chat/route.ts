import ollama from "ollama";

import { prisma } from "../../../lib/prisma";
import { embed } from "../../../lib/embedding";
import { cosineSimilarity } from "../../../lib/similarity";

export async function POST(
  req: Request
) {
  try {
    const {
      question,
      repositoryId,
      chatId,
    } = await req.json();

    if (!question) {
      return Response.json(
        {
          error: "Question required",
        },
        {
          status: 400,
        }
      );
    }

    if (!repositoryId) {
      return Response.json(
        {
          error:
            "Repository not selected",
        },
        {
          status: 400,
        }
      );
    }

    if (!chatId) {
      return Response.json(
        {
          error:
            "Chat not found",
        },
        {
          status: 400,
        }
      );
    }

    // Save user message

    await prisma.message.create({
      data: {
        chatId,
        role: "user",
        content: question,
      },
    });

    // Create embedding for question

    const questionEmbedding =
      await embed(question);

    // Load repository chunks

    const chunks =
      await prisma.chunk.findMany({
        where: {
          repositoryId,
        },
      });

    if (
      chunks.length === 0
    ) {
      return Response.json(
        {
          error:
            "No repository chunks found",
        },
        {
          status: 404,
        }
      );
    }

    // Similarity search

    const ranked = chunks
      .map((chunk) => ({
        text: chunk.content,
        score:
          cosineSimilarity(
            questionEmbedding,
            chunk.embedding as number[]
          ),
      }))
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 3);

    const context =
      ranked
        .map((r) => r.text)
        .join("\n\n");

    const prompt = `
You are a GitHub repository assistant.

Answer ONLY from the provided context.

Context:
${context}

Question:
${question}
`;

    // Generate answer

    const response =
      await ollama.chat({
        model:
          "qwen2.5-coder:7b",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const answer =
      response.message.content;

    // Save assistant message

    await prisma.message.create({
      data: {
        chatId,
        role: "assistant",
        content: answer,
      },
    });

    return Response.json({
      answer,
    });
  } catch (error) {
    console.error(
      "CHAT ERROR:",
      error
    );

    return Response.json(
      {
        error:
          "Failed to generate answer",
      },
      {
        status: 500,
      }
    );
  }
}