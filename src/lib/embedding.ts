import ollama from "ollama";

export async function embed(text: string) {
  const response = await ollama.embed({
    model: "nomic-embed-text",
    input: text,
  });

  return response.embeddings[0];
}