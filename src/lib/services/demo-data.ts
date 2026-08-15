import {
  ActivityType,
  InvoiceStatus,
  Prisma,
  PrismaClient,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import { db as defaultDb } from "@/lib/db";

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export async function seedDemoDataForUser(
  userId: string,
  userName: string,
  client: PrismaClient = defaultDb,
) {
  const db = client;
  const clients = await Promise.all([
    db.client.create({
      data: {
        userId,
        name: "Sarah Chen",
        email: "sarah@acmecorp.com",
        company: "Acme Corporation",
        phone: "+1 (555) 010-1001",
      },
    }),
    db.client.create({
      data: {
        userId,
        name: "Marcus Webb",
        email: "marcus@novalabs.io",
        company: "Nova Labs",
        phone: "+1 (555) 010-2044",
      },
    }),
    db.client.create({
      data: {
        userId,
        name: "Elena Torres",
        email: "elena@techflow.dev",
        company: "TechFlow",
        phone: "+1 (555) 010-3388",
      },
    }),
  ]);

  const [acme, nova, techflow] = clients;

  const projectDefs: Array<{
    name: string;
    description: string;
    clientId: string;
    status: ProjectStatus;
    progress: number;
    deadline: Date;
  }> = [
    {
      name: "E-commerce Platform",
      description:
        "Full-stack marketplace with cart, payments, and admin inventory tools.",
      clientId: acme.id,
      status: ProjectStatus.IN_PROGRESS,
      progress: 62,
      deadline: daysFromNow(45),
    },
    {
      name: "Banking Dashboard",
      description:
        "Secure finance dashboard with transaction analytics and reporting.",
      clientId: nova.id,
      status: ProjectStatus.IN_PROGRESS,
      progress: 40,
      deadline: daysFromNow(60),
    },
    {
      name: "AI Chat Application",
      description:
        "Conversational UI with streaming responses and conversation history.",
      clientId: techflow.id,
      status: ProjectStatus.PLANNED,
      progress: 15,
      deadline: daysFromNow(90),
    },
    {
      name: "Booking System",
      description:
        "Appointment scheduling with calendar sync and email reminders.",
      clientId: acme.id,
      status: ProjectStatus.COMPLETED,
      progress: 100,
      deadline: daysFromNow(-20),
    },
    {
      name: "Portfolio Website",
      description: "Personal brand site with case studies and contact forms.",
      clientId: nova.id,
      status: ProjectStatus.ON_HOLD,
      progress: 55,
      deadline: daysFromNow(30),
    },
  ];

  const projects = await Promise.all(
    projectDefs.map((p) =>
      db.project.create({
        data: {
          userId,
          name: p.name,
          description: p.description,
          clientId: p.clientId,
          status: p.status,
          progress: p.progress,
          deadline: p.deadline,
        },
      }),
    ),
  );

  const [ecommerce, banking, aiChat, booking, portfolio] = projects;

  const taskDefs: Array<{
    title: string;
    projectId: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date;
  }> = [
    {
      title: "Implement authentication",
      projectId: ecommerce.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(-5),
    },
    {
      title: "Create responsive navbar",
      projectId: ecommerce.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(-2),
    },
    {
      title: "Build dashboard",
      projectId: banking.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(10),
    },
    {
      title: "Fix API integration",
      projectId: banking.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      dueDate: daysFromNow(3),
    },
    {
      title: "Write tests",
      projectId: booking.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(-15),
    },
    {
      title: "Design onboarding flow",
      projectId: aiChat.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(20),
    },
    {
      title: "Optimize Lighthouse scores",
      projectId: portfolio.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.LOW,
      dueDate: daysFromNow(14),
    },
    {
      title: "Set up CI pipeline",
      projectId: ecommerce.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(7),
    },
  ];

  await Promise.all(
    taskDefs.map((t) =>
      db.task.create({
        data: {
          userId,
          title: t.title,
          projectId: t.projectId,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
        },
      }),
    ),
  );

  const invoiceDefs: Array<{
    invoiceNumber: string;
    clientId: string;
    amount: number;
    status: InvoiceStatus;
    issueDate: Date;
    dueDate: Date;
  }> = [
    {
      invoiceNumber: "INV-1001",
      clientId: acme.id,
      amount: 4800,
      status: InvoiceStatus.PAID,
      issueDate: monthsAgo(5),
      dueDate: monthsAgo(4),
    },
    {
      invoiceNumber: "INV-1002",
      clientId: nova.id,
      amount: 3200,
      status: InvoiceStatus.PAID,
      issueDate: monthsAgo(4),
      dueDate: monthsAgo(3),
    },
    {
      invoiceNumber: "INV-1003",
      clientId: techflow.id,
      amount: 5600,
      status: InvoiceStatus.PAID,
      issueDate: monthsAgo(3),
      dueDate: monthsAgo(2),
    },
    {
      invoiceNumber: "INV-1004",
      clientId: acme.id,
      amount: 2400,
      status: InvoiceStatus.SENT,
      issueDate: monthsAgo(1),
      dueDate: daysFromNow(10),
    },
    {
      invoiceNumber: "INV-1005",
      clientId: nova.id,
      amount: 1800,
      status: InvoiceStatus.OVERDUE,
      issueDate: monthsAgo(2),
      dueDate: monthsAgo(1),
    },
    {
      invoiceNumber: "INV-1006",
      clientId: techflow.id,
      amount: 4100,
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(),
      dueDate: daysFromNow(30),
    },
    {
      invoiceNumber: "INV-1007",
      clientId: acme.id,
      amount: 6500,
      status: InvoiceStatus.PAID,
      issueDate: monthsAgo(1),
      dueDate: daysFromNow(-5),
    },
  ];

  await Promise.all(
    invoiceDefs.map((inv) =>
      db.invoice.create({
        data: {
          userId,
          invoiceNumber: inv.invoiceNumber,
          clientId: inv.clientId,
          amount: new Prisma.Decimal(inv.amount),
          status: inv.status,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          notes: "Demo invoice generated for portfolio sandbox.",
        },
      }),
    ),
  );

  await db.activity.createMany({
    data: [
      {
        userId,
        type: ActivityType.PROJECT_CREATED,
        title: `Created project "Banking Dashboard"`,
        entityType: "project",
        entityId: banking.id,
        createdAt: monthsAgo(0),
      },
      {
        userId,
        type: ActivityType.TASK_COMPLETED,
        title: `Completed task "Implement authentication"`,
        entityType: "task",
        createdAt: daysFromNow(-4),
      },
      {
        userId,
        type: ActivityType.INVOICE_CREATED,
        title: "Created invoice #INV-1007",
        entityType: "invoice",
        createdAt: daysFromNow(-8),
      },
      {
        userId,
        type: ActivityType.CLIENT_CREATED,
        title: "Added new client Acme Corporation",
        entityType: "client",
        entityId: acme.id,
        createdAt: daysFromNow(-12),
      },
      {
        userId,
        type: ActivityType.PROJECT_UPDATED,
        title: `Updated project status for "Booking System"`,
        entityType: "project",
        entityId: booking.id,
        createdAt: daysFromNow(-18),
      },
      {
        userId,
        type: ActivityType.PROJECT_CREATED,
        title: `Welcome to FlowBoard, ${userName.split(" ")[0]}!`,
        description: "Your workspace was seeded with sample data so you can explore immediately.",
        createdAt: new Date(),
      },
    ],
  });
}
