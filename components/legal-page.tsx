import type { ReactNode } from 'react';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return <main className="legalPage container"><p className="overline">Mezgeb legal</p><h1>{title}</h1><p className="legalUpdated">Last updated: {updated}</p><article>{children}</article></main>;
}
