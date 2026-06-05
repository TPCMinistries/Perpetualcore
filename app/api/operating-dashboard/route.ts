import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPcClient } from "@/lib/accounts/permanent-account-sync";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SalesContactRow = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  status: string | null;
  interested_in: string | null;
  product: string | null;
  created_at: string | null;
};

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string | null;
  stage?: string | null;
  notes?: string | null;
  ai_insights?: unknown;
  estimated_value: number | null;
  next_follow_up_at: string | null;
  created_at: string;
};

type TaskRow = {
  id: string;
  status: string | null;
  priority: string | null;
  source_reference: string | null;
  due_date: string | null;
  tags: string[] | null;
};

type ClosePathState = {
  buyerStage?: string;
  paymentPath?: string;
  paymentStatus?: string;
  commercialNextStep?: string;
  updatedAt?: string;
};

type PackagePayment = {
  id: string;
  packageName: string;
  packageId: string;
  leadId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  createdAt: string;
};

type AccountTaskSummary = {
  open: number;
  blocked: number;
  overdue: number;
  nextDueDate?: string;
};

type PcAccountRow = {
  id: string;
  name: string;
  status: string;
  notes: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type PcEngagementRow = {
  id: string;
  account_id: string;
  name: string;
  offer_name: string;
  system_name: string;
  stage: string;
  value_range: string | null;
  next_step: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

function formatStripeAmount(amount: number | null, currency: string | null) {
  return {
    value: amount ?? 0,
    formatted: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
      maximumFractionDigits: 0,
    }).format((amount ?? 0) / 100),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readClosePath(lead: LeadRow): ClosePathState | null {
  if (!isRecord(lead.ai_insights) || !isRecord(lead.ai_insights.closePath))
    return null;
  const rawClosePath = lead.ai_insights.closePath;

  return {
    buyerStage:
      typeof rawClosePath.buyerStage === "string"
        ? rawClosePath.buyerStage
        : undefined,
    paymentPath:
      typeof rawClosePath.paymentPath === "string"
        ? rawClosePath.paymentPath
        : undefined,
    paymentStatus:
      typeof rawClosePath.paymentStatus === "string"
        ? rawClosePath.paymentStatus
        : undefined,
    commercialNextStep:
      typeof rawClosePath.commercialNextStep === "string"
        ? rawClosePath.commercialNextStep
        : undefined,
    updatedAt:
      typeof rawClosePath.updatedAt === "string"
        ? rawClosePath.updatedAt
        : undefined,
  };
}

function hasHandoffContext(lead: LeadRow) {
  return (
    isRecord(lead.ai_insights) &&
    isRecord(lead.ai_insights.accountHandoffContext)
  );
}

function createTaskSummary(tasks: TaskRow[]): AccountTaskSummary {
  const now = Date.now();
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const blocked = openTasks.filter((task) => task.status === "blocked").length;
  const overdue = openTasks.filter((task) => {
    if (!task.due_date) return false;
    return new Date(task.due_date).getTime() < now;
  }).length;
  const nextDueDate = openTasks
    .filter((task) => task.due_date)
    .sort(
      (a, b) =>
        new Date(a.due_date || "").getTime() -
        new Date(b.due_date || "").getTime(),
    )[0]?.due_date;

  return {
    open: openTasks.length,
    blocked,
    overdue,
    nextDueDate: nextDueDate || undefined,
  };
}

function humanizeStatus(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getClientStatus(lead: LeadRow, closePath: ClosePathState | null) {
  if (closePath?.paymentStatus === "paid") return "Paid start";
  if (closePath?.paymentStatus === "blocked") return "Payment blocked";
  if (closePath?.buyerStage) return humanizeStatus(closePath.buyerStage);
  return lead.stage === "delivery_handoff" ? "Delivery handoff" : "Won";
}

function getClientNextStep(lead: LeadRow, closePath: ClosePathState | null) {
  if (closePath?.commercialNextStep) return closePath.commercialNextStep;
  return lead.notes?.includes("Delivery handoff opened")
    ? "Run kickoff checklist and open the first operating lane"
    : "Confirm kickoff plan and delivery owner";
}

function hasAssistantPlan(metadata: Record<string, unknown>) {
  return isRecord(metadata.assistant_plan) || isRecord(metadata.account_plan);
}

function buildClientHandoffPath(leadId?: string, token?: string) {
  if (!leadId || !token) return undefined;
  return `/client-handoff/${encodeURIComponent(leadId)}?token=${encodeURIComponent(token)}`;
}

async function getPackagePayments(): Promise<PackagePayment[]> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.includes("your-stripe")) return [];

  const stripe = new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  });

  const sessions = await stripe.checkout.sessions.list({ limit: 50 });

  return sessions.data
    .filter((session) => session.metadata?.type === "perpetual_core_package")
    .map((session) => {
      const amount = formatStripeAmount(session.amount_total, session.currency);
      return {
        id: session.id,
        packageName: session.metadata?.package_name || "Perpetual Core package",
        packageId: session.metadata?.package_id || "unknown",
        leadId: session.metadata?.lead_id || "",
        customerName: session.customer_details?.name || "Unknown buyer",
        customerEmail:
          session.customer_details?.email || session.customer_email || "",
        amount: amount.value,
        status: session.payment_status,
        createdAt: new Date(session.created * 1000).toISOString(),
      };
    });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const pc = getPcClient();
  const [
    salesResult,
    leadsResult,
    accountResult,
    engagementResult,
    packagePayments,
  ] = await Promise.all([
    admin
      .from("sales_contacts")
      .select("id,name,email,company,status,interested_in,product,created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("leads")
      .select(
        "id,name,email,company,status,stage,notes,ai_insights,estimated_value,next_follow_up_at,created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    pc
      .from("pc_accounts")
      .select("id,name,status,notes,metadata,created_at,updated_at")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    pc
      .from("pc_engagements")
      .select(
        "id,account_id,name,offer_name,system_name,stage,value_range,next_step,metadata,created_at,updated_at",
      )
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
    getPackagePayments().catch(() => []),
  ]);

  if (accountResult.error) throw accountResult.error;
  if (engagementResult.error) throw engagementResult.error;

  const salesContacts = (salesResult.data || []) as SalesContactRow[];
  const leads = (leadsResult.data || []) as LeadRow[];
  const pcAccounts = (accountResult.data || []) as PcAccountRow[];
  const pcEngagements = (engagementResult.data || []) as PcEngagementRow[];
  const engagementsByAccountId = pcEngagements.reduce<
    Record<string, PcEngagementRow[]>
  >((groups, engagement) => {
    return {
      ...groups,
      [engagement.account_id]: [
        ...(groups[engagement.account_id] || []),
        engagement,
      ],
    };
  }, {});
  const leadIds = leads.map((lead) => lead.id);
  const taskSourceReferences = Array.from(
    new Set([...leadIds, ...pcAccounts.map((account) => account.id)]),
  );
  const tasksResult =
    taskSourceReferences.length > 0
      ? await admin
          .from("tasks")
          .select("id,status,priority,source_reference,due_date,tags")
          .in("source_reference", taskSourceReferences)
          .limit(500)
      : { data: [] };
  const accountTasks = (tasksResult.data || []) as TaskRow[];
  const tasksBySourceReference = accountTasks.reduce<Record<string, TaskRow[]>>(
    (groups, task) => {
      if (!task.source_reference) return groups;
      return {
        ...groups,
        [task.source_reference]: [
          ...(groups[task.source_reference] || []),
          task,
        ],
      };
    },
    {},
  );
  const paidPackages = packagePayments.filter(
    (payment) => payment.status === "paid",
  );
  const packageRevenue = paidPackages.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const openSalesContacts = salesContacts.filter((contact) => {
    const status = (contact.status || "new").toLowerCase();
    return !["closed", "won", "lost", "archived"].includes(status);
  });
  const openLeads = leads.filter((lead) => {
    const status = (lead.status || "new").toLowerCase();
    return !["won", "lost", "closed", "archived"].includes(status);
  });
  const wonLeads = leads.filter((lead) => {
    const status = (lead.status || "new").toLowerCase();
    return status === "won" || lead.stage === "delivery_handoff";
  });
  const pipelineValue = openLeads.reduce(
    (sum, lead) => sum + (lead.estimated_value || 0),
    0,
  );
  const permanentLeadIds = new Set(
    pcAccounts
      .map((account) => {
        const metadata = isRecord(account.metadata) ? account.metadata : {};
        return readString(metadata.source_lead_id);
      })
      .filter((value): value is string => Boolean(value)),
  );

  const allActiveClients = [
    ...pcAccounts.map((account) => {
      const accountMetadata = isRecord(account.metadata)
        ? account.metadata
        : {};
      const engagement = engagementsByAccountId[account.id]?.[0] || null;
      const engagementMetadata = isRecord(engagement?.metadata)
        ? engagement.metadata
        : {};
      const sourceLeadId =
        readString(accountMetadata.source_lead_id) ||
        readString(engagementMetadata.source_lead_id);
      const handoffToken = engagement?.id || account.id;
      const estimatedValue =
        readNumber(accountMetadata.estimated_value) ||
        readNumber(engagementMetadata.estimated_value) ||
        0;
      const closePath = sourceLeadId
        ? readClosePath(
            leads.find((lead) => lead.id === sourceLeadId) || ({} as LeadRow),
          )
        : null;
      const taskSummary = createTaskSummary([
        ...(tasksBySourceReference[account.id] || []),
        ...(sourceLeadId ? tasksBySourceReference[sourceLeadId] || [] : []),
      ]);
      const handoffContextReceived =
        isRecord(accountMetadata.account_handoff_context) ||
        isRecord(engagementMetadata.account_handoff_context);
      const packageIntakeReceived =
        isRecord(accountMetadata.package_intake) ||
        isRecord(engagementMetadata.package_intake);
      const contactEmail =
        readString(accountMetadata.contact_email) ||
        readString(engagementMetadata.contact_email);
      const sourceStatus =
        readString(accountMetadata.source_lead_status) ||
        readString(engagementMetadata.source_lead_status);
      const accountNextStep =
        readString(accountMetadata.last_account_next_action) ||
        readString(accountMetadata.account_next_step) ||
        readString(engagementMetadata.account_next_step);
      const assistantPlanUpdatedAt =
        readString(accountMetadata.account_plan_updated_at) ||
        readString(engagementMetadata.account_plan_updated_at) ||
        readString(accountMetadata.last_account_update_at);

      return {
        id: account.id,
        name: account.name,
        company: contactEmail || "Permanent client account",
        status:
          closePath?.paymentStatus === "paid" || packageIntakeReceived
            ? "Paid start"
            : humanizeStatus(sourceStatus || account.status),
        lane: engagement?.offer_name || "AI operating system",
        value:
          engagement?.value_range ||
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(estimatedValue),
        nextStep:
          accountNextStep ||
          engagement?.next_step ||
          closePath?.commercialNextStep ||
          "Open the account room and run the next operating action",
        buyerStage:
          closePath?.buyerStage ||
          readString(accountMetadata.source_lead_stage) ||
          readString(engagementMetadata.source_lead_stage),
        paymentPath:
          closePath?.paymentPath ||
          (packageIntakeReceived ? "package_checkout" : undefined),
        paymentStatus:
          closePath?.paymentStatus ||
          (packageIntakeReceived ? "paid" : undefined),
        commercialNextStep:
          closePath?.commercialNextStep || engagement?.next_step || undefined,
        closePathUpdatedAt: closePath?.updatedAt,
        handoffContextReceived,
        hasAssistantPlan:
          hasAssistantPlan(accountMetadata) ||
          hasAssistantPlan(engagementMetadata),
        assistantPlanUpdatedAt,
        openTaskCount: taskSummary.open,
        blockedTaskCount: taskSummary.blocked,
        overdueTaskCount: taskSummary.overdue,
        nextTaskDueDate: taskSummary.nextDueDate,
        createdAt: account.created_at,
        sourceType: "Permanent account",
        leadId: sourceLeadId,
        clientHandoffPath: buildClientHandoffPath(sourceLeadId, handoffToken),
        href: sourceLeadId
          ? `/dashboard/accounts/${sourceLeadId}`
          : `/dashboard/accounts/permanent/${account.id}`,
      };
    }),
    ...wonLeads
      .map((lead) => {
        if (permanentLeadIds.has(lead.id)) return null;
        const closePath = readClosePath(lead);
        const leadInsights = isRecord(lead.ai_insights) ? lead.ai_insights : {};
        const handoffToken =
          readString(leadInsights.engagementId) ||
          readString(leadInsights.accountId);
        const taskSummary = createTaskSummary(
          tasksBySourceReference[lead.id] || [],
        );
        return {
          id: lead.id,
          name: lead.company || lead.name || "Account",
          company: lead.email || "Client account",
          status: getClientStatus(lead, closePath),
          lane:
            lead.estimated_value && lead.estimated_value >= 15000
              ? "90-Day Operating Lane"
              : "First Workflow",
          value: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(lead.estimated_value || 0),
          nextStep: getClientNextStep(lead, closePath),
          buyerStage: closePath?.buyerStage,
          paymentPath: closePath?.paymentPath,
          paymentStatus: closePath?.paymentStatus,
          commercialNextStep: closePath?.commercialNextStep,
          closePathUpdatedAt: closePath?.updatedAt,
          handoffContextReceived: hasHandoffContext(lead),
          openTaskCount: taskSummary.open,
          blockedTaskCount: taskSummary.blocked,
          overdueTaskCount: taskSummary.overdue,
          nextTaskDueDate: taskSummary.nextDueDate,
          createdAt: lead.created_at,
          sourceType: "Lead handoff",
          leadId: lead.id,
          clientHandoffPath: buildClientHandoffPath(lead.id, handoffToken),
          href: `/dashboard/accounts/${lead.id}`,
        };
      })
      .filter((client): client is NonNullable<typeof client> =>
        Boolean(client),
      ),
    ...paidPackages.map((payment) => ({
      id: payment.id,
      name: payment.customerName,
      company: payment.customerEmail,
      status: "Paid package",
      lane: payment.packageName.replace("Perpetual Core ", ""),
      value: formatStripeAmount(payment.amount, "usd").formatted,
      nextStep: "Confirm intake context and onboarding window",
      buyerStage: "paid_start",
      paymentPath: "package_checkout",
      paymentStatus: "paid",
      commercialNextStep: "Confirm intake context and onboarding window",
      handoffContextReceived: false,
      hasAssistantPlan: false,
      openTaskCount: 0,
      blockedTaskCount: 0,
      overdueTaskCount: 0,
      createdAt: payment.createdAt,
      sourceType: "Stripe package",
      leadId: payment.leadId || undefined,
      href: payment.leadId
        ? `/dashboard/accounts/${payment.leadId}`
        : `/contact-sales?intent=post-payment-intake&session_id=${encodeURIComponent(payment.id)}`,
    })),
    ...openSalesContacts.slice(0, 6).map((contact) => ({
      id: contact.id,
      name: contact.name || "Unnamed contact",
      company: contact.company || contact.email || "No company yet",
      status: contact.status || "new",
      lane: contact.interested_in || contact.product || "Scoping",
      value: "Scope pending",
      nextStep: "Qualify fit and define first operating lane",
      buyerStage: "discovery",
      paymentStatus: "not_sent",
      handoffContextReceived: false,
      hasAssistantPlan: false,
      openTaskCount: 0,
      blockedTaskCount: 0,
      overdueTaskCount: 0,
      createdAt: contact.created_at || new Date().toISOString(),
      sourceType: "Sales inquiry",
      href: "/dashboard/leads",
    })),
  ];
  const activeClients = allActiveClients.slice(0, 12);

  const closePathActions = wonLeads
    .map((lead) => ({ lead, closePath: readClosePath(lead) }))
    .filter(
      ({ closePath }) =>
        closePath?.paymentStatus && closePath.paymentStatus !== "paid",
    )
    .map(({ lead, closePath }) => ({
      id: `close-path-${lead.id}`,
      title: `${closePath?.paymentStatus === "blocked" ? "Unblock" : "Advance"} ${lead.company || lead.name}`,
      detail:
        closePath?.commercialNextStep ||
        `${humanizeStatus(closePath?.buyerStage || "proposal")} account needs a clear payment or approval path.`,
      priority: closePath?.paymentStatus === "blocked" ? "high" : "medium",
      href: `/dashboard/accounts/${lead.id}`,
    }));

  const nextActions = [
    ...paidPackages.slice(0, 3).map((payment) => ({
      id: `paid-${payment.id}`,
      title: `Onboard ${payment.customerName}`,
      detail: `${payment.packageName} paid. Send intake and schedule kickoff.`,
      priority: "high",
      href: payment.leadId
        ? `/dashboard/leads?lead=${payment.leadId}`
        : `/contact-sales?intent=post-payment-intake&session_id=${encodeURIComponent(payment.id)}`,
    })),
    ...closePathActions.slice(0, 4),
    ...openSalesContacts.slice(0, 4).map((contact) => ({
      id: `contact-${contact.id}`,
      title: `Follow up with ${contact.name || contact.company || "new sales contact"}`,
      detail: `${contact.interested_in || "Sales inquiry"} from ${contact.company || contact.email || "unknown company"}.`,
      priority: "medium",
      href: "/dashboard/leads",
    })),
  ].slice(0, 7);

  return NextResponse.json({
    summary: {
      paidPackageCount: paidPackages.length,
      packageRevenue,
      packageRevenueFormatted: formatStripeAmount(packageRevenue, "usd")
        .formatted,
      openLeadCount: openLeads.length + openSalesContacts.length,
      activeClientCount: allActiveClients.length,
      paidStartCount: allActiveClients.filter(
        (client) => client.paymentStatus === "paid",
      ).length,
      paymentReadyCount: allActiveClients.filter((client) =>
        ["sent", "in_review"].includes(client.paymentStatus || ""),
      ).length,
      blockedClosePathCount: allActiveClients.filter(
        (client) => client.paymentStatus === "blocked",
      ).length,
      proposalCount: allActiveClients.filter(
        (client) => client.buyerStage === "proposal",
      ).length,
      pipelineValue,
      pipelineValueFormatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(pipelineValue),
    },
    activeClients,
    recentPackages: packagePayments.slice(0, 8).map((payment) => ({
      ...payment,
      amountFormatted: formatStripeAmount(payment.amount, "usd").formatted,
    })),
    recentSalesContacts: salesContacts.slice(0, 8),
    nextActions,
    systemMap: [
      {
        name: "Lorenzo D.C.",
        role: "Trust and demand",
        status: "Routes qualified attention",
      },
      {
        name: "Perpetual Core",
        role: "Commercial engine",
        status: "Packages, retainers, installs",
      },
      {
        name: "Sage / Dashboard",
        role: "Operating layer",
        status: "Client delivery and internal OS",
      },
      {
        name: "IHA / Engine",
        role: "Mission gravity",
        status: "Revenue commitment and legitimacy",
      },
    ],
  });
}
