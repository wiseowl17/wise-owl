/** Inbox that receives contact, onboarding, and signed agreements. */
export const STUDIO_INBOX = "mlcruz9804@gmail.com";

type Payload = Record<string, string | number | boolean | null | undefined>;

function asBody(payload: Payload) {
  const body: Record<string, string> = {
    _captcha: "false",
    _template: "table",
    _subject: String(payload._subject || "Wise Owl form"),
  };
  for (const [key, value] of Object.entries(payload)) {
    if (key.startsWith("_")) continue;
    if (value == null || value === "") continue;
    body[key] = String(value);
  }
  return body;
}

/** Emails the form. Returns true on success; otherwise opens mailto (unless disabled) and returns false. */
export async function deliverForm(
  payload: Payload,
  { mailtoFallback = true }: { mailtoFallback?: boolean } = {},
) {
  const body = asBody(payload);
  try {
    const response = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(STUDIO_INBOX)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    const json = (await response.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };
    if (json.success === true || json.success === "true" || response.ok) {
      return true;
    }
  } catch {
    /* fall through to mailto */
  }

  if (!mailtoFallback) return false;

  const lines = Object.entries(body)
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => `${key}: ${value}`);
  const mailto = `mailto:${STUDIO_INBOX}?subject=${encodeURIComponent(body._subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  window.open(mailto, "_self");
  return false;
}
