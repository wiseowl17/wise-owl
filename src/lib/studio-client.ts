import { deliverForm } from "@/lib/deliver";
import type { AgreementRow, SignAgreementInput } from "@/lib/agreements";
import {
  localAddClient,
  localAddSale,
  localAddTodo,
  localDeleteClient,
  localDeleteAgreement,
  localGetClient,
  localGetStudio,
  localListAgreements,
  localSetStatus,
  localSignAgreement,
  localSubmitOnboarding,
  localToggleTodo,
  localUpdateClient,
} from "@/lib/studio-local";
import type {
  AddClientInput,
  AddSaleInput,
  AddTodoInput,
  OnboardInput,
  SetStatusInput,
  UpdateClientInput,
} from "@/lib/studio";

export const getStudio = async () => localGetStudio();

export const getClient = async ({ data }: { data: number }) =>
  localGetClient(data);

export const addClient = async ({ data }: { data: AddClientInput }) =>
  localAddClient(data);

export const updateClient = async ({ data }: { data: UpdateClientInput }) =>
  localUpdateClient(data);

export const deleteClient = async ({ data }: { data: number }) =>
  localDeleteClient(data);

export const addSale = async ({ data }: { data: AddSaleInput }) =>
  localAddSale({
    ...data,
    amountCents: Math.round(Number(data.amountDollars) * 100),
  });

export const addTodo = async ({ data }: { data: AddTodoInput }) =>
  localAddTodo(data);

export const toggleTodo = async ({
  data,
}: {
  data: { id: number; clientId: number };
}) => localToggleTodo(data);

export const setClientStatus = async ({ data }: { data: SetStatusInput }) =>
  localSetStatus(data);

export const listAgreements = async () => localListAgreements();

export const deleteAgreement = async ({ data }: { data: number }) =>
  localDeleteAgreement(data);

export async function submitOnboarding({ data }: { data: OnboardInput }) {
  const result = localSubmitOnboarding(data);
  await deliverForm({
    _subject: "Wise Owl — onboarding brief",
    form: "Onboarding",
    name: data.name,
    email: data.email,
    company: data.company,
    website: data.website,
    projectType: data.projectType,
    goals: data.goals,
    audience: data.audience,
    timeline: data.timeline,
    budget: data.budget,
    extra: data.extra,
  });
  return result;
}

export async function signAgreement({ data }: { data: SignAgreementInput }) {
  const result = localSignAgreement(data);
  await deliverForm({
    _subject: "Wise Owl — agreement signed",
    form: "Agreement",
    name: data.name,
    email: data.email,
    company: data.company,
    project: data.project,
    signature: data.signature,
  });
  return result;
}

export type { AgreementRow };
export type {
  ClientDetail,
  ClientStatus,
  StudioOverview,
} from "@/lib/studio";
