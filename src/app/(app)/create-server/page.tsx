"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServer } from "@/features/server/actions";

export default function CreateServerPage(): React.ReactNode {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createServer({ name });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result.data) {
      router.push(`/servers/${result.data.server.id}`);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#313338]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-[#8e9297] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <form
          onSubmit={handleCreate}
          className="w-full rounded-lg bg-[#2b2d31] p-8"
        >
          <h1 className="mb-2 text-center text-2xl font-bold text-white">
            Create a Server
          </h1>
          <p className="mb-6 text-center text-sm text-[#8e9297]">
            Your server is where you and your friends hang out.
          </p>

          {error && (
            <p className="mb-4 rounded bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">
              {error}
            </p>
          )}

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
            Server Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome Server"
            required
            className="mb-6 w-full rounded-md border-none bg-[#1e1f22] px-3 py-2.5 text-sm text-white placeholder-[#4f545c] outline-none focus:ring-2 focus:ring-[#5865f2]"
          />

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full rounded-md bg-[#5865f2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
