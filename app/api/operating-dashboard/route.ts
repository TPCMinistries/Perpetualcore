import { NextResponse } from "next/server";
import Stripe from "stripe";
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
  estimated_value: number | null;
  next_follow_up_at: string | null;
  created_at: string;
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
        customerEmail: session.customer_details?.email || session.customer_email || "",
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
  const [salesResult, leadsResult, packagePayments] = await Promise.all([
    admin
      .from("sales_contacts")
      .select("id,name,email,company,status,interested_in,product,created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("leads")
      .select("id,name,email,company,status,stage,notes,estimated_value,next_follow_up_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    getPackagePayments().catch(() => []),
  ]);

  const salesContacts = (salesResult.data || []) as SalesContactRow[];
  const leads = (leadsResult.data || []) as LeadRow[];
  const paidPackages = packagePayments.filter((payment) => payment.status === "paid");
  const packageRevenue = paidPackages.reduce((sum, payment) => sum + payment.amount, 0);
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
  const pipelineValue = openLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);

  const activeClients = [
    ...wonLeads.map((lead) => ({
      id: lead.id,
      name: lead.company || lead.name || "Account",
      company: lead.email || "Client account",
      status: lead.stage === "delivery_handoff" ? "Delivery handoff" : "Won",
      lane: lead.estimated_value && lead.estimated_value >= 15000 ? "90-Day Operating Lane" : "First Workflow",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(lead.estimated_value || 0),
      nextStep: lead.notes?.includes("Delivery handoff opened")
        ? "Run kickoff checklist and open the first operating lane"
        : "Confirm kickoff plan and delivery owner",
      createdAt: lead.created_at,
      href: `/dashboard/accounts/${lead.id}`,
    })),
    ...paidPackages.map((payment) => ({
      id: payment.id,
      name: payment.customerName,
      company: payment.customerEmail,
      status: "Paid package",
      lane: payment.packageName.replace("Perpetual Core ", ""),
      value: formatStripeAmount(payment.amount, "usd").formatted,
      nextStep: "Confirm intake context and onboarding window",
      createdAt: payment.createdAt,
      href: payment.leadId ? `/dashboard/accounts/${payment.leadId}` : `/contact-sales?intent=post-payment-intake&session_id=${encodeURIComponent(payment.id)}`,
    })),
    ...openSalesContacts.slice(0, 6).map((contact) => ({
      id: contact.id,
      name: contact.name || "Unnamed contact",
      company: contact.company || contact.email || "No company yet",
      status: contact.status || "new",
      lane: contact.interested_in || contact.product || "Scoping",
      value: "Scope pending",
      nextStep: "Qualify fit and define first operating lane",
      createdAt: contact.created_at || new Date().toISOString(),
      href: "/dashboard/leads",
    })),
  ].slice(0, 10);

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
      packageRevenueFormatted: formatStripeAmount(packageRevenue, "usd").formatted,
      openLeadCount: openLeads.length + openSalesContacts.length,
      activeClientCount: activeClients.length,
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
      { name: "Lorenzo D.C.", role: "Trust and demand", status: "Routes qualified attention" },
      { name: "Perpetual Core", role: "Commercial engine", status: "Packages, retainers, installs" },
      { name: "Sage / Dashboard", role: "Operating layer", status: "Client delivery and internal OS" },
      { name: "IHA / Engine", role: "Mission gravity", status: "Revenue commitment and legitimacy" },
    ],
  });
}
