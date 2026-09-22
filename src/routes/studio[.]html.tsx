import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

/** Old bookmark. The Studio lives at /studio now. */
export const Route = createFileRoute("/studio.html")({
  component: StudioHtmlRedirect,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
});

function StudioHtmlRedirect() {
  useEffect(() => {
    window.location.replace(`/studio${window.location.search}`);
  }, []);
  return null;
}
