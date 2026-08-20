import { hashPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";

export const OWNER_EMAIL = "mlcruz9804@gmail.com";
const OWNER_PASSWORD = "eup4XQ7aMGGeJow";
const OWNER_NAME = "Manuel Lorenzo Cruz";

/**
 * Creates (or repairs) Manuel's studio account so email/password works
 * on the published site, not only in the preview. Server-only.
 */
export async function ensureOwnerAccount(): Promise<void> {
  const sql = await getSql();
  const [existing] = await sql<{ id: string }>`
    select id from "user" where email = ${OWNER_EMAIL} limit 1
  `;

  const userId = existing?.id ?? crypto.randomUUID();
  const hashed = await hashPassword(OWNER_PASSWORD);
  const now = new Date();

  if (!existing) {
    await sql`
      insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      values (
        ${userId},
        ${OWNER_NAME},
        ${OWNER_EMAIL},
        true,
        ${now},
        ${now}
      )
    `;
  }

  const [account] = await sql<{ id: string }>`
    select id from "account"
    where "userId" = ${userId} and "providerId" = 'credential'
    limit 1
  `;

  if (account) {
    await sql`
      update "account"
      set password = ${hashed}, "updatedAt" = ${now}
      where id = ${account.id}
    `;
  } else {
    await sql`
      insert into "account" (
        id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
      )
      values (
        ${crypto.randomUUID()},
        ${userId},
        'credential',
        ${userId},
        ${hashed},
        ${now},
        ${now}
      )
    `;
  }

  await sql`delete from studio_owner`;
  await sql`insert into studio_owner (user_id) values (${userId})`;
}
