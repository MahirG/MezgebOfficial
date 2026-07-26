export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" aria-label="Biloo Mezgeb home">
      <span className="brandMark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <circle cx="19" cy="24" r="8" stroke="currentColor" strokeWidth="3.5" />
          <circle cx="29" cy="24" r="8" stroke="currentColor" strokeWidth="3.5" />
          <path
            d="M22 18.4C24 16.6 26 16.6 28 18.4"
            stroke="#6F8FE8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compact && (
        <span>
          Biloo Mezgeb<small>መዝገብ · Business ledger</small>
        </span>
      )}
    </span>
  );
}
