import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center gap-2.5">
        <Logo className="h-8 w-8 rounded-lg shadow-sm" />
        <span className="text-lg font-semibold tracking-tight">jdlearn</span>
      </Link>
      {right}
    </header>
  );
}
