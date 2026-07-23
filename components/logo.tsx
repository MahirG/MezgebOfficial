export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" aria-label="Mezgeb home">
      <span className="brandMark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
          <path d="M5 4h13a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 19.5V4Z" />
          <path d="M5 17.5h14M9 8h6M9 11.5h6" />
        </svg>
      </span>
      {!compact && <span>Mezgeb<small>መዝገብ · Business ledger</small></span>}
    </span>
  );
}
