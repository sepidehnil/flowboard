import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectsManager } from "@/components/projects/projects-manager";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const [projects, clients] = await Promise.all([
    db.project.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    db.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
  ]);

  return <ProjectsManager projects={projects} clients={clients} />;
}
