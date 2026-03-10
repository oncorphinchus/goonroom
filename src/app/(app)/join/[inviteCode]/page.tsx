"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { joinServer } from "@/features/server/actions";

export default function JoinPage(): React.ReactNode {
  const params = useParams<{ inviteCode: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  async function handleJoin(): Promise<void> {
    setLoading(true);
    setError(null);
    const result = await joinServer({ inviteCode: params.inviteCode });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result.data) {
      setJoined(true);
      router.push(`/servers/${result.data.id}`);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#313338]">
      <div className="w-full max-w-md rounded-lg bg-[#2b2d31] p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">Join Server</h1>
        <p className="mb-6 text-sm text-[#8e9297]">
          Invite code: <span className="font-mono text-white">{params.inviteCode}</span>
        </p>

        {error && (
          <p className="mb-4 rounded bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleJoin}
          disabled={loading || joined}
          className="w-full rounded-md bg-[#5865f2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
        >
          {joined ? "Redirecting..." : loading ? "Joining..." : "Accept Invite"}
        </button>
      </div>
    </div>
  );
}
