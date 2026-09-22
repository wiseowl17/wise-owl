/**
 * Public form submissions. Each one is saved to the studio database and also
 * emailed. It only fails if both the database and the email fail.
 */
import { deliverForm } from "@/lib/deliver";
import { studioCall } from "@/lib/studio-api";

type Fields = Record<string, string | undefined>;

async function saveAndEmail(action: string, subject: string, form: string, data: Fields) {
  const [saved, emailed] = await Promise.allSettled([
    studioCall(action, data),
    deliverForm({ _subject: subject, form, ...data }, { mailtoFallback: false }),
  ]);
  if (saved.status === "fulfilled") return;
  const reason = saved.reason as { status?: number; message?: string };
  // A 4xx is a real validation problem the visitor can fix.
  if (reason?.status && reason.status >= 400 && reason.status < 500) {
    throw new Error(reason.message || "Check the form and try again.");
  }
  if (emailed.status === "fulfilled" && emailed.value) return;
  // Last resort: open the visitor's mail app with the details filled in.
  await deliverForm({ _subject: subject, form, ...data });
}

export async function submitInquiry({ data }: { data: Fields }) {
  await saveAndEmail("submitInquiry", "Wise Owl: new inquiry", "Contact", data);
}

export async function submitOnboarding({ data }: { data: Fields }) {
  await saveAndEmail("submitOnboarding", "Wise Owl: onboarding brief", "Onboarding", data);
}

export async function signAgreement({ data }: { data: Fields }) {
  await saveAndEmail("signAgreement", "Wise Owl: agreement signed", "Agreement", data);
}
