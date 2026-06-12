"use client";

import { useEffect, useState } from "react";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

type Chat = {
  id: string;
  title: string;
  repository?: {
    id?: string;
    name?: string;
  };
};

type Repository = {
  id: string;
  name: string;
  githubUrl: string;
};

export default function Home() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [repositoryId, setRepositoryId] = useState("");
  const [chatId, setChatId] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  async function loadRepositories() {
    const response = await fetch("/api/repositories");
    const data = await response.json();
    setRepositories(data);
  }

  async function loadChats() {
    const response = await fetch("/api/chats");
    const data = await response.json();
    setChats(data);
  }

  async function loadChatMessages(id: string) {
    const response = await fetch(`/api/chats/${id}`);
    const data = await response.json();

    if (Array.isArray(data)) {
      setMessages(data);
    } else if (data?.messages) {
      setMessages(data.messages);
    } else {
      setMessages([]);
    }

    if (data?.repository?.id) {
      setRepositoryId(data.repository.id);
    }

    setChatId(id);
  }

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      const [reposResponse, chatsResponse] = await Promise.all([
        fetch("/api/repositories"),
        fetch("/api/chats"),
      ]);

      if (!isMounted) return;

      const [reposData, chatsData] = await Promise.all([
        reposResponse.json(),
        chatsResponse.json(),
      ]);

      setRepositories(reposData);
      setChats(chatsData);
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function uploadRepository() {
    if (!githubUrl.trim()) return;

    try {
      setLoadingRepo(true);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl }),
      });

      const data = await response.json();
      const newRepositoryId = data.repositoryId;

      setRepositoryId(newRepositoryId);

      const chatResponse = await fetch("/api/chats/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: newRepositoryId }),
      });

      const chat = await chatResponse.json();

      setChatId(chat.id);
      setMessages([]);

      await loadRepositories();
      await loadChats();
      setGithubUrl("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRepo(false);
    }
  }

  async function sendMessage() {
    if (!question.trim() || !repositoryId || !chatId) return;

    const currentQuestion = question;

    setQuestion("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentQuestion },
    ]);

    try {
      setLoadingChat(true);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          repositoryId,
          chatId,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer ?? "No answer returned." },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingChat(false);
    }
  }

  return (
    <main className="h-screen flex bg-zinc-950 text-white">
      <aside className="w-80 border-r border-zinc-800 p-4 overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">GitHub RAG</h1>

        <input
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="GitHub URL"
          className="w-full bg-zinc-900 p-3 rounded mb-3"
        />

        <button
          onClick={uploadRepository}
          disabled={loadingRepo}
          className="w-full bg-blue-600 p-3 rounded disabled:opacity-60"
        >
          {loadingRepo ? "Loading..." : "Load Repository"}
        </button>

        <div className="mt-8">
          <h2 className="font-semibold mb-2">Repositories</h2>
          {repositories.map((repo) => (
            <button
              key={repo.id}
              type="button"
              onClick={() => setRepositoryId(repo.id)}
              className="block w-full text-left p-2 rounded cursor-pointer hover:bg-zinc-800"
            >
              {repo.name}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="font-semibold mb-2">Conversations</h2>
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => loadChatMessages(chat.id)}
              className="block w-full text-left p-2 rounded cursor-pointer hover:bg-zinc-800"
            >
              {chat.title}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-auto bg-blue-600 p-4 rounded-xl max-w-[80%]"
                  : "bg-zinc-800 p-4 rounded-xl max-w-[80%]"
              }
            >
              {message.content}
            </div>
          ))}

          {loadingChat && (
            <div className="bg-zinc-800 p-4 rounded-xl max-w-[80%]">Thinking...</div>
          )}
        </div>

        <div className="border-t border-zinc-800 p-4 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about this repository..."
            className="flex-1 bg-zinc-900 p-3 rounded"
          />

          <button
            onClick={sendMessage}
            className="bg-green-600 px-6 rounded disabled:opacity-60"
            disabled={!question.trim() || !repositoryId || !chatId || loadingChat}
          >
            Send
          </button>
        </div>
      </section>
    </main>
  );
}
