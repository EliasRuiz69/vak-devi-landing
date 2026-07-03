import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
};

export default function Button({
  href,
  children,
  variant = "solid",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-8 py-4 text-sm sm:text-base tracking-wide transition-colors duration-300";

  const styles =
    variant === "solid"
      ? "bg-purple-1 text-white hover:bg-purple-2"
      : "border border-white text-white hover:bg-white hover:text-purple-1";

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}
