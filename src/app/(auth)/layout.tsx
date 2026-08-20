import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.14),_transparent_50%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        {children}
      </div>
    </div>
  );
}
