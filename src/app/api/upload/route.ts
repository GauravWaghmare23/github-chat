import axios from "axios";

import { prisma } from "../../../lib/prisma";
import { embed } from "../../../lib/embedding";

function chunkText(
  text: string,
  size = 500
) {
  const chunks = [];

  for (
    let i = 0;
    i < text.length;
    i += size
  ) {
    chunks.push(
      text.slice(i, i + size)
    );
  }

  return chunks;
}

export async function POST(
  req: Request
) {
  try {
    const { githubUrl } =
      await req.json();

    const parts =
      githubUrl.split("/");

    const owner = parts[3];
    const repo = parts[4];

    const repoInfo =
      await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`
      );

    const branch =
      repoInfo.data.default_branch;

    const readmeResponse =
      await axios.get(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`
      );

    const readme =
      readmeResponse.data;

    const existing =
  await prisma.repository.findFirst({
    where: {
      githubUrl,
    },
  });

let repository;

if (existing) {
  repository = existing;
} else {
  repository =
    await prisma.repository.create({
      data: {
        githubUrl,
        name: repo,
      },
    });
}

    const chunks =
      chunkText(readme);

    for (const chunk of chunks) {
      const embedding =
        await embed(chunk);

      await prisma.chunk.create({
        data: {
          repositoryId:
            repository.id,
          content: chunk,
          embedding,
        },
      });
    }

    return Response.json({
      success: true,
      repositoryId:
        repository.id,
      chunks:
        chunks.length,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Failed to process repository",
      },
      {
        status: 500,
      }
    );
  }
}