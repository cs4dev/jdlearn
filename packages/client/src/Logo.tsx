// jdlearn mark: a job post (document) whose lines resolve into a checkmark — "proof".
// Drawn as a sign pictogram: white/yellow strokes on a black inset square.
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="jdlearn">
      <rect width="32" height="32" rx="4" fill="#0b0b0b" />
      {/* document text lines (the job post) */}
      <g stroke="#ffcc00" strokeWidth="2.25" strokeLinecap="square">
        <line x1="9" y1="9.5" x2="20" y2="9.5" />
        <line x1="9" y1="14" x2="16" y2="14" />
      </g>
      {/* checkmark (the proof) */}
      <path d="M9 19l4 4 10-10.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}
