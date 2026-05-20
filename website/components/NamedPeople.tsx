import Link from "next/link";
import type { CasePerson } from "@/lib/case";

function groupPeopleByAgency(people: CasePerson[]): { label: string; people: CasePerson[] }[] {
  const groups = new Map<string, CasePerson[]>();
  for (const p of people) {
    const key = p.agency ?? "Other";
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }
  return Array.from(groups.entries()).map(([label, people]) => ({ label, people }));
}

export function NamedPeople({ people }: { people: CasePerson[] }) {
  if (people.length === 0) return null;
  const groups = groupPeopleByAgency(people);
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
            {g.label}
          </p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {g.people.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/case/people/${p.slug}`}
                  className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
                >
                  {p.name}
                  {p.role ? <span className="ml-1.5 text-[var(--color-muted)] font-normal">· {p.role}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
