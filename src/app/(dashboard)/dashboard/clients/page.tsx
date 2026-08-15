import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClientsManager } from "@/components/clients/clients-manager";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clients = await db.client.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { projects: true } },
      invoices: { select: { amount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Prisma Decimal is not serializable to Client Components
  const serialized = clients.map((client) => ({
    ...client,
    invoices: client.invoices.map((invoice) => ({
      amount: Number(invoice.amount),
      status: invoice.status,
    })),
  }));

  return <ClientsManager clients={serialized} />;
}

