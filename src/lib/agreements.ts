import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export type AgreementRow = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  project: string;
  signature: string;
  signed_at: string;
};

export type SignAgreementInput = {
  name: string;
  email: string;
  company?: string;
  project: string;
  signature: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function norm(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export const signAgreement = createServerFn({ method: "POST" })
  .validator((input: SignAgreementInput) => {
    const name = clean(input.name);
    const email = clean(input.email).toLowerCase();
    const company = clean(input.company);
    const project = clean(input.project);
    const signature = clean(input.signature);

    if (name.length < 2) throw new Error("Add your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Add a valid email.");
    }
    if (!project) throw new Error("Choose what this agreement is for.");
    if (norm(signature) !== norm(name)) {
      throw new Error("Type your full name again to sign.");
    }

    return { name, email, company, project, signature };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into agreements (name, email, company, project, signature)
      values (
        ${data.name},
        ${data.email},
        ${data.company || null},
        ${data.project},
        ${data.signature}
      )
    `;
    return { ok: true as const };
  });

export const listAgreements = createServerFn({ method: "GET" }).handler(
  async (): Promise<AgreementRow[]> => {
    const sql = await getSql();
    return sql<AgreementRow>`
      select
        id,
        name,
        email,
        company,
        project,
        signature,
        signed_at::text as signed_at
      from agreements
      order by signed_at desc
    `;
  },
);
