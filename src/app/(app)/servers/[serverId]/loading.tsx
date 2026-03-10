export default function ServerLoading(): React.ReactNode {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#313338]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5865f2] border-t-transparent" />
    </div>
  );
}
