export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e1f22] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            GoonRoom
          </h1>
          <p className="mt-1 text-sm text-[#8e9297]">
            Your self-hosted chat &amp; media hub
          </p>
        </div>
        <div className="rounded-lg bg-[#2b2d31] p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}
