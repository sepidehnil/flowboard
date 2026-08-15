import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvoicesManager } from "@/components/invoices/invoices-manager";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const [invoices, clients] = await Promise.all([
    db.invoice.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { issueDate: "desc" },
    }),
    db.client.findMany({
      where: { userId },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Prisma Decimal is not serializable to Client Components
  const serializedInvoices = invoices.map((invoice) => ({
    ...invoice,
    amount: Number(invoice.amount),
  }));

  return (
    <InvoicesManager invoices={serializedInvoices} clients={clients} />
  );
}

