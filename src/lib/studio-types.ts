/** Row shapes returned by `api/studio.ts`. Money is always in cents. */

export const CLIENT_STATUSES = ["lead", "onboarding", "active", "paused", "completed", "archived"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PROJECT_KINDS = ["landing", "site", "large_site", "redesign", "care", "other"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export const PROJECT_STATUSES = ["proposal", "in_progress", "review", "launched", "on_hold", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PAYMENT_KINDS = ["onboarding", "deposit", "project", "final", "care", "refund", "other"] as const;
export const PAYMENT_METHODS = ["card", "cash", "check", "zelle", "venmo", "cashapp", "paypal", "bank", "other"] as const;
export const EXPENSE_CATEGORIES = ["hosting", "domain", "software", "contractor", "equipment", "marketing", "other"] as const;
export const CARE_PLANS = ["basic", "backend", "custom"] as const;
export const PRIORITIES = ["low", "normal", "high"] as const;

export const LABELS: Record<string, string> = {
  lead: "Lead",
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
  landing: "Landing page",
  site: "Site, 3–5 pages",
  large_site: "Larger site, 5+ pages",
  redesign: "Redesign",
  care: "Monthly care",
  other: "Other",
  proposal: "Proposal",
  in_progress: "In progress",
  review: "In review",
  launched: "Launched",
  on_hold: "On hold",
  cancelled: "Cancelled",
  deposit: "Deposit",
  project: "Project payment",
  final: "Final payment",
  refund: "Refund",
  card: "Card",
  cash: "Cash",
  check: "Check",
  zelle: "Zelle",
  venmo: "Venmo",
  cashapp: "Cash App",
  paypal: "PayPal",
  bank: "Bank transfer",
  paid: "Paid",
  pending: "Pending",
  hosting: "Hosting",
  domain: "Domain",
  software: "Software",
  contractor: "Contractor",
  equipment: "Equipment",
  marketing: "Marketing",
  basic: "Basic care",
  backend: "Backend care",
  custom: "Custom care",
  low: "Low",
  normal: "Normal",
  high: "High",
};

/** Label for payment kinds, where "onboarding" means the fee rather than the client status. */
export function paymentKindLabel(kind: string) {
  return kind === "onboarding" ? "Onboarding fee" : (LABELS[kind] ?? kind);
}

export function label(value: string | null | undefined) {
  if (!value) return "";
  return LABELS[value] ?? value;
}

export type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  address: string | null;
  status: ClientStatus;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientListRow = Client & {
  paid_cents: number;
  project_count: number;
  open_tasks: number;
  mrr_cents: number;
};

export type Project = {
  id: number;
  client_id: number;
  client_name: string;
  client_company: string | null;
  name: string;
  kind: ProjectKind;
  status: ProjectStatus;
  scope: string | null;
  price_cents: number;
  paid_cents: number;
  balance_cents: number;
  open_tasks: number;
  domain: string | null;
  site_url: string | null;
  links: string | null;
  start_on: string | null;
  due_on: string | null;
  launched_on: string | null;
  created_at: string;
};

export type Payment = {
  id: number;
  client_id: number;
  client_name: string;
  client_company: string | null;
  project_id: number | null;
  project_name: string | null;
  amount_cents: number;
  kind: string;
  method: string;
  status: "paid" | "pending";
  paid_on: string;
  notes: string | null;
};

export type Task = {
  id: number;
  client_id: number | null;
  client_name: string | null;
  client_company: string | null;
  project_id: number | null;
  project_name: string | null;
  title: string;
  notes: string | null;
  priority: "low" | "normal" | "high";
  repeat: "none" | "monthly";
  due_on: string | null;
  due_day: number | null;
  done: boolean;
  next_due: string | null;
};

export type Note = { id: number; client_id: number; body: string; created_at: string };

export type CarePlan = {
  id: number;
  client_id: number;
  plan: string;
  amount_cents: number;
  billing_day: number;
  started_on: string;
  ended_on: string | null;
  notes: string | null;
};

export type Expense = {
  id: number;
  client_id: number | null;
  client_name: string | null;
  vendor: string;
  category: string;
  amount_cents: number;
  spent_on: string;
  notes: string | null;
};

export type Inquiry = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  best_time: string | null;
  company: string | null;
  project_type: string | null;
  message: string | null;
  handled: boolean;
  created_at: string;
};

export type Onboarding = {
  id: number;
  client_id: number | null;
  client_name: string | null;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  project_type: string;
  goals: string;
  audience: string | null;
  timeline: string | null;
  budget: string | null;
  extra: string | null;
  created_at: string;
};

export type Agreement = {
  id: number;
  client_id: number | null;
  client_name: string | null;
  name: string;
  email: string;
  company: string | null;
  project: string;
  signature: string;
  signed_at: string;
};

export type ClientDetail = {
  client: Client;
  projects: Project[];
  payments: Payment[];
  tasks: Task[];
  notes: Note[];
  carePlans: CarePlan[];
  onboardings: Onboarding[];
  agreements: Agreement[];
  expenses: Expense[];
};

export type Dashboard = {
  today: string;
  month: string;
  money: {
    month_cents: number;
    year_cents: number;
    pending_cents: number;
    year_expense_cents: number;
    mrr_cents: number;
    outstanding_cents: number;
  };
  counts: {
    active_clients: number;
    pipeline_clients: number;
    total_clients: number;
    active_projects: number;
  };
  monthly: { month: string; income_cents: number; expense_cents: number }[];
  dueTasks: Task[];
  recentPayments: Payment[];
  openProjects: Project[];
  inbox: { inquiries: number; onboardings: number; agreements: number };
};

export type Inbox = {
  inquiries: Inquiry[];
  onboardings: Onboarding[];
  agreements: Agreement[];
};
