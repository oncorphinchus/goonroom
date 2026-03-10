export default function ChannelLoading(): React.ReactNode {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center border-b border-[#1e1f22] bg-[#313338] px-4">
        <div className="h-4 w-4 rounded bg-[#3f4147] animate-pulse mr-2" />
        <div className="h-4 w-32 rounded bg-[#3f4147] animate-pulse" />
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#3f4147]" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex gap-2 items-center">
                <div className="h-3 w-24 rounded bg-[#3f4147]" />
                <div className="h-3 w-16 rounded bg-[#3f4147] opacity-50" />
              </div>
              <div
                className="h-4 rounded bg-[#3f4147]"
                style={{ width: `${40 + ((i * 37) % 45)}%` }}
              />
              {i % 2 === 0 && (
                <div
                  className="h-4 rounded bg-[#3f4147] opacity-70"
                  style={{ width: `${25 + ((i * 23) % 35)}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-6 pt-2">
        <div className="h-11 rounded-lg bg-[#40444b] animate-pulse" />
      </div>
    </div>
  );
}
