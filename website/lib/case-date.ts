import { format, parseISO } from "date-fns";

// Postgres DATE values identify a calendar day, not midnight UTC. Parsing
// them as timestamps would show the previous day on servers west of UTC.
export function formatCaseDate(value: string, pattern = "MMMM d, yyyy"): string {
  return format(parseISO(value), pattern);
}
