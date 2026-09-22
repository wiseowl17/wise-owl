import { type ReactNode, useEffect, useState } from "react";
import { getStudioSession } from "@/lib/studio-auth";

export function StudioGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let live = true;
    void getStudioSession().then((email) => {
      if (!live) return;
      if (email) {
        setOk(true);
        return;
      }
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3" aria-label="Loading">
          <div className="h-8 w-32 animate-pulse rounded-full bg-raised" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-raised" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
