import { type ReactNode, useEffect, useState } from "react";
import { isStudioSignedIn } from "@/lib/studio-auth";

export function StudioGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const signedIn = isStudioSignedIn();
    setOk(signedIn);
    if (signedIn) return;
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login?next=${encodeURIComponent(next)}`);
  }, []);

  if (!ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
        <div className="h-10 w-40 animate-pulse rounded-full bg-raised" />
        <div className="h-6 w-64 animate-pulse rounded-full bg-raised" />
      </div>
    );
  }

  return <>{children}</>;
}
