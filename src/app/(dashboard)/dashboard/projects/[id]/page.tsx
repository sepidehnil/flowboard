import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectDetailView } from "@/components/projects/project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;

  const [project, clients] = await Promise.all([
    db.project.findFirst({
      where: { id, userId },
      include: {
        client: true,
        tasks: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
  ]);

  if (!project) notFound();

  return <ProjectDetailView project={project} clients={clients} />;
}
