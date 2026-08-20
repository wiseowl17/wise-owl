import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export type InquiryInput = {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  message: string;
};

function clean(input: InquiryInput): InquiryInput {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const company = input.company?.trim() ?? "";
  const projectType = input.projectType.trim();
  const message = input.message.trim();

  if (name.length < 2) throw new Error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please add a valid email.");
  }
  if (!projectType) throw new Error("Choose a project type.");
  if (message.length < 12) {
    throw new Error("Tell me a little more about the project.");
  }

  return { name, email, company, projectType, message };
}

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((input: InquiryInput) => clean(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into inquiries (name, email, company, project_type, message)
      values (
        ${data.name},
        ${data.email},
        ${data.company || null},
        ${data.projectType},
        ${data.message}
      )
    `;
    return { ok: true as const };
  });
