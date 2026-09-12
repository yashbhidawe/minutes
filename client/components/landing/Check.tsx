import type { SVGProps } from "react";

export function Check({
  className = "text-emerald-600",
  size = 13,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...({} as SVGProps<SVGSVGElement>)}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
