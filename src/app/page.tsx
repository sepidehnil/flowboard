import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(37,99,235,0.12),_transparent_45%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              F
            </span>
            <span className="text-lg font-semibold tracking-tight">FlowBoard</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Get started
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-16">
          <p className="mb-4 text-sm font-medium text-brand">Built for freelancers and developers</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your projects, clients, and invoices - in one place.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-foreground-muted sm:text-lg">
            Track delivery and revenue with a secure multi-user workspace where
            every account stays private and every number comes from live data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Create your workspace
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-medium text-foreground hover:bg-surface-muted"
            >
              Sign in
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
