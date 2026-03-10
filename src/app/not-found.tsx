import Link from "next/link";
import { Ghost } from "lucide-react";

export default function NotFound(): React.ReactNode {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#313338] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#5865f2]/10">
        <Ghost className="h-10 w-10 text-[#5865f2]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-[#8e9297]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-[#5865f2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4]"
      >
        Go Home
      </Link>
    </div>
  );
}
