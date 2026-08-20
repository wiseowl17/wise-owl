import { createFileRoute } from "@tanstack/react-router";
import { StudioChrome } from "@/components/studio/chrome";
import { StudioHome } from "@/routes/studio/index";

export const Route = createFileRoute("/studio.html")({
  component: StudioHtmlPage,
  head: () => ({
    meta: [{ title: "Studio — Wise Owl" }],
  }),
});

function StudioHtmlPage() {
  return (
    <StudioChrome>
      <StudioHome />
    </StudioChrome>
  );
}
