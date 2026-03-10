import { WifiOff } from "lucide-react";

export default function OfflinePage(): React.ReactNode {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#313338] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#faa61a]/10">
        <WifiOff className="h-10 w-10 text-[#faa61a]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">You&apos;re offline</h1>
        <p className="mt-2 max-w-md text-sm text-[#8e9297]">
          Check your internet connection and try again. GoonRoom requires an active connection for real-time features.
        </p>
      </div>
    </div>
  );
}
