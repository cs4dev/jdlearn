// jdlearn mark: a job post (document) whose lines resolve into a checkmark — "proof".
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="jdlearn">
      <defs>
        <linearGradient id="jd-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#jd-g)" />
      {/* document text lines (the job post) */}
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <line x1="9" y1="10" x2="20" y2="10" />
        <line x1="9" y1="14" x2="17" y2="14" />
      </g>
      {/* checkmark (the proof) */}
      <path
        d="M9 18.5l4 4 10-10.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
