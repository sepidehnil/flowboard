import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { seedDemoDataForUser } from "../src/lib/services/demo-data";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@FlowBoard.app";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("Demo user already exists:", email);
    return;
  }

  const passwordHash = await hash("password123", 12);
  const user = await prisma.user.create({
    data: {
      name: "Demo Freelancer",
      email,
      passwordHash,
    },
  });

  await seedDemoDataForUser(user.id, user.name, prisma);
  console.log("Seeded demo user:");
  console.log("  email:    demo@FlowBoard.app");
  console.log("  password: password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
