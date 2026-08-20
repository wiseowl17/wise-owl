import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StudioChrome } from "@/components/studio/chrome";

export const Route = createFileRoute("/studio")({
  component: StudioLayout,
  head: () => ({
    meta: [{ title: "Studio — Wise Owl" }],
  }),
});

function StudioLayout() {
  return (
    <StudioChrome>
      <Outlet />
    </StudioChrome>
  );
}
