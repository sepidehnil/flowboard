import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  href?: string;
  onClick?: () => void;
};

/** FlowBoard mark: kanban columns + flow curve on teal. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="64" height="64" rx="14" className="fill-brand" />
      <rect
        x="14"
        y="18"
        width="10"
        height="28"
        rx="3"
        fill="white"
        fillOpacity="0.95"
      />
      <rect
        x="27"
        y="14"
        width="10"
        height="22"
        rx="3"
        fill="white"
        fillOpacity="0.95"
      />
      <rect
        x="40"
        y="20"
        width="10"
        height="30"
        rx="3"
        fill="white"
        fillOpacity="0.75"
      />
      <path
        d="M16 46c8 2 16-6 24-4s12 6 12 6"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
  wordmarkClassName,
  href,
  onClick,
}: LogoProps) {
  const content = (
    <>
      <LogoMark className={cn("h-9 w-9", markClassName)} />
      {showWordmark ? (
        <span
          className={cn(
            "text-lg font-semibold tracking-tight text-foreground",
            wordmarkClassName,
          )}
        >
          FlowBoard
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "relative z-10 inline-flex cursor-pointer items-center gap-2.5",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {content}
    </span>
  );
}
