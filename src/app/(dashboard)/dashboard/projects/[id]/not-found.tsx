import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <h2 className="text-lg font-semibold">Project not found</h2>
      <p className="mt-2 text-sm text-foreground-muted">
        This project doesn&apos;t exist or belongs to another account.
      </p>
      <Link href="/dashboard/projects" className="mt-5">
        <Button>Back to projects</Button>
      </Link>
    </div>
  );
}
