import { MessageSquare } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#5865f2]/10">
        <MessageSquare className="h-10 w-10 text-[#5865f2]" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">
          Welcome to GoonRoom
        </h2>
        <p className="mt-1 text-sm text-[#8e9297]">
          Select a channel from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}
