// Sign-system primitives (DESIGN.md "Terminal Wayfinding"): bold pictogram glyphs,
// the black inset square that carries them, the stop-sign notice, and the split-flap
// departures board used for application lists.

type GlyphProps = { className?: string };
const glyph = (d: React.ReactNode) =>
  function Glyph({ className = "h-4 w-4" }: GlyphProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        className={className}
        aria-hidden
      >
        {d}
      </svg>
    );
  };

export const ArrowRight = glyph(<path d="M4 12h15M13 6l6 6-6 6" />);
export const ArrowLeft = glyph(<path d="M20 12H5M11 6l-6 6 6 6" />);
export const Check = glyph(<path d="M4.5 12.5l5 5 10-11" />);
export const Cross = glyph(<path d="M6 6l12 12M18 6L6 18" />);
export const Plus = glyph(<path d="M12 5v14M5 12h14" />);
export const Copy = glyph(
  <>
    <rect x="9" y="9" width="11" height="11" />
    <path d="M15 5H4v11" />
  </>,
);
export const Pencil = glyph(<path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />);
export const Refresh = glyph(<path d="M20 5v5h-5M4 19v-5h5M18.5 10A7 7 0 0 0 6 7.5M5.5 14A7 7 0 0 0 18 16.5" />);
export const Download = glyph(<path d="M12 4v11M7 10l5 5 5-5M4 20h16" />);
export const Upload = glyph(<path d="M12 16V5M7 10l5-5 5 5M4 20h16" />);
/** The sign's forward-action device: an arrow inside an outlined square ("→ Find gates"). */
export function ArrowSquare() {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-[2px] border-[1.5px] border-current">
      <ArrowRight className="h-3.5 w-3.5" />
    </span>
  );
}
export const Flag = glyph(<path d="M6 21V4h11l-2 4 2 4H6" />);
// Partial: a half-filled disc — "some evidence, not all".
export function Half({ className = "h-4 w-4" }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 4.5a7.5 7.5 0 0 1 0 15z" fill="currentColor" />
    </svg>
  );
}

/** The black inset square that carries every pictogram. `open` = dashed outline (a
 *  closed route: gaps, empty slots). `sign` = yellow square with a black frame. */
export function Picto({
  children,
  tone = "black",
  size = "md",
}: {
  children: React.ReactNode;
  tone?: "black" | "open" | "sign";
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-11 w-11" }[size];
  const tones = {
    black: "bg-ink text-white",
    open: "border-2 border-dashed border-ink bg-white text-ink",
    sign: "border-2 border-ink bg-sign-yellow text-ink",
  }[tone];
  return (
    <span className={`grid shrink-0 place-items-center rounded-[3px] ${dims} ${tones}`}>
      {children}
    </span>
  );
}

/** Error notice: a red "no entry" square + message + optional recovery action. */
export function Notice({
  children,
  onRetry,
  tone = "error",
}: {
  children: React.ReactNode;
  onRetry?: () => void;
  tone?: "error" | "ok";
}) {
  const error = tone === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-md border px-3 py-2.5 text-sm ${
        error ? "border-stop/40 bg-danger-50 text-ink" : "border-rule bg-white text-ink"
      }`}
    >
      <span
        className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-[3px] text-white ${
          error ? "bg-stop" : "bg-ink"
        }`}
      >
        {error ? <Cross className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      </span>
      <div className="min-w-0">
        <p>{children}</p>
        {onRetry && (
          <button
            type="button"
            className="mt-1 font-bold underline decoration-2 underline-offset-2 hover:decoration-stop"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// ── Departures board ────────────────────────────────────────────────────────────

const WHEN = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Black split-flap board. Children are <BoardRow>s (or one <BoardEmpty>). */
export function Board({
  title,
  children,
  busy = false,
}: {
  title: string;
  children: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <div
      className="overflow-hidden rounded-md bg-ink font-mono text-sm text-white [&_button[data-focus-visible=true]]:outline-flap"
      aria-busy={busy}
    >
      <div className="flex items-center justify-between gap-3 border-b border-frame px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-flap">{title}</h2>
        <span className="hidden text-xs uppercase tracking-[0.14em] text-flap-dim sm:inline" aria-hidden>
          Time · Role · Fit · Status
        </span>
      </div>
      <ul className="divide-y divide-frame">{children}</ul>
    </div>
  );
}

export function BoardEmpty({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-4 py-4 text-xs uppercase tracking-[0.12em] text-flap-dim">{children}</li>
  );
}

export type BoardStatus = "pending" | "done" | "failed" | "archived";
const STATUS_LABEL: Record<BoardStatus, string> = {
  pending: "Generating",
  done: "Ready",
  failed: "Failed",
  archived: "Deleted",
};

/** One application on the board. The status cell remounts on change → flaps into place;
 *  `index` staggers the first paint so the board "updates" once, top to bottom. */
export function BoardRow({
  when,
  role,
  fit,
  status,
  index,
  active = false,
  onOpen,
  actions,
}: {
  when: string;
  role: string;
  fit?: number;
  status: BoardStatus;
  index: number;
  active?: boolean;
  onOpen?: () => void;
  actions?: React.ReactNode;
}) {
  const delay = { animationDelay: `${Math.min(index, 8) * 45}ms` };
  const statusColor =
    status === "failed" ? "text-stop-on-dark" : status === "done" ? "text-flap" : "text-white";
  return (
    <li
      className={`flex items-center gap-2 pr-2 transition-colors ${
        active ? "bg-frame" : "hover:bg-frame/70"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        aria-current={active || undefined}
        className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 pl-4 text-left uppercase tracking-[0.1em] outline-none focus-visible:bg-frame focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-flap disabled:cursor-default sm:grid-cols-[8.5rem_1fr_4.5rem_7.5rem] sm:items-center"
      >
        <span className="whitespace-nowrap text-xs text-flap-dim sm:text-sm">
          {WHEN.format(new Date(when))}
          {fit !== undefined && <span className="text-white sm:hidden"> · Fit {fit}</span>}
        </span>
        <span
          className={`col-span-2 row-start-2 line-clamp-2 font-semibold normal-case tracking-normal sm:col-span-1 sm:row-start-auto ${
            active ? "text-flap" : "text-white"
          }`}
        >
          {active && <span className="sr-only">Viewing: </span>}
          {role}
        </span>
        <span className="hidden text-white sm:inline">
          {fit === undefined ? <span className="text-flap-dim">—</span> : <>Fit {fit}</>}
        </span>
        <span className={`col-start-2 row-start-1 flex items-center justify-end gap-2 font-bold sm:col-start-auto sm:row-start-auto sm:justify-start ${statusColor}`}>
          {status === "pending" && (
            <span className="h-2 w-2 bg-flap motion-safe:animate-pulse" aria-hidden />
          )}
          <span key={status} className="flap" style={delay}>
            {STATUS_LABEL[status]}
          </span>
        </span>
      </button>
      {actions}
    </li>
  );
}
