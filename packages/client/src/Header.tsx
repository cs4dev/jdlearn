import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

// The sign band: full-bleed yellow, wordmark left, text links right. `wide` aligns its
// rail with the landing's two-column junction; app pages use the working column.
export function Header({ right, wide = false }: { right?: React.ReactNode; wide?: boolean }) {
  return (
    <header className="border-b border-ink bg-sign-yellow">
      <div
        className={`mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6 ${
          wide ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        <Link
          to="/"
          className="-ml-1 flex items-center gap-2.5 rounded-[3px] p-1 outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Logo className="h-8 w-8" />
          <span className="hidden text-xl font-extrabold tracking-tight min-[400px]:inline">jdlearn</span>
        </Link>
        {right && <nav className="flex items-center gap-1">{right}</nav>}
      </div>
    </header>
  );
}

const NAV =
  "inline-flex h-9 items-center gap-1.5 rounded-[3px] text-sm font-bold text-ink outline-none transition-colors hover:bg-ink hover:text-sign-yellow focus-visible:ring-2 focus-visible:ring-ink max-sm:px-2 sm:px-3";

/** A sign-band link; the current route renders inverted (black plate, yellow type). */
export function NavLink({ to, children }: { to: "/" | "/resume" | "/archived"; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className={`${NAV} data-[status=active]:bg-ink data-[status=active]:text-sign-yellow`}
    >
      {children}
    </Link>
  );
}

export function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={NAV}>
      {children}
    </button>
  );
}
